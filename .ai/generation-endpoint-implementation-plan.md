# API Endpoint Implementation Plan: Generate Creations via AI & Accept Creation

## 1. Przegląd punktu końcowego
Endpoint "Generate Creations via AI" umożliwia wywołanie procesu AI generującego propozycje kreacji na podstawie stylu. Przed rozpoczęciem generacji, endpoint sprawdza, czy użytkownik posiada minimalnie wymagane elementy garderoby (np. okrycie górne, okrycie dolne, buty). Drugi endpoint "Accept Creation" pozwala użytkownikowi zaakceptować wygenerowaną kreację, przenosząc ją z tymczasowego magazynu do kolekcji zapisanych kreacji.

## 2. Szczegóły żądania
- **Generate Creations via AI:**
    - **Metoda:** POST
    - **URL:** `/creations/generate`
    - **Parametry:**
        - Wymagane: `style_id` (UUID) – identyfikator stylu kreacji.
        - Opcjonalne: brak.
    - **Request Body Example:**
      ```json
      {
        "style_id": "uuid"
      }
      ```

- **Accept Creation:**
    - **Metoda:** POST
    - **URL:** `/creations/{creation_id}/accept`
    - **Parametry:**
        - Wymagane: `creation_id` (UUID) – unikalny identyfikator kreacji, uzyskany podczas generacji i przechowywany w magazynie tymczasowym.
        - Request body: puste (możliwy rozszerzalny model dla przyszłych potrzeb).

## 3. Wykorzystywane typy
- **DTO i Command Modele:**
    - `GenerateCreationsCommand` – komenda inicjująca generowanie kreacji (zawiera `style_id`).
    - `AcceptCreationCommand` – komenda do akceptacji kreacji (obecnie pusta, ale zachowawcza dla przyszłych rozszerzeń).
    - `CreationDTO` – reprezentacja danych kreacji zarówno w stanie tymczasowym, jak i zaakceptowanym.
- Dodatkowo mogą zostać wykorzystane inne DTO, np. `WardrobeItemDTO` oraz `ItemCategoryDTO`, do walidacji kompletu wymaganych elementów garderoby.

## 4. Przepływ danych
1. Klient wysyła żądanie do endpointu `/creations/generate` wraz z `style_id`.
2. Warstwa API wywołuje serwis odpowiedzialny za:
    - Weryfikację obecności wymaganych elementów garderoby użytkownika, zgodnie z danymi w tabeli `public.item_categories` (np. okrycie górne, dolne, buty).
    - W przypadku niekompletnej garderoby, serwis zwraca błąd HTTP 400.
    - Jeśli weryfikacja przejdzie, wywoływany jest proces komunikacji z modelem AI (np. przez Openrouter.ai lub odpowiedni moduł) w celu wygenerowania propozycji. W czasie developmentu użyjemy danych z mocków zamiast z serwisów AI.
3. Wygenerowane propozycje kreacji (listę obiektów, zawierających m.in. `id`, `name`, `image_path`, `style`) są zwracane w strukturze response wraz z szczegółowym opisem tworzonych zestawów.
4. Endpoint `/creations/{creation_id}/accept` aktualizuje status kreacji, aktualizując jej status w bazie danych na `accepted` (tabela `public.creations`).
5. Endpoint `/creations/{creation_id}/reject` aktualizuje status pozostałych wygenerowanych w tej sesji kreacji, aktualizując jej status w bazie danych na `rejected` (tabela `public.creations`).

## 5. Względy bezpieczeństwa
- Autoryzacja: Upewnić się, że tylko zalogowani użytkownicy mogą wywoływać oba endpointy.
- Walidacja danych wejściowych: Weryfikacja formatu UUID dla `style_id` oraz `creation_id`.
- Ochrona przed atakami typu injection: Użyć przygotowanych zapytań lub ORM.
- Ograniczenia (rate-limiting): Wprowadzić mechanizmy rate-limiting, aby zabezpieczyć usługę przed nadużyciami.

## 6. Obsługa błędów
- **HTTP 400 Bad Request:** W przypadku braku wymaganych elementów garderoby lub niepoprawnego formatu `style_id`.
- **HTTP 404 Not Found:** Jeśli przekazana kreacja w `/creations/{creation_id}/accept` nie istnieje w magazynie tymczasowym.
- **HTTP 401 Unauthorized:** Gdy użytkownik nie jest zalogowany.
- **HTTP 500 Internal Server Error:** W przypadku błędów serwera lub nieoczekiwanych wyjątków.
- Logowanie błędów: Każdy błąd powinien być rejestrowany (ewentualnie w dedykowanej tabeli error_log) z pełnymi szczegółami problemu.

## 7. Rozważania dotyczące wydajności
- Optymalizacja zapytań do bazy danych poprzez indeksy na kolumnach używanych przy walidacji (np. `user_id`, `category_id`).
- Cache'owanie odpowiedzi dla statycznych danych (np. konfiguracje kategorii garderoby) w celu zmniejszenia obciążenia bazy.
- Użycie asynchronicznej komunikacji z modelem AI w celu nieblokowania głównego wątku serwera.

## 8. Etapy wdrożenia
1. Utworzenie warstwy walidacji żądania w kontrolerze – sprawdzenie, czy `style_id` jest poprawnym UUID.
2. Rozbudowa serwisu (np. `CreationService`) obejmującego:
    - Weryfikację obecności wymaganych elementów garderoby użytkownika.
    - Integrację z usługą AI do generacji kreacji.
3. Implementacja endpointu `/creations/generate`:
    - Mapowanie wejścia na `GenerateCreationsCommand`.
    - Wywołanie serwisu i przekazanie przetworzonych danych.
    - Odpowiednie obsłużenie błędów (zgodnie z wymaganiami).
4. Implementacja endpointu `/creations/{creation_id}/accept`:
    - Walidacja przekazanego identyfikatora `creation_id`.
    - Pobranie kreacji z magazynu tymczasowego.
    - Jeśli kreacja istnieje, przeniesienie jej do kolekcji zaakceptowanych kreacji (aktualizacja statusu lub przeniesienie rekordu).
5. Testy jednostkowe i integracyjne:
    - Pokrycie walidacji wejścia, logiki serwisu oraz obsługi błędów.
    - Stworzenie mocków dla komunikacji z modelem AI.

