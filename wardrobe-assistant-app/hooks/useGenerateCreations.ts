import { useCallback, useRef, useState } from 'react'
import { API_BASE } from '@/constants/api'
import { CreationDTO, ResponseMessage } from 'shared/src/types/dto'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MOCK_JWT } from '@/mocks/jwt'

type Proposal = { creation: CreationDTO; description: string }

type GeneratePayload = { style_id: string }

type State = {
  loading: boolean
  error: Error | null
  proposals: Proposal[]
}

/**
 * Hook do obsługi generowania kreacji przez AI oraz akceptacji/odrzucenia propozycji.
 * - POST /creations/generate { style_id }
 * - POST /creations/{id}/accept
 * - POST /creations/{id}/reject
 */
export function useGenerateCreations() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<State>({ loading: false, error: null, proposals: [] })
  // Dodatkowa blokada wielokrotnego wysłania z poziomu UI
  const inFlight = useRef(false)

  const generateMutation = useMutation<Proposal[], Error, GeneratePayload>({
    mutationKey: ['creations', 'generate'],
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/creations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MOCK_JWT}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        const message = res.status === 400 ? mapValidationMessage(text) : `Błąd generowania (${res.status})`
        throw new Error(message)
      }
      return (await res.json()) as Proposal[]
    },
    onMutate: () => {
      setState((s) => ({ ...s, loading: true, error: null }))
      inFlight.current = true
    },
    onError: (err) => {
      setState((s) => ({ ...s, loading: false, error: err }))
      inFlight.current = false
    },
    onSuccess: (data) => {
      setState({ loading: false, error: null, proposals: Array.isArray(data) ? data : [] })
      inFlight.current = false
    },
  })

  const acceptMutation = useMutation<ResponseMessage, Error, string>({
    mutationKey: ['creations', 'accept'],
    mutationFn: async (creationId) => {
      const res = await fetch(`${API_BASE}/creations/${creationId}/accept`, { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Nie udało się zaakceptować kreacji (${res.status})`)
      }

      return res.json() as unknown as ResponseMessage
    },
    onSuccess: (_data, creationId) => {
      // Usuń zaakceptowaną propozycję z lokalnego stanu
      setState((s) => ({ ...s, proposals: s.proposals.filter((p) => p.creation.id !== creationId) }))
      // Opcjonalnie: odśwież listę zapisanych kreacji, jeśli istnieje
      queryClient.invalidateQueries({ queryKey: ['creations', 'list'] }).catch(() => {})
    },
    onError: (err) => setState((s) => ({ ...s, error: err })),
  })

  const rejectMutation = useMutation<unknown, Error, string>({
    mutationKey: ['creations', 'reject'],
    mutationFn: async (creationId) => {
      const res = await fetch(`${API_BASE}/creations/${creationId}/reject`, { method: 'POST' })
      if (!res.ok) throw new Error(`Nie udało się odrzucić kreacji (${res.status})`)

      return res.json() as unknown as ResponseMessage
    },
    onSuccess: (_data, creationId) => {
      setState((s) => ({ ...s, proposals: s.proposals.filter((p) => p.creation.id !== creationId) }))
    },
    onError: (err) => setState((s) => ({ ...s, error: err })),
  })

  const generate = useCallback(
    async (payload: GeneratePayload) => {
      if (inFlight.current) return
      await generateMutation.mutateAsync(payload)
    },
    [generateMutation],
  )

  const accept = useCallback(async (creationId: string) => acceptMutation.mutateAsync(creationId), [acceptMutation])

  const reject = useCallback(async (creationId: string) => rejectMutation.mutateAsync(creationId), [rejectMutation])

  const reset = useCallback(() => setState({ loading: false, error: null, proposals: [] }), [])

  return {
    loading: state.loading,
    error: state.error,
    proposals: state.proposals,
    generate,
    accept,
    reject,
    reset,
  }
}

function mapValidationMessage(text: string): string {
  // naive mapping of common errors; backend-specific messages can be mapped here
  const lower = text.toLowerCase()
  if (lower.includes('required wardrobe items')) {
    return 'Brakuje wymaganych elementów garderoby do wygenerowania kreacji.'
  }
  if (lower.includes('style') && lower.includes('uuid')) {
    return 'Wybrany styl ma niepoprawny identyfikator.'
  }
  return 'Nie udało się zweryfikować danych wejściowych.'
}

export type { Proposal as CreationProposalViewModel }
