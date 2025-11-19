# API Endpoint Implementation Plan: List Categories or Styles

## 1. Przegląd punktu końcowego
Endpoint ma za zadanie umożliwić pobranie listy kategorii elementów gardoroby (item_categories) lub stylów kreacji (styles). Operacja ta jest dostępna dla wszystkich uwierzytelnionych użytkowników, a dla akcji administracyjnych (tworzenie/aktualizacja) wykorzystywane będą oddzielne endpointy chronione rolą `service_role`.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET dla pobierania (GET) oraz POST/PUT dla operacji administracyjnych.
- **Struktura URL:**
    - Pobieranie: `/item_categories` i `/styles`
    - Operacje Administracyjne: `/admin/item_categories` i `/admin/styles`
- **Parametry:**
    - *Wymagane:* Brak dodatkowych parametrów – endpoint zwraca wszystkie rekordy.
    - *Opcjonalne:* Możliwość implementacji parametrów query (np. filtrowanie, sortowanie, stronicowanie) w przyszłości.
- **Request Body:** Nie dotyczy operacji typu GET.  
  Dla operacji administracyjnych (POST/PUT) wymagany będzie payload zawierający:
    - `name`: string
    - `display_name`: string
    - (dla kategorii) `is_required`: boolean

## 3. Wykorzystywane typy
- **DTOs:**
    - `ItemCategoryDTO` – definiuje strukturę kategorii, zawiera `id`, `name`, `display_name` oraz `is_required`.
    - `StyleDTO` – definiuje strukturę stylu, zawiera `id`, `name` oraz `display_name`.
- **Command Modele:**  
  Dla operacji administracyjnych można wprowadzić Command Model typu:
    - `CreateOrUpdateItemCategoryCommand` (analogiczny model mógłby być powielony dla stylów) z polami: `name`, `display_name`, `is_required` (opcjonalnie z domyślną wartością).

## 4. Szczegóły odpowiedzi
- **Sukces:**
    - **Kode odpowiedzi:** 200 (dla odczytu) lub 201 (dla operacji tworzenia).
    - **Struktura odpowiedzi GET:** Tablica obiektów DTO (`ItemCategoryDTO` lub `StyleDTO`).
- **Błędy:**
    - 400 – nieprawidłowe dane wejściowe (głównie dla POST/PUT).
    - 401 – nieautoryzowany dostęp, gdy użytkownik nie jest uwierzytelniony.
    - 403 – dostęp zabroniony (dla operacji administracyjnych, gdy brakuje roli `service_role`).
    - 500 – błąd serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie do endpointu `/item_categories` lub `/styles` z nagłówkiem autoryzacji (JWT).
2. Warstwa uwierzytelnienia (np. za pomocą NestJS Guards) weryfikuje token i autoryzuje użytkownika.
3. Kontroler wywołuje metodę serwisu, która pobiera dane z bazy danych (tabela `public.item_categories` lub `public.styles`).
4. Serwis mapuje dane na odpowiednie DTO (`ItemCategoryDTO` lub `StyleDTO`).
5. Dane są zwracane do klienta z odpowiednim kodem stanu.

Dla operacji administracyjnych:
1. Klient wysyła żądanie zawierające payload z danymi do endpointu `/admin/item_categories` lub `/admin/styles`.
2. Uwierzytelnienie i autoryzacja dodatkowo sprawdzają rolę `service_role`.
3. Walidacja payloadu następuje na poziomie DTO/Command Model oraz service'u.
4. W przypadku poprawnych danych, serwis tworzy lub aktualizuje rekord w tabeli i zwraca nowy/zmodyfikowany rekord jako DTO.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie:** Wszystkie operacje wymagają uwierzytelnienia za pomocą JWT. Endpointy pobierania dostępne są dla wszystkich zalogowanych użytkowników.
- **Autoryzacja:** Operacje administracyjne (POST/PUT) muszą być zabezpieczone przed nieautoryzowanym dostępem poprzez weryfikację roli `service_role`.
- **Walidacja danych:** Użycie klas walidacyjnych (np. dekoratorów `@IsUUID`, `@IsNotEmpty`, itp.) oraz customowych pipe'ów w NestJS zapewnia poprawność danych wejściowych zgodnie z dokumentacją.
- **Bezpieczeństwo bazy:** Stosowanie mechanizmów RLS (Row-Level Security) w tabelach zapewnia, że tylko uprawnieni użytkownicy mogą modyfikować dane.

## 7. Obsługa błędów
- **Błędy walidacyjne:** Aktualizacja lub tworzenie z nieprawidłowym payloadem zwróci 400 z listą błędów walidacji.
- **Błędy autoryzacji:** Brak tokenu lub nieodpowiednia rola spowoduje zwrócenie 401 lub 403.
- **Brak zasobów:** Jeśli endpoint próbuje odczytać dane, a nie ma ich w bazie, zostanie zwrócony 404.
- **Błędy serwera:** Każdy nieobsłużony wyjątek zostanie przetłumaczony na 500 z informacyjnym komunikatem dla logów (bez ujawniania szczegółów klientowi).

## 8. Rozważania dotyczące wydajności
- Użycie paginacji oraz filtrowania (w odróżnieniu od pełnego pobierania wszystkich rekordów) może być wprowadzone w przyszłych iteracjach, aby poprawić wydajność przy dużej liczbie rekordów.
- Warstwa cache'owania (np. z Redis) może być rozważona, jeżeli operacja pobierania stanie się wąskim gardłem.

## 9. Etapy wdrożenia
1. **Analiza i projekt DTO/Command:**
    - Przegląd istniejących typów DTO w `dto.ts`.
    - Utworzenie Command Model dla operacji administracyjnych (jeśli nie istnieje).
2. **Implementacja kontrolera:**
    - Dodanie endpointów GET w kontrolerze (np. `ItemCategoriesController` lub `StylesController`).
    - Utworzenie oddzielnych endpointów administracyjnych i ich zabezpieczenie przez rolę `service_role`.
3. **Implementacja serwisu:**
    - Utworzenie lub rozszerzenie istniejącego serwisu do obsługi logiki pobierania oraz zapisu danych.
    - Wstrzyknięcie warstwy dostępu do bazy (np. przy użyciu NestJS Repository lub bezpośrednio Supabase).
    - Zaimplementowanie mapowania danych z modelu bazy na DTO.
4. **Walidacja danych wejściowych:**
    - Integracja walidatorów na poziomie DTO/Command Model.
    - Dodanie pipe'ów walidacyjnych w kontrolerze.
5. **Testowanie endpointu:**
    - Przygotowanie testów jednostkowych i integracyjnych (np. z wykorzystaniem Jest).
    - Przeprowadzenie testów z poprawnymi oraz niepoprawnymi danymi aby zweryfikować walidację.
6. **Dokumentacja i Code Review:**
    - Aktualizacja dokumentacji API wraz z opisem endpointu.
    - Code Review w zespole przed wdrożeniem do środowiska produkcyjnego.
7. **Monitoring i logowanie błędów:**
    - Implementacja mechanizmów logowania błędów (np. przez logger NestJS).
    - Konfiguracja mechanizmu monitorowania dla zbierania metryk użycia endpointu.
