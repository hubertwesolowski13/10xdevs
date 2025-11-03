// Global env typings for Expo public variables
// Do not import this file directly; the compiler picks it up via tsconfig include.

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  }
}
