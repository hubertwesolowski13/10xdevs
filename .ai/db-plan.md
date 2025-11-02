# Schemat Bazy Danych PostgreSQL - Aplikacja Kreacje Garderoby

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### 1.1. `public.profiles`
Tabela przechowująca publiczne dane profilowe użytkowników.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY | Identyfikator użytkownika (zgodny z auth.users.id) |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Unikalna nazwa użytkownika |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia profilu |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Klucze obce:**
- `id` → `auth.users(id)` ON DELETE CASCADE

---

### 1.2. `public.item_categories`
Tabela słownikowa przechowująca kategorie elementów garderoby.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identyfikator kategorii |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Nazwa kategorii |
| `display_name` | VARCHAR(100) | NOT NULL | Nazwa wyświetlana użytkownikowi |
| `is_required` | BOOLEAN | NOT NULL, DEFAULT false | Czy kategoria jest wymagana do kreacji |

**Wartości predefiniowane:**
- Okrycie głowy (opcjonalne, `is_required = false`)
- Okrycie górne (wymagane, `is_required = true`)
- Okrycie dolne (wymagane, `is_required = true`)
- Buty (wymagane, `is_required = true`)

---

### 1.3. `public.styles`
Tabela słownikowa przechowująca style kreacji.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identyfikator stylu |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Nazwa stylu |
| `display_name` | VARCHAR(100) | NOT NULL | Nazwa wyświetlana użytkownikowi |

**Wartości predefiniowane:**
- casual
- elegancki
- plażowy
- sexy
- wieczorowy

---

### 1.4. `public.wardrobe_items`
Tabela przechowująca elementy garderoby użytkowników.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identyfikator elementu garderoby |
| `user_id` | UUID | NOT NULL | Identyfikator właściciela |
| `category_id` | UUID | NOT NULL | Identyfikator kategorii |
| `name` | VARCHAR(100) | NOT NULL | Nazwa elementu |
| `color` | VARCHAR(50) | NOT NULL | Kolor elementu |
| `brand` | VARCHAR(100) | NULL | Marka (opcjonalna) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data dodania elementu |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Klucze obce:**
- `user_id` → `auth.users(id)` ON DELETE CASCADE
- `category_id` → `public.item_categories(id)` ON DELETE RESTRICT

---

### 1.5. `public.creations`
Tabela przechowująca zaakceptowane kreacje użytkowników.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identyfikator kreacji |
| `user_id` | UUID | NOT NULL | Identyfikator właściciela |
| `style_id` | UUID | NOT NULL | Identyfikator stylu |
| `name` | VARCHAR(200) | NOT NULL | Automatycznie generowana nazwa kreacji |
| `image_path` | TEXT | NOT NULL | Ścieżka do obrazu PNG w Supabase Storage |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia kreacji |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Klucze obce:**
- `user_id` → `auth.users(id)` ON DELETE CASCADE
- `style_id` → `public.styles(id)` ON DELETE RESTRICT

---

### 1.6. `public.creation_items`
Tabela łącząca (relacja wiele-do-wielu) między kreacjami a elementami garderoby.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identyfikator powiązania |
| `creation_id` | UUID | NOT NULL | Identyfikator kreacji |
| `item_id` | UUID | NOT NULL | Identyfikator elementu garderoby |

**Klucze obce:**
- `creation_id` → `public.creations(id)` ON DELETE CASCADE
- `item_id` → `public.wardrobe_items(id)` ON DELETE CASCADE

**Ograniczenia:**
- UNIQUE(`creation_id`, `item_id`) - zapobiega duplikowaniu tego samego elementu w kreacji

---

## 2. Relacje między tabelami

### 2.1. Użytkownicy i Profile
- **auth.users → public.profiles**: Relacja **jeden-do-jednego**
    - Każdy użytkownik ma dokładnie jeden profil publiczny

### 2.2. Użytkownicy i Garderoba
- **auth.users → public.wardrobe_items**: Relacja **jeden-do-wielu**
    - Jeden użytkownik może mieć wiele elementów garderoby
    - Każdy element należy do dokładnie jednego użytkownika

### 2.3. Kategorie i Elementy Garderoby
- **public.item_categories → public.wardrobe_items**: Relacja **jeden-do-wielu**
    - Jedna kategoria może być przypisana do wielu elementów garderoby
    - Każdy element ma dokładnie jedną kategorię

### 2.4. Użytkownicy i Kreacje
- **auth.users → public.creations**: Relacja **jeden-do-wielu**
    - Jeden użytkownik może mieć wiele zapisanych kreacji
    - Każda kreacja należy do dokładnie jednego użytkownika

### 2.5. Style i Kreacje
- **public.styles → public.creations**: Relacja **jeden-do-wielu**
    - Jeden styl może być użyty w wielu kreacjach
    - Każda kreacja ma dokładnie jeden styl

### 2.6. Kreacje i Elementy Garderoby
- **public.creations ↔ public.wardrobe_items**: Relacja **wiele-do-wielu** (przez `creation_items`)
    - Jedna kreacja składa się z wielu elementów garderoby
    - Jeden element garderoby może być użyty w wielu kreacjach
    - Tabela łącząca: `public.creation_items`

