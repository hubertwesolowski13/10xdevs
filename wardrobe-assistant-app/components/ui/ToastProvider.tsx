import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Platform } from 'react-native'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  type: ToastType
  message: string
}

type ToastContextType = {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, type, message }])
      // Auto dismiss after 3s (longer on iOS for accessibility)
      const timeout = Platform.select({ ios: 3500, default: 3000 })
      setTimeout(() => remove(id), timeout)
    },
    [remove],
  )

  const value = useMemo<ToastContextType>(
    () => ({
      show: (msg, type) => push(msg, type),
      success: (msg) => push(msg, 'success'),
      error: (msg) => push(msg, 'error'),
      info: (msg) => push(msg, 'info'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container overlay */}
      <Box
        pointerEvents="none"
        className="absolute left-0 right-0 px-4"
        style={{ bottom: 24 }}
        accessibilityLiveRegion="polite"
      >
        {toasts.map((t) => (
          <ToastItemView key={t.id} item={t} />
        ))}
      </Box>
    </ToastContext.Provider>
  )
}

function ToastItemView({ item }: { item: ToastItem }) {
  const bg = item.type === 'success' ? 'bg-success-600' : item.type === 'error' ? 'bg-error-600' : 'bg-secondary-700'
  const border =
    item.type === 'success' ? 'border-success-700' : item.type === 'error' ? 'border-error-700' : 'border-outline-300'
  return (
    <Box
      className={`mt-2 rounded-lg px-4 py-3 ${bg} border ${border} shadow-lg`}
      accessibilityRole="alert"
      accessibilityLabel={`${item.type === 'success' ? 'Sukces' : item.type === 'error' ? 'Błąd' : 'Informacja'}: ${item.message}`}
    >
      <Text className="text-white">{item.message}</Text>
    </Box>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
