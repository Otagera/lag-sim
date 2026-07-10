import type { ResearchNode } from '../state/types'

export const RESEARCH_TREE: ResearchNode[] = [
  // ── SECURITY (forensics path) ─────────────────────────────
  {
    id: 'forensics-lab',
    domain: 'security',
    title: 'Forensics Lab',
    pitch:
      'A modern forensics laboratory that processes evidence in days instead of months. The police still work from handwritten ledgers — digitise the chain of custody and watch conviction rates rise.',
    framing: 'localImplementation',
    cost: 8,
    weeksToComplete: 8,
    prerequisites: [],
    stepEffect: { securityIndex: 3 },
  },
  {
    id: 'digital-forensics',
    domain: 'security',
    title: 'Digital Forensics',
    pitch:
      'A dedicated digital forensics unit within the lab — cyber evidence, mobile device analysis, financial trail tracing. The Lagos State DNA & Forensic Centre already exists; expand its mandate into the digital domain where modern crime lives.',
    framing: 'localImplementation',
    cost: 10,
    weeksToComplete: 10,
    prerequisites: [{ type: 'node', nodeId: 'forensics-lab', label: 'Forensics Lab' }],
    stepEffect: { securityIndex: 3, corruptionPressure: -1 },
  },
  {
    id: 'evidence-database',
    domain: 'security',
    title: 'Evidence Database',
    pitch:
      'A centralised digital evidence database linking every divisional station to the state prosecutor. Cases that currently rot in filing cabinets become trackable, triageable, prosecutable.',
    framing: 'localImplementation',
    cost: 12,
    weeksToComplete: 10,
    prerequisites: [{ type: 'node', nodeId: 'digital-forensics', label: 'Digital Forensics' }],
    stepEffect: { securityIndex: 2, corruptionPressure: -1 },
  },
  {
    id: 'cctv-network',
    domain: 'security',
    title: 'CCTV Network',
    pitch:
      'A citywide CCTV network covering major intersections, markets, and transport hubs. Lagos has 20 million people and roughly 2,000 working cameras — this aims for 20,000. Infrastructure must support the grid.',
    framing: 'localImplementation',
    cost: 20,
    weeksToComplete: 14,
    prerequisites: [
      { type: 'node', nodeId: 'evidence-database', label: 'Evidence Database' },
      {
        type: 'state',
        predicate: (s) => s.stats.infrastructureScore > 55,
        label: 'Infrastructure > 55',
      },
    ],
    stepEffect: { securityIndex: 5 },
  },
  {
    id: 'conviction-reform',
    domain: 'security',
    title: 'Conviction Reform',
    pitch:
      'A complete overhaul of the prosecution pipeline — special courts for expedited hearings, witness protection, and mandatory sentencing guidelines. The payoff is a Lagos where crime has consequences. Or where the system gets captured.',
    framing: 'localImplementation',
    cost: 15,
    weeksToComplete: 16,
    prerequisites: [{ type: 'node', nodeId: 'evidence-database', label: 'Evidence Database' }],
    outcomes: [
      {
        kind: 'success',
        weight: 35,
        weightModifier: (s) => (s.stats.corruptionPressure < 35 ? 1.4 : 1),
        payoff: { securityIndex: 12, publicTrust: 8 },
        factionImpact: { businessCommunity: 5, civilSocietyMedia: 8, informalEconomy: -3 },
        resultText:
          'The first special court clears its docket in six weeks flat. The market traders in Mushin — your toughest critics — notice they can open late without paying "protection." Trust is tentative. But it is trust. For the first time in a decade, Lagosians believe the state might actually be on their side.',
        scope: 'state',
      },
      {
        kind: 'partial',
        weight: 30,
        payoff: { securityIndex: 5 },
        factionImpact: { civilSocietyMedia: 3 },
        resultText:
          'The courts process cases faster. But the backlog is deep — three years of adjournments, missing files, intimidated witnesses. Progress, yes. Justice? Still a rumour. The system moved; it did not transform.',
        scope: 'state',
      },
      {
        kind: 'captured',
        weight: 25,
        weightModifier: (s) => (s.stats.corruptionPressure > 55 ? 1.8 : 1),
        payoff: { securityIndex: 2, corruptionPressure: 5 },
        factionImpact: { partyGodfathers: 6, civilSocietyMedia: -5, businessCommunity: -3 },
        resultText:
          'The special courts are open for business — and everyone means that literally. The godfathers got there first. Bail is for sale. Witnesses disappear. The new system is the old system with better lighting. You built a machine. They own it now.',
        scope: 'state',
      },
      {
        kind: 'stalled',
        weight: 10,
        payoff: {},
        resultText:
          'The judiciary pushes back. The magistrates call it executive overreach. The bill sits in a committee. The reform is not dead — it is waiting. Waiting for a governor with more capital, a legislature less hostile, a moment that may never come.',
        scope: 'state',
      },
    ],
  },

  // ── AGRICULTURE (aquaculture / Feed Lagos) ───────────────
  {
    id: 'aquaculture-pilot',
    domain: 'agriculture',
    title: 'Aquaculture Pilot',
    pitch:
      'A pilot fish farming programme in Epe, tapping the lagoon economy that already sustains thousands of informal workers. Formalise it, fund it, and turn a survival fishery into a productive asset.',
    framing: 'localImplementation',
    cost: 6,
    weeksToComplete: 6,
    prerequisites: [],
    stepEffect: { igr: 0.5 },
  },
  {
    id: 'cold-chain',
    domain: 'agriculture',
    title: 'Cold Chain',
    pitch:
      'Refrigeration and logistics from farm to market. Lagos loses 40% of its perishable food to spoilage. A cold chain saves the yield, stabilises prices, and makes the aquaculture investment actually matter.',
    framing: 'localImplementation',
    cost: 15,
    weeksToComplete: 10,
    prerequisites: [{ type: 'node', nodeId: 'aquaculture-pilot', label: 'Aquaculture Pilot' }],
    stepEffect: { igr: 0.8, infrastructureScore: 3 },
  },
  {
    id: 'food-security',
    domain: 'agriculture',
    title: 'Food Security',
    pitch:
      'A Lagos food security programme — cold storage, urban distribution, price stabilisation. It needs the CCTV network to secure the supply chain from dock to market. If it works, the city eats. If it stalls, the fish rot and the young stay angry.',
    framing: 'localImplementation',
    cost: 12,
    weeksToComplete: 14,
    prerequisites: [
      { type: 'node', nodeId: 'cold-chain', label: 'Cold Chain' },
      { type: 'node', nodeId: 'cctv-network', label: 'CCTV Network' },
    ],
    outcomes: [
      {
        kind: 'success',
        weight: 35,
        weightModifier: (s) => {
          let mod = 1
          if (s.selectedGoalId === 'make-the-promise-real') mod *= 1.25
          if (s.stats.corruptionPressure < 35) mod *= 1.2
          return mod
        },
        payoff: { igr: 1.5, youthTension: -8 },
        factionImpact: { informalEconomy: 6, businessCommunity: 4 },
        resultText:
          'The fish from Epe reaches Mile 12 market cold, fresh, and affordable. The price of protein drops for the first time in eighteen months. Youth groups in Bariga call it a win — not because they love you, but because their mothers can cook. Food security is not a slogan. It is a full stomach.',
        scope: 'state',
      },
      {
        kind: 'partial',
        weight: 30,
        payoff: { igr: 0.6, youthTension: -3 },
        factionImpact: { informalEconomy: 3 },
        resultText:
          'The cold chain works in patches. Some wards get fresh fish. Others get the same old supply. The gap between who benefits and who does not is visible — and in Lagos, visible is political. Partial progress, partial credit, partial trust.',
        scope: 'state',
      },
      {
        kind: 'stalled',
        weight: 25,
        weightModifier: (s) => (s.stats.cashReserve < 0 ? 1.8 : 1),
        payoff: {},
        resultText:
          'The cold storage units are built. The generators do not run. The fish rots at the dock. The informal traders who trusted you with their catch are left with debt and spoilage. They will not trust the next promise. Why should they?',
        scope: 'state',
      },
      {
        kind: 'captured',
        weight: 10,
        weightModifier: (s) => (s.stats.corruptionPressure > 55 ? 1.5 : 1),
        payoff: { igr: 0.3, corruptionPressure: 3 },
        factionImpact: { partyGodfathers: 4, informalEconomy: -3 },
        resultText:
          'The cold chain is operational. The godfathers control the distribution. The fish goes to their markets, at their prices. Food security became political patronage. The city eats — but the machine feeds.',
        scope: 'state',
      },
    ],
  },

  // ── INNOVATION (revive the hub) ───────────────────────────
  {
    id: 'revive-the-hub',
    domain: 'innovation',
    title: 'Revive the Hub',
    pitch:
      "Yaba was once Lagos's answer to Silicon Valley — before the power went out, before the rent tripled, before the talent fled. This is not about building something new. It is about fixing what we broke. Infrastructure first. Hope second.",
    framing: 'innovation',
    cost: 10,
    weeksToComplete: 8,
    prerequisites: [
      {
        type: 'state',
        predicate: (s) => s.stats.infrastructureScore > 50,
        label: 'Infrastructure > 50',
      },
    ],
    stepEffect: { igr: 0.3 },
  },
  {
    id: 'lasric-grants',
    domain: 'innovation',
    title: 'LASRIC Grants',
    pitch:
      'The Lagos State Science, Research and Innovation Council already funds research — N900m granted to 155 researchers and startups. Scale it. Target applied research that solves Lagos problems: waste-to-energy, traffic AI, urban agritech. A bet on local ideas.',
    framing: 'innovation',
    cost: 6,
    weeksToComplete: 8,
    prerequisites: [{ type: 'node', nodeId: 'revive-the-hub', label: 'Revive the Hub' }],
    stepEffect: { igr: 0.4, youthTension: -2 },
  },
  {
    id: 'startup-incubator',
    domain: 'innovation',
    title: 'Startup Incubator',
    pitch:
      'A government-backed incubator in Yaba — co-working, power, fibre, mentorship. The private sector wants to believe. Give them a reason. The last time Lagos tried this, the lights went out and the talent left. This time the infrastructure actually holds.',
    framing: 'innovation',
    cost: 8,
    weeksToComplete: 10,
    prerequisites: [{ type: 'node', nodeId: 'lasric-grants', label: 'LASRIC Grants' }],
    stepEffect: { igr: 0.5, youthTension: -2 },
  },
  {
    id: 'digital-skills',
    domain: 'innovation',
    title: 'Digital Skills Pipeline',
    pitch:
      'A state-run digital skills programme targeting 10,000 young Lagosians — software engineering, data analytics, cybersecurity. Not another coding crash course; a proper pipeline from training to placement in the growing tech ecosystem the incubator is building.',
    framing: 'innovation',
    cost: 8,
    weeksToComplete: 10,
    prerequisites: [{ type: 'node', nodeId: 'startup-incubator', label: 'Startup Incubator' }],
    stepEffect: { youthTension: -5, igr: 0.3 },
  },
  {
    id: 'it-tax-base',
    domain: 'innovation',
    title: 'IT Tax Base',
    pitch:
      "Formalise Lagos's tech sector into the tax net. The developers, fintechs, and freelancers already generate value — they just do not pay into the state. Register them. Support them. Collect. The dream: a self-funding innovation economy. The risk: they leave, or the system eats them.",
    framing: 'innovation',
    cost: 10,
    weeksToComplete: 16,
    prerequisites: [{ type: 'node', nodeId: 'digital-skills', label: 'Digital Skills Pipeline' }],
    outcomes: [
      {
        kind: 'success',
        weight: 30,
        weightModifier: (s) => {
          let mod = 1
          if (s.selectedGoalId === 'make-the-promise-real') mod *= 1.25
          if (s.stats.infrastructureScore > 65) mod *= 1.3
          return mod
        },
        payoff: { igr: 1.8, youthTension: -10 },
        factionImpact: { businessCommunity: 6, informalEconomy: -2 },
        resultText:
          'The fintechs register. The freelancers file. For the first time, Lagos collects meaningful tax from its digital economy — and puts it back into the grid that makes it possible. The Yaba dream, dusty and wounded and laughed at for a decade, breathes again. It is not 2014. But it is something. Something real.',
        scope: 'state',
      },
      {
        kind: 'partial',
        weight: 35,
        payoff: { igr: 0.6, youthTension: -3 },
        factionImpact: { businessCommunity: 2 },
        resultText:
          'Some startups register. Most do not. The informal sector — the real engine of Lagos — stays informal by choice. Tax morale is a generation away. The programme covers its costs but does not transform the budget. A step. Not a leap.',
        scope: 'state',
      },
      {
        kind: 'stalled',
        weight: 20,
        weightModifier: (s) =>
          s.stats.cashReserve < 0 ? 1.6 : s.stats.infrastructureScore < 50 ? 1.4 : 1,
        payoff: {},
        resultText:
          'The talent left. Not all of them — some stayed because Lagos is home. But the ones with options, the ones who could build anywhere, chose somewhere with reliable power and a government that answers emails. The incubator is half-empty. The promise is not dead. It is just... tired. This is the Yaba disappointment, rendered in real time.',
        scope: 'state',
      },
      {
        kind: 'captured',
        weight: 15,
        weightModifier: (s) => (s.stats.corruptionPressure > 55 ? 1.6 : 1),
        payoff: { igr: 0.2, corruptionPressure: 3 },
        factionImpact: { partyGodfathers: 5, businessCommunity: -4 },
        resultText:
          'The incubator is running. A "consultant" collects rent from every desk. A "connection fee" opens the right doors. The tech scene — already fragile, already sceptical — watches another government initiative become another godfather revenue stream. The ones who can leave, leave. The others adapt. Lagos adapts to everything, even its own broken promises.',
        scope: 'state',
      },
    ],
  },

  // ── ADMINISTRATION (e-governance) ─────────────────────────
  {
    id: 'e-governance-platform',
    domain: 'administration',
    title: 'E-Governance Platform',
    pitch:
      'A single digital portal for all Lagos State services — business registration, tax filing, permit applications, land title searches. No more queues at the Secretariat. No more "the file is with the director." Transparent, trackable, digital.',
    framing: 'localImplementation',
    cost: 6,
    weeksToComplete: 8,
    prerequisites: [],
    stepEffect: { igr: 0.4, corruptionPressure: -1 },
  },
  {
    id: 'records-digitalization',
    domain: 'administration',
    title: 'Records Digitalization',
    pitch:
      'Digitise every land title, every business registration, every court record currently rotting in basement archives. The e-governance platform is useless without clean data behind it. This is the boring, expensive, essential work that makes everything else possible.',
    framing: 'localImplementation',
    cost: 10,
    weeksToComplete: 12,
    prerequisites: [
      { type: 'node', nodeId: 'e-governance-platform', label: 'E-Governance Platform' },
    ],
    stepEffect: { igr: 0.6, corruptionPressure: -2 },
  },

  // ── CLIMATE (coastal resilience) ──────────────────────────
  {
    id: 'coastal-erosion-model',
    domain: 'climate',
    title: 'Coastal Erosion Model',
    pitch:
      "A satellite-linked coastal erosion monitoring system for Lagos's 180km of coastline. The Atlantic is taking metres every year in some areas. Without data, every seawall is a guess. With data, every naira spent is a naira that might actually hold.",
    framing: 'localImplementation',
    cost: 8,
    weeksToComplete: 10,
    prerequisites: [],
    stepEffect: { infrastructureScore: 1 },
  },
  {
    id: 'drainage-master-plan',
    domain: 'climate',
    title: 'Drainage Master Plan',
    pitch:
      'A comprehensive flood management plan for Lagos — modelled on the coastal erosion data, targeting the worst-hit LGAs. Agege, Alimosho, and Badagry flood every rainy season. Not because the water is unavoidable. Because the drainage is a colonial relic. Build the model. Build the plan. Then build.',
    framing: 'localImplementation',
    cost: 12,
    weeksToComplete: 14,
    prerequisites: [
      { type: 'node', nodeId: 'coastal-erosion-model', label: 'Coastal Erosion Model' },
    ],
    outcomes: [
      {
        kind: 'success',
        weight: 40,
        payoff: { infrastructureScore: 5, publicTrust: 4, youthTension: -4 },
        factionImpact: { informalEconomy: 3, civilSocietyMedia: 4 },
        resultText:
          'The first dry season after the Drainage Master Plan, the canals in Alimosho do not overflow. Market stalls that have flooded every October since anyone can remember stay dry. The traders do not applaud — they just open for business without bailing water. That is the point. A city that works is a city that does not make headlines.',
        scope: 'state',
      },
      {
        kind: 'partial',
        weight: 35,
        payoff: { infrastructureScore: 2, publicTrust: 1 },
        resultText:
          'The plan is sound. The implementation is patchy. Some LGAs get new drainage; others get promises. The rainy season still floods the usual places — just not as badly. Progress is measured in centimetres, not kilometres.',
        scope: 'state',
      },
      {
        kind: 'stalled',
        weight: 15,
        weightModifier: (s) => (s.stats.cashReserve < 0 ? 2 : 1),
        payoff: {},
        resultText:
          'The plan is published. The contracts are awarded. The contractor disappears with the mobilisation fee. The canals remain clogged. The next rainy season, the water rises again — higher than before, because now the city has been promised a fix that did not come. Broken trust drains faster than floodwater.',
        scope: 'state',
      },
      {
        kind: 'captured',
        weight: 10,
        weightModifier: (s) => (s.stats.corruptionPressure > 55 ? 1.5 : 1),
        payoff: { infrastructureScore: 1, corruptionPressure: 2 },
        factionImpact: { partyGodfathers: 3, civilSocietyMedia: -2 },
        resultText:
          'The drainage contracts went to the usual firms. The canals are dug — shallow, narrow, cheap. They will silt up in a year. But the godfathers made their margin. The water will find its level. In Lagos, it always does.',
        scope: 'state',
      },
    ],
  },

  // ── ADMINISTRATION (fiscal autonomy) ───────────────────────
  {
    id: 'etax-ussd-portal',
    domain: 'administration',
    title: 'LIRS e-Tax USSD Portal',
    pitch:
      'A low-tech USSD tax filing portal for Lagosians without smartphones. The informal economy runs on feature phones and cash. Meet them where they are — and bring them into the net.',
    framing: 'localImplementation',
    cost: 4,
    weeksToComplete: 6,
    prerequisites: [
      { type: 'node', nodeId: 'e-governance-platform', label: 'E-Governance Platform' },
    ],
    stepEffect: { igr: 0.6 },
  },
  {
    id: 'border-tax-accords',
    domain: 'administration',
    title: 'Lagos-Ogun Tax Collation Accords',
    pitch:
      'A data-sharing agreement with Ogun State to track residents who work in Lagos but live across the border. Every Akute-to-Ikeja commuter is a revenue leak. Close it. Carefully.',
    framing: 'localImplementation',
    cost: 8,
    weeksToComplete: 12,
    prerequisites: [{ type: 'node', nodeId: 'etax-ussd-portal', label: 'LIRS e-Tax USSD Portal' }],
    stepEffect: { igr: 1.0, federalRelationship: 3 },
  },

  // ── INNOVATION (creative economy + tech) ──────────────────
  {
    id: 'entertainment-district',
    domain: 'innovation',
    title: 'Lagos Entertainment District',
    pitch:
      'A designated entertainment zone with 24-hour power, security, and tax holidays for film and music production. Nollywood already runs on generator fuel and grit — give them the grid and watch what they produce.',
    framing: 'innovation',
    cost: 10,
    weeksToComplete: 10,
    prerequisites: [
      {
        type: 'state',
        predicate: (s) => s.stats.infrastructureScore > 50,
        label: 'Infrastructure > 50',
      },
    ],
    stepEffect: { igr: 0.5 },
  },
  {
    id: 'nollywood-tax-credit',
    domain: 'innovation',
    title: 'Nollywood Tax Credit Scheme',
    pitch:
      'A production tax credit for films, music, and fashion content shot and processed in Lagos. The industry already generates billions annually — formalise the financing, capture the credit, and make Lagos the creative capital of Africa by law, not just by reputation.',
    framing: 'innovation',
    cost: 6,
    weeksToComplete: 8,
    prerequisites: [
      { type: 'node', nodeId: 'entertainment-district', label: 'Lagos Entertainment District' },
    ],
    stepEffect: { igr: 0.7 },
  },

  // ── AGRICULTURE (food security + logistics) ───────────────
  {
    id: 'canal-dredging',
    domain: 'agriculture',
    title: 'Epe-Badagry Canal Dredging',
    pitch:
      'Dredge the farm-to-market canals connecting Epe and Badagry to the Lagos lagoon network. Currently impassable for half the year. This is how food gets to market without rotting on the road.',
    framing: 'localImplementation',
    cost: 6,
    weeksToComplete: 8,
    prerequisites: [{ type: 'node', nodeId: 'aquaculture-pilot', label: 'Aquaculture Pilot' }],
    stepEffect: { foodSecurityIndex: 10, igr: 0.3 },
  },
  {
    id: 'livestock-logistics',
    domain: 'agriculture',
    title: 'Sallah Livestock Logistics',
    pitch:
      'A dedicated livestock corridor with holding pens, inspection points, and scheduled movement windows from Kara Market to Lagos abattoirs. No more midnight cattle jams on the Lagos-Ibadan expressway.',
    framing: 'localImplementation',
    cost: 10,
    weeksToComplete: 10,
    prerequisites: [{ type: 'node', nodeId: 'cold-chain', label: 'Cold Chain' }],
    stepEffect: { foodSecurityIndex: 8, publicTrust: 3 },
  },

  // ── CLIMATE (resilience) ─────────────────────────────────
  {
    id: 'drainage-system-156',
    domain: 'climate',
    title: 'System 156 Drainage Upgrade',
    pitch:
      'The notorious System 156 drainage collector that serves Alimosho, Agege, and Ikeja is a colonial-era relic. Desilt, reinforce, and extend it. This one channel affects flood risk for 3 million Lagosians.',
    framing: 'localImplementation',
    cost: 12,
    weeksToComplete: 14,
    prerequisites: [
      { type: 'node', nodeId: 'drainage-master-plan', label: 'Drainage Master Plan' },
    ],
    stepEffect: { floodResilienceScore: 15, infrastructureScore: 2 },
  },
  {
    id: 'wetland-enforcement',
    domain: 'climate',
    title: 'Wetland Classification & Enforcement',
    pitch:
      'Geotechnical mapping of Lagos wetlands, codified into enforceable planning regulations. Every building on a floodplain was approved by someone. Stop approving. The lawsuits will come. The flooding will not.',
    framing: 'localImplementation',
    cost: 8,
    weeksToComplete: 10,
    prerequisites: [
      { type: 'node', nodeId: 'drainage-system-156', label: 'System 156 Drainage Upgrade' },
    ],
    stepEffect: { floodResilienceScore: 10, ghostWorkerRate: -0.02 },
  },
  {
    id: 'flood-resettlement',
    domain: 'climate',
    title: 'Floodplain Resettlement Framework',
    pitch:
      'A structured resettlement programme for communities living in high-risk flood zones. Compensation, alternative housing, livelihood support. Costly. Controversial. Necessary.',
    framing: 'localImplementation',
    cost: 6,
    weeksToComplete: 8,
    prerequisites: [
      {
        type: 'node',
        nodeId: 'wetland-enforcement',
        label: 'Wetland Classification & Enforcement',
      },
    ],
    stepEffect: { floodResilienceScore: 8, publicTrust: 3 },
  },
]
