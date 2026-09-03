# CountMyCals

Application web de suivi nutritionnel avec authentification Supabase, onboarding, profil alimentaire et consultation des recettes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/countmycals run dev` — run the CountMyCals web app through its managed workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required app secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React, Vite, TypeScript, Tailwind CSS, TanStack Query
- Backend métier et authentification: Supabase

## Where things live

- `artifacts/countmycals/` — application web
- `artifacts/countmycals/src/lib/supabase.ts` — client Supabase
- `artifacts/countmycals/src/hooks/` — accès à l’authentification, au profil, aux magasins et aux recettes
- `artifacts/countmycals/src/pages/` — connexion, onboarding, dashboard, recettes et profil
- `artifacts/countmycals/src/index.css` — thème visuel

## Architecture decisions

- Le navigateur communique directement avec Supabase au moyen de la clé publique; les règles RLS du projet Supabase restent la frontière d’autorisation.
- Le schéma Supabase existant est consommé tel quel et n’est ni migré ni recréé dans ce workspace.
- L’application affiche un écran de configuration explicite lorsque les variables Supabase sont absentes, sans données fictives.

## Product

- Inscription et connexion par email/mot de passe
- Onboarding en quatre étapes pour objectifs, équipement, magasins et budget
- Dashboard du profil, édition des préférences et consultation des recettes Supabase

## User preferences

- Ne pas ajouter de génération de plans de repas, Stripe, Crisp ou scraping dans cette première version.
- Ne pas générer de fausses recettes.

## Gotchas

- Les noms de colonnes utilisés côté client doivent rester alignés sur le schéma Supabase déjà créé.
- Les variables Vite exposées au navigateur doivent conserver le préfixe `VITE_`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
