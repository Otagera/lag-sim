import type { GameState, StatDelta } from '../state/types'

/*
INCOME
  PAYE Tax Collection          ₦6.2bn    (fluctuates with formal employment)
  Land Use Charges             ₦1.1bn    (can be increased — politically costly)
  Vehicle Registration/Fees   ₦0.8bn    (stable)
  FAAC Allocation              ₦3.2bn    (can be cut by Abuja)
  Other Levies & IGR           ₦1.5bn
  ─────────────────────────────────────
  GROSS WEEKLY INCOME          ₦12.8bn

EXPENDITURE
  Civil Servant Salaries       ₦4.8bn    (fixed — missing this is game over)
  Debt Servicing               ₦1.6bn    (non-negotiable)
  Security Vote                ₦0.9bn    (opaque, politically untouchable)
  Infrastructure Maintenance   ₦1.2bn    (can be cut — infrastructure decays)
  Health & Education           ₦1.4bn    (cutting triggers trust drop)
  Contractor Backlog Payment   ₦0.8bn    (skip this and projects stall)
  Corruption Drag (default)    ₦0.5bn    (systemic graft on procurement)
  ─────────────────────────────────────
  GROSS WEEKLY EXPENDITURE     ₦11.2bn

NET WEEKLY SURPLUS             ₦1.6bn
*/

export function weeklyTick(state: GameState): StatDelta {
  const { igr, expenditure, corruptionPressure } = state.stats
  const corruptionDrag = expenditure * (corruptionPressure / 100) * 0.3
  const netCashChange = igr - expenditure - corruptionDrag

  return { cashReserve: netCashChange }
}
