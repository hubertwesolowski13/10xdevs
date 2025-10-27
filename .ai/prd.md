# Dokument wymagań produktu (PRD) - Aplikacja Kreacje Garderoby

## 1. Przegląd produktu
Produkt to mobilna aplikacja (React Native, Android) umożliwiająca zarządzanie garderobą użytkownika oraz generowanie inspirujących kreacji przy użyciu AI. Aplikacja pozwala użytkownikom na rejestrację/logowanie, dodawanie, edycję i usuwanie elementów garderoby (każdy oznaczony etykietą: okrycie głowy, okrycie górne, okrycie dolne, buty) oraz generowanie propozycji kreacji w oparciu o dostępne elementy i wybrany styl (np. casual, elegancki, plażowy, sexy). Generowane kreacje są wizualizowane w formacie PNG, a użytkownik może zaakceptować lub odrzucić propozycje, zapisując wybrane kreacje do kolekcji.

## 2. Problem użytkownika
Użytkownicy często mają problem z komponowaniem spójnych kolorystycznie i stylistycznie kreacji, korzystając z odzieży, którą już posiadają. Powtarzająca się zawartość szafy powoduje znużenie i utrudnia szybkie podejmowanie decyzji dotyczących ubioru. Aplikacja ma na celu eliminację tego problemu poprzez:
- Ułatwienie przeglądania i zarządzania garderobą.
- Automatyczne generowanie kreatywnych propozycji kreacji przy wykorzystaniu AI.
- Wizualizację gotowych kompozycji, co skraca czas potrzebny na dobór ubioru.

## 3. Wymagania funkcjonalne
- System kont użytkowników z podstawową walidacją (sprawdzenie wprowadzonych danych, potwierdzenie hasła, poprawny format emaila) oraz modułowością umożliwiającą przyszłą integrację SSO.  
- Moduł CRUD dla elementów garderoby, gdzie każdy element musi mieć przypisaną etykietę określającą jedną z kategorii: okrycie głowy (opcjonalne), okrycie górne, okrycie dolne, buty.  
- Mechanizm generowania kreacji przy użyciu AI, który:
  - Sprawdza obecność minimalnych elementów (buty, okrycie dolne, okrycie górne) w garderobie.
  - Umożliwia wybór stylu kreacji (np. casual, elegancki, plażowy, sexy).
  - Generuje 3 propozycje kreacji wraz z grafiką w formacie PNG, uwzględniając kolory, kompozycję i proporcje elementów.
- Interfejs użytkownika:
  - Ekran logowania/rejestracji z natychmiastową walidacją danych.
  - Modale do dodawania elementów do garderoby i generowania kreacji, zaprojektowane w spójnej stylistyce ale z wyraźnym rozróżnieniem funkcji.
  - Ekran przeglądania garderoby i kolekcji zaakceptowanych kreacji.
- Zarządzanie kontem użytkownika, w tym edycja profilu oraz możliwość usunięcia konta po potwierdzeniu operacji.

## 4. Granice produktu
- Aplikacja nie będzie w MVP:
  - Proponować uzupełnienia garderoby, gdy brakuje elementów do stworzenia kreacji.
  - Umożliwiać udostępnianie kreacji ani całej garderoby innym użytkownikom.
  - Pozwalać na dodawanie zdjęć do kreacji lub zastępowanie wygenerowanej grafiki.
  - Planować przyszłe kreacje ani wysyłać powiadomień o oddaniu ubrań do pralni.
  - W pierwszej wersji nie zostanie zintegrowane logowanie SSO (używany będzie standardowy system logowania).

## 5. Historyjki użytkowników
- ID: US-001  
  Tytuł: Rejestracja i logowanie  
  Opis: Użytkownik niezarejestrowany może utworzyć konto, a istniejący użytkownik uzyskać dostęp do aplikacji przez logowanie z podstawową walidacją pól (email, hasło, potwierdzenie hasła).  
  Kryteria akceptacji:
    - Formularz rejestracji sprawdza poprawność danych (niepuste pola, właściwy format email, zgodność haseł).
    - Po rejestracji użytkownik jest automatycznie logowany lub przekierowany do ekranu logowania.
    - Formularz logowania weryfikuje poprawność danych i umożliwia odzyskanie hasła.

