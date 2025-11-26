import React from 'react'
import { Button, ButtonText } from '@/components/ui/button'
import { Box } from '@/components/ui/box'

type Props = {
  onGenerate: () => void
  loading?: boolean
  disabled?: boolean
  onReset?: () => void
}

export function ActionButtons({ onGenerate, loading = false, disabled = false, onReset }: Props) {
  return (
    <Box className="flex-row gap-3 mt-2">
      <Button
        variant="solid"
        action="primary"
        size="lg"
        onPress={onGenerate}
        isDisabled={disabled || loading}
        isFocusVisible={false}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityLabel={loading ? 'Trwa generowanie kreacji' : 'Generuj kreacje'}
      >
        <ButtonText>{loading ? 'Generowanie…' : 'Generuj'}</ButtonText>
      </Button>
      {onReset ? (
        <Button
          variant="outline"
          action="secondary"
          size="lg"
          onPress={onReset}
          isDisabled={loading}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          accessibilityLabel="Wyczyść formularz"
        >
          <ButtonText>Reset</ButtonText>
        </Button>
      ) : null}
    </Box>
  )
}
