import React, { useCallback, useMemo, useState } from 'react'
import { Stack } from 'expo-router'
import { Box } from '@/components/ui/box'
import { Card } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { StyleSelect } from '@/components/creations/StyleSelect'
import { ActionButtons } from '@/components/creations/ActionButtons'
import { PreviewPanel } from '@/components/creations/PreviewPanel'
import { useGenerateCreations } from '@/hooks/useGenerateCreations'
import { z } from 'zod'
import { useToast } from '@/components/ui/ToastProvider'

const UUID_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

export default function AddCreationPage() {
  const [styleId, setStyleId] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const { loading, error, proposals, generate, accept, reject, reset } = useGenerateCreations()
  const toast = useToast()

  const isStyleValid = useMemo(() => UUID_REGEX.test(styleId), [styleId])
  const isFormValid = isStyleValid

  const schema = useMemo(
    () =>
      z.object({
        style_id: z.string().uuid({ message: 'Wybierz poprawny styl (UUID).' }),
      }),
    [],
  )

  const onGenerate = useCallback(async () => {
    // Walidacja z wykorzystaniem Zod (nazwa jest walidowana w UI i nie jest wysyłana do backendu)
    const parsed = schema.safeParse({ style_id: styleId, name })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      setFormError(first?.message ?? 'Nieprawidłowe dane formularza.')
      return
    }
    setFormError(null)
    // Endpoint zgodnie z planem wymaga tylko style_id
    try {
      await generate({ style_id: parsed.data.style_id })
      // Po sukcesie: pokaż komunikat – zależnie od liczby propozycji
      setTimeout(() => {
        // odczyt z aktualnego stanu po mutacji
        if (proposals.length > 0) {
          toast.success(`Wygenerowano ${proposals.length} propozycje.`)
        } else {
          toast.info('Brak propozycji dla wybranego stylu. Spróbuj ponownie.')
        }
      }, 0)
    } catch {
      toast.error('Nie udało się wygenerować propozycji.')
    }
  }, [generate, proposals.length, schema, styleId, toast])

  const onReset = useCallback(() => {
    setStyleId('')
    setFormError(null)
    reset()
  }, [reset])

  const onAccept = useCallback(
    async (creationId: string) => {
      try {
        await accept(creationId)
        toast.success('Kreacja została zaakceptowana.')
      } catch (e) {
        // error is handled in hook state
        toast.error('Nie udało się zaakceptować kreacji.')
      }
    },
    [accept, toast],
  )

  const onReject = useCallback(
    async (creationId: string) => {
      try {
        await reject(creationId)
        toast.info('Propozycja została odrzucona.')
      } catch (e) {
        // error is handled in hook state
        toast.error('Nie udało się odrzucić propozycji.')
      }
    },
    [reject, toast],
  )

  return (
    <>
      <Stack.Screen options={{ title: 'Dodaj kreację' }} />
      <Box className="flex-1 bg-background-0 p-4">
        <Heading size="lg" className="mb-4">
          Nowa kreacja
        </Heading>

        <Card className="p-4 gap-4">
          <StyleSelect value={styleId} onChange={setStyleId} />

          {(formError || error) && (
            <Box className="rounded-md border border-error-600 bg-error-100 p-3">
              <Text className="text-error-700">{formError ?? error?.message ?? 'Wystąpił nieznany błąd.'}</Text>
            </Box>
          )}

          <ActionButtons
            onGenerate={() => {
              onGenerate()
            }}
            onReset={onReset}
            loading={loading}
            disabled={!isFormValid || loading}
          />
        </Card>

        <PreviewPanel proposals={proposals} loading={loading} onAccept={onAccept} onReject={onReject} />
      </Box>
    </>
  )
}
