import type { DriveStep } from 'driver.js'

export const ONBOARDING_TOUR_STEPS: DriveStep[] = [
  {
    element: 'header',
    popover: {
      title: 'Welcome to Lagos',
      description:
        'You are the Governor of Lagos State — 20 million people, a treasury that never quite stretches, and a city that demands everything at once. Every week you will face decisions that shape your legacy.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="next-week"]',
    popover: {
      title: 'Advance Time',
      description:
        'Click <strong>Next Week</strong> to move time forward. Each week brings new events, revenue, expenditures, and consequences for your choices.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[title="Weekly revenue minus expenditure"]',
    popover: {
      title: 'Your Treasury',
      description:
        'This is your cash reserve. Three consecutive weeks in the red means bankruptcy and game over. Keep an eye on it — everything costs money.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[title="Public approval rating"]',
    popover: {
      title: 'Public Trust',
      description:
        'Trust is your political oxygen. Let it drop below 15% with high youth tension and the streets will rise. Deliver visible wins to keep it healthy.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[title="Political capital to spend"]',
    popover: {
      title: 'Political Capital',
      description:
        'Influence to spend on bold actions — launching initiatives, appointing commissioners, cutting deals. Earn it by delivering on promises.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.event-card-area',
    popover: {
      title: 'Your Desk',
      description:
        'Decisions land here. Each choice has immediate effects on your stats and factions. Some have delayed consequences that surface weeks later. Choose carefully — there are no do-overs.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="dock-inbox"]',
    popover: {
      title: 'Inbox',
      description:
        "Your Chief of Staff, commissioners, and the party send messages here. Some are briefing memos; others contain actionable decisions. Don't let them pile up.",
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="dock-economy"]',
    popover: {
      title: 'Economy',
      description:
        'Revenue levers, spending cuts, and financing options. When the budget is tight, this is where you fix it — or decide who to disappoint.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="dock-factions"]',
    popover: {
      title: 'Factions',
      description:
        'Lagos runs on relationships. Six power blocs — business, labour, godfathers, Abuja, media, local chairmen — each with their own agenda. Keep them close, but not too close.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="dock-people"]',
    popover: {
      title: 'People',
      description:
        'Your deputy, cabinet commissioners, and the NPCs who orbit power. Appointments matter — competence and loyalty are rarely the same person.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="dock-state"]',
    popover: {
      title: 'State of the State',
      description:
        'Every stat, every faction score, every constituency approval rating. The full dashboard. When you need the truth, look here.',
      side: 'top',
      align: 'center',
    },
  },
]
