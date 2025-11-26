# Plan implementacji widoku Formularz dodawania kreacji

## 1. Przegląd
Widok umożliwia użytkownikowi ręczne stworzenie nowej kreacji. Po wybraniu stylu i wpisaniu nazwy kreacji, system wywołuje proces AI, który na podstawie obecnych elementów garderoby generuje 3 propozycje kreacji – wraz z podglądem grafiki w formacie PNG i opisem kompozycji. Użytkownik ma możliwość zaakceptowania lub odrzucenia każdej z wygenerowanych propozycji.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką: `/creations/add`

## 3. Struktura komponentów
- **AddCreationPage**  
  └── **StyleSelect**  
  └── **NameInput**  
  └── **PreviewPanel**  
  └── **ActionButtons**

## 4. Szczegóły komponentów

### AddCreationPage
- **Opis:** Główny kontener widoku, który zarządza formularzem generacji kreacji oraz wyświetla wygenerowane propozycje.
- **Główne elementy:**
    - Formularz z walidacją (wymagane pola: wybór stylu, nazwa kreacji).
    - Logika wywołania endpointu generującego kreacje.
    - Sekcja podglądu (PreviewPanel) z propozycjami kreacji.
    - Obsługa przycisków akceptacji/odrzucenia wygenerowanych propozycji.
- **Obsługiwane interakcje:**
    - Zmiana wybranego stylu (aktualizacja stanu).
    - Wprowadzenie nazwy kreacji.
    - Kliknięcie przycisku "Generuj" wywołujące żądanie do API.
    - Kliknięcie przycisku akceptacji lub odrzucenia każdej propozycji.
- **Warunki walidacji:**
    - Styl musi być poprawnym UUID.
    - Nazwa kreacji nie może być pusta.
    - Blokada wielokrotnego wysłania formularza podczas oczekiwania na odpowiedź API.
- **Typy:** Użycie DTO `GenerateCreationsCommand` (pole `style_id`) oraz ViewModelu dla propozycji kreacji (obejmującego m.in. `id`, `name`, `image_path`, `style`, `description`).
- **Propsy:** Komponent jest samodzielny i zarządza wewnętrznym stanem, nie przyjmuje zewnętrznych propsów.

### StyleSelect
- **Opis:** Komponent umożliwiający wybór stylu kreacji z listy.
- **Główne elementy:**
    - Rozwijana lista (select) z dostępnymi stylami pobranymi z API z endpointa `/styles`.
    - Wyświetlanie dodatkowych informacji (np. tooltip z opisem).
- **Obsługiwane interakcje:**
    - Zmiana wartości wybranego stylu – przekazanie wybranej wartości do rodzica.
- **Warunki walidacji:**
    - Sprawdzenie poprawności formatu UUID.
- **Typy:** Oparta na typie `StyleDTO` (pola: `id`, `name`, `display_name`).
- **Propsy:**
    - `value`: string – aktualnie wybrany styl.
    - `onChange`: (value: string) => void – callback informujący o zmianie.
    - `options`: StyleDTO[] – lista dostępnych stylów.

### NameInput
- **Opis:** Pole tekstowe do wprowadzenia nazwy kreacji.
- **Główne elementy:**
    - Input typu tekst z etykietą.
- **Obsługiwane interakcje:**
    - Zdarzenie onChange aktualizujące tekst w stanie rodzica.
- **Warunki walidacji:**
    - Pole wymagane – wartość nie może być pusta.
- **Typy:** Prosty typ string.
- **Propsy:**
    - `value`: string – aktualna nazwa.
    - `onChange`: (value: string) => void – callback aktualizujący nazwę.

### PreviewPanel
- **Opis:** Panel wyświetlający propozycje kreacji wygenerowane przez AI.
- **Główne elementy:**
    - Obraz z generowanej grafiki (ścieżka do pliku PNG).
    - Tekstowy opis kompozycji kreacji.
    - Przycisk lub ikony umożliwiające akceptację i odrzucenie każdej propozycji.
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku akceptacji – wywołanie endpointu do zatwierdzenia kreacji.
    - Kliknięcie przycisku odrzucenia – wywołanie endpointu do odrzucenia kreacji.
- **Warunki walidacji:**
    - Brak dodatkowej walidacji, element tylko wyświetla dane.
- **Typy:** Obiekt modelu widoku, obejmujący `CreationDTO` oraz dodatkowo `description`.
- **Propsy:**
    - `proposals`: Array<{ creation: CreationDTO; description: string }> – lista propozycji.
    - `onAccept`: (creationId: string) => void – akcja przy akceptacji.
    - `onReject`: (creationId: string) => void – akcja przy odrzuceniu.

### ActionButtons
- **Opis:** Komponent zawierający przycisk generowania kreacji oraz ewentualny przycisk resetowania formularza.
- **Główne elementy:**
    - Przycisk "Generuj".
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku powoduje wywołanie funkcji generowania.
- **Warunki walidacji:**
    - Przycisk aktywny tylko gdy wszystkie wymagane dane są obecne.
