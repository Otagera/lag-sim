import type { SocialTone } from '../state/types'

// Commenter archetypes drive tone and phrasing.
export type Archetype = 'alarmist' | 'skeptic' | 'amplifier' | 'personal' | 'partisan' | 'cynic'

export interface Persona {
  name: string // WhatsApp / display name (first-name + initial style)
  handle: string // @handle for tweet & video comments
  archetype: Archetype
}

// ~12 named commenters. Reused across tweet replies, video comments, WhatsApp threads.
export const PERSONAS: Persona[] = [
  { name: 'Kemi A.', handle: '@KemiReacts', archetype: 'alarmist' },
  { name: 'Tunde B.', handle: '@TundeSpeaks', archetype: 'skeptic' },
  { name: 'Aunty Ngozi', handle: '@NgoziNaija', archetype: 'personal' },
  { name: 'Dr. Rotimi', handle: '@RotimiThinks', archetype: 'cynic' },
  { name: 'Bayo Esq.', handle: '@BayoEsq', archetype: 'skeptic' },
  { name: 'Amaka O.', handle: '@AmakaOnline', archetype: 'amplifier' },
  { name: 'Emeka L.', handle: '@EmekaLagos', archetype: 'skeptic' },
  { name: 'Shade M.', handle: '@ShadeGist', archetype: 'amplifier' },
  { name: 'Yemi F.', handle: '@YemiFolarin', archetype: 'personal' },
  { name: 'Ifeoma', handle: '@IfeomaViews', archetype: 'partisan' },
  { name: 'Chidi N.', handle: '@ChidiTalks', archetype: 'partisan' },
  { name: 'Zainab K.', handle: '@ZainabWrites', archetype: 'cynic' },
]

// Slot tokens filled by the builder: {lga} {stat} {value} {delta} {dir} {cat}
// Shared by tweet replies, video comments and WhatsApp group messages.
export const COMMENT_TEMPLATES: Record<Archetype, Partial<Record<SocialTone, string[]>>> = {
  alarmist: {
    negative: [
      'Wait, {stat} is now {value}?? This is how it starts o 😱',
      '{delta} in one week?! Nobody is talking about {lga}. We are finished',
      'Ah. {stat} {dir} to {value} and everywhere is quiet. God help us 🙏',
      'This {cat} matter will scatter everything if they don\u2019t act now',
    ],
    rumor: [
      'If na true say {stat} reach {value}, we are in serious trouble 😨',
      'They are hiding the real numbers. {stat} cannot just be {value}',
    ],
    neutral: [
      'Somebody explain this {stat} = {value} thing to me abeg',
      'Why is nobody screaming about {lga}?? {delta} is not small',
    ],
  },
  skeptic: {
    negative: [
      'So {stat} is now {value}? Who exactly approved this?',
      'Show me the breakdown. {delta} doesn\u2019t just happen by itself',
      'Every week na story. {stat} {dir} again and still no accountability',
      'They\u2019ll call a press conference and tell us {value} is progress. Rubbish',
    ],
    rumor: [
      'Where is the source for this? Not everything you hear is true sha',
      'Hmm. {value}? Let\u2019s wait for confirmation before we start forwarding',
      'People should verify before spreading this {cat} gist',
      'Screenshot or it didn\u2019t happen. {stat} {value} sounds off',
    ],
    positive: [
      'Fine, {stat} is {value} today. Let\u2019s see if they maintain it',
      'One good week ({delta}) doesn\u2019t erase everything. I\u2019m watching',
    ],
    neutral: [
      'What\u2019s the methodology behind this {stat} figure?',
      'Numbers can be framed anyhow. {value} means what exactly?',
    ],
  },
  amplifier: {
    rumor: [
      'If this {cat} gist is true, forward am give everybody 🔁',
      'Share this! They don\u2019t want us to know {stat} reached {value} 👀',
      'Spreading this now. {lga} people need to hear it',
      'Retweet till it reaches the right people 🔁 {stat} {value}',
    ],
    positive: [
      'Finally good news! {stat} up to {value} 🙌 Forward this one too!',
      'See {delta}!! Post it everywhere, good things deserve to spread 🙏',
      'This is the update we needed. {lga} we move! 🎉',
      'Retweet! For once something is working — {stat} {value}',
    ],
    negative: [
      'Everybody must see this. {stat} {dir} to {value}. Share!',
      'Forward to your reps. {delta} cannot slide under the table',
    ],
    neutral: [
      'Boosting this so more people see the {stat} numbers 🔁',
      'Everyone should know {stat} is {value} now',
    ],
  },
  personal: {
    negative: [
      'This one go affect my family for {lga} directly. {stat} at {value} 😔',
      'By month end all of us go feel this {delta}. I\u2019m tired honestly',
      'My shop is in {lga}. When {stat} is {value}, na we dey suffer am',
    ],
    positive: [
      'As someone living in {lga}, {value} actually gives me small hope 🙏',
      'If this {stat} improvement is real, my area will feel it. Finally!',
      'I\u2019ve waited long for this. {delta} means something to ordinary people',
    ],
    neutral: [
      'How does {stat} at {value} affect regular people like me in {lga}?',
      'Just want to know what {value} means for my daily hustle',
    ],
  },
  partisan: {
    positive: [
      'Say what you like — {stat} at {value} is this administration working 💪',
      'The critics are quiet now that it\u2019s {delta}. Give them credit!',
      'This is the {cat} progress they promised {lga}. Proud today',
      'Opposition can\u2019t stand it. {stat} {dir} to {value}. Facts',
    ],
    negative: [
      'One bad {stat} number ({value}) and enemies are celebrating. Context please',
      'This {delta} is inherited mess, not their doing. Be fair',
      'The blogs will spin {value} but the full picture is different',
      'They\u2019re only reporting {stat} to make {lga} look bad. Typical',
    ],
    neutral: [
      'Wait for the full report before judging {stat}',
      'Both sides should calm down about this {value} figure',
    ],
  },
  cynic: {
    negative: [
      'Same script. {stat} {dir} to {value}, nothing will change 😒',
      'We\u2019ve seen this movie before. {delta} today, excuses tomorrow',
      'Una see am? I knew from day one. {lga} was always going to suffer',
      'Politicians and their {cat} numbers. {value} means nothing to me',
    ],
    positive: [
      'Enjoy the {value} while it lasts. Give it two weeks',
      '{delta}? Election is coming, that\u2019s all this is',
    ],
    rumor: [
      'Whether na {value} or not, e no concern them if we live or die',
      'This {cat} gist will trend and then die like the rest',
    ],
    neutral: [
      'Another {stat} update nobody asked for. {value}, so what?',
      'They release {stat} = {value} to distract us from the real issues',
    ],
  },
}

