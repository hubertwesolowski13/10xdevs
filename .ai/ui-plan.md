# Architektura UI dla Kreacje Garderoby

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika została zaprojektowana z myślą o intuicyjnym, responsywnym i bezpiecznym doświadczeniu mobilnym (React Native – Android). Bazuje na podziale aplikacji na główne widoki, zintegrowane z backendowym API przez mechanizmy autoryzacji i zarządzania stanem oparte na react-query oraz Context API. Interfejs zapewnia spójną estetykę, czytelną nawigację i jasne komunikaty o błędach.

## 2. Lista widoków

**Ekran logowania / rejestracji**
- **Ścieżka widoku:** `/auth`
- **Główny cel:** Umożliwić nowym użytkownikom rejestrację oraz logowanie istniejącym użytkownikom.
- **Kluczowe informacje:** Formularz wprowadzania emaila, hasła oraz potwierdzenia hasła; natychmiastowa walidacja pól.
- **Kluczowe komponenty:** Formularz, pola tekstowe, przycisk do wysłania, link do odzyskiwania hasła.
- **UX, dostępność i bezpieczeństwo:** Walidacja w czasie rzeczywistym, wsparcie dla czytników ekranu, wyraźne komunikaty o błędach, zabezpieczenie przesyłu danych (SSL).

**Ekran listy kreacji**
- **Ścieżka widoku:** `/creations`
- **Główny cel:** Prezentacja listy kreacji użytkownika z możliwością filtrowania po nazwie oraz typie, wspierana mechanizmami paginacji i cache’owania (react-query).
- **Kluczowe informacje:** Lista kreacji z grafiką (PNG), nazwa, styl, data utworzenia; opcje filtrowania oraz sortowania.
- **Kluczowe komponenty:** Lista elementów, pasek wyszukiwania, filtry, przyciski paginacji.
- **UX, dostępność i bezpieczeństwo:** Responsywność listy, możliwość łatwego dotknięcia elementu, czytelne etykiety, dobry kontrast i wsparcie gestów dotykowych.

**Ekran garderoby**
- **Ścieżka widoku:** `/wardrobe`
- **Główny cel:** Zarządzanie elementami garderoby – przeglądanie, wyszukiwanie, filtrowanie, edycja i dodawanie nowych elementów.
- **Kluczowe informacje:** Lista elementów garderoby (np. okrycia, buty) z informacjami o kategorii, kolorze, marce oraz datach dodania.
- **Kluczowe komponenty:** Lista lub siatka elementów, pasek wyszukiwania, filtry (np. kategorie, kolor, marka), przycisk „+” otwierający formularz dodawania.
- **UX, dostępność i bezpieczeństwo:** Ułatwiona nawigacja dotykowa, intuicyjne sortowanie i filtrowanie, jasne przyciski oraz wsparcie dla użytku przez osoby o ograniczonej sprawności manualnej.

**Formularz dodawania kreacji**
- **Ścieżka widoku:** `/creations/add`
- **Główny cel:** Umożliwić użytkownikowi ręczne stworzenie nowej kreacji poprzez wybór stylu oraz prezentację dodatkowych informacji o stylu przy wygenerowanym obrazie.
- **Kluczowe informacje:** Wybór stylu, nazwa kreacji, podgląd wygenerowanej grafiki wraz z dodatkowymi opisami.
- **Kluczowe komponenty:** Formularz (select do wyboru stylu, pole tekstowe na nazwę), komponent do podglądu obrazu, przycisk potwierdzający generację, możliwość akceptacji lub odrzucenia propozycji.
- **UX, dostępność i bezpieczeństwo:** Przejrzysty układ formularza, podpowiedzi i wskazówki, wizualne potwierdzenie wykonanej akcji, zabezpieczenia przed wielokrotnym wysłaniem formularza.

