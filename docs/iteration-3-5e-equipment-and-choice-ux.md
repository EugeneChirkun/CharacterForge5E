# Iteration 3.5E — Equipment and Choice UX

## Choice filtering architecture

`evaluateChoiceDefinition` is the generic rules-layer boundary for choice controls. It returns stable option IDs and labels plus `visible`, `enabled`, and an optional reason. React renders that projection; it does not infer legality. `reconcileFeatChoices` repeatedly removes stale interdependent selections and supplies inline explanations. Skill Expert filters the ability increase by its cap, proficiency by existing selections, and Expertise by proficiency, existing Expertise, and sibling choices.

## Equipment and capability registry

Equipment remains a single immutable registry of verified definitions. Optional aliases support search, while typed capabilities describe what an object can do independently of its display category. The canonical Quarterstaff is one physical definition with both `weapon` and `spellcasting-focus` capabilities; class-package, purchase, and focus use resolve to that ID. Focus definitions retain source, cost, weight, and Druidic focus data.

Mechanical summaries derive category, damage, properties, range, AC rules, cost, weight, and proficiency state exclusively from definitions.

## Package registry and inventory materialization

The package registry owns Explorer's Pack contents and quantities. The viewer uses this structure before purchase and wherever the package appears in equipment selection; totals are derived rather than copied. Search covers name, alias, and category, and equipment supports alphabetical, cost, and weight ordering.

Packages remain purchasable definitions in the builder. Finalization expands Explorer's Pack into individual inventory entries. Each entry carries `Explorer's Pack` as its acquisition source. Duplicate detection is informational: it names the containing pack and asks for confirmation without making the extra item illegal.

## Druidic Focus architecture

Focus behavior is a capability, not a duplicate inventory category. Dedicated verified focus definitions can coexist with multi-capability equipment. Quarterstaff therefore works as a simple melee weapon and a Druidic Focus while occupying one inventory instance.
