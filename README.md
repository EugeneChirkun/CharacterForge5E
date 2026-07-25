# Character Forge 5E

A mobile-first, static React character manager scaffold for a Dungeons & Dragons 5e (2024) play aid. Iteration 2A provides a reference character, five responsive sheet sections, generic character calculations, spell/resource tracking, rest previews and undo, and local browser persistence.

> **Fixture notice:** Generic character statistics are calculated from typed fixture inputs. Class, species, subclass, background, feature, equipment-description, spell-list, resource, and recovery behavior remain fixture UI data until later iterations. No Player’s Handbook prose or copyrighted artwork is bundled.

## Character calculation architecture

The framework-independent `src/domain` layer separates three concepts:

- **`CharacterBuild`** is immutable, serializable input containing permanent choices such as ability scores, proficiencies, explicit HP gains, AC sources, and supplied spell-slot progression.
- **`CharacterSession`** is immutable gameplay state containing current and temporary HP, spent slots and hit dice, resources, and conditions. Session update helpers return new objects.
- **`ComputedCharacter`** is a transient projection of derived statistics and calculation explanations. It is never persisted.

`computeCharacter(build, session)` validates both inputs and composes small pure calculators for ability modifiers, proficiency, saves, skills, initiative, passive Perception, AC, HP, and spellcasting. The typed reference build and session live in `src/features/characters/referenceCharacter.ts`; an adapter maps their computed projection to the existing presentation and storage model without putting formulas in React.

Dependency rule: domain code must not import React, browser storage, or UI code. UI and fixture adapters may depend on the domain, but the domain must not depend on them. The domain is deterministic and can run in Node or any other JavaScript environment.

Until Iteration 2B, full-caster slots and equipped AC inputs are verified numeric fixture data rather than class/equipment rules modules. Druid, Circle of the Land, Chthonic Tiefling, species, feature, rest-recovery, prepared-spell, and spell-effect rules remain deliberately out of scope.

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

## Iteration 2A scope and limitations

Included: responsive character list and sheet; pure explained generic calculations; immutable build/session models; summary, actions, spells, features, and inventory views; accessible rest confirmation dialogs; one-step rest undo; spell-slot controls; versioned local storage; and a creation placeholder.

Not included: class/species/subclass/feat feature rules, rest rules, spell effects, prepared-spell validation, full character creation, leveling, authentication, backend/cloud sync, Android packaging, PDF export, multiplayer, complete book content, or dark mode. State is browser-local and deliberately uses a single version-1 fixture character. The placeholder names and descriptions are original/minimal UI copy rather than reproduced rulebook descriptions.

## Iteration 2B: verified Druid vertical slice

Iteration 2B adds a read-only, typed rule registry and pure interpreters for Druid levels 1–8, Circle of the Land (Arid, Polar, Temperate, and Tropical), Tiefling with Chthonic Legacy, Farmer, and Tough. These are the **only** class, subclass, species/legacy, background, feat, and levels currently supported. Character creation, multiclassing, and level-up flows remain out of scope.

Every definition carries `5e-2024` source metadata and a verification flag. Private-reference text is never bundled: the application stores only names, structured mechanics, short original summaries, and section/page metadata. Spell descriptions from the PHB are not included.

### Architecture

- The immutable `RuleRegistry` contains class progression, typed feature effects, spells, independent spell grants, and resources. It is injected into character and rest computation.
- Rule resolution derives active class, subclass, species, background, and feat features. Unknown or incompatible IDs produce typed diagnostics.
- Resource session values consistently mean **remaining uses**. Maximums and recovery come from definitions rather than persisted or React-owned formulas.
- Prepared Druid spells are validated for count, duplicates, list membership, spell level, cantrips, missing definitions, and accidental inclusion of granted spells.
- Class, subclass, and species grant paths remain separate. Presentation merges cards by spell ID while retaining all source badges.
- Rest previews and immutable transitions share one rules path. Short Rests restore only explicitly eligible resources; Long Rests restore HP, spell slots, resources, and free uses and can change the active Circle land.
- Storage schema v2 persists the current presentation state. A v1 reference payload is conservatively merged with fresh derived Iteration 2B data; malformed state resets only to the reference default.

### Known limitations

Wild Shape creature forms, spell effects, attacks, concentration, conditions, equipment mechanics, individual Hit Dice spending/recovery, Natural Recovery choices, character creation, and level-up UI are deferred. The compatibility view-model rest adapter remains for the existing UI while authoritative new transitions are available in `src/domain/rest`.

See [the compact verification matrix](docs/rules-verification/druid-tiefling-levels-1-8.md) for rule provenance and exact limitations.
