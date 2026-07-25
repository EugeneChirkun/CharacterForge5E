# Character Forge 5E

A mobile-first, static React character manager scaffold for a Dungeons & Dragons 5e (2024) play aid. Iteration 1 provides a reference character, five responsive sheet sections, mock spell/resource tracking, rest previews and undo, and local browser persistence.

> **Fixture notice:** Numerical character values and recovery behavior are mock UI fixture data, not authoritative rules calculations. No Player’s Handbook prose or copyrighted artwork is bundled.

## Local setup

Requires Node.js 22 and npm. The committed `package-lock.json` is the source of
truth for dependency versions.

```bash
npm ci
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

1. In **Repository Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
2. Merge changes into `master` (which creates a push to `master`) or run **Build and deploy GitHub Pages** manually under Actions.
3. The production deployment workflow does not run for pull requests.
4. The workflow installs the locked dependencies with `npm ci`, lints, tests,
   builds, uploads `dist`, and deploys it to Pages.

Vite emits relative asset URLs, so the same build works at a repository path or
on a custom domain. Client-side navigation uses hash routes, which lets every
route load from the static `index.html` without server rewrite rules.

## Iteration 1 scope and limitations

Included: responsive character list and sheet; summary, actions, spells, features, and inventory views; accessible rest confirmation dialogs; one-step rest undo; spell-slot controls; versioned local storage; and a creation placeholder.

Not included: a rules engine, authoritative calculations, full character creation, leveling, authentication, backend/cloud sync, Android packaging, PDF export, multiplayer, complete book content, or dark mode. State is browser-local and deliberately uses a single version-1 fixture character. The placeholder names and descriptions are original/minimal UI copy rather than reproduced rulebook descriptions.
