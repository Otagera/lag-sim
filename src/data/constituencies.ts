import type { ConstituencyKey } from '../state/types'

export type ZoneInfo = {
  key: ConstituencyKey
  label: string
  description: string
}

export const CONSTITUENCIES: ZoneInfo[] = [
  { key: 'lagosIsland',    label: 'Lagos Island',      description: 'Central business district and historic core' },
  { key: 'etiOsa',         label: 'Eti Osa',           description: 'Victoria Island, Ikoyi — affluent commercial hub' },
  { key: 'ibejuLekki',     label: 'Ibeju-Lekki',       description: 'Lekki — fast-growing coastal corridor' },
  { key: 'surulere',       label: 'Surulere',           description: 'Middle-class heartland, National Stadium' },
  { key: 'amuwoOdofin',    label: 'Amuwo Odofin',      description: 'Festac Town, Mile 2, industrial estates' },
  { key: 'apapa',          label: 'Apapa',              description: 'Port district, shipping and commerce' },
  { key: 'oshodiIsolo',    label: 'Oshodi/Isolo',       description: 'Transport and market nexus, Airport Road' },
  { key: 'mushin',         label: 'Mushin',             description: 'Dense working-class district, markets' },
  { key: 'shomolu',        label: 'Shomolu',            description: 'Residential and light commercial' },
  { key: 'kosofe',         label: 'Kosofe',             description: 'Ojota, Ketu — northern residential sprawl' },
  { key: 'lagosMainland',  label: 'Lagos Mainland',     description: 'Yaba, Ebute Metta, Makoko waterfront' },
  { key: 'ikeja',          label: 'Ikeja',              description: 'State capital, GRA, Murtala Mohammed Airport' },
  { key: 'alimosho',       label: 'Alimosho',           description: 'Most populous LGA — Egbeda, Idimu, Igando' },
  { key: 'agege',          label: 'Agege',              description: 'Dense urban north-west, old rail corridor' },
  { key: 'ifakoIjaye',     label: 'Ifako/Ijaye',        description: 'Ojokoro, Ifako — outer north-west fringe' },
  { key: 'badagry',        label: 'Badagry',            description: 'Historic slave route port, border with Benin' },
  { key: 'epe',            label: 'Epe',                description: 'Fishing community, Lekki Free Zone hinterland' },
  { key: 'ikorodu',        label: 'Ikorodu',            description: 'Fast-growing northern district, ferry terminal' },
  { key: 'ojo',            label: 'Ojo',                description: 'Ojo, Alaba — south-western industrial fringe' },
  { key: 'ajeromiIfelodun', label: 'Ajeromi/Ifelodun', description: 'Ajegunle — densely packed waterfront slums' },
]