---

## 3. Indeksy

### 3.1. Indeksy na kluczach głównych
Automatycznie tworzone przez PostgreSQL dla wszystkich PRIMARY KEY.

### 3.2. Indeksy na kluczach obcych

```sql
-- Tabela profiles
CREATE INDEX idx_profiles_id ON public.profiles(id);

-- Tabela wardrobe_items
CREATE INDEX idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category_id ON public.wardrobe_items(category_id);

-- Tabela creations
CREATE INDEX idx_creations_user_id ON public.creations(user_id);
CREATE INDEX idx_creations_style_id ON public.creations(style_id);

-- Tabela creation_items
CREATE INDEX idx_creation_items_creation_id ON public.creation_items(creation_id);
CREATE INDEX idx_creation_items_item_id ON public.creation_items(item_id);
```


### 3.3. Indeksy funkcjonalne i dodatkowe

```sql
-- Indeks na nazwach użytkowników dla szybkiego wyszukiwania
CREATE INDEX idx_profiles_username_lower ON public.profiles(LOWER(username));

-- Indeks na datach utworzenia dla sortowania chronologicznego
CREATE INDEX idx_creations_created_at ON public.creations(created_at DESC);
CREATE INDEX idx_wardrobe_items_created_at ON public.wardrobe_items(created_at DESC);
```


---

## 4. Row-Level Security (RLS)

### 4.1. Włączenie RLS na wszystkich tabelach

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creation_items ENABLE ROW LEVEL SECURITY;
```


### 4.2. Polityki RLS dla tabeli `public.profiles`

```sql
-- Użytkownicy mogą odczytać tylko własny profil
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Użytkownicy mogą wstawiać tylko własny profil
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Użytkownicy mogą aktualizować tylko własny profil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Użytkownicy mogą usuwać tylko własny profil
CREATE POLICY "Users can delete own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = id);
```


### 4.3. Polityki RLS dla tabeli `public.wardrobe_items`

```sql
-- Użytkownicy mogą odczytać tylko własne elementy garderoby
CREATE POLICY "Users can view own wardrobe items" 
ON public.wardrobe_items FOR SELECT 
USING (auth.uid() = user_id);

-- Użytkownicy mogą dodawać tylko do własnej garderoby
CREATE POLICY "Users can insert own wardrobe items" 
ON public.wardrobe_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą aktualizować tylko własne elementy
CREATE POLICY "Users can update own wardrobe items" 
ON public.wardrobe_items FOR UPDATE 
USING (auth.uid() = user_id);

-- Użytkownicy mogą usuwać tylko własne elementy
CREATE POLICY "Users can delete own wardrobe items" 
ON public.wardrobe_items FOR DELETE 
USING (auth.uid() = user_id);
```


### 4.4. Polityki RLS dla tabeli `public.creations`

```sql
-- Użytkownicy mogą odczytać tylko własne kreacje
CREATE POLICY "Users can view own creations" 
ON public.creations FOR SELECT 
USING (auth.uid() = user_id);

-- Użytkownicy mogą dodawać tylko własne kreacje
CREATE POLICY "Users can insert own creations" 
ON public.creations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą aktualizować tylko własne kreacje
CREATE POLICY "Users can update own creations" 
ON public.creations FOR UPDATE 
USING (auth.uid() = user_id);

-- Użytkownicy mogą usuwać tylko własne kreacje
CREATE POLICY "Users can delete own creations" 
ON public.creations FOR DELETE 
USING (auth.uid() = user_id);
```


### 4.5. Polityki RLS dla tabeli `public.creation_items`

```sql
-- Użytkownicy mogą odczytać składowe własnych kreacji
CREATE POLICY "Users can view own creation items" 
ON public.creation_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.creations 
    WHERE creations.id = creation_items.creation_id 
    AND creations.user_id = auth.uid()
  )
);

-- Użytkownicy mogą dodawać elementy tylko do własnych kreacji i z własnej garderoby
CREATE POLICY "Users can insert own creation items" 
ON public.creation_items FOR INSERT 
WITH CHECK (public.can_add_to_creation(creation_id, item_id));

