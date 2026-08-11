# Stage 4, Iteration 4.0 — rich spells and level-up preparation

## Content and presentation architecture

`SpellDefinition` carries structured casting, component, attack/save, damage, healing, and character-level cantrip-scaling mechanics alongside unbounded authored `description` and optional `higherLevels` prose. Rules calculations consume structured fields only. `content.completeness` (`full`, `summary`, or `mechanics-only`) identifies how much prose is installed without invalidating an otherwise usable spell.

Bundled definitions enter the `RuleRegistry`; application selectors resolve mechanics and typed sources into the shared `SpellDetailView`; React cards consume that view. Creation's ordinary and Magician cantrip pickers, prepared-spell picker, level-up review, and Spellbook therefore share content. Circle and species spells remain derived, read-only grants outside ordinary preparation.

```plantuml
@startuml
database "Bundled Content" as Content
participant "Spell Registry" as Registry
participant "Spell Selectors" as Selectors
participant "Spell Detail View Model" as View
participant "Builder / Level Up / Spellbook" as UI
Content -> Registry: Spell definitions
Registry -> Selectors: Structured rules + descriptions
Selectors -> View: Resolved spell presentation
View -> UI: Shared rich spell data
@enduml
```

## Level-up transaction

The immutable draft seeds existing ordinary Druid preparations. Validation uses prospective progression (including level-5 access at Druid 9), permits a count at or below the limit, and rejects invalid choices. No draft mutation reaches storage; confirmation sends spell IDs, advancement, and HP through pure preview and one repository save, so cancel/failure preserves build and session state.

```plantuml
@startuml
actor User
participant "Level Up UI" as UI
participant "Level Up Controller" as Controller
participant "Spell Preparation Draft" as Draft
participant "Spell Registry" as Registry
participant "Character Calculator" as Calc
participant "Character Repository" as Repo
User -> UI: Start 8 -> 9 level-up
UI -> Controller: Create level-up draft
Controller -> Calc: Build prospective level 9 character
Calc --> Controller: Spell limit / max spell level
Controller -> Draft: Seed existing prepared spells
Draft -> Registry: Resolve available Druid spells
Registry --> Draft: Levels 1-5
Controller --> UI: Preparation view
User -> UI: Prepare / unprepare spells
UI -> Controller: Update draft
Controller -> Draft: Validate prospective selection
Draft --> Controller: Updated draft + diagnostics
Controller --> UI: Render count and selections
User -> UI: Confirm level-up
UI -> Controller: Commit
Controller -> Calc: Validate complete prospective build
Calc --> Controller: ComputedCharacter
alt valid
  Controller -> Repo: Persist level + prepared spells atomically
  Repo --> Controller: Success
  Controller --> UI: Level-up complete
else invalid
  Controller --> UI: Show diagnostics
end
@enduml
```

## Persistence and boundaries

No character schema or migration changed: only ordinary prepared IDs remain persisted. Expansion state, formatted labels, derived grants, and descriptions do not. Registry access is the seam for future content packs; React does not import a PHB file. Most prior entries had placeholders and no prose. Existing information was preserved, representative verified summaries are marked `summary`, and the rest `mechanics-only`; missing PHB prose was not invented. Background/feat expansion, Circle redesign, weapon attacks, richer Wild Shape, other classes, and levels 10+ remain deferred.
