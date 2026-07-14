# Tally — status projektu

Grupowy scoreboard: grupy znajomych, admin wpisuje punkty za aktywności, bogata warstwa statystyk. Styl UI wzorowany na "Upwise" (dark, monospace, akcent czerwono-pomarańczowy).

Ostatnia aktualizacja: 2026-07-14

## Stack
- Next.js 16 (App Router, TypeScript, Turbopack)
- Supabase (Postgres + Auth + Realtime + RLS + RPC)
- Tailwind v4 + shadcn v4 (base-ui) + Recharts + JetBrains Mono
- Hosting: Vercel

## Środowiska
- Supabase project: `dolpgphtyvlrbgtrezua` (region eu-central-1)
- Produkcja: https://punktacja.vercel.app
- Vercel: projekt `punktacja` (scope paschalskibiznes-6828)
- Zmienne: skopiuj `.env.local.example` → `.env.local` (wartości publiczne, chroni RLS)

## Uruchomienie lokalnie (MacBook)
```bash
npm install
cp .env.local.example .env.local
npm run dev        # http://localhost:3000
npm run build      # produkcyjny build / weryfikacja typów
```
Deploy: `npx vercel deploy --prod` (po `vercel login` i `vercel link` do projektu `punktacja`).

## Co jest zrobione
- Auth: magic link (email OTP) + Google OAuth; obsługa `next` (powrót po logowaniu na link zaproszenia)
- Grupy: wiele grup per user, tworzenie, dołączanie kodem
- Zaproszenia przez link: `/join/[code]` + przycisk "Wyślij zaproszenie" (natywny share) na ekranie Członkowie
- Silnik punktów w DB (trigger + `calc_entry_total`), 4 typy: base / multiplier_add / flat_bonus / per_unit_bonus (5 testów formuły przeszło)
- Tylko admin dodaje wpisy (RLS)
- Ranking: podium top-3 + lista, zakresy all-time/tydzień/miesiąc/7d/30d
- Statystyki: timeline, top aktywności, quick stats
- Feed realtime
- Profil gracza: statystyki, odznaki, streak, historia
- Konto: menu z avatarem, edycja nicku/awatara (`/settings`), wylogowanie
- Motyw: dark (domyślny) + light (ciepły krem), toggle
- Redesign UI w stylu Upwise (globals.css tokeny, monospace, podium, login hero)
- Wydajność: auth przez `getSession` (lokalnie) zamiast wielokrotnego `getUser`; skeleton `loading.tsx`; usunięty framer-motion z rankingu/feedu (animacje CSS)
- Granice błędów: `error.tsx` + `global-error.tsx` (m.in. auto-reload przy deployment skew)

## Punkt 4 — rozbudowa statystyk i punktacji (ZROBIONE 2026-07-14)
Funkcje obliczeniowe w `src/lib/stats.ts` są teraz podpięte do UI. Nowe komponenty:
- `charts/calendar-heatmap.tsx` — heatmapa dni w stylu GitHub (intensywność wg punktów, tooltip)
- `head-to-head.tsx` — pojedynek 1v1 (2 pickery + porównanie per aktywność, `computeHeadToHead`)
- `season-trophies.tsx` — gablota trofeów miesięcznych (`computeSeasonWinners`)
- `stat-highlights.tsx` — rekordy + forma (sparkline) + MVP + percentyl
- `charts/category-breakdown.tsx` — podział punktów wg aktywności (stacked bar CSS)

Wpięcia:
- `stats/page.tsx` — pobiera raz `entry_feed` (limit 1000) + `leaderboard`, liczy statystyki serwerowo i renderuje: rekordy grupy + MVP, heatmapę, timeline, podział punktów, top aktywności, pojedynek 1v1, sezony.
- Ranking (`g/[groupId]/page.tsx` + `leaderboard-list.tsx`) — `computeRankMomentum` z feedu (14 dni) → strzałki awans/spadek przy pozycjach (prop `momentum`).
- Profil gracza (`p/[userId]/page.tsx`) — dodano heatmapę + rekordy/forma/percentyl (`StatHighlights`).
- Punkty ujemne / kary — edytor aktywności dopuszcza ujemną wartość (hint + badge "Kara"); `entry-card` i podgląd w `entry-composer` poprawnie pokazują znak +/− i kolor (czerwony dla ujemnych). DB liczy ujemne bez zmian (brak CHECK na `activities.value`).

Weryfikacja: `npm run build` (0 błędów, TS OK), `eslint` czysty, dev server bootuje.

### Backlog dot. statystyk (opcjonalne dopieszczenia)
- Kategoria-kontener "Kary" w seedzie grupy (obecnie kara = pojedyncza aktywność z ujemną wartością).
- `activity-bar-chart` / `timeline-chart` używają zahardkodowanych kolorów `#0A84FF` itp. zamiast tokenów `--chart-*` — do ujednolicenia z motywem.

## Pozostałe kroki manualne (dashboard — NIE w kodzie)
- Supabase → Auth → URL Configuration: Site URL = https://punktacja.vercel.app; Redirect URLs += `https://punktacja.vercel.app/**` oraz `http://localhost:3000/**`
- Google OAuth (BLOKER logowania Google):
  - W Supabase → Providers → Google podmień Client ID/Secret na TEN utworzony w Google Cloud:
    - Client ID: `707471152106-1tcajohkt7cmu3k64r483ibqtjq53d3b.apps.googleusercontent.com`
    - (obecnie w Supabase jest niezgodny `12583498029-...` → powoduje redirect_uri_mismatch)
  - Google Cloud Console → OAuth consent screen → PUBLISH APP → "In production" (usuwa komunikat "niezgodne z zasadami" dla nie-testowych userów; scopes email/profile nie wymagają weryfikacji)
- Magic link działa niezależnie od Google.

## Znane braki do "pełnej" apki (backlog)
- Edycja/usuwanie wpisów (poprawa pomyłek admina)
- Zarządzanie grupą: zmiana nazwy, usuwanie grupy/członków, przekazanie admina, wielu adminów
- Upload awatara (Supabase Storage) zamiast wklejania URL
- PWA (instalacja, offline, ikona)
- Powiadomienia push/email
- Paginacja feedu, filtry
- Podstrony prawne `/privacy` i `/terms` (wymagane też do publikacji OAuth)

## Struktura DB (migracje w `supabase/migrations/`)
- 0001 schema, 0002 seed/defaults, 0003 helpers + RLS, 0004 RPC, 0005 views, 0006 auth trigger, 0007 hardening + realtime
- Kluczowe: profiles, groups, group_members(role), categories, activities(type+value), entries, entry_items
- RPC: `leaderboard`, `create_group`, `join_group_by_code`, `add_entry`, `stats_by_activity`, `stats_timeline`, `is_group_admin`, `is_group_member`
