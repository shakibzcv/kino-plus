<div align="center">

# Kino Plus 🎬

**Your Unified Multi-Platform Entertainment Ecosystem**

Discover, track, and stream movies, TV series, and anime seamlessly across Web, Mobile, and Desktop.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Turborepo](https://img.shields.io/badge/monorepo-Turborepo-ef4444.svg)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/package__manager-pnpm-f69220.svg)](https://pnpm.io/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%207.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 🌟 Overview

**Kino Plus** is an all-in-one entertainment platform designed to deliver a smooth and consistent media discovery, watchlist tracking, and viewing experience. Powered by a high-performance **Turborepo** monorepo, Kino Plus shares core business logic, design tokens, and UI components across Web, Mobile, and Desktop clients backed by a dedicated scalable API.

---

## 🚀 Platforms & Applications

| Platform | Path | Tech Stack | Highlights |
| :--- | :--- | :--- | :--- |
| **Web** | [`apps/web`](./apps/web) | **Next.js 16**, React 19, Tailwind CSS v4, React Icons | Server Components, responsive streaming dashboard, SEO optimized, watchlist & ratings |
| **Mobile** | [`apps/mobile`](./apps/mobile) | **Expo SDK 58**, React Native 0.88, NativeWind v4, Expo Router | Cross-platform (iOS/Android), video player, offline download manager, QR scanner, voice search |
| **Desktop** | [`apps/desktop`](./apps/desktop) | **Electron 30**, Vite 5, React 18, Tailwind CSS v4 | Native desktop client, custom built-in ad blocker, seamless media playback |
| **API** | [`apps/api`](./apps/api) | **Express 5**, TypeScript, PostgreSQL, AWS S3, TMDb API | RESTful backend, Passport Google OAuth2, JWT sessions, rate limiting, Winston logging |

---

## 📦 Shared Packages

Kino Plus maintains modularity and high code reuse through internal packages:

- **[`@repo/ui`](./packages/ui)**: Reusable cross-platform design system and UI components (`MediaCard`, `TrailerSlider`, `AuthPage`, `WatchlistGrid`, `KinoLogo`, `ShareDialog`).
- **[`@repo/eslint-config`](./packages/eslint-config)**: Shared ESLint flat configurations for Next.js, React, and base TypeScript packages.
- **[`@repo/typescript-config`](./packages/typescript-config)**: Shared `tsconfig.json` configurations across the workspace.

---

## 📁 Repository Structure

```
kino-plus/
├── .github/
│   ├── ISSUE_TEMPLATE/        # Bug report and feature request templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/ci.yml       # GitHub Actions CI workflow
├── .vscode/                   # Recommended extensions and workspace settings
├── apps/
│   ├── api/                   # Express 5 backend API & TMDb integration
│   ├── desktop/               # Electron + Vite + React desktop application
│   ├── mobile/                # Expo SDK 58 React Native application
│   └── web/                   # Next.js 16 App Router web application
├── packages/
│   ├── eslint-config/         # Reusable ESLint configs
│   ├── typescript-config/     # Reusable TypeScript compiler configs
│   └── ui/                    # Shared design system & UI components
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc
├── CODE_OF_CONDUCT.md         # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md            # Contribution guidelines & workflow
├── package.json               # Root monorepo workspace configuration
├── pnpm-lock.yaml             # Frozen dependency lockfile
├── pnpm-workspace.yaml        # pnpm monorepo workspace definition
├── README.md                  # Project documentation
└── turbo.json                 # Turborepo task pipeline configuration
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `v24.x` or higher
- **pnpm**: `v11.25.0` or higher (`corepack enable` or `npm install -g pnpm@11.25.0`)
- **Turborepo**: `v2.x` (`npm install -g turbo`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shakibzcv/kino-plus.git
   cd kino-plus
   ```

2. **Install all monorepo dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   Copy the example environment file for the backend API:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Fill in your PostgreSQL database credentials, TMDb API key, AWS S3/Cloudflare R2 storage credentials, and Google OAuth credentials.

---

## 💻 Development & Available Scripts

Run common tasks from the root directory:

```bash
# Start all applications in development mode simultaneously
pnpm run dev

# Target a specific application with Turbo filter:
pnpm turbo run dev --filter=web       # Start Web application
pnpm turbo run dev --filter=desktop   # Start Desktop application
pnpm turbo run dev --filter=mobile    # Start Mobile application
pnpm turbo run dev --filter=api       # Start Backend API service

# Build all applications and packages
pnpm run build

# Run lint checks across the entire monorepo
pnpm run lint

# Run TypeScript static type checking
pnpm run check-types

# Format all files with Prettier
pnpm run format
```

---

## 🤝 Contributing

We welcome contributions from the community! Please check out our [Contributing Guide](./CONTRIBUTING.md) to get started.

Please ensure all participants adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 📬 Contact

Have questions, suggestions, or want to collaborate? Feel free to reach out:

- **Email**: [shakibzcv@gmail.com](mailto:shakibzcv@gmail.com)
- **GitHub**: [@shakibzcv](https://github.com/shakibzcv)
- **Repository**: [https://github.com/shakibzcv/kino-plus](https://github.com/shakibzcv/kino-plus)

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
