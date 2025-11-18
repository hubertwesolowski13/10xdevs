# API Endpoint Implementation Plan: Register and Login Endpoints

## 1. Przegląd punktu końcowego
Endpointy `/auth/v1/signup` oraz `/auth/v1/login` służą do rejestracji i logowania użytkowników. Rejestracja tworzy nowy rekord użytkownika oraz automatycznie generuje profil. Logowanie uwierzytelnia użytkownika i zwraca token JWT oraz dane profilu.

## 2. Szczegóły żądania
### Register User
- **Metoda HTTP:** POST
- **Scieżka:** `/auth/v1/signup`
- **Parametry:**
    - **Wymagane:**
        - `email` (string)
        - `password` (string)
    - **Opcjonalne:**
        - `additional_metadata.username` (string)
- **Body Żądania:**
  ```json
  {
    "email": "string",
    "password": "string",
    "additional_metadata": { "username": "string" }
  }
  ```

### Login User
- **Metoda HTTP:** POST
- **Scieżka:** `/auth/v1/login`
- **Parametry:**
    - **Wymagane:**
        - `email` (string)
        - `password` (string)
    - **Opcjonalne:** Brak
- **Body Żądania:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

## 3. Wykorzystywane typy
- **DTO:**
    - `ProfileDTO` – reprezentuje publiczne dane użytkownika.
    - `RegisterUserCommand` – zawiera pola: `email`, `password` i opcjonalne `additional_metadata.username`.
    - `LoginUserCommand` – zawiera pola: `email` oraz `password`.

- **Command Modele:**
    - `RegisterUserCommand` do rejestracji.
    - `LoginUserCommand` do logowania.

## 4. Przepływ danych
1. **Rejestracja:**
    - Żądanie przychodzi do endpointu `/auth/v1/signup`.
    - Warstwa kontrolera waliduje dane wejściowe (np. sprawdzenie poprawności formatu email, długości hasła, dostępności nazwy użytkownika).
    - Warstwa kontrolera waliduje obecność pola additional_metadata.username i jeśli nie zostało podane to zostanie wygenerowane automatycznie na podstawie emaila.
    - Wywoływana jest logika serwisowa do rejestracji:
        - Utworzenie rekordu w systemie autoryzacji (np. Supabase Auth).
        - Automatyczne wywołanie triggera lub logiki w service, która tworzy profil użytkownika w tabeli `public.profiles` z odpowiednimi danymi (używając `username` z additional_metadata).
    - Po pomyślnym utworzeniu zwracany jest kod stanu HTTP 201 oraz szczegóły utworzonego użytkownika (np. `ProfileDTO`).

2. **Logowanie:**
    - Żądanie przychodzi do endpointu `/auth/v1/login`.
    - Kontroler dokonuje wstępnej walidacji wejścia (sprawdzenie formatu email i obecności hasła).
    - Logika serwisowa weryfikuje dane uwierzytelniające.
    - Jeśli dane są poprawne, generowany jest token JWT, a wraz z nim zwracane są dane profilu (np. `ProfileDTO`).
    - W przypadku błędnych danych zwracany jest kod 401.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja:**
    - Rejestracja nie wymaga wcześniejszej autoryzacji.
    - Przy logowaniu należy stosować sprawdzanie poprawności danych (hashowanie haseł, wykorzystanie bezpiecznych bibliotek do generowania JWT).
- **Walidacja wejścia:**
    - Użycie bibliotek walidacyjnych (np. class-validator lub NestJS Pipes) w celu sprawdzenia poprawności formatu email, minimalnej długości hasła oraz unikalności `username` zgodnie z ograniczeniami bazy.
- **Bezpieczeństwo transmisji:**
    - Wymuszenie HTTPS dla przesyłu wrażliwych danych.
- **Ochrona danych:**
    - Sanitizacja danych wejściowych w celu zapobieżenia atakom typu SQL Injection oraz XSS.
- **Logowanie i audyt:**
    - Rejestrowanie prób logowania i błędów rejestracji dla celów monitoringu oraz audytu (bez ujawniania wrażliwych informacji).

## 6. Obsługa błędów
- **HTTP 400 (Bad Request):**
    - Błędy walidacji danych wejściowych (np. nieprawidłowy format email, brak wymaganego pola).
- **HTTP 401 (Unauthorized):**
    - Błędne dane logowania (nieprawidłowy email lub hasło).
- **HTTP 500 (Internal Server Error):**
    - Błędy po stronie serwera, np. problemy z połączeniem z bazą danych lub nieoczekiwane wyjątki.
- **Rejestracja błędów:**
    - Każdy błąd powinien być odpowiednio logowany (dla celów monitoringu i debugowania) przy użyciu centralized error logging system.

## 7. Rozważania dotyczące wydajności
- **Caching:**
    - Rozważyć caching statycznych danych użytkownika po udanym logowaniu.
- **Asynchroniczność:**
    - Użycie asynchronicznych metod przy odczycie/zapisie do bazy.
- **Load Balancing:**
    - W przypadku dużego ruchu, zastosować load balancing dla instancji API.
- **Indeksy:**
    - Zabezpieczenie, że kolumny wykorzystywane w wyszukiwaniu (np. email, username) są odpowiednio indeksowane w bazie PostgreSQL.

## 8. Etapy wdrożenia
1. **Przygotowanie środowiska:**
    - Upewnienie się, że środowisko NestJS oraz Supabase są skonfigurowane zgodnie z wytycznymi.
2. **Implementacja kontrolera:**
    - Utworzenie kontrolera dla endpointów `/auth/v1/signup` i `/auth/v1/login`.
    - Dodanie odpowiednich dekoratorów i metod obsługujących żądania.
3. **Implementacja serwisu:**
    - Utworzenie lub rozszerzenie istniejącego serwisu odpowiedzialnego za logikę rejestracji i logowania.
    - Wyodrębnienie walidacji danych wejściowych przy pomocy NestJS Pipes lub dedykowanych bibliotek (np. class-validator).
4. **Integracja z bazą danych:**
    - Upewnienie się, że operacje tworzenia użytkownika i profilu działają wraz z triggerami w bazie (np. automatyczne tworzenie profilu po rejestracji).
5. **Implementacja logiki uwierzytelniania:**
    - Dodanie modułu obsługi JWT dla generowania tokenów przy logowaniu.
    - Upewnienie się, że hasła są odpowiednio szyfrowane.
6. **Testowanie:**
    - Utworzenie testów jednostkowych i integracyjnych przy użyciu Jest.
    - Testowanie scenariuszy sukcesu oraz błędów (walidacja, nieprawidłowe dane, błędy serwera).
7. **Walidacja bezpieczeństwa:**
    - Przeprowadzenie audytu bezpieczeństwa z naciskiem na ochronę danych oraz prawidłową implementację uwierzytelniania.
8. **Dokumentacja:**
    - Uaktualnienie dokumentacji API (np. Swagger/OpenAPI) o nowe endpointy i przykłady żądań/odpowiedzi.
9. **Deployment:**
    - Wdrożenie na środowisku testowym, a następnie produkcyjnym z odpowiednimi monitorami wydajności i logowania błędów.