- ID: US-002  
  Tytuł: Zarządzanie garderobą – dodawanie elementów  
  Opis: Użytkownik zalogowany może dodać nowe elementy garderoby, wybierając odpowiednią kategorię (okrycie głowy, okrycie górne, okrycie dolne, buty) oraz wprowadzając wymagane dane.  
  Kryteria akceptacji:
    - Formularz dodawania elementu wymaga wprowadzenia pełnych informacji i wybrania jednej z czterech kategorii.
    - Po dodaniu elementu jest on widoczny w przeglądzie garderoby.
    - System waliduje obecność wszystkich wymaganych elementów przy próbie generowania kreacji.

- ID: US-003  
  Tytuł: Edycja i usuwanie elementów garderoby  
  Opis: Użytkownik może edytować lub usuwać wcześniej dodane elementy garderoby.  
  Kryteria akceptacji:
    - Użytkownik widzi listę swoich elementów garderoby.
    - Istnieje możliwość edycji danych elementu z natychmiastową walidacją.
    - Usunięty element przestaje być widoczny w przeglądzie garderoby.

- ID: US-004  
  Tytuł: Generowanie kreacji przy użyciu AI  
  Opis: Użytkownik wybiera styl kreacji (np. casual, elegancki, plażowy, sexy) i uruchamia proces generowania, który sprawdza obecność wymaganych elementów (okrycie górne, okrycie dolne, buty) i na tej podstawie generuje 3 propozycje kreacji wraz z wizualizacją w formacie PNG.  
  Kryteria akceptacji:
    - System zwraca 3 propozycje tylko, gdy w garderobie są dostępne wszystkie wymagane kategorie.
    - Każda propozycja zawiera grafikę kreacji oraz opis kompozycji.
    - Użytkownik może zaakceptować lub odrzucić każdą propozycję.

- ID: US-005  
  Tytuł: Akceptacja i zapis kreacji  
  Opis: Po otrzymaniu propozycji kreacji użytkownik może zaakceptować wybraną kreację, która zostanie zapisana w kolekcji zapisanych kreacji.  
  Kryteria akceptacji:
    - Istnieje przycisk akceptacji przy każdej propozycji kreacji.
    - Po zaakceptowaniu kreacja jest przenoszona do kolekcji użytkownika.
    - Użytkownik widzi powiadomienie o pomyślnym zapisaniu kreacji.

- ID: US-006  
  Tytuł: Przeglądanie zapisanych kreacji  
  Opis: Użytkownik ma możliwość przeglądania kolekcji zaakceptowanych kreacji wraz z wizualizacjami.  
  Kryteria akceptacji:
    - Użytkownik uzyskuje dostęp do osobnego widoku z listą zapisanych kreacji.
    - Kreacje są prezentowane z grafiką w formacie PNG oraz dodatkowymi informacjami o zastosowanym stylu.

- ID: US-007  
  Tytuł: Zarządzanie kontem użytkownika  
  Opis: Użytkownik może edytować swój profil lub usunąć konto za pomocą prostego procesu potwierdzenia.  
  Kryteria akceptacji:
    - Użytkownik może zmienić ustawienia profilu (email, hasło, dane osobowe).
    - Proces usuwania konta wymaga potwierdzenia (np. dialog potwierdzający).
    - Po usunięciu konta użytkownik nie może już się logować.

## 6. Metryki sukcesu
- Minimum 70% generowanych kreacji musi być zaakceptowanych przez użytkowników i zapisanych do kolekcji.  
- Co najmniej 60% zarejestrowanych użytkowników powinno korzystać z aplikacji przynajmniej raz w tygodniu.  
- Proces generacji kreacji musi walidować obecność wymaganych elementów w garderobie oraz wyświetlać jasne komunikaty przy ich braku.  
- Szybkość operacji (dodawanie elementów, generowanie kreacji) powinna zapewniać płynne i bezproblemowe doświadczenie użytkownika.
