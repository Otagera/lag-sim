# Commissioner System

## Overview

Five commissioner roles, each with 3 candidates from `src/data/commissionerCandidates.ts`. Appointment screen appears early in the game. Commissioners have mechanical effects on gameplay.

## Roles and Effects

| Role | Effect | Key stat |
|---|---|---|
| **Works** (godfather pick) | `procurementLeakage +5%`; project cost overruns more likely | competence, isGodfatherChoice |
| **Works** (high competence) | `effectiveProjectProgress × (1 + competence/100 × 0.1)` | competence |
| **Finance** (high competence) | `grants += 0.8 × min(1, grantsCompliance + competence/100 × 0.15)` | competence |
| **Information** (high loyalty) | Hostile media/civil-society events drawn less frequently: weight * (1 - loyalty/100 * 0.25) | loyalty |
| **Environment** | (mechanical effects minimal — primarily narrative) | — |
| **Transport** | (mechanical effects minimal — primarily narrative) | — |

## Candidate Data

Each role has 3 candidates with varying `competence` (1–99) and `loyalty` (1–99):

- **Works**: Segun Ogbe (godfather pick, comp 55, loy 70) / Yemi Fashola (comp 82, loy 45) / Dele Bajulaiye (comp 45, loy 88)
- **Finance**: Wale Edun (comp 91, loy 30) / Kemi Adeosun (comp 78, loy 55) / Femi Atoyebi (godfather pick, comp 30, loy 85)
- **Environment**: Bimbo Ogun (comp 65, loy 70) / Tunde Bello (comp 80, loy 40) / Biodun Shobanjo (godfather pick, comp 20, loy 90)
- **Transport**: Kayode Opeifa (comp 58, loy 75) / Abimbola Akinfolarin (comp 76, loy 50) / Gbenga Onigbogi (godfather pick, comp 35, loy 82)
- **Information**: Olusegun Osoba (comp 72, loy 60) / Funke Opeke (comp 88, loy 35) / Gabby Onyegbulam (godfather pick, comp 25, loy 92)

Each role has exactly 1 godfather pick (marked `isGodfatherChoice: true`).

## Commissioner State

```typescript
type CommissionerState = {
  name: string
  competence: number    // 1–99
  loyalty: number       // 1–99
  isGodfatherChoice: boolean
}
```

## Appointment Flow

1. Early game: commissioner appointment screen presented (Zustand action)
2. Player picks one candidate per role
3. Choice may involve godfather pressure (godfather picks are offered and accepting improves godfather relations)
4. Commissioners remain for the full term (no removal mechanic — except phase-4 event paths)

## Godfather Commissioner Dynamics

- Appointing a godfather pick improves godfather relations but reduces competence
- Works commissioner godfather pick adds `procurementLeakage +5%` (hidden drag on every project)
- Information commissioner competence affects event pool filtering (hostile media events dampened)
- Finance commissioner competence affects grant income (up to +0.15× multiplier)

## Mechanical Effects Implementation

- Information commissioner loyalty dampening: `getEventWeight()` in `eventEngine.ts:69-78`
- Works commissioner competence: `processProjects()`, applies +10% build speed per 100 competence via `capitalEfficiency`
- Finance commissioner grants boost: applied in `revenueEngine.ts` grants calculation
