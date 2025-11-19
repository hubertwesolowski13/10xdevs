# API Endpoint Implementation Plan: Creation Items Endpoints

Poniższy plan wdrożenia obejmuje dwa endpointy związane z relacją między kreacjami a elementami garderoby:
- GET `/creations/{creation_id}/items` – pobranie listy elementów garderoby powiązanych z daną kreacją
- POST `/creations/{creation_id}/items` – dodanie elementu garderoby do kreacji

---

## 1. Przegląd punktu końcowego
Endpointy służą do zarządzania powiązaniami między kreacjami a elementami garderoby.
- **GET `/creations/{creation_id}/items`:** Umożliwia pobranie wszystkich elementów garderoby powiązanych z kreacją. Dostęp mają jedynie właściciele kreacji (implementacja RLS).
- **POST `/creations/{creation_id}/items`:** Umożliwia dodanie nowego elementu garderoby do kreacji, po uprzedniej walidacji (m.in. czy element należy do użytkownika) przez funkcję `can_add_to_creation`.

---

## 2. Szczegóły żądania

### GET `/creations/{creation_id}/items`
- **Metoda HTTP:** GET
- **Struktura URL:** `/creations/{creation_id}/items`
- **Parametry:**
    - **Wymagane:**
        - `creation_id` (UUID) – identyfikator kreacji, dla której pobieramy powiązane elementy garderoby
- **Request Body:** Brak

### POST `/creations/{creation_id}/items`
- **Metoda HTTP:** POST
- **Struktura URL:** `/creations/{creation_id}/items`
- **Parametry:**
    - **Wymagane:**
        - `creation_id` (UUID) – identyfikator kreacji, do której dodajemy element
- **Request Body:** Obiekt JSON zgodny z modelem `AddWardrobeItemToCreationCommand`:
  ```json
  {
    "item_id": "uuid"
  }
  ```

---

## 3. Wykorzystywane typy i modele

- **DTOs:**
    - `CreationItemDTO`: Reprezentuje rekord z tabeli `creation_items` (pola: `id`, `creation_id`, `item_id`)
    - (Ewentualnie) `WardrobeItemDTO`: Może być używany do mapowania danych elementu garderoby przy pobieraniu listy
- **Command Modele:**
    - `AddWardrobeItemToCreationCommand`: Model wejściowy zawierający pole `item_id` (UUID)

---

## 4. Przepływ danych

### GET `/creations/{creation_id}/items`
1. **Autentykacja i autoryzacja:**
    - Użytkownik musi być uwierzytelniony (JWT).
    - Mechanizm RLS w bazie danych sprawdza, że kreacja należy do użytkownika (poprzez subzapytanie w polityce RLS).
2. **Interakcja z bazą danych:**
    - Wykonanie zapytania SELECT na tabeli `creation_items` z filtrem `creation_id`.
    - Dodatkowo można dołączyć dane elementów garderoby (np. poprzez JOIN do `wardrobe_items`) w celu pełniejszego wyniku.
3. **Mapowanie danych:**
    - Wynik zapytania jest mapowany do listy obiektów DTO w formacie `CreationItemDTO` lub rozszerzonego o dane z `WardrobeItemDTO`.
4. **Odpowiedź:**
    - API zwraca listę powiązanych elementów garderoby z kodem 200.

### POST `/creations/{creation_id}/items`
1. **Walidacja wejścia:**
    - Sprawdzenie poprawności identyfikatora kreacji z URL.
    - Walidacja JSON request body, aby upewnić się, że zawiera poprawne `item_id` (UUID).
2. **Autoryzacja:**
    - Sprawdzenie, czy użytkownik jest właścicielem kreacji oraz czy element garderoby należy do użytkownika.
    - Funkcja `can_add_to_creation` w bazie danych weryfikuje poprawność relacji.
3. **Interakcja z bazą danych:**
    - Wstawienie nowego rekordu do tabeli `creation_items`, przy czym ograniczenie UNIQUE zapobiega duplikatom.
4. **Odpowiedź:**
    - W przypadku sukcesu, zwracany jest rekord powiązania z kodem 201.

---

## 5. Względy bezpieczeństwa

- **Autoryzacja i RLS:**
    - Oba endpointy wymagają ważnego tokena JWT.
    - Dla GET endpointu polityka RLS umożliwia odczyt jedynie powiązań dla kreacji, do których użytkownik ma dostęp.
    - Dla POST endpointu polityka INSERT korzysta z funkcji `can_add_to_creation`, która weryfikuje, czy zarówno kreacja, jak i element garderoby należą do użytkownika.
