import type { EventCard } from '../../state/types'
import { isHarmattan } from '../../utils/calendar'

// Food-security counter-tools (OTA-32 "Feed Lagos" strand).
// These are the accessible steering wheel for foodSecurityIndex: recurring,
// player-facing choices that raise food security (and agrarianSector), so the
// weekly decay re-enabled in gameLoop is a fight the player can actually win —
// not a meter falling with no controls. They pair with the slow research nodes
// in researchTree.ts (aquaculture, cold-chain, livestock) and the Feed Lagos goal.

export const agricultureEvents: EventCard[] = [
  {
    id: 'agri-cold-chain-investment',
    title: 'Mile 12 Market: The Cold-Chain Gap',
    body: `Mile 12 — the food gateway for 20 million people — still runs on ice blocks and prayer. A ThisDay investigation puts post-harvest losses across Lagos markets at 40%: tomatoes rotting in gridlock, fish spoiling before dawn, traders eating the cost and passing it to buyers. Your Agriculture Commissioner has costed a cold-storage and logistics upgrade. The Ministry of Finance wants to know where the money comes from.`,
    severity: 'medium',
    category: 'economy',
    isRecurring: true,
    cooldownWeeks: 16,
    triggerCondition: (state) => state.week >= 20 && (state.stats.foodSecurityIndex ?? 40) < 62,
    choices: [
      {
        id: 'fund-cold-chain',
        label: 'Fund the Cold-Chain Upgrade — ₦1.8bn',
        description:
          'Build cold storage and a logistics hub at Mile 12. Food Security +11. Agrarian sector +8, Informal economy +5. Cash -₦1.8bn. A durable supply-chain win.',
        immediate: { foodSecurityIndex: 11, cashReserve: -1.8 },
        factionImpact: { informalEconomy: 5 },
        secondaryFactionImpact: { agrarianSector: 8 },
        launchProject: {
          name: 'Mile 12 Cold-Chain Hub',
          location: 'kosofe',
          totalCost: 1.8,
          weeklyDraw: 0.15,
          weeksRemaining: 12,
          contractorId: 'contractor-roads-1',
        },
      },
      {
        id: 'trader-subsidy',
        label: 'Subsidise Trader-Run Ice Depots',
        description:
          'Cheaper, faster: co-fund ice and refrigerated vans that traders already run. Food Security +5. Informal economy +6. Cash -₦0.4bn.',
        immediate: { foodSecurityIndex: 5, cashReserve: -0.4 },
        factionImpact: { informalEconomy: 6 },
        diminishingReturns: true,
      },
      {
        id: 'defer-cold-chain',
        label: 'Defer — the Markets Have Always Coped',
        description: 'No spend now. Food Security -3 as losses mount. Informal economy -3.',
        immediate: { foodSecurityIndex: -3 },
        factionImpact: { informalEconomy: -3 },
      },
    ],
  },

  {
    id: 'agri-harmattan-food-prices',
    title: 'Harmattan Food Spike: Prices Bite',
    body: `The dry-season squeeze has arrived. Northern supply corridors are thin, the Harmattan haze is grounding perishable freight, and garri, tomatoes and pepper have jumped 30% in a fortnight. Market women at Oyingbo are already blaming "government." Your buffer-stock reserves exist on paper; the question is whether you release them and what you say while you do it.`,
    severity: 'high',
    category: 'economy',
    isRecurring: true,
    cooldownWeeks: 30,
    triggerCondition: (state) =>
      isHarmattan(state.week) && (state.stats.foodSecurityIndex ?? 40) < 70,
    choices: [
      {
        id: 'release-buffer-stocks',
        label: 'Release Buffer Stocks + Open Food Fairs',
        description:
          'Flood the market with reserves and run subsidised weekend food fairs. Food Security +9. Trust +4. Cash -₦1.1bn.',
        immediate: { foodSecurityIndex: 9, publicTrust: 4, cashReserve: -1.1 },
        factionImpact: { informalEconomy: 4, civilSocietyMedia: 3 },
      },
      {
        id: 'price-monitoring-taskforce',
        label: 'Deploy a Price-Monitoring Taskforce',
        description:
          'Cheap and visible: enforcement teams and a price hotline. Food Security +4. Business Community -4 (they resent the raids). Corruption Pressure +2.',
        immediate: { foodSecurityIndex: 4, corruptionPressure: 2 },
        factionImpact: { businessCommunity: -4 },
        diminishingReturns: true,
      },
      {
        id: 'blame-supply-shock',
        label: 'Call It a National Supply Shock',
        description:
          'Point at Abuja and the naira. Buys a news cycle, changes nothing. Food Security -4. Youth Tension +4.',
        immediate: { foodSecurityIndex: -4, youthTension: 4 },
        factionImpact: { civilSocietyMedia: -5 },
      },
    ],
  },

  {
    id: 'agri-agrarian-partnership',
    title: 'Epe & Badagry Farmers: A Partnership Offer',
    body: `The Lagos Agrarian Cooperative Union — the farming blocs of Epe, Badagry and Ikorodu — have come to the table. They want farm-to-market roads, guaranteed offtake for their produce, and a seat when agricultural policy is written. In return they can put reliable local supply into the city's markets and deliver two of your least-attended constituencies.`,
    severity: 'medium',
    category: 'political',
    isRecurring: true,
    cooldownWeeks: 22,
    triggerCondition: (state) => state.week >= 30,
    choices: [
      {
        id: 'full-agrarian-compact',
        label: 'Sign the Full Offtake Compact',
        description:
          'Guaranteed purchase agreements + farm roads. Food Security +8. Agrarian sector +12. Epe & Badagry approval +6. Cash -₦0.9bn.',
        immediate: { foodSecurityIndex: 8, cashReserve: -0.9 },
        factionImpact: { lgChairmen: 4 },
        secondaryFactionImpact: { agrarianSector: 12 },
        constituencyImpact: { epe: 6, badagry: 6, ikorodu: 3 },
      },
      {
        id: 'token-agrarian-gesture',
        label: 'Offer a Symbolic MoU',
        description:
          'A photo-op and a committee. Agrarian sector +3. Epe & Badagry +2. No fiscal exposure.',
        immediate: { foodSecurityIndex: 2 },
        factionImpact: {},
        secondaryFactionImpact: { agrarianSector: 3 },
        constituencyImpact: { epe: 2, badagry: 2 },
        diminishingReturns: true,
      },
      {
        id: 'decline-agrarian',
        label: 'Decline — Focus on the Metro Core',
        description:
          'The votes are in the city, not the farms. Agrarian sector -6. Epe & Badagry -4.',
        immediate: {},
        factionImpact: {},
        secondaryFactionImpact: { agrarianSector: -6 },
        constituencyImpact: { epe: -4, badagry: -4 },
      },
    ],
  },
]
