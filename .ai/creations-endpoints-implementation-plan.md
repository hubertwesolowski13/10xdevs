# API Endpoint Implementation Plan: Create Creation (Manual)

## 1. Przegląd punktu końcowego
Endpoint służy do manualnego utworzenia nowej kreacji przez użytkownika. Oprócz rejestracji powiązania z określonym stylem, endpoint przyjmuje również ścieżkę do obrazu. Kreacja zostanie powiązana z użytkownikiem uwierzytelnionym przez system. W planie wdrożenia uwzględniamy walidację danych wejściowych, autoryzację oraz mapowanie danych do odpowiednich DTO.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** `/creations`
- **Parametry:**
    - **Wymagane:**
        - `style_id` (UUID) – identyfikator stylu kreacji
        - `name` (string) – nazwa kreacji (generowana ręcznie)
        - `image_path` (string) – ścieżka do obrazu PNG
    - **Opcjonalne:**
        - Brak dodatkowych parametrów (opcjonalnie możliwe rozszerzenie o parametry paginacji, filtrowania itp. przy listowaniu kreacji)
- **Request Body:**
  ```json
  {
    "style_id": "uuid",
    "name": "string",
    "image_path": "string"
  }
  ```

## 3. Wykorzystywane typy
- **DTOs:**
    - `CreationDTO` – reprezentuje zapisane dane kreacji (m.in. `id`, `name`, `image_path`, `style_id`, `status`, `created_at`, `updated_at`, `user_id`)
- **Command Modele:**
    - `CreateCreationCommand` – Command model oparty na `CreationDTO` z wykluczeniem pól generowanych (takich jak `id`, `created_at`, `updated_at`, `user_id` i `status`)

## 4. Przepływ danych
1. **Odbiór żądania:**
    - Żądanie przychodzi do endpointu `/creations` wraz z payloadem zawierającym `style_id`, `name` i `image_path`.
2. **Autoryzacja:**
    - Middleware/Guard weryfikuje, czy użytkownik jest uwierzytelniony (np. poprzez JWT) oraz przypisuje identyfikator użytkownika (user_id).
3. **Walidacja danych wejściowych:**
    - Weryfikacja poprawności formatu `style_id` (czy jest UUID).
    - Walidacja obecności i typu pól `name` oraz `image_path`.
4. **Weryfikacja zależności i spójności danych:**
    - Sprawdzenie, czy styl o podanym `style_id` istnieje w tabeli `public.styles`.
    - Opcjonalnie: sprawdzenie, czy obraz o podanej ścieżce istnieje i jest prawidłowy.
5. **Wywołanie logiki biznesowej:**
    - Kontroler wywołuje metodę serwisu (np. `CreationsService.createCreation`) przekazując dane z command modelu oraz user_id.
6. **Operacja zapisu:**
    - Serwis mapuje dane wejściowe do modelu bazy danych i wykonuje operację INSERT w tabeli `public.creations`.
    - Status kreacji ustawiany jest domyślnie na `pending`.
7. **Odpowiedź:**
    - W przypadku powodzenia zwracany jest kod HTTP 201 wraz z utworzonym obiektem kreacji (mapowanym do `CreationDTO`).
    - W przypadku nieprawidłowych danych lub innych błędów zwracane są odpowiednie kody błędów.

## 5. Względy bezpieczeństwa
- **Autoryzacja:**
    - Endpoint dostępny wyłącznie dla uwierzytelnionych użytkowników.
    - Weryfikacja, że użytkownik nie modyfikuje cudzych zasobów dzięki mechanizmowi RLS.
- **Walidacja danych:**
    - Walidacja typu i formatu dla `style_id` (UUID), `name` oraz `image_path`.
    - Użycie mechanizmów walidacyjnych (np. NestJS Pipes i class-validator) zapewniających zgodność z regułami.
- **Bezpieczeństwo wejścia:**
    - Sanitizacja danych wejściowych w celu uniknięcia ataków takich jak SQL Injection.
- **Obsługa błędów:**
    - Stosowanie standardowych kodów HTTP, szczególnie 400 dla błędnych danych, 401 dla nieautoryzowanego dostępu oraz 500 dla błędów serwera.

## 6. Obsługa błędów
- **HTTP 201 – Created:**
    - Kreacja została pomyślnie utworzona.
- **HTTP 400 – Bad Request:**
    - Nieprawidłowy format danych wejściowych (np. błędny UUID, brak wymaganych pól).
- **HTTP 401 – Unauthorized:**
    - Brak uwierzytelnienia.
- **HTTP 404 – Not Found:**
    - Styl o podanym `style_id` nie został znaleziony.
- **HTTP 500 – Internal Server Error:**
    - Niespodziewane błędy po stronie serwera (np. problem z połączeniem do bazy danych).

## 7. Rozważania dotyczące wydajności
- **Optymalizacja operacji bazodanowych:**
    - Operacja INSERT wykonuje tylko minimalną liczbę operacji – tylko jeden zapis do tabeli `public.creations`.
    - Upewnienie się, że kolumny typu UUID (np. `style_id` i `user_id`) są zindeksowane, co przyspieszy weryfikację istnienia rekordu stylu.
- **Łączenie operacji walidacyjnych:**
    - Walidacja istnienia stylu i właściwości kreacji wykonywana w ramach jednej transakcji w serwisie, aby zminimalizować opóźnienia.

## 8. Etapy wdrożenia
1. **Analiza wymagań i wstępny projekt:**
    - Zapoznać się ze specyfikacją endpointu oraz strukturą tabel w bazie danych.
    - Upewnić się, że nowy endpoint jest zgodny z zasadami implementacji opisanymi w pliku `guidelines.md`.
2. **Implementacja kontrolera:**
    - W pliku `creations.controller.ts` dodać metodę obsługującą POST na ścieżce `/creations` (analogicznie do metod w innych endpointach).
    - Zastosować odpowiednie dekoratory (np. `@Post()`, `@HttpCode(HttpStatus.CREATED)`) oraz walidację danych.
3. **Rozszerzenie serwisu:**
    - W pliku `creations.service.ts` zaimplementować metodę `createCreation` przyjmującą dane z command modelu oraz `user_id`.
    - W metodzie dokonać walidacji danych (sprawdzenie UUID, istnienia stylu) oraz przetworzyć logikę zapisu w bazie.
4. **Implementacja walidacji wejścia:**
    - Użyć dedykowanych walidatorów (np. decorators z class-validator) do sprawdzenia pól `style_id`, `name` i `image_path`.
    - Zapewnić, że error messages są przyjazne i zgodne z obsługą błędów (np. HTTP 400 dla nieprawidłowych danych).
5. **Testy jednostkowe i integracyjne:**
    - Napisać testy dla scenariuszy sukcesu:
        - Kreacja utworzona przy użyciu poprawnych danych.
    - Napisać testy dla scenariuszy błędów:
        - Brak wymaganych pól lub nieprawidłowy format `style_id`.
        - Nieistniejący styl.
        - Próba utworzenia kreacji przez użytkownika nieautoryzowanego.
6. **Code Review oraz wdrożenie na środowisko testowe:**
    - Przeprowadzić przegląd kodu z zespołem.
    - Wdrożyć zmiany na środowisku stagingowym w celu walidacji działania endpointu.
7. **Deployment na produkcję:**
    - Po zatwierdzeniu testów i przeglądzie kodu wdrożyć zmiany na środowisku produkcyjnym.
    - Monitorować logi błędów oraz wydajność operacji.