// Podcast co-hosts (host name still comes from the existing PODCAST_HOSTS pool).
export const PODCAST_CO_HOSTS = ['Ngozi Osei-Eze', 'Femi Badmus', 'Amaka Okafor', 'Tobi Alade']

// Host ⇄ co-host dialogue. Builder alternates host/coHost and fills slots.
export const PODCAST_TEMPLATES: Record<SocialTone, { host: string[]; coHost: string[] }> = {
  positive: {
    host: [
      'So the headline number is {stat} at {value} — a {delta} swing. Real or noise?',
      'What I keep coming back to is {value}. That\u2019s not nothing for {lga}.',
    ],
    coHost: [
      'It\u2019s real enough, but I\u2019d want two more weeks before we call it a trend.',
      'Agreed — {delta} is encouraging, though the base was low to begin with.',
    ],
  },
  negative: {
    host: [
      'Let\u2019s not bury it: {stat} moved {dir} to {value}. That\u2019s a {delta} shift.',
      'The question for {lga} is who owns this {value} number.',
    ],
    coHost: [
      'And that\u2019s the part that worries me — nobody is claiming responsibility.',
      'A {delta} move like this usually points to a structural problem, not a one-off.',
    ],
  },
  rumor: {
    host: [
      'There\u2019s chatter that {stat} has hit {value}. We should flag it\u2019s unconfirmed.',
      'The {cat} rumour mill is loud this week — but the data is thin.',
    ],
    coHost: [
      'Right, treat {value} as a claim, not a fact, until the numbers are published.',
      'I\u2019ve heard the same from {lga}, but I wouldn\u2019t bank on it yet.',
    ],
  },
  neutral: {
    host: [
      'Where do you land on the {stat} figure — {value} this week?',
      'Walk me through what {value} actually means on the ground in {lga}.',
    ],
    coHost: [
      'Honestly it\u2019s a mixed picture. {delta} matters less than the direction.',
      'For most residents, {value} is abstract until it hits their daily costs.',
    ],
  },
}

// Emoji reaction sets for the WhatsApp "channel" (broadcast) mode.
export const EMOJI_BY_TONE: Record<SocialTone, string[]> = {
  positive: ['🙌', '🙏', '❤️', '👏'],
  negative: ['😱', '😡', '😢', '🤦'],
  rumor: ['👀', '😳', '🤔', '🔥'],
  neutral: ['👀', '🤔', '📌', '👍'],
}

export const WHATSAPP_GROUPS = [
  'Lagos Residents 🇳🇬',
  'Naija Matters 🇳🇬',
  'Eko Updates',
  'Concerned Lagosians',
  'Island vs Mainland 😅',
  'Lagos Traffic Talk',
]

export const WHATSAPP_CHANNELS = ['Lagos Alert', 'Eko Breaking', 'Naija Now', 'Lagos Insider']

// Seeded conversation timestamps (kept plausible for a single sitting).
export const CHAT_TIMES = [
  '9:04 AM',
  '9:11 AM',
  '9:18 AM',
  '12:39 PM',
  '12:44 PM',
  '12:51 PM',
  '2:14 PM',
  '2:19 PM',
  '2:27 PM',
  '7:30 PM',
  '7:35 PM',
  '7:41 PM',
]
