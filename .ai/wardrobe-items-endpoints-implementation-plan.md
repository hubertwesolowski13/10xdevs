# API Endpoint Implementation Plan: Wardrobe Items

## 1. Przegląd punktu końcowego
Endpointy dotyczą operacji CRUD dla elementów garderoby należących do zalogowanego użytkownika. Funkcjonalność obejmuje wypisywanie listy użytkownikowych elementów, tworzenie nowego elementu, aktualizację oraz usunięcie elementu. Każda operacja jest zabezpieczona uwierzytelnianiem i autoryzacją dzięki mechanizmowi Supabase Auth oraz zastosowaniu Row-Level Security w bazie danych.

## 2. Szczegóły żądania
- **Metoda HTTP:**
    - GET (listowanie)
    - POST (tworzenie)
    - PATCH (aktualizacja)
    - DELETE (usuwanie)
- **Struktura URL:**
    - Lista: `/wardrobe_items`
    - Tworzenie: `/wardrobe_items`
    - Aktualizacja: `/wardrobe_items/{item_id}`
    - Usuwanie: `/wardrobe_items/{item_id}`
- **Parametry:**
    - **GET:**
        - Wymagane: brak (użytkownik określony przez token)
        - Opcjonalne:
            - Pagination (np. page, limit)
            - Filtrowanie (category, color, brand)
            - Sortowanie (np. sort_by=created_at; order=asc/desc)
    - **POST:**
        - Request Body (CreateWardrobeItemCommand):
            - Wymagane: `category_id`, `name`, `color`
            - Opcjonalne: `brand`
    - **PATCH:**
        - URL Path parameter: `item_id` (UUID)
        - Request Body: Zbiór pól do aktualizacji (częściowa aktualizacja WardrobeItemDTO)
    - **DELETE:**
        - URL Path parameter: `item_id` (UUID)

## 3. Wykorzystywane typy
- **WardrobeItemDTO**  
  Obejmuje pola: `id`, `user_id`, `category_id`, `name`, `color`, `brand`, `created_at`, `updated_at`
- **CreateWardrobeItemCommand**  
  Obejmuje pola: `category_id`, `name`, `color`, `brand?`
- **(Ewentualnie) UpdateWardrobeItemCommand**  
  Można wykorzystać częściową wersję WardrobeItemDTO dla aktualizacji

## 4. Szczegóły odpowiedzi
- **GET:**
    - Sukces: HTTP 200, z ciałem odpowiedzi jako tablica obiektów WardrobeItemDTO
    - Błąd: HTTP 401 w przypadku braku autoryzacji
- **POST:**
    - Sukces: HTTP 201, z ciałem zawierającym nowo utworzony WardrobeItemDTO
    - Błąd: HTTP 400 dla niewłaściwych danych; HTTP 401 dla nieautoryzowanych; HTTP 500 dla błędów wewnętrznych
- **PATCH:**
    - Sukces: HTTP 200, z ciałem zawierającym zaktualizowany WardrobeItemDTO
    - Błąd: HTTP 400 dla niewłaściwych danych; HTTP 404, jeśli element nie istnieje; HTTP 401 w przypadku nieautoryzowanego dostępu
- **DELETE:**
    - Sukces: HTTP 204 bez ciała odpowiedzi
    - Błąd: HTTP 404, jeśli element nie istnieje; HTTP 401 dla nieautoryzowanego dostępu

## 5. Przepływ danych
1. Klient wysyła żądanie do odpowiedniego endpointu.
2. Warstwa kontrolera NestJS autentykuje żądanie (sprawdzany JWT token).
3. Kontroler przekazuje dane (query lub payload) do WardrobeItemsService.
4. Serwis waliduje wejście, sprawdza autoryzację (czy element należy do użytkownika) i wykonuje operację przy użyciu Supabase Client.
5. W przypadku operacji GET – dane są pobierane z tabeli `wardrobe_items` z zastosowaniem zapytań filtrujących, paginacyjnych i sortujących.
6. Dla POST, PATCH i DELETE – serwis wykonuje operacje insert/update/delete na tabeli, odpowiednio reagując na błędy.
7. Odpowiedź jest zwracana do klienta z odpowiednim kodem statusu.

