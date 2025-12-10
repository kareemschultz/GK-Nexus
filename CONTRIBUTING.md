# Contributing to GK-Nexus Suite

Thank you for your interest in contributing to GK-Nexus Suite! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [API Architecture](#api-architecture)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/GK-Nexus.git`
3. Add upstream remote: `git remote add upstream https://github.com/kareemschultz/GK-Nexus.git`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.2+
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

### Installation

```bash
# Install dependencies
bun install

# Start database containers
docker compose up -d

# Push database schema
bun run db:push

# Seed initial data
bun run db:seed

# Start development server
bun run dev
```

### Development URLs

- **Web App:** http://localhost:3001
- **API Server:** http://localhost:3000
- **Documentation:** http://localhost:4321

## Code Standards

This project uses **Ultracite** (Biome) for code formatting and linting.

### Quick Commands

```bash
# Check for issues
npx ultracite check

# Auto-fix issues
npx ultracite fix
```

### Key Principles

- **TypeScript**: Use explicit types for function parameters and return values
- **Async/Await**: Always use async/await instead of promise chains
- **React**: Use function components and hooks at the top level only
- **Error Handling**: Throw `ORPCError` objects with descriptive messages
- **Security**: Add `rel="noopener"` for external links, validate all user input

### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `ClientList.tsx`)
- Routes: `kebab-case.tsx` (e.g., `forgot-password.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Routers: `kebab-case.ts` (e.g., `service-catalog.ts`)

## API Architecture

The API uses **nested oRPC routers** following this pattern:

### Naming Convention

```
orpc.{domain}.{resource}.{action}
```

**Examples:**
- `orpc.training.courses.list`
- `orpc.clients.list`
- `orpc.tax.filings.submitVat`

### Router Implementation

Individual router files export flat procedures:

```typescript
// packages/api/src/routers/training.ts
export const trainingCoursesList = protectedProcedure
  .use(requirePermission("training.read"))
  .input(courseQuerySchema)
  .handler(async ({ input, context }) => { ... });
```

The main router assembles them into nested structure:

```typescript
// packages/api/src/routers/index.ts
export const appRouter = {
  training: {
    courses: {
      list: trainingCoursesList,
      create: trainingCoursesCreate,
    },
  },
};
```

### Frontend Usage

```typescript
// Use dynamic imports for lazy loading
const { data } = useQuery({
  queryKey: ["training", "courses"],
  queryFn: async () => {
    const { client } = await import("@/utils/orpc");
    return client.training.courses.list({ page: 1, limit: 20 });
  },
});
```

## Commit Guidelines

We use conventional commits. Format:

```
type(scope): description

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(payroll): add employee management module
fix(auth): resolve session expiration issue
docs(api): update router documentation
refactor(clients): migrate to nested router pattern
```

## Pull Request Process

1. **Update your branch**: `git fetch upstream && git rebase upstream/main`
2. **Run checks**: `npx ultracite check && bun run build`
3. **Write tests**: Add tests for new functionality
4. **Update documentation**: Document new features or API changes
5. **Create PR**: Use the PR template and provide clear description
6. **Address feedback**: Respond to review comments promptly

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass (`bun run test`)
- [ ] Build succeeds (`bun run build`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] PR description explains the changes

## Testing

### Running Tests

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Coverage report
bun run test:coverage
```

### Writing Tests

- Place unit tests next to the code they test
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions

## Project Structure

```
GK-Nexus/
├── apps/
│   ├── web/              # React frontend
│   ├── server/           # Hono backend
│   └── docs/             # Astro documentation
├── packages/
│   ├── api/              # oRPC routers and procedures
│   ├── auth/             # Better-Auth configuration
│   └── db/               # Drizzle ORM schema
├── tests/                # E2E tests
└── scripts/              # Build and setup scripts
```

## Need Help?

- Check existing issues and discussions
- Read the documentation in `/docs`
- Review the [ARCHITECTURE.md](.claude/ARCHITECTURE.md) for technical details

Thank you for contributing to GK-Nexus Suite!

---

**GK-Nexus Suite** - Created by **Kareem Schultz** at [Karetech Solutions](https://karetech.gy)
