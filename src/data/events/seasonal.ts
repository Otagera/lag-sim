import type { EventCard } from '../../state/types'
import { isSallahPeriod, isDettyDecember, isEyoFestival, isHarmattan } from '../../utils/calendar'

export const seasonalEvents: EventCard[] = [
  // ── Sallah (Eid-el-Kabir) — Kara Ram Market ─────────────────────────────────
  {
    id: 'sallah-kara-market',
    week: 3,
    title: 'Sallah Rush: Kara Market Gridlock Spills into Lagos',
    body: `Ram sellers and buyers have blocked a lane of the Lagos–Ibadan Expressway at the Kara Cattle Market. Heavy trucks offloading livestock have created a backlog stretching from Berger to Arepo. The market sits on Ogun State land, but the traffic, open defecation on the expressway median, and environmental spillover are Lagos's problem now. Ogun State collects the market taxes; Lagos deploys the emergency services. Your Commissioner of Police is asking for direction.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (s) => isSallahPeriod(s.week),
    isRecurring: true,
    cooldownWeeks: 48,
    choices: [
      {
        id: 'deploy-lastma-border',
        label: 'Deploy LASTMA to the Border — Coordinate with Ogun',
        description: 'Send LASTMA and RRS to clear the Berger corridor. Coordinate with Ogun TRACE. Cash cost, trust gain. LG Chairmen +3 (proxy for Ogun State relationship).',
        immediate: { publicTrust: 3, cashReserve: -0.5 },
        factionImpact: { lgChairmen: 3, civilSocietyMedia: 5 },
        delayed: {
          weekOffset: 2,
          delta: { publicTrust: 2, cashReserve: 0.3 },
          eventText: `The joint LASTMA–RRS deployment at the Lagos–Ogun border cleared the Sallah backlog within 48 hours. No robberies reported along the corridor. Ogun State officially acknowledged the coordination — a rare public courtesy between the two governments. The improved traffic flow along the Berger corridor reduced fuel wastage and improved economic activity.`,
        },
      },
      {
        id: 'blockade-livestock-trucks',
        label: 'Blockade Livestock Trucks at Berger',
        description: 'Stop incoming livestock trucks at the Lagos border. Trust +2 from commuters. Informal Economy -8, Ogun/LG Chairmen -5.',
        immediate: { publicTrust: 2, cashReserve: -0.3 },
        factionImpact: { informalEconomy: -8, lgChairmen: -5 },
        // Ogun State proxy via lgChairmen — in a fuller simulation this would be a separate faction
      },
      {
        id: 'sallah-do-nothing',
        label: 'Leave It to Ogun State',
        description: 'No LASG response. Trust -6. Traffic worsens; delayed youth tension spike.',
        immediate: { publicTrust: -6 },
        factionImpact: {},
        delayed: {
          weekOffset: 2,
          delta: { youthTension: 5, publicTrust: -3 },
          eventText: `The Sallah gridlock persisted for three days. Commuters blamed LASG for inaction. Social media clips of families stranded at Berger for six hours have 400,000 views. Ogun State issued a statement saying they "cannot be responsible for Lagos's traffic management failures."`,
        },
      },
    ],
  },

  // ── Detty December — Yuletide Tourism Boom ───────────────────────────────────
  {
    id: 'detty-december-rush',
    week: 27,
    title: 'Detty December: IJGBs, 50% Ride Surge, and Total Gridlock',
    body: `December is here and so are the IJGBs (I Just Got Back). Hundreds of thousands of diaspora returnees have flooded Victoria Island, Lekki, and Ikoyi. Eko Hotel is selling VIP tables at ₦300,000. Bolt and Uber fares have tripled. Ahmadu Bello Way is a carpark. The tourism boom is projected to inject $71.6M into the state economy — but LASTMA is overwhelmed and wealthy returnees are hiring armed military escorts who park on medians and threaten your traffic officers.`,
    severity: 'high',
    category: 'economy',
    triggerCondition: (s) => isDettyDecember(s.week),
    isRecurring: true,
    cooldownWeeks: 48,
    choices: [
      {
        id: 'night-gang-shift-drones',
        label: 'Deploy Night Gang Shift + Surveillance Drones',
        description: 'LASTMA Night Gang Shift works late hours. Drones monitor black spots. Trust +4, IGR +0.5, Business +6.',
        immediate: { publicTrust: 4, igr: 0.5, cashReserve: -0.5 },
        factionImpact: { businessCommunity: 6, informalEconomy: 5, civilSocietyMedia: 4 },
        setFlags: { dettyDecemberSurge: true },
        delayed: {
          weekOffset: 4,
          delta: { publicTrust: 2, igr: 0.3, cashReserve: 0.5 },
          eventText: `LASTMA's Night Gang Shift and drone deployment were featured on Channels TV and Arise News as a model for African megacity traffic management during festive seasons. Tourism revenue exceeded projections. The drones alone generated 1,200 traffic violation citations.`,
        },
      },
      {
        id: 'strict-event-center-fines',
        label: 'Strict Ban on Roadside Parking — Fine Event Centres',
        description: 'Heavy fines for event centres that cause vehicle spillover. Trust -3, Business -5, IGR +0.3 from fines.',
        immediate: { publicTrust: -3, igr: 0.3 },
        factionImpact: { businessCommunity: -5, informalEconomy: -3, lgChairmen: 4 },
      },
      {
        id: 'tolerate-chaos-max-tourism',
        label: 'Tolerate the Chaos — Maximise Tourism Revenue',
        description: 'Let the economy run. Trust -6 from local commuters, IGR +0.8, Informal Economy +6.',
        immediate: { publicTrust: -6, igr: 0.8 },
        factionImpact: { informalEconomy: 6, businessCommunity: 8, civilSocietyMedia: -5 },
      },
    ],
  },

  // ── Eyo Festival — Customary Law Assertion ───────────────────────────────────
  {
    id: 'eyo-festival-custom',
    week: 2,
    title: 'Eyo Festival: White Masquerades Take Over Lagos Island',
    body: `The Eyo festival is here. Ten thousand white-clad masquerades line the streets of Isale Eko. Under Eyo tradition, no footwear, headgear, smoking, or photography is permitted in the presence of the masquerades. Federal police officers and wealthy visitors who refuse to comply have been struck by the Opambata (sacred palm branch staff). The Lagos Island Traditional Council insists that customary law supersedes civil law during the festival. State security forces are caught between enforcing state law and respecting ancestral tradition.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (s) => isEyoFestival(s.week),
    isRecurring: true,
    cooldownWeeks: 48,
    choices: [
      {
        id: 'sponsor-festival-tourism',
        label: 'Co-Opt as State Tourism Asset — Fund the Festival',
        description: 'State sponsorship and funding. Trust +3, Civil Society +6, IGR +0.2 from tourism. Suspended sanitation restrictions on Eyo day.',
        immediate: { publicTrust: 3, igr: 0.2, cashReserve: -0.3 },
        factionImpact: { civilSocietyMedia: 6, informalEconomy: 4, partyGodfathers: 3 },
        delayed: {
          weekOffset: 3,
          delta: { cashReserve: 0.4, publicTrust: 1 },
          eventText: `The state-sponsored Eyo festival drew international media coverage. Tourism Board estimates ₦400m in economic impact. The Oba of Lagos publicly commended the governor's respect for tradition.`,
        },
      },
      {
        id: 'restrict-closed-arena',
        label: 'Restrict Festival to Closed Cultural Arenas',
        description: 'Limit disruption. Trust -5, Civil Society -10. Delayed protest from traditional council.',
        immediate: { publicTrust: -5 },
        factionImpact: { civilSocietyMedia: -10, lgChairmen: -3 },
        delayed: {
          weekOffset: 4,
          delta: { publicTrust: -3, youthTension: 5 },
          eventText: `The Isale Eko Descendants Union has issued a statement condemning the "confinement" of their ancestral heritage. The Oba of Lagos is said to be "deeply displeased." Traditional leaders are meeting to discuss their response.`,
        },
      },
      {
        id: 'eyo-leave-traditional-council',
        label: 'Leave It to the Traditional Council',
        description: 'No state intervention. Risk of federal vs. customary law confrontation.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 3 },
      },
    ],
  },

  // ── Harmattan Fire Epidemic — Dry Season Market Blazes ──────────────────────
  {
    id: 'harmattan-fire-risk',
    week: 27,
    title: 'Harmattan Winds: Market Fire Risk at Critical Level',
    body: `The dry Harmattan winds have arrived. Dust-laden air from the Sahara has blanketed Lagos. In Balogun, Docemo, and Jankara markets, informal electrical wiring and generator fumes hang in the dry air. The Lagos State Fire and Rescue Service has flagged 14 high-risk markets — all with blocked fire lanes, unauthorised wooden extensions, and no municipal hydrants within 500 metres. Market unions are resisting any structural clearances that would displace their kiosks.`,
    severity: 'high',
    category: 'crisis',
    triggerCondition: (s) => isHarmattan(s.week) && Math.random() < 0.4,
    isRecurring: true,
    cooldownWeeks: 12,
    choices: [
      {
        id: 'fire-hydrants-clearances',
        label: 'Install Hydrants + Enforce Fire Lane Clearances',
        description: 'Deploy municipal hydrants, clear unauthorised kiosks from fire lanes. Cash -1.0, Trust +4, Infrastructure +3. Market unions resist.',
        immediate: { cashReserve: -1.0, publicTrust: 4, infrastructureScore: 3 },
        factionImpact: { informalEconomy: -6, civilSocietyMedia: 4 },
        delayed: {
          weekOffset: 8,
          delta: { infrastructureScore: 3, publicTrust: 2, cashReserve: 0.6 },
          eventText: `Market fire hydrant installation is complete across 8 of the 14 high-risk markets. Fire lane clearances displaced 47 kiosks but LSFRS now has unobstructed access. The International Fire Chiefs Association has commended Lagos as a regional model for market fire prevention. The reduction in fire-related property losses has had a measurable positive effect on the state's insurance pool.`,
        },
      },
      {
        id: 'fire-safety-campaign',
        label: 'Launch Fire Safety Sensitisation Campaign',
        description: 'Posters, radio jingles, market visits by LSFRS. Cash -0.3, Trust +2. Lower effectiveness — fire may still occur.',
        immediate: { cashReserve: -0.3, publicTrust: 2 },
        factionImpact: { civilSocietyMedia: 3 },
      },
      {
        id: 'harmattan-do-nothing',
        label: 'Rely on Post-Disaster Support',
        description: 'No preventive action. Trust -8 when fires hit. Civil Society -10.',
        immediate: { publicTrust: -8 },
        factionImpact: { civilSocietyMedia: -10, businessCommunity: -6 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: -5, cashReserve: -0.5 },
          eventText: `A fire gutted 22 lockup shops in Docemo market. LASEMA estimates ₦2.1bn in trader losses. No hydrants were available within 800 metres. The Federal Fire Service arrived 40 minutes after LSFRS. Affected traders are demanding compensation your treasury cannot afford.`,
        },
      },
    ],
  },

  // ── Flooding Crisis — Rainy Season Drainage Standoff ────────────────────────
  {
    id: 'seasonal-flooding-crisis',
    week: 4,
    title: 'The Rains Are Here: Flooded Streets and Angry Communities',
    body: `Three days of continuous rainfall have submerged the Idi-Oro, Aguda, and Itire axes. LASEMA records 1,500 displaced households — the worst single-event displacement on the mainland since 2018. The main drainage channel overflowed at the Aguda junction; engineers say it has not been desilted in seven years. Developers are blamed for building on floodplains using federal planning permits that bypass state drainage regulations. The System 156 network is blocked by luxury properties with valid NIWA approvals.`,
    severity: 'critical',
    category: 'infrastructure',
    season: 'wet',
    isRecurring: true,
    cooldownWeeks: 10,
    choices: [
      {
        id: 'demolish-illegal-floodplain',
        label: 'Demolish Illegal Structures on Floodplains',
        description: 'Aggressive demolition of luxury properties blocking drainage channels. Trust +6, Infra +4, Business -8, PC cost 15. Delayed infra and cash gains.',
        immediate: { publicTrust: 6, infrastructureScore: 4 },
        factionImpact: { businessCommunity: -8, civilSocietyMedia: 10, informalEconomy: -4 },
        politicalCapitalCost: 15,
        delayed: {
          weekOffset: 8,
          delta: { infrastructureScore: 5, publicTrust: 3, cashReserve: 0.8 },
          eventText: `Demolition of 11 properties on the System 156 drainage network is complete. The canal at Aguda junction is flowing freely for the first time in three years. The property developers have filed a joint lawsuit citing federal permits — the legal battle is expected to last two years but the drainage is clear. Reduced flood damage claims have already improved the state's insurance position.`,
        },
      },
      {
        id: 'drainage-desilt-emergency',
        label: 'Emergency Drainage Desilt + Municipal Upgrades',
        description: 'Fast-track desilting contracts across flood-prone areas. Cash -1, Trust +2, Infra +3.',
        immediate: { cashReserve: -1, publicTrust: 2, infrastructureScore: 3 },
        factionImpact: { civilSocietyMedia: 5, informalEconomy: 3 },
        delayed: {
          weekOffset: 4,
          delta: { publicTrust: 2, infrastructureScore: 2 },
          eventText: `Emergency desilting across 12 flood-prone channels is complete. The Aguda junction no longer floods after standard rainfall. LASWATER engineers estimate the work should hold through two more wet seasons.`,
        },
      },
      {
        id: 'flooding-blame-federal',
        label: 'Issue Statement — Blame Federal Climate Inaction',
        description: 'Attribute to climate change, request federal drainage grant. Trust -4, FedRel +3. Delayed federal response.',
        immediate: { publicTrust: -4 },
        factionImpact: { federalGovt: 3, civilSocietyMedia: -6 },
        delayed: {
          weekOffset: 8,
          delta: { cashReserve: 0.3 },
          eventText: `The Federal Ministry of Environment has acknowledged your request for a drainage intervention grant. No timeline has been given. The flood victims association has named you in an NHRC petition over delayed response.`,
        },
      },
    ],
  },
]