- **Walidacja typów:**
    - Identyfikatory w URL i w ciele żądania muszą być zgodne z formatem UUID, co zabezpiecza przed atakami typu injection.
- **Ograniczenie duplikatów:**
    - Constraint UNIQUE na parze (`creation_id`, `item_id`) zabezpiecza przed wielokrotnym dodaniem tego samego elementu.

---

## 6. Obsługa błędów

- **GET `/creations/{creation_id}/items`:**
    - **HTTP 200 (OK):** Pomyślne pobranie listy elementów.
    - **HTTP 400 (Bad Request):** Błędny format `creation_id`.
    - **HTTP 401 (Unauthorized):** Użytkownik nie jest uwierzytelniony.
    - **HTTP 404 (Not Found):** Kreacja lub powiązane elementy nie zostały znalezione.
    - **HTTP 500 (Internal Server Error):** Błąd po stronie serwera lub problem z dostępem do bazy danych.

- **POST `/creations/{creation_id}/items`:**
    - **HTTP 201 (Created):** Element został dodany do kreacji.
    - **HTTP 400 (Bad Request):** Błędne dane wejściowe lub format JSON.
    - **HTTP 401 (Unauthorized):** Brak ważnego tokena.
    - **HTTP 403 (Forbidden):** Element nie należy do użytkownika lub naruszenie reguł walidacji przez funkcję `can_add_to_creation`.
    - **HTTP 404 (Not Found):** Kreacja lub element garderoby nie istnieją.
    - **HTTP 500 (Internal Server Error):** Błąd przy zapisie do bazy danych lub inny problem serwerowy.

---

## 7. Rozważania dotyczące wydajności

- **Query Optimization:**
    - Indeksacja kolumn `creation_id` i `item_id` w tabeli `creation_items` zapewnia szybkie wyszukiwanie.
    - Rozważenie możliwości dołączenia (JOIN) danych z tabeli `wardrobe_items` tylko jeśli wymagane przez UI.
- **Bezpośredni zapis w bazie:**
    - Wstawienie rekordu odbywa się bezpośrednio w bazie i korzysta z mechanizmów transakcyjnych PostgreSQL.
- **Cache:**
    - W przypadku dużej liczby zapytań GET, można rozważyć cache’owanie wyników w mechanizmie takim jak Redis.

---

## 8. Etapy wdrożenia

1. **Definicja kontraktu API:**
    - Aktualizacja dokumentacji Swagger/OpenAPI z oboma endpointami – GET i POST dla ścieżki `/creations/{creation_id}/items`.

2. **Implementacja walidacji i DTO:**
    - Upewnienie się, że typ `AddWardrobeItemToCreationCommand` jest poprawnie zdefiniowany w pliku DTO.
    - Przygotowanie DTO `CreationItemDTO` wykorzystywanego w odpowiedzi oraz opcjonalnego rozszerzenia o dane z `WardrobeItemDTO`.

3. **Implementacja logiki w warstwie serwisowej:**
    - Dodanie metody `listCreationItems(creationId: string, userId: string)` dla GET endpointu, która wykonuje zapytanie do bazy danych i zwraca powiązane rekordy.
    - Rozszerzenie istniejącego serwisu (np. `CreationsService`) o metodę `addWardrobeItemToCreation(creationId: string, command: AddWardrobeItemToCreationCommand, userId: string)` do obsługi POST endpointu.

4. **Aktualizacja kontrolera:**
    - Dodanie nowej metody w kontrolerze kreacji, która obsługuje GET `/creations/{creation_id}/items`.
    - Upewnienie się, że dla metody POST wykorzystywana jest właściwa metoda serwisowa i poprawnie obsługiwane są parametry ścieżki oraz ciało żądania.

5. **Testowanie:**
    - Implementacja testów jednostkowych i integracyjnych:
        - Testy poprawnego pobierania powiązanych elementów przy GET.
        - Testy walidacji oraz poprawnego dodania elementu przy POST.
        - Scenariusze negatywne, np. próba pobrania z nieistniejącej kreacji, dodanie elementu niebędącego własnością użytkownika, błędne UUID.

6. **Review i code review:**
    - Przeprowadzenie przeglądu kodu pod kątem zgodności z zasadami opisanymi w `guidelines.md` oraz sprawdzenie zgodności z modelem RLS.

7. **Deployment i monitoring:**
    - Wdrożenie endpointów na środowisku stagingowym, monitorowanie logów oraz zachowanie aplikacji, a następnie wdrożenie na produkcję po akceptacji.

---
