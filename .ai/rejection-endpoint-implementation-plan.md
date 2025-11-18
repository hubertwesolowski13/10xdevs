# API Endpoint Implementation Plan: Reject Creation

## 1. Przegląd punktu końcowego
Endpoint służy do odrzucenia wygenerowanej kreacji przez użytkownika, ustawiając jej status na `rejected`. Operacja wymaga weryfikacji, czy kreacja istnieje oraz czy należy do użytkownika wykonującego żądanie. Endpoint wykorzystuje metodę POST i zwraca potwierdzenie w przypadku poprawnej operacji.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** `/creations/{creation_id}/reject`
- **Parametry:**
    - **Wymagane:**
        - `creation_id` (parametr ścieżki, UUID kreacji)
    - **Opcjonalne:**
        - Brak dodatkowych parametrów
- **Request Body:**
    - Brak treści (pusty payload)

## 3. Wykorzystywane typy
- **DTOs i Command Modele:**
    - `AcceptCreationCommand` (w `dto.ts`): reprezentuje dane wejściowe dla operacji akceptacji/odrzucenia, obecnie pusty, ale zapewnia spójność typów.
    - Możliwe użycie `CreationDTO` przy operacjach związanych z danymi kreacji.

## 4. Szczegóły odpowiedzi
- **Success Response:**
    - HTTP 200 z potwierdzeniem operacji, np.:
      ```json
      {
        "message": "Creation rejected successfully"
      }
      ```
- **Error Responses:**
    - HTTP 400 – w przypadku, gdy kreacja jest nieprawidłowa, nie istnieje lub nie należy do użytkownika.
    - HTTP 500 – w przypadku błędu serwera.

## 5. Przepływ danych
1. Żądanie trafia do endpointu REST API: `/creations/{creation_id}/reject`.
2. W warstwie kontrolera wyodrębniany jest `creation_id` z parametrów URL oraz weryfikowany jest użytkownik (na podstawie tokena autoryzacyjnego).
3. Kontroler przekazuje żądanie do serwisu (np. `CreationsService.rejectCreation`), który:
    - Weryfikuje, czy kreacja o podanym `creation_id` istnieje.
    - Sprawdza, czy kreacja należy do użytkownika wykonującego operację.
    - Aktualizuje status kreacji na `rejected` w bazie danych.
4. W przypadku sukcesu, serwis zwraca potwierdzenie, które kontroler przekazuje jako HTTP 200.
5. W przypadku wykrycia błędu walidacyjnego lub autoryzacyjnego, kontroler zwraca odpowiedni kod błędu (HTTP 400) z komunikatem.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie i autoryzacja:**
    - Endpoint wymaga, aby użytkownik był uwierzytelniony (np. za pomocą JWT oraz RLS oparty na `auth.uid()`).
    - Walidacja, czy kreacja należy do aktualnie zalogowanego użytkownika.
- **Weryfikacja danych:**
    - Sprawdzanie, czy `creation_id` jest poprawnym UUID i czy występuje w bazie.
- **Ochrona przed atakami:**
    - Stosowanie mechanizmu RLS w bazie danych oraz weryfikacja po stronie serwisu zapobiegająca modyfikacji cudzych kreacji.

## 7. Obsługa błędów
- **Błędy walidacji:**
    - Jeśli `creation_id` jest nieprawidłowe lub kreacja nie istnieje – HTTP 400 lub 404.
- **Błędy autoryzacji:**
    - Jeśli kreacja nie należy do użytkownika – HTTP 400 lub ewentualnie 403, zależnie od implementacji.
- **Błąd serwera:**
    - W przypadku nieoczekiwanych problemów operacyjnych – HTTP 500.
- **Rejestrowanie błędów:**
    - Używanie centralnego loggera (np. Logger NestJS) do zapisywania błędów operacyjnych i autoryzacyjnych.

## 8. Rozważania dotyczące wydajności
- **Minimalizacja operacji na bazie:**
    - Aktualizacja jednego pola (`status`) w tabeli `creations`, korzystająca z indeksów na `id` i `user_id`.
- **Skalowalność:**
    - Weryfikacja i walidacja powinna być jak najbardziej optymalna przy wykorzystaniu istniejących mechanizmów RLS oraz indeksów.
- **Caching:**
    - Nie ma potrzeby wdrażania cache’owania dla pojedynczej operacji modyfikacji statusu.

## 9. Etapy wdrożenia
1. **Analiza i zaprojektowanie:**
    - Zweryfikować potrzeby i wymagania biznesowe związane z odrzuceniem kreacji.
    - Ustalić dokładną logikę walidacji oraz autoryzacji dla danego endpointu.
2. **Modyfikacja serwisu:**
    - Rozszerzyć `CreationsService` lub stworzyć nową funkcję `rejectCreation(creationId, userId)`:
        - Sprawdzić, czy kreacja istnieje.
        - Zweryfikować, czy użytkownik jest właścicielem kreacji.
        - Zaktualizować status kreacji na `rejected`.
3. **Edycja kontrolera:**
    - Dodać nowy endpoint w `CreationsController` odpowiadający metodzie POST na `/creations/{creation_id}/reject`.
    - Upewnić się, że kontroler poprawnie wywołuje serwis oraz obsługuje błędy.
4. **Testy jednostkowe i e2e:**
    - Napisać testy pokrywające scenariusze sukcesu i błędów:
        - Kreacja odrzucona przez właściciela.
        - Próba odrzucenia kreacji nieistniejącej.
        - Próba odrzucenia kreacji, która nie należy do użytkownika.
5. **Przegląd kodu i wdrożenie:**
    - Przeprowadzić code review.
    - Wdrożyć zmiany na środowisku testowym, a następnie produkcyjnym.