-- Użytkownicy mogą usuwać składowe tylko z własnych kreacji
CREATE POLICY "Users can delete own creation items" 
ON public.creation_items FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.creations 
    WHERE creations.id = creation_items.creation_id 
    AND creations.user_id = auth.uid()
  )
);
```


### 4.6. Funkcja walidacyjna `public.can_add_to_creation`

```sql
CREATE OR REPLACE FUNCTION public.can_add_to_creation(
  p_creation_id UUID,
  p_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_creation_user_id UUID;
  v_item_user_id UUID;
BEGIN
  -- Pobierz user_id z kreacji
  SELECT user_id INTO v_creation_user_id
  FROM public.creations
  WHERE id = p_creation_id;
  
  -- Pobierz user_id z elementu garderoby
  SELECT user_id INTO v_item_user_id
  FROM public.wardrobe_items
  WHERE id = p_item_id;
  
  -- Sprawdź czy oba należą do zalogowanego użytkownika
  RETURN (
    v_creation_user_id = auth.uid() 
    AND v_item_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```


### 4.7. Polityki RLS dla tabel słownikowych

Tabele `item_categories` i `styles` są dostępne do odczytu dla wszystkich zalogowanych użytkowników, ale modyfikacja jest zarezerwowana tylko dla administratorów (service_role).

```sql
-- Odczyt kategorii dla wszystkich zalogowanych użytkowników
CREATE POLICY "Anyone can view item categories" 
ON public.item_categories FOR SELECT 
USING (auth.role() = 'authenticated');

-- Odczyt stylów dla wszystkich zalogowanych użytkowników
CREATE POLICY "Anyone can view styles" 
ON public.styles FOR SELECT 
USING (auth.role() = 'authenticated');
```


---

## 5. Triggery i funkcje automatyczne

### 5.1. Automatyczna aktualizacja `updated_at`

```sql
-- Funkcja aktualizująca kolumnę updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla tabeli profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger dla tabeli wardrobe_items
CREATE TRIGGER update_wardrobe_items_updated_at
BEFORE UPDATE ON public.wardrobe_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger dla tabeli creations
CREATE TRIGGER update_creations_updated_at
BEFORE UPDATE ON public.creations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```


### 5.2. Automatyczne tworzenie profilu po rejestracji

```sql
-- Funkcja tworząca profil po rejestracji użytkownika
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger w schemacie auth
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```


---

## 6. Polityki Storage dla Supabase Storage

Obrazy kreacji będą przechowywane w bucket `creations` z następującą strukturą ścieżek:
```
{user_id}/{creation_id}.png
```


### 6.1. Polityki Storage

```sql
-- Użytkownicy mogą przesyłać pliki tylko do własnego folderu
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'creations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Użytkownicy mogą odczytać tylko pliki z własnego folderu
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'creations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Użytkownicy mogą usuwać tylko pliki z własnego folderu
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'creations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```


---

## 7. Dodatkowe uwagi i decyzje projektowe

### 7.1. Wybór UUID jako klucz główny
- UUID zapewnia globalną unikalność i jest standardem w Supabase
- Uniemożliwia przewidywanie kolejnych identyfikatorów (bezpieczeństwo)
- Ułatwia replikację i synchronizację danych

### 7.2. Tabele słownikowe zamiast ENUM
- Umożliwia dynamiczne dodawanie nowych kategorii i stylów bez zmian w schemacie
- Ułatwia internacjonalizację (kolumna `display_name`)
- Pozwala na przechowywanie dodatkowych metadanych (np. `is_required`)

### 7.3. Przechowywanie obrazów w Storage
- Baza danych przechowuje tylko ścieżki (TEXT), obrazy PNG są w Supabase Storage
- Zapobiega spowolnieniu bazy danych przy dużej liczbie kreacji
- Umożliwia efektywne skalowanie i CDN

### 7.4. ON DELETE CASCADE
- Automatyczne usuwanie powiązanych danych przy usunięciu użytkownika
- Zapewnia spójność danych i zgodność z RODO (prawo do usunięcia danych)

### 7.5. Normalizacja
- Schemat jest znormalizowany do 3NF
- Brak redundancji danych
- Optymalizacja zapytań przez odpowiednie indeksy

### 7.6. Bezpieczeństwo
- Row-Level Security (RLS) na wszystkich tabelach z danymi użytkowników
- Polityki Storage oparte na `user_id` w ścieżce pliku
- Funkcja walidacyjna dla złożonych reguł (`can_add_to_creation`)

### 7.7. Wydajność
- Indeksy na wszystkich kluczach obcych
- Dodatkowy indeks na `creation_items(item_id)` dla odwrotnych zapytań
- Indeksy funkcjonalne (np. `LOWER(username)`) dla case-insensitive search

### 7.8. Rozszerzalność
- Struktura umożliwia łatwe dodanie nowych funkcji (np. tagów, kolorów jako osobna tabela)
- Kolumny `created_at` i `updated_at` ułatwiają audyt i sortowanie chronologiczne
- Możliwość przyszłej integracji z systemem rekomendacji AI

---

## 8. Migracja początkowa - kolejność wykonania

1. Włączenie rozszerzenia `uuid-ossp` (jeśli jeszcze nie włączone)
2. Utworzenie tabel słownikowych: `item_categories`, `styles`
3. Zasilenie tabel słownikowych danymi początkowymi
4. Utworzenie tabeli `profiles`
5. Utworzenie tabeli `wardrobe_items`
6. Utworzenie tabeli `creations`
7. Utworzenie tabeli `creation_items`
8. Utworzenie indeksów
9. Utworzenie funkcji pomocniczych (`update_updated_at_column`, `can_add_to_creation`, `handle_new_user`)
10. Utworzenie triggerów
11. Włączenie RLS i utworzenie polityk bezpieczeństwa
12. Utworzenie bucket `creations` w Storage i polityk dostępu