- **Typy:** Interfejs akcji (prosty typ boolean dla stanu ładowania).
- **Propsy:**
    - `onGenerate`: () => void – callback wywoływany przy generowaniu.
    - `loading`: boolean – informacja o stanie ładowania żądania.

## 5. Typy
- **GenerateCreationsCommand:**
    - `style_id`: string
- **CreationProposalViewModel:**
    - `creation`: CreationDTO
    - `description`: string
- **CreationDTO:** (widok) zawiera m.in.:
    - `id`: string
    - `name`: string
    - `image_path`: string
    - `style_id`: string
    - `status`: string
    - `created_at`: string
    - `updated_at`: string
    - `user_id`: string

## 6. Zarządzanie stanem
Widok opiera się na lokalnym stanie komponentów za pomocą hooków React (useState, useEffect).
Komunikacja z API odbywa się przy pomocy biblioteki react-query aby ograniczyć ilość żądań do serwera i zapewnić możliwą synchronizację danych między komponentami.
Dodatkowo utworzony zostanie customowy hook (np. useGenerateCreations) do obsługi żądań API, który w połączeniu z react-query będzie zarządzał:
- stanem ładowania,
- wynikami odpowiedzi (tablica propozycji kreacji),
- obsługą błędów (np. przy braku wymaganych elementów garderoby).

## 7. Integracja API
- **Generowanie kreacji:**
    - Wywołanie endpointu `POST /creations/generate` z payloadem w postaci obiektu `{ style_id: string }`.
    - Otrzymana odpowiedź to tablica propozycji kreacji, zawierająca obiekty z polami kreacji oraz dodatkowymi opisami.
- **Akceptacja kreacji:**
    - Wywołanie endpointu `POST /creations/{creation_id}/accept` – bez payloadu.
- **Odrzucenie kreacji:**
    - Wywołanie endpointu `POST /creations/{creation_id}/reject` – bez payloadu.

## 8. Interakcje użytkownika
- Użytkownik wybiera styl z listy w komponencie StyleSelect.
- Użytkownik wpisuje nazwę kreacji w NameInput.
- Po kliknięciu przycisku "Generuj" (ActionButtons) następuje wywołanie API, a następnie w PreviewPanel pojawiają się 3 propozycje kreacji.
- Użytkownik może kliknąć przycisk akceptacji dla jednej z propozycji, co wywoła odpowiedni endpoint i zatwierdzi kreację.
- Użytkownik może również odrzucić wybraną propozycję, co pozostawi możliwość wygenerowania nowych propozycji.

## 9. Warunki i walidacja
- Walidacja formularzy realizowana przy użyciu biblioteki zod.
- Formularz wymaga wybranego stylu (poprawny UUID) oraz niepustej nazwy kreacji.
- Formularz blokuje wielokrotne wysyłanie, aby zapobiec powieleniu żądań.
- Podczas wywoływania API sprawdzane są warunki:
    - System weryfikuje obecność wymaganych elementów garderoby – w przypadku braku odpowiednich danych wyświetlany jest komunikat o błędzie.
    - Odpowiedzi 400 z API są mapowane na komunikaty walidacyjne w interfejsie.

## 10. Obsługa błędów
- Komunikaty błędów są wyświetlane w widocznym miejscu w widoku (np. pod formularzem).
- W przypadku błędu walidacji lub braku wymaganych elementów garderoby, użytkownik otrzymuje komunikat informujący o konkretnym problemie.
- W przypadku błędnej odpowiedzi API (np. błąd 400 lub 500) interfejs wyświetla stosowny komunikat wraz z możliwością ponowienia akcji.

## 11. Kroki implementacji
1. Utworzyć widok AddCreationPage i skonfigurować routing pod `/creations/add`.
2. Zaimplementować komponenty:
    - **StyleSelect**: pobranie i wyświetlenie listy stylów z API.
    - **NameInput**: pole do wpisania nazwy kreacji z walidacją.
    - **PreviewPanel**: komponent do wyświetlania wygenerowanych propozycji kreacji.
    - **ActionButtons**: przycisk wywołujący generowanie kreacji.
3. Połączyć komponenty w AddCreationPage, zarządzając lokalnym stanem oraz przekazując dane między podkomponentami.
4. Utworzyć customowy hook (np. useGenerateCreations) do wywoływania endpointu `POST /creations/generate`:
    - Zarządzać stanem ładowania, wynikami oraz błędami.
5. Zaimplementować metody obsługi przycisków akceptacji i odrzucenia, które wywołują odpowiednie endpointy (`/creations/{id}/accept` i `/creations/{id}/reject`).
6. Dodać walidację formularza (sprawdzanie formatu UUID, niepustej nazwy) oraz blokadę wielokrotnego wysłania.
7. Przeprowadzić testy integracyjne widoku oraz sprawdzić obsługę błędów.
8. Dokonać przeglądu i code review przed wdrożeniem do środowiska produkcyjnego.
