# Project Structure

This document explains the repository layout for reviewers.

## Top-Level Layout

```text
agent-skill-forge/
├─ docs/                 # Documentation and planning artifacts
├─ mcp-proxy/            # Local MCP proxy server
├─ public/               # Static assets (including awesome-skills catalog)
├─ scripts/              # Maintenance and data-sync scripts
├─ src/                  # Application source code
├─ README.md             # Main repository documentation
├─ README.en.md          # English documentation
├─ README.zh-CN.md       # Chinese documentation
└─ package.json          # Build and runtime scripts
```

## `src/` Breakdown

```text
src/
├─ components/           # Shared UI and IDE modules
│  └─ ide/               # File explorer and editor panes
├─ pages/                # Route-level pages (Library/Editor/Simulator/Settings)
├─ lib/                  # Domain logic (FS, validation, security, compliance)
│  └─ p5-sketches/       # Theme background engines
├─ store/                # Zustand stores (app + MCP integration)
├─ i18n/                 # Localization messages and helpers
├─ App.tsx               # Route composition and bootstrapping
└─ main.tsx              # Entry point
```

## Review Checklist

- Start from `src/App.tsx` to understand route and page boundaries.
- Read `src/store/index.ts` for application state and persistence.
- Inspect `src/lib/fsCore.ts` and `src/lib/securityScan.ts` for core business logic.
- Check `src/pages/Library.tsx` and `src/pages/SkillEditor.tsx` for primary workflows.
