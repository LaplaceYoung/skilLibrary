<p align="center">
  <img src="./public/logo.svg" alt="Agent Skill Forge Logo" width="120">
</p>
# Agent Skill Forge

<p align="center">
  Visual IDE for creating, validating, importing, and installing Agent Skills across coding assistants.
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-0f766e.svg">
  <img alt="React 19" src="https://img.shields.io/badge/react-19-149eca.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-5.x-3178c6.svg">
  <img alt="Vite" src="https://img.shields.io/badge/vite-7.x-646cff.svg">
</p>

English | [Chinese](./README.zh-CN.md)

## Table of Contents

- [Why Agent Skill Forge](#why-agent-skill-forge)
- [Feature Overview](#feature-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [MCP Proxy Setup](#mcp-proxy-setup)
- [Project Structure](#project-structure)
- [Quality Gates](#quality-gates)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Why Agent Skill Forge

Agent Skill Forge is built for one specific workflow: turn raw prompt ideas into production-ready skill packages that can be reviewed, tested, and installed into multiple agent ecosystems.

It is not just a markdown editor. It provides:

- A library-first workspace (local + discover + custom GitHub repositories).
- Structured skill editing with metadata, instructions, sidecar files, and preview.
- Security/compliance checks before save/import/install/export.
- Multi-target installation output (`.claude`, `.codex`, `.cursor`, `.windsurf`, `.github`, `.gemini`, etc.).

## Feature Overview

| Module | What it does | Status |
| --- | --- | --- |
| Skill Library | Local/discover tabs, search, import, install, export | Ready |
| Discover Trust Signals | Source metadata badges (stars/license/activity), trust score, sort by trust/popular/recent | Ready |
| Favorites | Pin/unpin local skills and prioritize pinned entries | Ready |
| Skill Editor | Frontmatter + instructions + preview + multi-file IDE mode | Ready |
| Local Sync | File System Access API directory link and resync | Ready |
| Security Scan | Risk scoring (`safe/review/warning/blocked`) | Ready |
| Compliance Policy | Action-level guardrails for save/import/install/export | Ready |
| MCP Integration | Connect to local MCP proxy and inspect tool list | Ready |
| Skill Simulator | Mock chat simulation with skill instructions | Ready |
| Command Palette | `Ctrl/Cmd + K` quick actions for navigation, theme, sync, and motion controls | Ready |
| Global Shortcuts | `G H / G E / G S / G ,` route chords with input-focus conflict protection | Ready |
| i18n + Themes | `zh-CN/en-US` + dynamic p5 theme backgrounds | Ready |
| Performance Controls | Background motion mode (`auto/on/off`) with reduced-motion and data-saver awareness | Ready |
| Launch Pages | Multi-page promo site (`/promo`) for positioning, growth loops, and benchmark narrative | Ready |

## Architecture

```text
UI (React Pages + Components)
        |
        v
State Layer (Zustand + Persist + IndexedDB handle)
        |
        +--> Skill Domain (validation, security scan, compliance policy)
        |
        +--> File Domain (local directory read/write, tree sync, install targets)
        |
        +--> Discover Domain (local catalog + remote market proxy)
        |
        +--> MCP Domain (proxy connection, tool discovery)
```

## Tech Stack

- React 19 + TypeScript + Vite
- Zustand (`persist`) + `idb-keyval`
- Tailwind CSS v4
- p5.js (theme-driven background engine)
- Express + MCP SDK (local proxy bridge)

## Quick Start

### 1) Install

```bash
npm install
```

### 2) Run web app

```bash
npm run dev
```

Open `http://localhost:5173`.

Promo pages: `http://localhost:5173/promo`.

### 3) Optional: run MCP proxy

```bash
npm run mcp
```

### 4) Optional: refresh local awesome skills catalog

```bash
npm run sync:awesome
```

### Compatibility Matrix (Install Targets)

| Target Ecosystem | Status |
| --- | --- |
| Claude Code (`.claude`) | Supported |
| OpenAI Codex (`.codex`) | Supported |
| Cursor (`.cursor`) | Supported |
| Windsurf (`.windsurf`) | Supported |
| GitHub Copilot-style workspace (`.github`) | Supported |
| Gemini (`.gemini`) | Supported |

## MCP Proxy Setup

Proxy server file: [`mcp-proxy/index.js`](./mcp-proxy/index.js)

Supported environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Proxy bind address |
| `PORT` | `3001` | Proxy port |
| `MCP_PROXY_TOKEN` | empty | Optional auth token for `/sse` and `/api/proxy-market` |
| `MCP_ALLOWED_COMMANDS` | `npx,node` | Command allowlist for stdio spawn |
| `MCP_ALLOWED_MARKET_HOSTS` | `claude-plugins.dev,skillsllm.com` | Market host allowlist |

Example:

```bash
MCP_PROXY_TOKEN=your-token npm run mcp
```

Then configure in app settings:

- Proxy SSE URL: `http://localhost:3001/sse`
- Auth token: same as `MCP_PROXY_TOKEN` (if enabled)
- Command/Args: according to your MCP runtime command

## Project Structure

```text
.
|-- docs/                  # docs index, structure, and engineering standards
|-- mcp-proxy/             # local MCP bridge service
|-- public/                # static assets and skill catalog
|-- scripts/               # maintenance scripts
|-- src/
|   |-- components/        # shared UI and IDE components
|   |   `-- ide/           # file explorer and code pane
|   |-- pages/             # Library / SkillEditor / Simulator / Settings
|   |-- lib/               # fs, validation, compliance, security, indexing
|   |-- store/             # app and MCP state stores
|   `-- i18n/              # locale messages
|-- CONTRIBUTING.md
|-- LICENSE
`-- README*.md
```

Detailed review guide: [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

## Quality Gates

```bash
npm run check:repo
npm run lint
npm run build
npm run analyze:bundle
```

E2E smoke tests:

```bash
npx playwright install chromium
npm run test:e2e:smoke
npm run test:e2e:a11y
```

Or run both:

```bash
npm run check
```

Or run full local gate (repo hygiene + lint + build + bundle analysis):

```bash
npm run check:full
```

## Documentation

- Docs index: [docs/README.md](./docs/README.md)
- Review structure: [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)
- UI/UX compliance baseline: [docs/standards/UI_UX_COMPLIANCE.md](./docs/standards/UI_UX_COMPLIANCE.md)

## GitHub Pages Deployment

- Workflow: [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)
- Trigger: push to `main` or manual `workflow_dispatch`
- Default URL pattern: `https://<username>.github.io/<repo>/`
- Current repo target: `https://laplaceyoung.github.io/skilLibrary/`
- Promo routes: `/promo`, `/promo/growth`, `/promo/benchmarks`

## Roadmap

- Add E2E tests for import/edit/install/sync workflows.
- Improve discover source quality scoring and trust labeling.
- Add skill templates and onboarding wizard for first-time users.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. See [LICENSE](./LICENSE).
