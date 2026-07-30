# Character Forge 5E

> **Implementation status:** The milestone banner on the character-list page is rendered from the single authoritative [`applicationImplementationStatus`](src/application/implementation-status/implementation-status.ts) definition. Future iterations update that module; React components contain no milestone strings.

## Release quality (Iteration 3.4)

CharacterForge5E is now an offline-capable, browser-local MVP. Build and serve `dist/` over HTTPS (or localhost), then use the browser's install action where available. After one successful production load, the generated service worker caches the bundled app shell and rules: hash routes, existing characters, session editing, inventory, Spellbook, and creation work offline. Install UX differs across current Chromium, Firefox, and Safari; external and never-bundled content remains unavailable offline.

Open `#/settings` to export all characters, validate/preview JSON, select Replace/Keep both/Skip conflicts, inspect storage health, export isolated corrupt records, or perform a `DELETE`-confirmed reset. Character cards support individual export, duplication, and confirmed deletion. Keep external backups because browser/site data can be cleared and private modes or quotas can reject writes. **Print Character** opens the browser print dialog with dedicated control-free styles.

Updates are not forced: a waiting service worker offers **Update now** or **Later**. Paths and scope remain relative for GitHub Pages project hosting. Character data stays local unless explicitly exported; there are no accounts, backend, cloud sync, analytics, or telemetry. Imports are untrusted, validated, and size/count limited. See [the release-quality architecture and recovery guide](docs/iteration-3d-release-quality.md).

Deferred work includes cloud synchronization, accounts, collaboration, remote databases, D&D Beyond import, PDF form filling, combat automation, additional rules, and remote analytics. Stage 4 should first design compatibility/versioning for optional encrypted synchronization and broader licensed rules while preserving fully local use.

## Spellbook (Iteration 3.3)

`#/character/{id}/spellbook` is the dedicated spell-management experience. Domain functions own name search, composable filters, canonical sorting, and level grouping. Application selectors build an immutable `SpellbookView`; React renders its cards, detail, preparation totals, and slot summaries. Preparation reuses rules validation, and slot controls share Session Mode persistence.

Spell metadata is structured and contains no copyrighted descriptions. An optional description field permits future user-imported or appropriately licensed content without redesigning the pipeline. See [the Iteration 3.3 architecture](docs/iteration-3c-spellbook.md).

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

## Iteration 2C: creation and level-up

The guided creation workflow supports **only Druid levels 1–8, Tiefling with Chthonic Legacy, Farmer, Tough, and Circle of the Land** (Arid, Polar, Temperate, or Tropical). Its responsive steps cover basics/class, fixed origin, Standard Array/27-point Point Buy/strict Manual scores, Farmer adjustments, Druid skills, one verified MVP equipment preset, class cantrips and prepared spells, the level-3 subclass choice, and a computed review. Spell descriptions from the PHB are not bundled.

Creation choices live in a serializable schema-v1 `CharacterDraft`, separate from completed characters. The browser saves it under `character-forge-creation-draft-v1`, restores it after refresh, and removes it after confirmation or confirmed cancellation. Completed schema-v1 build/session records use `character-forge-records-v1`; computed characters and rule definitions are never stored. Remove those two local-storage keys plus `character-forge-state-v2` in browser developer tools to reset all browser data.

Hash routes are `#/characters`, `#/characters/new`, `#/characters/new/:step`, `#/character/reference`, `#/character/:id`, and `#/character/:id/level-up`. The seeded reference remains read-only and cannot be deleted or leveled. User characters advance exactly one level through level 8. Level-up preserves current and temporary HP and spent resources/slots rather than performing a Long Rest; level 3 requires Circle and land selection. Cantrip replacement and other uncertain replacement rules are deliberately deferred.

See [the Iteration 2C architecture notes](docs/iteration-2c-character-creation.md). Run verification with `npm ci`, `npm run lint`, `npm run test`, and `npm run build`.

## Iteration 3B: equipment and inventory

Characters now own a persistent, typed inventory rather than display-only equipment strings. Immutable domain definitions cover armor, shields, weapons, tools, adventuring gear, containers, and spellcasting focuses for the supported Druid/Farmer path. Instances independently track quantity, carried/equipped state, an optional container, notes, and attunement. The starting-equipment choice creates stable inventory instances during character creation, and level-up preserves them.

Equipped armor and shield mechanics feed the existing generic Armor Class calculator. The sheet displays grouped inventory, carried/owned weight, searchable verified additions, confirmed removal, quantity and equipment controls, container assignment, and an integer CP/SP/EP/GP/PP wallet. Container commands prevent missing, self, and circular references. Generic attunement state and its three-item limit are implemented even though no supported production item requires attunement.

Character-record schema v2 migrates schema-v1 records to the structured fallback preset. Equipment definitions and derived AC/weight are never persisted. See [the Iteration 3B architecture and limitations](docs/iteration-3b-equipment-inventory.md).

This iteration deliberately does **not** include automated attacks, automated damage, purchasing workflows, encumbrance penalties, a complete equipment compendium, or magic-item effects. Starting currency remains zero where a non-zero value was not verified; container capacity and complete training warnings are deferred.

## Iteration 3.5A: Druid Primal Order and Wild Shape rests

Druids now permanently choose **Magician** (one extra verified Druid cantrip and an Arcana or Nature check contribution equal to Wisdom, minimum +1) or **Warden** (Medium Armor and Martial Weapons training). Existing stored Druids are not guessed: migration marks `druid.primal-order` as a required build choice for explicit resolution. Wild Shape is sourced from the Druid progression/resource registry (unavailable at level 1, 2 uses at levels 2–5, and 3 at levels 6–8); a Short Rest restores one use and a Long Rest restores all uses through shared recovery transitions.

Current Druid limitations remain: ASI/feat decisions, subclass-choice changes, transformations, and additional forms/subclasses are deferred.

## Iteration 3.5B: starting equipment and creation purchasing

New Druids independently choose the verified Druid package or 50 GP and the verified Farmer package or 50 GP. Package currencies combine with gold alternatives, and the creation-only catalog uses verified registry prices and exact integer copper arithmetic. The editable draft cart can be left partly or wholly unspent; an over-budget cart blocks creation without losing selections.

Finalization atomically materializes structured inventory and a remaining denomination wallet. Every instance records a stable package source ID or starting-purchase attribution. Druid package leather armor and shield begin equipped; purchased armor and shields begin carried so they never displace package defaults. The existing equipped-item Armor Class pipeline supplies both review and final AC. Generic Warden training suppresses medium-armor and martial-weapon warnings, while Magician ownership remains allowed with warnings.

Persistence schema 3 adds starting-choice metadata conservatively. Existing structured inventory and wallets remain authoritative and are never retroactively granted equipment; unknown historical choices are marked `legacy-unknown`. Creation purchasing remains intentionally limited to creation: selling, refunds after creation, merchants, discounts, encumbrance effects, attacks, magic-item effects, ASI/feat selection, and subclass-selection changes are deferred. See [the Iteration 3.5B architecture notes](docs/iteration-3-5b-druid-starting-equipment-purchasing.md).

## Iteration 3.5C

CharacterForge5E now supports data-driven Druid advancement through level 8, including **Ability Score Improvements** and supported **General Feats**, with calculation-engine previews and persistent advancement history. Session Mode includes a responsive **Conditions redesign**, long-rest condition recovery, and persistent **Maximum HP adjustment** with current-HP clamping. The Home page **Implementation Status** panel is sourced from the shared status module and is the authoritative deployed-feature report.
