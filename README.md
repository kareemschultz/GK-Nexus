# GK-Nexus Enterprise Suite

**A comprehensive enterprise business management application for Guyana, built with modern TypeScript stack.**

GK-Nexus is inspired by GK-Enterprise-Suite and provides a complete solution for managing clients, appointments, documents, tax calculations, compliance monitoring, and government integrations - all tailored specifically for the Guyanese business environment.

## 🚀 Enterprise Features

### Core Business Management
- **Client Management** - Complete client lifecycle with multi-step onboarding wizard
- **Appointment System** - Full booking system with public client portal access
- **Document Management** - Organized file storage with categorization and sharing
- **User Management** - Invite-based registration with comprehensive RBAC (8 enterprise roles)
- **Enterprise Dashboard** - Real-time KPIs, compliance tracking, and analytics

### Guyana Tax & Compliance
- **PAYE Tax Calculations** - Complete implementation of Guyana tax brackets (0%, 28%, 30%, 33%, 40%)
- **NIS Contributions** - Automated NIS calculations with proper rates and thresholds
- **VAT Management** - VAT calculations and reporting for Guyana's 12.5% rate
- **GRA E-Services Integration** - Direct integration with Guyana Revenue Authority
- **NIS Electronic Submissions** - Automated schedule submissions to National Insurance Scheme
- **Compliance Monitoring** - Automated alerts and tracking for regulatory compliance

### Technical Architecture
- **TypeScript** - Full type safety across frontend and backend
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS & shadcn/ui** - Modern, responsive UI components
- **Hono & oRPC** - High-performance backend with end-to-end type safety
- **Drizzle & PostgreSQL** - Enterprise-grade database with comprehensive business schema
- **Better Auth** - Secure authentication with role-based access control
- **PWA Support** - Progressive Web App for offline functionality
- **WCAG 2.1 AA Compliance** - Full accessibility standards implementation

## 🏗️ Architecture Stack

- **Frontend**: React 19+ with TanStack Router and React Query
- **Backend**: Hono server with oRPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth with invite-based user management
- **Styling**: TailwindCSS with shadcn/ui components
- **Development**: Bun runtime with Turborepo monorepo
- **Quality**: Ultracite (Biome) for linting and formatting
- **Deployment**: Docker containerization support

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:
```bash
bun run db:push
```


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).







## Project Structure

```
GK-Nexus/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   ├── docs/        # Documentation site (Astro Starlight)
│   └── server/      # Backend API (Hono, ORPC)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
- `cd apps/web && bun run generate-pwa-assets`: Generate PWA assets
- `cd apps/web && bun run desktop:dev`: Start Tauri desktop app in development
- `cd apps/web && bun run desktop:build`: Build Tauri desktop app
- `cd apps/docs && bun run dev`: Start documentation site
- `cd apps/docs && bun run build`: Build documentation site
