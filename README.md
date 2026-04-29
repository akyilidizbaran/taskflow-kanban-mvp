# TaskFlow

Live demo: `https://taskflow-zeta-ten.vercel.app`

TaskFlow is a focused Kanban MVP built for a tight 9-hour delivery window. The goal was not feature breadth, but a clean and technically defensible core workflow: authentication, board ownership, columns and cards, drag-and-drop reordering, and persistent ordering after refresh.

## GitHub Repository

This repository contains a deploy-ready Next.js App Router application designed for GitHub-based delivery and Vercel deployment. It uses Supabase for authentication and PostgreSQL, and `dnd-kit` for sortable Kanban interactions.

Repository URL: `https://github.com/akyilidizbaran/taskflow-kanban-mvp`

## Project Goal

TaskFlow aims to cover the smallest useful Trello-like workflow:

- Users can register and log in with email and password.
- Users can create, rename, view, and delete their own boards.
- Users can add columns and cards inside a board.
- Users can edit cards in a modal.
- Users can drag cards within the same column or between columns.
- Users can reorder columns themselves through the lane handle.
- Card and column placement persist in Supabase and survive page refreshes.

## Core Features

- Landing page with clear auth entry points
- Register and login with Supabase Auth
- Protected dashboard and board routes
- Board create, rename, delete
- Board sharing with existing registered users by email
- Viewer and editor access roles for shared boards
- Column create and reorder
- Card create and edit
- Card and lane drag-and-drop with `dnd-kit`
- Persistent `order_index` ordering strategy
- Responsive horizontal board layout for mobile and desktop
- Row Level Security policies for owner and shared board access

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Supabase Auth
- Supabase PostgreSQL
- `@supabase/ssr`
- `dnd-kit`
- Vitest
- Vercel

Typography note:

- The app uses a curated system font stack instead of remote Google Font fetching, which keeps local and CI builds independent from external font network access.

## Why `dnd-kit`?

`dnd-kit` was chosen because it is modern, React-native in its mental model, flexible for sortable lists, and better suited than older drag libraries for touch and pointer sensor tuning.

For this MVP, it gives us:

- Multi-column card movement
- Sortable lists
- Sortable lane reordering
- Touch-friendly activation constraints
- Fine control over drag visuals and overlays
- A reliable path for richer keyboard/touch drag handling and future collaboration features

## Data Model

Supabase PostgreSQL uses five core tables:

### `profiles`

- `id uuid primary key` referencing `auth.users(id)`
- `email text`
- `full_name text nullable`
- `created_at timestamptz default now()`

### `boards`

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid references auth.users(id) on delete cascade`
- `title text not null`
- `description text nullable`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `columns`

- `id uuid primary key default gen_random_uuid()`
- `board_id uuid references boards(id) on delete cascade`
- `title text not null`
- `order_index integer not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `cards`

