## Project Summary
Dropy is an all-in-one e-commerce SaaS platform designed for the Tunisian market. It connects sellers (dropshippers), suppliers, and UGC creators to create a complete local e-commerce ecosystem.

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide React
- Backend: Supabase (Auth, Database, Storage)
- Payments: Stripe
- Internationalization: Custom context with JSON translation files (FR, AR)
- Deployment: Vercel

## Architecture
- `src/app`: Next.js App Router routes
  - `(landing)`: Public landing pages
  - `admin`, `seller`, `supplier`, `creator`: Role-specific dashboards
  - `api`: Backend API routes
- `src/components`: Reusable UI and layout components
- `src/context`: React contexts (Language, Auth)
- `src/locales`: Translation files

## User Preferences
- No comments in code unless explicitly requested.
- Use French and Arabic for the platform.
- Platform blog is hosted at https://dropyblog.vercel.app.

## Project Guidelines
- Follow the existing modern, high-contrast UI aesthetic (Purple/Teal gradients, sharp accents).
- Maintain responsiveness for all dashboard and landing components.
- Use the custom translation system for all user-facing text.

## Common Patterns
- Dashboard sidebars use a common layout structure with role-specific links.
- Landing pages use a separate header/footer from the dashboard.