## 6. Względy bezpieczeństwa
- Wszystkie endpointy wymagają ważnego JWT tokena (uwierzytelnienie przez Supabase Auth).
- Użytkownik może operować tylko na swoich zasobach – autoryzacja zostanie zapewniona przez RLS na poziomie bazy danych.
- Walidacja wejścia przy użyciu ValidationPipe (whitelist, transform, forbidNonWhitelisted).
- Sprawdzenie poprawności formatu UUID w parametrach URL.
- Zapewnienie, że operacja update/delete sprawdza przynależność elementu do użytkownika.

## 7. Obsługa błędów
- **401 Unauthorized:** Gdy użytkownik nie jest uwierzytelniony.
- **400 Bad Request:** Dla błędów walidacji (brak wymaganych pól, zły format UUID).
- **404 Not Found:** Gdy element nie istnieje lub nie należy do użytkownika.
- **500 Internal Server Error:** W przypadku problemów z bazą danych lub innych nieoczekiwanych błędów.
- Serwis powinien wykorzystywać dedykowane wyjątki (np. BadRequestException, NotFoundException, InternalServerErrorException) oraz opcjonalny logger do rejestrowania błędów krytycznych.

## 8. Rozważania dotyczące wydajności
- Użycie mechanizmów paginacji, filtrowania i sortowania w zapytaniach do bazy poprawi skalowalność dla dużych zestawów danych.
- Indeksy na kluczach obcych oraz na polach wykorzystywanych w filtrowaniu (np. category, created_at) zapewnią lepszą wydajność zapytań.
- Ograniczenie wielkości odpowiedzi za pomocą paginacji pozytywnie wpłynie na czas odpowiedzi i zużycie pamięci.

## 9. Etapy wdrożenia
1. **Analiza wymagań:** Przegląd specyfikacji API, zidentyfikowanie kluczowych pól i walidacji a także zapoznanie się z modelami baz danych.
2. **Projekt DTO i Command Models:** Wykorzystanie istniejących typów (WardrobeItemDTO, CreateWardrobeItemCommand) i przygotowanie nowego UpdateWardrobeItemCommand, jeśli konieczne.
3. **Rozbudowa warstwy serwisowej:**
    - Utworzenie lub rozszerzenie serwisu (WardrobeItemsService) w celu obsługi logiki CRUD.
    - Implementowanie zapytań do bazy przy użyciu Supabase Client z uwzględnieniem paginacji, filtrowania i sortowania.
4. **Implementacja kontrolera:**
    - Utworzenie kontrolera (WardrobeItemsController) z obsługą żądań GET, POST, PATCH i DELETE.
    - Zastosowanie ValidationPipe dla request payloadów.
5. **Implementacja walidacji i autoryzacji:**
    - Walidacja danych wejściowych.
    - Sprawdzenie autentyczności oraz przynależności zasobu (poprzez RLS i dodatkowo wewnętrznie w serwisie).
6. **Testy jednostkowe i integracyjne:**
    - Przygotowanie testów jednostkowych dla serwisu i kontrolera.
    - Sprawdzenie scenariuszy błędnych (np. brak tokena, zły format danych, operacja na cudzym elemencie).
7. **Dokumentacja i Code Review:**
    - Aktualizacja dokumentacji API i wewnętrznych komentarzy.
    - Przegląd kodu przez zespół.
8. **Wdrożenie na środowisku testowym:**
    - Uruchomienie endpointów na środowisku staging i monitorowanie zgodności z wymaganiami.
9. **Monitorowanie i logging:**
    - Wdrożenie mechanizmów logowania błędów i analizy wydajności.
10. **Wdrożenie produkcyjne:**
    - Finalne wdrożenie na środowisku produkcyjnym i optymalizacja na podstawie feedbacku.