**Widok profilu**
- **Ścieżka widoku:** `/profile`
- **Główny cel:** Prezentacja danych użytkownika wraz z możliwością edycji profilu oraz wyraźnym przyciskiem wylogowania umieszczonym na dole ekranu.
- **Kluczowe informacje:** Podstawowe dane użytkownika (email, nazwa użytkownika), informacje kontaktowe, opcje edycji.
- **Kluczowe komponenty:** Formularz edycji profilu, informacje o koncie, przycisk „Wyloguj” umieszczony na stałe na dole ekranu, przyciski zapisywania zmian.
- **UX, dostępność i bezpieczeństwo:** Łatwa edycja danych, duży kontrast przycisku wylogowania, potwierdzenie przed krytycznymi operacjami, zabezpieczenie danych osobowych.

## 3. Mapa podróży użytkownika

1. **Start – Ekran logowania/rejestracji:**
    - Użytkownik wprowadza dane, weryfikacja w czasie rzeczywistym.
    - Po poprawnym wprowadzeniu następuje przekierowanie do głównej aplikacji.

2. **Główna nawigacja – Dolna nawigacja typu Tab Navigation:**
    - Użytkownik widzi przyciski umożliwiające przejście do ekranu garderoby, dodawania kreacji, listy kreacji oraz profilu.

3. **Ekran garderoby:**
    - Użytkownik przegląda swoje posiadane elementy, wyszukuje lub filtruje wg. kategorii.
    - Kliknięcie przycisku „+” przenosi do formularza dodawania nowego elementu garderoby.

4. **Ekran listy kreacji:**
    - Użytkownik może filtrować kreacje według nazwy lub typu.
    - Wybór konkretnej kreacji wyświetla szczegóły (np. opis kreacji, data utworzenia).

5. **Formularz dodawania kreacji:**
    - Użytkownik wybiera styl kreacji i inicjuje generowanie.
    - Wygenerowane 3 propozycje są prezentowane wraz z dodatkowymi informacjami.
    - Użytkownik akceptuje jedną z propozycji, co powoduje zapis kreacji do kolekcji.

6. **Widok profilu:**
    - Użytkownik przegląda dane swojego profilu, edytuje dane lub decyduje się na wylogowanie, korzystając z widocznego przycisku u dołu ekranu.

## 4. Układ i struktura nawigacji

Nawigacja realizowana jest jako dolna nawigacja typu tab navigation. Kluczowe zakładki to:
- Garderoba – umożliwia przeglądanie i zarządzanie elementami garderoby.
- Dodaj kreację – otwiera formularz generowania kreacji.
- Kreacje – lista kreacji wraz z możliwością filtrowania i paginacji.
- Profil – widok zarządzania kontem z opcją edycji i wylogowania.

Przejścia między widokami są płynne, z wyraźną animacją lub zmianą koloru aktywnej zakładki. Dodatkowo, mechanizm react-query zapewnia, że dane są pobierane i aktualizowane w tle, co zmniejsza opóźnienia przy zmianie ekranu.

## 5. Kluczowe komponenty

- **Formularze:**  
  Odpowiedzialne za rejestrację, logowanie, dodawanie elementów garderoby oraz kreacji. Zawierają mechanizmy walidacji w czasie rzeczywistym.

- **Listy i siatki:**  
  Umożliwiają wyświetlanie garderoby i kreacji z obsługą paginacji, filtrowania i sortowania.

- **Dolna nawigacja (Tab Navigation):**  
  Umożliwia szybkie przejścia między głównymi widokami, z wyraźnymi ikonami i etykietami.

- **Komponenty podglądu graficznego:**  
  Prezentują wygenerowane obrazy kreacji wraz z dodatkowymi informacjami o stylu.

- **Komponent powiadomień:**  
  Informują użytkownika o błędach autoryzacji, brakach wymaganych danych lub sukcesie operacji (np. zapis kreacji, edycja profilu).

- **Komponenty zabezpieczające:**  
  Mechanizmy automatycznej obsługi sesji i tokenów, zapewniające, że widoki wymagające autoryzacji są dostępne tylko dla zalogowanych użytkowników.
