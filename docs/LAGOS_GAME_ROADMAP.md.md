Lagos Governor Sim — Game Evolution Roadmap

Version 1.0 — captured from the design session that followed the map work. Purpose: hold the WHOLE vision so nothing is lost, sequence it so nothing spirals, and make each phase verifiable so "done" is unambiguous. The map is SHELVED (in code, out of UI). This roadmap is about the GAME.

0. Where the game actually stands (from the audit)

The engine is REAL and DEEP. 242 event cards, full Godfather arc, working delayed consequences, elections, primaries, second term, working save system. The budget genuinely bites (−1.8bn/wk starting deficit; bankruptcy in ~25 weeks if passive). Seven game-over conditions fire. This is a substantially complete governance sim.

The problem is NOT depth. It is ENGAGEMENT. A real playtest (week 22 save) revealed the player poking idly "to see how far I get" rather than playing purposefully — and losing to an overhead bleed they never saw coming. Three faces of ONE wound:

Recycled content (13 routine cards across 150 weeks) → world feels generic → no immersion

Narrow interaction (everything happens THROUGH event cards) → player only reacts → no agency

Numeric, not emotional, consequences (+8/−12 deltas) → information not experience → no feeling

The cure across all three: specificity, agency, character, and a reason to play.

1. The Vision (assembled from what genuinely excited the designer)

