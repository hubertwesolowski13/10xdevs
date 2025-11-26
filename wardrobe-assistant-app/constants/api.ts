// Centralne miejsce konfiguracji adresu API backendu
// W produkcji sugerowane jest użycie zmiennych środowiskowych Expo (app.config) lub pliku .env
// Dla uproszczenia używamy fallbacku na localhost.

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE?.trim() || 'http://localhost:3000'