- `id uuid primary key default gen_random_uuid()`
- `column_id uuid references columns(id) on delete cascade`
- `board_id uuid references boards(id) on delete cascade`
- `title text not null`
- `description text nullable`
- `order_index integer not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `board_members`

- `board_id uuid references boards(id) on delete cascade`
- `user_id uuid references profiles(id) on delete cascade`
- `role text` constrained to `viewer` or `editor`
- `added_by uuid references profiles(id)`
- `created_at timestamptz default now()`
- composite primary key: `(board_id, user_id)`

### Integrity and RLS Notes

- `cards.board_id` is intentionally stored alongside `column_id` for easier board-scoped querying.
- A database trigger ensures the card’s `board_id` always matches its parent column’s `board_id`.
- `board_members` stores non-owner access with `viewer` and `editor` roles.
- RLS policies allow board participants to read a board, while only owners can rename, delete, or manage sharing.
- Columns and cards are readable by viewers and editable by owners or editors.

Schema source: [supabase/schema.sql](/Users/baran/Desktop/Koç_GenAI/supabase/schema.sql)

## Ordering Strategy

This MVP uses a simple integer ordering strategy:

- Each column stores cards with `order_index` values like `0, 1, 2, 3`.
- The columns themselves also store `order_index` values so lane order persists after refresh.
- On drag-and-drop, the local UI updates immediately after drop.
- The affected cards or columns are fully reindexed.
- Changed cards are then persisted to Supabase in a single `upsert` call.

Behavior rules:

- Same-column move: only that column’s cards are reindexed.
- Cross-column move: the dragged card gets a new `column_id`, and both source and destination columns are reindexed.
- Lane reorder: only the moved columns are reindexed and persisted through `columns.order_index`.

Why this approach:

- It is easy to reason about.
- It is reliable for small and medium boards.
- It fits a 9-hour MVP better than more complex ranking systems.

For larger scale or high-concurrency boards, a fractional indexing or rank-based strategy would be a better long-term choice.

## Mobile Usability Notes

- The board uses horizontal scroll with fixed minimum column widths.
- Cards remain readable on narrow screens.
- Drag is started through a visible handle.
- Touch activation constraints help reduce accidental drag starts during scrolling.
- The goal is a usable responsive web experience, not a native-app interaction model.

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project values.

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Set up Supabase schema

Open the Supabase SQL editor and run:

- [supabase/schema.sql](/Users/baran/Desktop/Koç_GenAI/supabase/schema.sql)

This creates:

- Tables
- `updated_at` triggers
- profile auto-creation trigger
- card/column board consistency trigger
- RLS policies

### 4. Configure Supabase Auth

For this MVP, configure Supabase Auth with:

- Email/password sign-in enabled
- Email confirmation disabled for faster demo flow

Production note:

- Enabling email confirmation is recommended for a public deployment.

### 5. Start development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. Quality checks

```bash
npm run lint
npm test
npm run build
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No service role key is required for this MVP because client-side mutations rely on RLS.

## Supabase Schema Setup

The project is intentionally `schema.sql`-centric instead of Supabase CLI migration-centric to keep the delivery lightweight and easier to review in a single repo.

Suggested setup flow:

1. Create a new Supabase project.
2. Copy values into `.env.local`.
3. Run [supabase/schema.sql](/Users/baran/Desktop/Koç_GenAI/supabase/schema.sql) in the SQL editor.
4. Disable email confirmation in Supabase Auth settings for the MVP demo flow.
5. Run the app locally and create the first user through the register page.

## Deployment Notes for Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

Optional CLI flow:

```bash
npx vercel login
npx vercel
```

Notes:

- The app uses Next.js App Router and is compatible with Vercel’s standard deployment flow.
- Route protection is handled through root `proxy.ts`, which aligns with Next.js 16’s replacement for the older `middleware.ts` convention.
- Supabase must be reachable from the deployed app, and RLS must remain enabled.

## Known Limitations

- Sharing currently supports only users who already have a TaskFlow account.
- Outbound invitation email delivery is not implemented yet.
- No realtime collaboration.
- No activity history or audit trail.
- No assignees, labels, or due dates.
- Board analytics and search are out of scope.
- The integer reindex strategy is simple and reliable, but not ideal for heavy concurrent editing at scale.

## Future Improvements

- Card delete with undo
- Column collapse / expand
- Invitation links and pending invites for users who are not registered yet
- Shared member presence and multi-user collaboration refinements
- Activity history
- Assignees
- Labels and due dates
- Realtime sync with Supabase Realtime
- Fractional indexing or rank-based ordering for larger boards
- Board templates such as `To Do`, `In Progress`, `Done`
- Richer accessibility support for keyboard drag-and-drop workflows

## Project Structure

```text
app/
  page.tsx
  login/page.tsx
  register/page.tsx
  dashboard/page.tsx
  boards/[boardId]/page.tsx
components/
  auth/
  board/
  ui/
lib/
  supabase/
  kanban.ts
  types.ts
  utils.ts
supabase/
  schema.sql
```

## Testing Notes

Automated coverage in this MVP focuses on the critical ordering helper logic:

- grouping cards into columns
- same-column reordering
- cross-column movement
- changed-card collection for persistence

Test file: [lib/kanban.test.ts](/Users/baran/Desktop/Koç_GenAI/lib/kanban.test.ts)

Manual smoke scenarios still matter for:

- register
- login
- dashboard ownership filtering
- board CRUD
- column create
- card create/edit
- drag-and-drop persistence after refresh

## MVP Scope Rationale

This project intentionally optimizes for a strong core demo:

- fewer features
- fewer broken edges
- clearer technical decisions
- faster review and deployment

That is why the implementation focuses on the Kanban path first and leaves broader product features to a second phase.
