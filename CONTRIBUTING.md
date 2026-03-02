# Contributing Guide

Thanks for contributing to Agent Skill Forge.

## Development Setup

```bash
npm install
npm run dev
```

Optional MCP proxy:

```bash
npm run mcp
```

## Quality Gate (Required)

```bash
npm run lint
npm run build
```

## Commit Scope

- Keep changes focused and reviewable.
- Update `README` and docs when behavior or architecture changes.
- Do not commit generated files from `dist/`, `node_modules/`, or local report folders.

## Pull Request Checklist

- [ ] Clear problem statement and proposed fix.
- [ ] Screenshots or terminal logs for user-facing changes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Documentation updated.
