# Character Forge 5E

A mobile-first, static React character manager scaffold for a Dungeons & Dragons 5e (2024) play aid. Iteration 1 provides a reference character, five responsive sheet sections, mock spell/resource tracking, rest previews and undo, and local browser persistence.

> **Fixture notice:** Numerical character values and recovery behavior are mock UI fixture data, not authoritative rules calculations. No Player’s Handbook prose or copyrighted artwork is bundled.

## Local setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL. The application uses hash routes (`#/`, `#/character/reference`, and `#/character/new`) so refreshes work on static hosting.

## Quality commands

```bash
npm run lint
npm run test
npm run build
```

Preview a production build with `npm run dev -- --host` or `npx vite preview` after building.

## GitHub Pages

1. Push the repository to GitHub and make `main` the deployment branch (or edit the workflow trigger).
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. Push to `main` or run **Test and deploy Pages** manually under Actions.
4. The workflow installs dependencies, lints, tests, builds with `VITE_BASE_PATH=/<repository-name>/`, and deploys `dist`.

For a custom host/base, set `VITE_BASE_PATH` while building, for example `VITE_BASE_PATH=/my-project/ npm run build`.

## Iteration 1 scope and limitations

Included: responsive character list and sheet; summary, actions, spells, features, and inventory views; accessible rest confirmation dialogs; one-step rest undo; spell-slot controls; versioned local storage; and a creation placeholder.

Not included: a rules engine, authoritative calculations, full character creation, leveling, authentication, backend/cloud sync, Android packaging, PDF export, multiplayer, complete book content, or dark mode. State is browser-local and deliberately uses a single version-1 fixture character. The placeholder names and descriptions are original/minimal UI copy rather than reproduced rulebook descriptions.
