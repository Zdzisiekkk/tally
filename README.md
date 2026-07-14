# Tally

Grupowy scoreboard — grupy znajomych liczą punkty za aktywności, z bogatą warstwą statystyk. Next.js 16 + Supabase, hostowane na Vercel.

Produkcja: https://punktacja.vercel.app

## Start
```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Pełny status prac, następne kroki i kroki manualne (Supabase / Google OAuth): patrz [STATUS.md](./STATUS.md).

## Stack
Next.js 16 (App Router, TS) · Supabase (Postgres/Auth/Realtime/RLS) · Tailwind v4 · shadcn (base-ui) · Recharts · JetBrains Mono
