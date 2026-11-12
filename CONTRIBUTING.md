# Contributing to Kino Plus

Thank you for your interest in contributing to **Kino Plus**! Kino Plus is a cross-platform movie, series, and entertainment tracking/streaming ecosystem organized as a high-performance Turborepo monorepo.

We welcome contributions of all kinds: bug fixes, new features, UI improvements, documentation, and translations.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report any unacceptable behavior to **shakibzcv@gmail.com**.

---

## Monorepo Architecture

Kino Plus is structured into distinct applications and shared packages:

```
kino-plus/
├── apps/
│   ├── api/       # Express + TypeScript backend API service (PostgreSQL, TMDB, S3)
│   ├── web/       # Next.js 16 + React 19 web application
│   ├── mobile/    # Expo SDK 58 + React Native 0.88 mobile application
│   └── desktop/   # Electron 30 + Vite 5 + React 18 desktop application
├── packages/
│   ├── ui/                # Shared React UI components & design system
│   ├── eslint-config/     # Shared ESLint configuration presets
│   └── typescript-config/ # Shared tsconfig bases
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v24` or later
- **pnpm**: `v11.25.0` or later (`npm install -g pnpm@11.25.0` or `corepack enable`)
- **Turbo**: `v2` (`npm install -g turbo`)

### Setup Instructions

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/shakibzcv/kino-plus.git
   cd kino-plus
   ```

2. **Install all dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   - Copy `apps/api/.env.example` to `apps/api/.env` and supply the required API keys (TMDb API key, PostgreSQL credentials, AWS S3 / Cloudflare R2 bucket details, and Google OAuth credentials).

4. **Start Development:**
   - Run all apps simultaneously:
     ```bash
     pnpm run dev
     ```
   - Or run a specific application using Turbo filter:
     ```bash
     pnpm turbo run dev --filter=web       # Run Web app
     pnpm turbo run dev --filter=api       # Run API backend
     pnpm turbo run dev --filter=desktop   # Run Desktop app
     pnpm turbo run dev --filter=mobile    # Run Mobile app
     ```

---

## Development Workflow

### Scripts Overview

- `pnpm run build` - Build all packages and applications.
- `pnpm run dev` - Launch local development servers in parallel.
- `pnpm run lint` - Run ESLint across all projects.
- `pnpm run check-types` - Type-check all packages with TypeScript compiler.
- `pnpm run format` - Format all files with Prettier.

### Branch Naming Conventions

Please use descriptive branch names prefixed with the relevant type:

- `feat/feature-name` (e.g., `feat/watchlist-offline-sync`)
- `fix/bug-description` (e.g., `fix/desktop-ad-blocker-filter`)
- `docs/doc-update` (e.g., `docs/update-api-setup`)
- `chore/tooling-update` (e.g., `chore/bump-dependencies`)

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope): add new feature`
- `fix(scope): resolve bug`
- `docs(scope): update documentation`
- `style(scope): code style formatting`
- `refactor(scope): refactor without feature/fix change`
- `perf(scope): performance improvements`
- `test(scope): add or modify tests`
- `chore(scope): build, tooling, or dependency changes`

*Scopes:* `web`, `mobile`, `desktop`, `api`, `ui`, `repo`, `tooling`.

---

## Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of `shakibzcv/kino-plus`.
3. Complete the provided PR template checklist.
4. Ensure CI tests, type-checks, and linters pass.
5. Address any review feedback promptly.

---

## Contact & Questions

If you have questions, feedback, or need guidance on contributing:

- **Email**: [shakibzcv@gmail.com](mailto:shakibzcv@gmail.com)
- **GitHub**: [@shakibzcv](https://github.com/shakibzcv)
