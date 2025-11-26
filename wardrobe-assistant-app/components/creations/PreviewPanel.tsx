import React, { useCallback, useMemo, useState } from 'react'
import { Box } from '@/components/ui/box'
import { Card } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button, ButtonText } from '@/components/ui/button'
import type { CreationDTO } from 'shared/src/types/dto'
import { Image } from 'react-native'

type Proposal = { creation: CreationDTO; description: string }

type Props = {
  proposals: Proposal[]
  loading?: boolean
  onAccept: (creationId: string) => Promise<void> | void
  onReject: (creationId: string) => Promise<void> | void
}

/**
 * PreviewPanel
 * - Wyświetla listę propozycji kreacji (obraz PNG + opis)
 * - Pozwala zaakceptować lub odrzucić pojedynczą propozycję
 * - Obsługuje pusty stan, a także błędy ładowania obrazów przez placeholder
 */
export function PreviewPanel({ proposals, loading = false, onAccept, onReject }: Props) {
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  const hasProposals = useMemo(() => proposals.length > 0, [proposals])

  const handleAccept = useCallback(
    async (id: string) => {
      if (busy[id]) return
      setBusy((b) => ({ ...b, [id]: true }))
      try {
        await onAccept(id)
      } finally {
        setBusy((b) => {
          const copy = { ...b }
          delete copy[id]
          return copy
        })
      }
    },
    [busy, onAccept],
  )

  const handleReject = useCallback(
    async (id: string) => {
      if (busy[id]) return
      setBusy((b) => ({ ...b, [id]: true }))
      try {
        await onReject(id)
      } finally {
        setBusy((b) => {
          const copy = { ...b }
          delete copy[id]
          return copy
        })
      }
    },
    [busy, onReject],
  )

  // Widok skeletonów podczas generowania
  if (!hasProposals && loading) {
    return (
      <Box className="mt-6 gap-4">
        <Heading size="md">Propozycje</Heading>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 gap-3">
            <Box className="flex-row gap-4">
              <Box className="w-[120px] h-[120px] bg-outline-100 rounded-md" accessibilityRole="progressbar" />
              <Box className="flex-1 gap-2">
                <Box className="h-5 w-2/3 bg-outline-100 rounded" />
                <Box className="h-4 w-full bg-outline-100 rounded" />
                <Box className="h-4 w-5/6 bg-outline-100 rounded" />
                <Box className="flex-row gap-3 mt-2">
                  <Box className="h-10 w-24 bg-outline-100 rounded-md" />
                  <Box className="h-10 w-24 bg-outline-100 rounded-md" />
                </Box>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    )
  }

  if (!hasProposals) {
    return (
      <Box className="mt-6">
        <Card className="p-4 items-center justify-center">
          <Heading size="sm" className="text-tertiary-700 text-center">
            Brak propozycji do wyświetlenia
          </Heading>
          <Text className="text-tertiary-700 mt-1 text-center">
            Wybierz styl i kliknij „Generuj”, aby zobaczyć propozycje kreacji.
          </Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box className="mt-6 gap-4">
      <Heading size="md">Propozycje</Heading>
      {proposals.map((p) => {
        const c = p.creation
        const isBusy = !!busy[c.id]
        const failed = !!imageError[c.id]
        return (
          <Card key={c.id} className="p-4 gap-3">
            <Box className="flex-row gap-4">
              {failed ? (
                <Box className="w-[120px] h-[120px] bg-outline-100 items-center justify-center rounded-md">
                  <Text className="text-outline-700">Brak podglądu</Text>
                </Box>
              ) : (
                <Image
                  source={{ uri: c.image_path }}
                  onError={() => setImageError((e) => ({ ...e, [c.id]: true }))}
                  style={{ width: 120, height: 120, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)' }}
                  resizeMode="cover"
                  accessibilityLabel={`Podgląd kreacji ${c.name || c.id}`}
                />
              )}
              <Box className="flex-1">
                <Heading size="sm" numberOfLines={1} className="mb-1">
                  {c.name || 'Propozycja kreacji'}
                </Heading>
                <Text className="text-tertiary-700" numberOfLines={3}>
                  {p.description}
                </Text>
                <Box className="flex-row gap-3 mt-3">
                  <Button
                    variant="solid"
                    action="primary"
                    size="md"
                    onPress={() => void handleAccept(c.id)}
                    isDisabled={isBusy}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isBusy }}
                    accessibilityLabel={`Akceptuj propozycję ${c.name || c.id}`}
                  >
                    <ButtonText>{isBusy ? 'Przetwarzanie…' : 'Akceptuj'}</ButtonText>
                  </Button>
                  <Button
                    variant="outline"
                    action="secondary"
                    size="md"
                    onPress={() => void handleReject(c.id)}
                    isDisabled={isBusy}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isBusy }}
                    accessibilityLabel={`Odrzuć propozycję ${c.name || c.id}`}
                  >
                    <ButtonText>Odrzuć</ButtonText>
                  </Button>
                </Box>
              </Box>
            </Box>
          </Card>
        )
      })}
    </Box>
  )
}
