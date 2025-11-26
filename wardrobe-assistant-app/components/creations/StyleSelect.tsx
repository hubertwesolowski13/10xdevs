import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { Button, ButtonText } from '@/components/ui/button'
import type { StyleDTO } from 'shared/src/types/dto'
import { API_BASE } from '@/constants/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MOCK_JWT } from '@/mocks/jwt'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function StyleSelect({ value, onChange }: Props) {
  const queryClient = useQueryClient()
  const {
    data: options = [],
    isPending: loading,
    error,
    refetch,
  } = useQuery<StyleDTO[], Error>({
    queryKey: ['styles'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/styles`, { headers: { Authorization: `Bearer ${MOCK_JWT}` } })
      if (!res.ok) throw new Error(`Błąd ładowania stylów (${res.status})`)
      return (await res.json()) as StyleDTO[]
    },
    staleTime: 1000 * 60 * 60, // 1h – style rzadko się zmieniają
  })

  return (
    <Box className="gap-2">
      <Heading size="sm">Wybierz styl</Heading>

      <Box className="mt-2 gap-2">
        <Heading size="xs">Dostępne style {loading ? '(ładowanie...)' : ''}</Heading>
        {error && <Text className="text-error-700">{error.message}</Text>}

        {/* Skeletony podczas ładowania */}
        {loading ? (
          <Box className="flex-row flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Box
                key={i}
                className="h-10 w-28 rounded-md bg-outline-100"
                accessibilityLabel="Ładowanie opcji stylu"
                accessibilityRole="progressbar"
              />
            ))}
          </Box>
        ) : options.length === 0 ? (
          <Box className="gap-2">
            <Text className="text-tertiary-700">Brak dostępnych stylów.</Text>
            <Button
              variant="outline"
              action="secondary"
              onPress={() => {
                // prefer refetch, fallback to invalidate
                void refetch()
                void queryClient.invalidateQueries({ queryKey: ['styles'] })
              }}
              accessibilityRole="button"
              accessibilityLabel="Odśwież listę stylów"
            >
              <ButtonText>Odśwież</ButtonText>
            </Button>
          </Box>
        ) : (
          <Box className="flex-row flex-wrap gap-2">
            {options.map((opt) => (
              <Button
                key={opt.id}
                variant={opt.id === value ? 'solid' : 'outline'}
                action={opt.id === value ? 'primary' : 'secondary'}
                onPress={() => onChange(opt.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: opt.id === value }}
                accessibilityLabel={`Wybierz styl ${opt.display_name || opt.name}`}
              >
                <ButtonText>{opt.display_name || opt.name}</ButtonText>
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
