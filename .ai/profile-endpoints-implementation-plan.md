# API Endpoint Implementation Plan: User Profiles Endpoint

## 1. Przegląd punktu końcowego
Endpoint dotyczy operacji na publicznym profilu użytkownika. Umożliwia pobranie profilu (GET) oraz aktualizację danych profilu (PUT/PATCH). Endpoint korzysta z mechanizmu RLS, dzięki któremu użytkownik może uzyskać dostęp jedynie do swojego profilu, chyba że posiada uprawnienia administratora.

## 2. Szczegóły żądania
- **Metoda HTTP GET** (Get User Profile)
    - **Struktura URL:** `/profiles/{user_id}`
    - **Parametry:**
        - Wymagane: `user_id` (UUID, identyfikator profilu)
    - **Request Body:** Brak

- **Metoda HTTP PUT/PATCH** (Update Profile)
    - **Struktura URL:** `/profiles/{user_id}`
    - **Parametry:**
        - Wymagane: `user_id` (UUID, identyfikator profilu)
    - **Request Body:** Obiekt zawierający pola do aktualizacji, np.:
        - `username` (opcjonalnie, string)

## 3. Wykorzystywane typy
- **DTOs**
    - `ProfileDTO` – reprezentuje dane profilu (pola: `id`, `username`, `created_at`, `updated_at`)
- **Command Modele**
    - `UpdateProfileCommand` – model do przekazywania danych przy aktualizacji profilu

## 4. Przepływ danych
1. **Autentykacja** – Endpoint wymaga weryfikacji JWT, które dostarcza Supabase Auth, oraz mechanizmu RLS.
2. **Pobieranie danych (GET)**
    - Klient wysyła zapytanie GET z `user_id`.
    - Serwis sprawdza, czy żądający użytkownik jest właścicielem profilu (lub adminem).
    - Dane profilu są pobierane z tabeli `public.profiles` i mapowane do `ProfileDTO`.
3. **Aktualizacja danych (PUT/PATCH)**
    - Klient wysyła zapytanie PUT/PATCH z `user_id` oraz danymi w ciele żądania.
    - Endpoint waliduje dane wejściowe względem `UpdateProfileCommand`.
    - Logika biznesowa sprawdza, czy użytkownik próbuje zmodyfikować własny profil (lub posiada uprawnienia admina).
    - W przypadku poprawnej walidacji, serwis aktualizuje rekord w tabeli `public.profiles` i zwraca zaktualizowane dane.

## 5. Względy bezpieczeństwa
- **Autoryzacja i RLS:** Każde żądanie weryfikuje, czy dany profil należy do użytkownika wykonującego żądanie. Mechanizm RLS w Supabase dodatkowo ogranicza dostęp w bazie danych.
- **Walidacja tokena:** Wszystkie żądania wymagają ważnego tokena JWT, który jest sprawdzany przez middleware autoryzacyjne.
- **Uprawnienia administratora:** Umożliwienie dostępu do profilu innego użytkownika tylko dla administratorów.

## 6. Obsługa błędów
- **HTTP 200 (OK):** Pobranie lub aktualizacja profilu zakończona sukcesem.
- **HTTP 400 (Bad Request):** Błędne dane wejściowe lub niepoprawny format żądania.
- **HTTP 401 (Unauthorized):** Brak lub nieważny token autoryzacyjny.
- **HTTP 403 (Forbidden):** Próba aktualizacji profilu innego użytkownika bez odpowiednich uprawnień.
- **HTTP 404 (Not Found):** Profil o podanym `user_id` nie istnieje.
- **HTTP 500 (Internal Server Error):** Błąd po stronie serwera, np. problemy z połączeniem do bazy danych.

## 7. Rozważania dotyczące wydajności
- **Cache'owanie:** Rozważenie cache'owania wyników zapytań GET (np. przy użyciu Redis) w przypadku bardzo dużej liczby odczytów.
- **Indeksowanie:** Upewnienie się, że kolumna `id` w tabeli `public.profiles` jest odpowiednio zindeksowana, aby przyspieszyć operacje wyszukiwania.
- **Optymalizacja zapytań:** Upewnienie się, że zapytania generowane przez ORM/QueryBuilder są zoptymalizowane, aby nie pobierać zbędnych danych.

## 8. Etapy wdrożenia
1. **Definicja kontraktu API:**
    - Aktualizacja dokumentacji API (Swagger/OpenAPI) o szczegóły żądania, odpowiedzi oraz kody statusu.
2. **Implementacja walidacji:**
    - Utworzenie/rozszerzenie modułu walidacji danych wejściowych, korzystając z `UpdateProfileCommand`.
3. **Implementacja logiki biznesowej:**
    - Wydzielenie logiki pobierania i aktualizacji profilu do dedykowanego serwisu (np. `ProfilesService`).
    - Upewnienie się, że serwis sprawdza zgodność `user_id` z tokenem JWT.
4. **Integracja z bazą danych:**
    - Stworzenie metod w serwisie, które komunikują się z tabelą `public.profiles` (pobieranie i aktualizacja).
5. **Obsługa błędów:**
    - Konfiguracja centralnego mechanizmu obsługi błędów, który mapuje wyjątki do odpowiednich kodów HTTP.
6. **Testowanie:**
    - Napisanie testów jednostkowych i integracyjnych dla endpointów GET i PUT/PATCH, obejmujących m.in. przypadki sukcesu oraz błędów (np. próba aktualizacji innego profilu, brak autoryzacji).
7. **Review i code review:**
    - Przeprowadzenie code review oraz weryfikacja zgodności implementacji z ustalonymi standardami i zasadami (np. RLS, walidacja danych, logika biznesowa).
8. **Deployment i monitoring:**
    - Deployment na środowisko stagingowe z odpowiednim monitorowaniem logów błędów oraz wydajności, a następnie wdrożenie na produkcję po akceptacji.