Watching Reigns / Frostpunk / Crusader Kings / Disco Elysium clarified the target. NOT a swipe game (Reigns too light), NOT a puzzle/skill-check game (Disco's mechanics). The real vision, in the designer's own reactions:

Frostpunk's INHABITANCE — "you live in the game." (This is also why the map mattered — its true job was to be a place you inhabit, not an accurate map. Return to it later with that lens.)

Crusader Kings' GOALS & CHARACTERS — start with a goal you play toward; characters who feel like present people, not meters; AI-generated character portraits (cheap, and unlike the map, AI does this well).

Designer-original systems — a proactive economy panel (push levers yourself), a research/future-investment tree (commission research → startup → tax/jobs years later), and an inbox (the vehicle that makes characters SPEAK to you).

Through-line: a living Lagos you inhabit, govern proactively, and play toward a goal you chose, with characters who feel present. Almost all of it sits on the existing engine.

2. Sequencing principle

Build in the order that most makes the player want to play PURPOSEFULLY, cheapest-high-impact first. Each phase is independently shippable and leaves the game better than it found it. Never start a phase before the previous is verified done and committed.

Recommended order: Phase A (Goals) → B (Emotional consequence text) → C (Proactive economy panel) → D (Inbox + characters) → E (Research tree) → F (revisit map as inhabitance).

Rationale: Goals give a reason to play (fixes the "idle poking" directly). Emotional text is cheap and makes every existing card land harder. The economy panel fixes narrow interaction. The inbox makes characters present. Research adds the long-arc hope mechanic. The map returns last, when the game is worth inhabiting.

PHASE A — Starting Goals (the spine)

Why first: The playtest proved the player had no reason to play purposefully. A chosen goal converts "see how far I get" into "I'm trying to do X and the godfathers are in my way." Everything else hangs on this spine.

What it is:

At game start (after archetype/deputy selection), the player chooses a GOAL — a multi-year ambition that defines their term. Examples:

"Clean Lagos" — environment/sanitation/infrastructure to target levels

"Break the Machine" — survive a full term with partyGodfathers low / godfather defied

"Industrialize the Mainland" — IGR/employment/infrastructure in mainland LGAs

"The People's Governor" — public trust + informal economy + youth at target

"Fiscal Sovereignty" — eliminate the deficit, clear debt, IGR self-sufficiency

Each goal defines: target conditions (read from existing stats), a visible progress indicator, and the KNOWN pushbacks (which factions/forces resist it).

A persistent GOAL TRACKER in the UI shows progress toward the chosen goal and what's blocking it.

How to build it:

goals.ts — data file: each goal = { id, title, description, targetConditions (predicate over GameState), progressFn (0–100 from current state), pushbackText, relevantFactions }.

Goal selection screen after deputy selection. Store selectedGoal in GameState (+ save migration to v5).

GoalTracker.tsx — persistent panel: goal title, progress bar (progressFn), and a "what's blocking you" line derived from state (e.g. "Civil Society backs you (62) but the Godfathers resist (4)").

Goal completion → a major positive event / legacy boost. Goal failure → reflected in ending. NO new mechanics — targets read existing stats.

How to verify it's done:

[ ] Player picks a goal at start; it persists across save/load (v5 migration works).

[ ] Goal tracker shows live progress that moves as the relevant stats move.

[ ] The "what's blocking you" line correctly names the real obstacle in the player's state.

[ ] Reaching target conditions fires a completion outcome; ending reflects goal success/fail.

[ ] Playtest: does having a goal make YOU play more purposefully? (the real test)

What it is NOT:

Not a quest system with scripted steps. It's a target + progress + pushback readout.

Not new stats. Goals read existing state.

Not a tutorial. It's a reason to care, not a hand-hold.

Next step after A: Phase B — make the consequences of pursuing the goal FEEL like something.

PHASE B — Emotional Consequence Text (cheap, high feeling-per-effort)

Why second: Makes every one of the 242 existing cards land harder, for pure writing effort. Converts "+8 trust, −12 godfather" from a REPORT into an EXPERIENCE.

What it is:

Replace/augment numeric deltas with SPECIFIC, named consequences. A −12 godfather isn't a number — it's "Chief Fashemu doesn't call. Days later your Commissioner for Works mentions, not meeting your eyes, that the Agege contract is 'under review.'"

Two parts:

Richer delayed-consequence text — the engine already supports eventText on delayed consequences (audit confirmed). Make that text specific, personal, named.

A felt "consequence beat" after a choice — a short narrative line that dramatizes the biggest stat/faction change, shown alongside (not instead of) the numbers.

State-aware templating (NO LLM at runtime): consequence text reads current state and assembles from fragments — names Alimosho when Alimosho is in crisis, references the Godfather when you just defied him, opens differently when trust is low.

How to build it:

A consequenceNarrator.ts — given a choice's deltas + current state, returns a specific narrative beat from templated fragments (deterministic, instant, free).

Upgrade existing cards' delayed eventText to specific/personal versions (writing pass).

Optional, LATER: generate prose variants OFFLINE in bulk with a capable model, bake as static text. NEVER run an LLM at play-time (it drags the machine and solves nothing that templating doesn't).

How to verify it's done:

[ ] After a significant choice, a specific narrative beat appears, not just numbers.

[ ] The beat references the player's ACTUAL situation (correct LGA, correct character).

[ ] Delayed consequences arrive with specific, personal text.

[ ] Playtest: does a choice now make you feel something (dread, guilt, satisfaction)?

[ ] No runtime LLM; no performance hit.

What it is NOT:

Not a rewrite of the simulation. The numbers stay; the FEELING is added on top.

Not runtime LLM generation. Templating + offline-baked prose only.

Not flavor for its own sake — the beat dramatizes the REAL mechanical consequence.

Next step after B: Phase C — let the player ACT, not just react.

PHASE C — Proactive Economy Panel (fixes narrow interaction)

Why third: The audit's Problem 3. Right now levers (overheads, subventions, LUC, PAYE, debt) exist but are only reachable through event cards. Surface them as a panel the player acts on directly. This is the Frostpunk "click economy, toggle directions" the designer wanted.

What it is:

An ECONOMY panel where the player can proactively:

Adjust overhead/subvention levels (with political/faction costs)

Launch revenue initiatives directly (PAYE drive, LUC enforcement) instead of waiting for a card to offer them

Take PLANNED loans — the takeLoan() function and world_bank/bond/federal terms ALREADY EXIST in the engine but nothing calls them (audit 4.1). Wire them to a UI action.

See the budget breakdown and act on the biggest bleed (the week-22 save lost to overheads the player couldn't proactively cut).

How to build it:

EconomyPanel.tsx — reads budget state, exposes levers as actions that dispatch existing engine functions (takeLoan, set subventionCutRate, trigger initiatives).

Each lever shows its cost (PC, faction hit) BEFORE the player commits — informed agency.

Wire the already-built takeLoan() to a loan UI (world_bank = cheap+conditions, bond, federal = political cost). Nearly free; the engine work is done.

Gate proactive actions behind political capital / cooldowns so they're choices, not spam.

How to verify it's done:

[ ] Player can cut overheads / take a planned loan / launch an initiative WITHOUT waiting for an event card.

[ ] Each action shows its cost before commit and applies correctly via existing engine.

[ ] The week-22 failure is now PREVENTABLE: a player who sees the overhead bleed can act.

[ ] takeLoan (world_bank/bond/federal) is reachable and works.

[ ] Playtest: do you now feel like you're GOVERNING, not just answering mail?

What it is NOT:

Not new economic mechanics — it surfaces and triggers EXISTING engine functions.

Not unlimited control — actions cost PC/factions/cooldowns; tradeoffs remain.

Next step after C: Phase D — make the characters present.

PHASE D — Inbox + Present Characters (emotional presence)

Why fourth: The Godfather at "4" should FEEL like a person you're at war with, not a meter. The inbox is the vehicle that makes characters speak. Connective tissue for the whole emotional layer.

What it is:

An INBOX receiving messages as the game proceeds:

The Godfather (Fashemu) — congratulates, threatens, goes cold, sends a chilling note after you cross him. His relationship score becomes a VOICE.

Chief of Staff — morning briefings, summaries of what's developing.

Commissioners — requests, warnings, performance notes.

NPCs (NEO, Dayo, SMJ) — they already exist in the engine; give them a message channel.

AI-GENERATED CHARACTER PORTRAITS — consistent per character (AI does this well, unlike the map). A face next to a voice makes the relationship real.

Some inbox messages are just flavor/presence; some carry decisions (becoming event cards).

How to build it:

Inbox.tsx + a message model { from (character), week, text, optional linkedEventId }.

Hook into existing systems: Godfather phase transitions, NPC pressure/activation, commissioner state already produce events — route their "voice" into inbox messages.

Generate one portrait per recurring character (offline, bake as static asset).

State-aware message text (same templating as Phase B).

How to verify it's done:

[ ] Characters send messages that reflect the real relationship state (Godfather at war sounds different from Godfather appeased).

[ ] Each recurring character has a consistent portrait.

[ ] Inbox messages sometimes carry decisions; sometimes just presence.

[ ] Playtest: do you now CARE about / fear specific characters?

What it is NOT:

Not a new dialogue/quest engine — it's a presentation channel over existing character state.

Not busywork mail — every message reflects real state or carries a real decision.

Next step after D: Phase E — add the long arc of hope.

PHASE E — Research / Future-Investment Tree (the long arc)

Why fifth: Everything currently resolves in weeks. Research adds YEARS-long consequence — hope and patience as mechanics. Pointedly Lagos: investing in the future against a culture that doesn't reward it is a real, specific tension.

What it is:

Commission research / future investments that pay off later (CIV-style, but governance-themed):

Fund a tech hub → births a startup → employs people + pays tax in 2–3 years

Commission urban planning research → unlocks better/cheaper future projects

Invest in education → youth tension / employment improvements down the line

Each has an upfront cost, a long timer, and a delayed payoff — rewarding the patient player and the one playing toward a long-term GOAL (ties back to Phase A).

How to build it:

research.ts — items = { id, cost, weeksToComplete, payoff (delta/unlock), pushback }.

A research panel to commission them; they run on the existing initiative/timer system (already proven by initiatives in the audit).

Payoffs fire via the existing delayed-consequence / completion machinery.

How to verify it's done:

[ ] Player can commission a long-term investment with a clear future payoff.

[ ] Payoffs actually fire years later via existing timers.

[ ] At least one path (startup → tax/jobs) demonstrably alters the late game.

[ ] Playtest: does the early game now hold a sense of building toward something?

What it is NOT:

Not a tech tree for its own sake — each item is a governance investment with a real payoff.

Not new timer mechanics — reuses the initiative/delayed-consequence system.

Next step after E: Phase F — make it a place you live.

PHASE F — Revisit the Map as INHABITANCE (last, reframed)

Why last & reframed: The map's true job was never accuracy — it was to be the place you INHABIT (Frostpunk model), which is why the abstract/broken versions never satisfied. Return to it only when the game is worth inhabiting, and approach it as "the room you govern from," not "an accurate map." By then you'll also know (from real players) whether it's even needed.

What it is (when you get here):

The shelved code map, brought back as the ambient backdrop you govern from — indicators float around it (Frostpunk style), the inbox and panels overlay it.

Possibly a simpler, more stylized "control room" view rather than a literal city.

Decide WITH PLAYER FEEDBACK whether literal-Lagos recognizability is worth an illustrator, or whether the stylized night-city is enough as a backdrop.

How to verify / NOT: Deferred — re-spec when the game reaches this phase. Do not pre-build.

3. The discipline rules (so we don't spiral again)

One phase at a time. Do not start a phase until the previous is verified done AND committed to git. (The map work was lost once for lack of a commit — never again.)

Commit at every working state. Every green playtest = a commit.

Verify by PLAYING, not by tests passing. Tests passing ≠ feature working (the empty-map lesson). Each phase's real test is a playtest question about FEELING.

No runtime LLM. Templating + offline-baked prose only.

Surface, don't invent. Most of this vision is presentation over the EXISTING engine. Resist adding new simulation unless a phase truly requires it.

The map stays shelved until Phase F. Do not get pulled back into it.

4. Definition of "satisfied"

The game is where it wants to be when: the player CHOOSES a goal and plays toward it purposefully (A), FEELS their choices land (B), GOVERNS proactively instead of only reacting (C), CARES about/fears specific characters (D), and builds toward a long-term future (E). The map (F) returns only if/when the inhabited-world payoff justifies it.

v1.0 — captured so the vision survives. Build A first. Commit everything. Verify by playing. The engine is real; this roadmap makes it FELT.

EXPANSION (captured from design session) — Goals, Research & Realism

Status: DOCUMENTED FUTURE DESIGN. Not for immediate build. This expands Phase A (Goals) and Phase E (Research), and adds a cross-cutting realism principle. Captured so the ideas are not lost. Build only when the relevant phase is reached, one piece at a time, per the discipline rules.

Guiding principle for this whole strand: DRAW FROM LIVED REALITY

The designer lives in Lagos and knows these systems firsthand (worked at a real tech hub; experiences the power crisis directly — days/weeks without grid electricity). The parts of this game that ring true will be the ones drawn from lived experience, not research. Two consequences:

The innovation/research strand should feel HARD-WON and UNCERTAIN, not triumphant. The gap between the promise of Lagos (e.g. the Yaba tech-hub dream) and the reality (stalled, power-starved, talent-drained) IS the honest story. Investing in the future is stubborn hope against conditions that resist it. Innovation goal framing: "Make the Promise Real" — closing the gap between what Lagos could be and what it is — not "Build Silicon Valley."

The power/NEPA mechanic should carry real weight — it's not a statistic, it's daily life.

A+ — EXPANDED GOALS LIST

Goals give the player a reason to play purposefully (Phase A spine). Each goal = target conditions (read existing stats) + visible progress + KNOWN pushbacks (who resists) + ideally a place/identity anchor. Place-specific beats abstract — it teaches Lagos and creates attachment.

Entertainment / Creative Capital — "Build the Creative Capital"

Nollywood (2nd-largest film industry by output), Afrobeats global export, a film city, music infrastructure, event/tourism economy.

Tensions: wants light regulation + security; attracts godfather contract pressure; informal economy around events (vendors, area boys); piracy/IP.

The most obviously-Lagos goal. Writes its own event cards.

Place-specific industrial (replaces the too-broad "Industrialize the Mainland")

"Revive Apapa" — the port + perpetual gridlock + decay. Famously hard, specific. (Ties to federal tension: you don't control the port — see realism section.)

"The Ikeja Corridor" — real industrial/tech spine: Computer Village, airport, manufacturing belt. (Tech-hub revival lives here — "Make the Promise Real".)

"Reclaim the Waterfront" — Makoko, lagoon economy, fishing, informal settlements.

Transport — touches everyone; modernization vs the informal economy millions depend on

"Move the City" — BRT expansion, rail lines, ferry network.

"Tame the Danfo" — formalize informal transport; directly antagonizes agberos/NURTW (existing engine tension).

"Cross the Water" — bridges + ferries; ease the island-mainland chokepoint.

Power — "Lights On"

Independent power, DisCo politics, the generator economy. Maybe the most-felt daily struggle.

Ties to federal tension: grid generation is federal — the goal becomes about working AROUND the constraint (independent power plants; see shifting-frontier note).

Security — "The Safe City" — policing reform, post-#EndSARS youth relationship. Charged. (Federal tension: you fund/equip but can't command the police — IGP is Abuja's.)

Climate — "Climate-Proof Lagos" — flooding, drainage, coastal erosion (existential), Eko Atlantic's contested role. Long-horizon, genuinely urgent.

Agriculture — "Feed Lagos" — novel BECAUSE Lagos isn't agricultural. Aquaculture (the lagoon!), urban/vertical farming, Epe/Badagry rural fringe, reduce food-import dependence. Against-the-grain = interesting, not a poor fit.

Education — "Educate a Generation" — schools, LASU, technical/vocational education, the youth-unemployment time bomb.

Health — "The Healthy City" — health infra, cholera-in-Makoko, pandemic readiness.

Fiscal sovereignty — "Self-Sufficient Lagos" — eliminate deficit, clear debt, IGR self-sufficiency, framed as independence from Abuja/FAAC. Direct political edge; ties to the realism section (the goal IS expanding the federal cage).

(More goals to be added as they surface. Goals can reinforce research: e.g. Creative Capital makes entertainment investments stronger; Feed Lagos unlocks the agriculture branch.)

E+ — RESEARCH REFRAMED AS "COMMISSIONING THE FUTURE"

The anti-staleness fix: NOT "invest → wait → startup" (a vending machine). Instead, diverse investment DOMAINS, each a real government lever, each a BET with a RANGE of outcomes and a delayed reveal, and outcomes that CHANGE THE POLITICAL LANDSCAPE (not just stats).

Why uncertain outcomes = alive: You fund the tech hub. Maybe it births 3 startups; maybe it's captured by a godfather's nephew and produces nothing; maybe it succeeds AND creates a powerful new constituency you must now manage. Uncertainty + delayed reveal + landscape change = a living system. This also encodes the "Make the Promise Real" honesty — the future is hard to build and investments can stall like the real Yaba.

Investment domains (diverse, realistic):

Knowledge/innovation — tech hubs (revive the stalled promise), university research partnerships, innovation grants → startups, IT tax base, jobs (uncertain; can stall).

Agriculture — aquaculture, urban/vertical farming, rural-fringe development → food security, jobs. Novel because against-the-grain.

Industrial — special economic zones, free trade zone, manufacturing incentives.

Human capital — vocational training, creative-industry pipeline, healthcare workforce.

Climate/infrastructure R&D — drainage engineering, coastal defense, renewable power pilots. (Designer-flagged favourite.)

Mechanics: each item = upfront cost + long timer + RANGE of possible payoffs (good/partial/ captured/stalled) revealed later + possible new constituency/pushback. Runs on the existing initiative/delayed-consequence timer system (already proven). Ties to goals (a goal can make a domain cheaper/stronger or unlock it).

REALISM PRINCIPLE (cross-cutting) — THE FEDERAL-STATE CONSTRAINT

The single most distinctive realism lever, and what makes a LAGOS governance sim fundamentally unlike SimCity/Frostpunk: a Nigerian governor does NOT have full sovereignty. Surface it through FRICTION, never EXPOSITION. No lectures. The player learns the shape of the cage by pushing against its bars — and, crucially, by sometimes EXPANDING it.

The constraint (felt, not explained):

Reform policing → you can fund/equip, but can't command; the IGP is Abuja's.

Fix the expressway → it's federal (FERMA); you can lobby, not build.

Defy the party → FAAC gets quietly cut; you feel the squeeze.

Act on the port → Apapa chokes your city but you don't control it; you can only beg.

Power → generation is federal; "Lights On" becomes about independent power + DisCo politics BECAUSE the grid isn't yours.

The KEY INSIGHT — the cage is a SHIFTING FRONTIER, not a fixed wall: Some constraints lift over time, through national change, or through YOUR effort — and that movement is itself gameplay and hope:

State police gets approved → a new power opens up.

You're allowed to build power plants → "if you have excess, sell to the national grid."

Fiscal autonomy clawed back → the "Self-Sufficient Lagos" goal IS expanding the cage. These can pop up as events ("oh, you can do this now") triggered by your actions or national developments. Converts "learn the cage" into "work to expand the cage" — active and hopeful.

Idealistic powers with REAL surfaced tradeoffs (try idealism, feel the cost):

LGA/LCDA creation — the game lets you "create LGAs as you wish" (real Lagos issue: 37 LCDAs, federal non-recognition fight). Pros: local responsiveness, more citizen access points. Cons: salary burden on an already-bleeding budget, more positions for godfathers to fill, federal non-recognition complications. Player tries the idealistic move, FEELS the tradeoff — no lecture. This is the design philosophy in miniature: fun, not preachy, teaches how it actually works, lets you try idealism.

Where it connects: gives the federalRelationship stat real teeth; makes fiscal-sovereignty goal meaningful; natural inbox voice (curt federal minister, "allocation under review", a summons → federal govt becomes a present looming character, not a meter).

Design tone (designer's explicit want): felt constraint, not preachy. Not "what I imagine to be the good." If it teaches how things actually work, is FUN, and lets you try idealism — that's the win. Surfaced everywhere through friction; preached nowhere.

TRADITIONAL LEADERS — a LIGHT FORCE (not a full faction)

Obas / white-cap chiefs are real Lagos power but — per the designer's real-life read — not so central as to warrant a full seventh faction dial touching all 242 cards. Implement as a LIGHTER force surfaced through specific moments:

Land — every Lagos development touches traditional land claims (disputes, allocations).

Legitimacy — an Oba's public backing moves trust in ways money can't (an "oba endorsement" card already exists in the engine — a toehold).

Tradition vs modernization — your transport/industrial goal bulldozes something a community holds sacred.

Surfaced via land events, certain goals, and the inbox — not a stat that every choice moves.

Option to promote to fuller presence LATER if it proves central. Start light.

DISCIPLINE REMINDER FOR THIS EXPANSION

All of the above is DOCUMENTED FUTURE DESIGN. Do NOT build it now. It expands Phase A and Phase E and threads the realism principle through later phases. Build order and the discipline rules from the main roadmap still hold: one phase at a time, commit every working state, verify by PLAYING, surface don't invent, no runtime LLM. These ideas are captured here so they survive — that is their only job for now.

DEFERRED ENHANCEMENTS (named so they come back, not lost)

Phase A+ — Mid-game goal failure / abandonment (DEFERRED from Phase A)

Phase A ships with succeed-or-not-at-term-end only. Mid-game failure is explicitly deferred, NOT dropped. Reasons it's deferred (and why that's correct, not just easier):

The RIGHT design for mid-game failure can't be known until we watch players play TOWARD goals. Does a failed goal feel like fair consequence or a rug-pull? Should a failing goal be abandonable and swappable, or is that cheating? Those answers come from playtest data we don't have yet. Building it now would be guessing; building it after is informed. Open questions to resolve when we return:

Can a goal be abandoned/swapped mid-term, or are you locked in?

What constitutes mid-game failure (a target collapses irreversibly? a hard floor breached?)

Does failure end the run, or just forfeit the goal's legacy reward? Revisit AFTER Phase A has been played enough to answer these from real experience.

More goals (DEFERRED from Phase A)

Phase A ships 3 fully-realized goals (Break the Machine, Make the Promise Real, Lights On). The full expanded list (Creative Capital, Revive Apapa, Ikeja Corridor, transport goals, Safe City, Climate-Proof Lagos, Feed Lagos, education, health, fiscal sovereignty, etc. — see the A+ EXPANDED GOALS LIST above) is deferred until the 3-goal framework is proven by play. Quality over volume: prove the system, then expand. Come back and add them.

PHASE E — UPDATED DESIGN (supersedes the original Phase E sketch above)

Phase E evolved significantly in design. The original "fund hub → startup → tax" was a vending machine. The agreed design (see PHASE_E_RESEARCH_TREE.md for the full build spec):

A branching node-graph research tree — "Commission the Future" — NOT an event card and NOT a guaranteed-payoff initiative. A NEW interaction model (justified: the reactive event-card framing can't deliver proactive, owned, long-arc commissioning), reusing the proven timer/delayed-consequence math underneath.

Reliable steps, uncertain destination: individual nodes complete reliably with small effects; uncertainty (success/partial/stalled/captured/complication) lives at the PAYOFF level, state-influenced (governance tilts odds, never guarantees).

Data-driven, auto-laid-out graph: nodes declare domain + prerequisites; layout is COMPUTED and lines auto-drawn. Adding a node = adding data. This is the anti-balloon guarantee — the small build grows to the full vision with no re-architecture.

Full schema now, vertical slice of content: 3 domains (Security/forensics, Agriculture/aquaculture-Feed-Lagos, Innovation/revive-the-hub) × ~4 nodes ≈ 12, exercising all prereq types (node/state/cost) + at least one cross-domain link + one full path to an uncertain payoff.

Framing mixed per-node: some "adapt known science to Lagos" (forensics, aquaculture), some genuine innovation (the hub). Not universally one or the other.

Honesty: an innovation stall should echo the real Yaba disappointment — the promise often isn't kept, and that tension IS the mechanic.

DEFERRED from Phase E (named so they return):

More domains — Administration/civil-service, Climate, and others. Schema already supports them; adding is data, not architecture. Expand after the 12-node slice is proven by play.

More nodes / branching depth — expand paths and add branches into the existing tree.

National-scope payoffs (moonshots) — the schema has a scope field; first build is state-scoped only. Nation-making payoffs (the half-joked "fusion") are reserved for the FUTURE COUNTRY-EXPANSION (the long-stated plan to expand beyond Lagos to all of Nigeria). Out of scope until then — they'd break the state-governor frame otherwise.

A NOTE ON THE DISCIPLINE (corrected during the session):

"Surface, don't invent" was relaxed from an absolute to a high-bar default. New mechanics ARE allowed when they clear three tests: (1) existing systems genuinely can't deliver the FEELING (framing/experience counts, not just machinery), (2) worth the build + integration/balance cost, (3) serves the felt experience. Phase E's tree cleared all three — the reactive event-card model structurally can't produce proactive long-arc hope. The designer has earned more latitude to invent as the project matured and demonstrated restraint (shelving the map, scoping carefully). The guardrail remains: name what feeling a new mechanic delivers that existing systems can't, and weigh integration cost, before building.

GOALS BACKLOG — TIERED BY BUILDABILITY + PAIRED WITH RESEARCH

This turns the flat A+ goals list into a sequenced, dependency-aware plan. The KEY insight: goals are coupled to research domains — a goal targets a stat; the matching research domain is what MOVES that stat. Build a goal and its paired research as ONE vertical strand. And not all goals are equal: some read existing stats (cheap), some need a clean mapping, some need a NEW stat/system (a real commitment, often = the paired research domain). Scope each strand when you reach it; this note makes the cost of each honest in advance.

TIER 1 — buildable NOW on existing stats (no engine changes)

Add these straight into the Phase A goal framework once it's proven. They read stats that exist.

"Self-Sufficient Lagos" (fiscal sovereignty) — cashReserve, debtStock, igr, expenditure, deficit. All exist. (Pairs loosely with Administration research later, not required.)

"The Safe City" — securityIndex, youthTension, publicTrust. All exist. PAIRS WITH the Security/forensics research domain already in the Phase E slice — build them as a strand.

"Build the Creative Capital" — IF mapped to businessCommunity + publicTrust + igr + a creative-anchor constituency (NOT a literal "entertainment sector" stat). Clean mapping = Tier 1. Confirm the mapping when scoping; don't invent an entertainment stat for v1.

TIER 2 — buildable with a deliberate mapping you must design

Each needs a design decision about what existing stat REPRESENTS the goal's target. Doable, no new core system, but not a one-liner — scope the mapping when you build it.

"Revive Apapa" / "The Ikeja Corridor" / "Reclaim the Waterfront" — place-specific. Need a notion of per-place economic health. Toehold: constituencyApproval gives per-place sentiment, but probably not economic dimension. Decide: does "thriving Apapa" map to its constituency approval + infra + igr contribution, or do you add a light per-place economic measure? (If the latter, it tips toward Tier 3.)

"Tame the Danfo" — maps onto the informalEconomy faction tension (exists) + transport infra. Needs the tradeoff (formalize vs the millions who depend on danfos) designed explicitly.

"Move the City" / "Cross the Water" — transport goals; map to infrastructureScore + specific project completions. Need a transport dimension or a creative infra mapping.

TIER 3 — imply a NEW stat/system (a real commitment) — and these PAIR WITH research

These target dimensions the engine doesn't currently measure. Building the goal means building the measure — which is usually the SAME work as the paired research domain. Design goal + research TOGETHER as one strand. New-stat commitment is allowed (per the corrected discipline) when justified — but name it as the bigger build it is.

"Feed Lagos" ↔ Agriculture research domain (already in Phase E slice). The agriculture research IS what moves food-security. Build the strand: agriculture research nodes + a food-security measure + the Feed Lagos goal that targets it. Natural first Tier-3 strand since the research half is already slated.

"Climate-Proof Lagos" ↔ Climate research domain (Phase E expansion). Needs flood/ resilience state (engine has flood EVENTS, not a resilience STAT). Build climate research + resilience measure + the goal together.

"Educate a Generation" ↔ a Human-Capital/education research strand. Needs an education measure. Couple them.

"The Healthy City" ↔ a health-infrastructure strand. Needs a health measure. Couple them.

"Lights On" (power) — NOTE: it's in the Phase A STARTER three, currently mapped to infra + trust + cash (Tier 1 mapping). A richer version would add a dedicated power/grid measure and pair with a power-infrastructure research strand + the federal "can you generate?" frontier. Starter version is Tier 1; the deep version is Tier 3. Don't over-build the starter.

THE STRAND PRINCIPLE (how to sequence goals + research together)

Don't build "all goals" then "all research." Build VERTICAL STRANDS: a goal + its paired research domain + any new measure they share, as one coherent slice of game. Order strands by player value and by how much new machinery they need (Tier 1 goals first — they need none). Examples of strands:

Safe City (goal, Tier 1) + Security/forensics research (Phase E slice) — LOW cost, high synergy, build early (both already partly slated).

Feed Lagos (goal) + Agriculture research (Phase E slice) + food-security measure — first Tier-3 strand, since its research half is already in the E slice.

Each later strand (climate, education, health) scoped when reached.

STILL TO SCOPE (per designer — this is the logical next step after Phase E ships)

When the Phase A framework + Phase E tree are proven by play, the next scoping job is the FIRST goal-expansion strand. Recommended first strand to scope: either the cheap Tier-1 additions (Self-Sufficient Lagos, The Safe City, Creative Capital) as a quick batch, OR the Feed Lagos + Agriculture vertical strand as the first goal↔research integration. Decide based on what play reveals is missing. Write the strand instruction then, the same way each phase was scoped.