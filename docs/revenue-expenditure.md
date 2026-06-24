# Revenue & Expenditure

## Revenue Formula (per week)

`calculateWeeklyRevenue()` in `src/engine/revenueEngine.ts`:

```
PAYE      = 19.6 × (0.3 + 0.3×infraScore + 0.2×securityIndex + 0.2×(100−youthTension)) / 100
MDA       = 5.9   × (0.4 + 0.4×infraScore + 0.2×securityIndex) / 100
LUC       = 0.3   × landUseChargeEnforcement
Other     = 2.1   × (0.5 + 0.5×infraScore/100)
FAAC      = 8.7   × federalMultiplier (0–1, drops sharply below −15 relationship)
Grants    = 0.8   × grantsCompliance  (0 if freeze active, 0 if compliance zeroed)
```

### Revenue Breakdown (starting week 1)

| Stream | ₦bn/wk | Driver |
|---|---|---|
| PAYE | ~6.2 | Infra + Security + Youth Tension |
| FAAC | ~8.7 | Federal Relationship |
| MDA | ~1.9 | Infra + Security |
| LUC | ~0.3 | Land Use Charge Enforcement |
| Other | ~1.4 | Infra Score |
| Grants | ~0.48 | Grants Compliance |
| **Total** | **~29.1** | |

### FAAC Federal Multiplier
- `federalRelationship ≥ 15`: 1.0 (full allocation)
- `federalRelationship ≤ -25`: 0.0 (zero allocation)
- Linear interpolation between −25 and 15
- Wet season: variance 1.5× wider (higher peaks and lower troughs)
- Budget crunch: −0.2 penalty
- Election year: −0.1 penalty

## Expenditure Formula (per week)

`calculateWeeklyExpenditure()` in `src/engine/expenditureEngine.ts`:

```
Personnel        = 4.8 × (1 + ghostWorkerRate)  + 0.5 × ghostWorkerRate spike
Debt Interest    = sum of all active loans' weeklyInterest
Debt Repayment   = sum of all active loans' weeklyRepayment
Overheads        = 3.3 + baseOverheads  (+ ghostReinvestment if ghost purge completed)
Subventions      = 3.9 × (1 − subventionCutRate)
Contractor       = min(4.0, contractorBacklog × 0.15)
```

### Expenditure Breakdown (starting week 1)

| Item | ₦bn/wk | Driver |
|---|---|---|
| Personnel | ~5.23 | Ghost worker rate +0.09 |
| Debt Interest | 0 | No loans |
| Debt Repayment | 0 | No loans |
| Overheads | ~3.3 | Base + creep |
| Subventions | ~3.9 | Default rate |
| Contractor | 0 | No backlog |
| **Total** | **~30.9** | |

## Budget Deficit

Starting budget: ~₦29.1bn revenue vs ~₦30.9bn expenditure = **−₦1.8bn/week deficit**.

Cash reserve: ₦45bn → approximately **25 weeks** before bankruptcy, assuming no corrective action.

## Key Levers

### Increase Revenue
| Lever | Effect | Side effects |
|---|---|---|
| Raise infrastructureScore | PAYE, MDA, Other all scale | Requires capital projects (cash) |
| Raise securityIndex | PAYE, MDA scale | Uses cash or PC |
| Lower youthTension | PAYE improves | Social events, youth engagement |
| Improve federalRelationship | FAAC allocation increases up to ×1.0 | Political events, godfather choices |
| Raise landUseChargeEnforcement | LUC scales up to ×3.0 | Political cost |
| Grants compliance > 75 | Grants flow (₦0.8bn/wk) | Requires corruption < 75 |
| LIRS efficiency events | IGR baseline improves | Informal economy faction hit |

### Decrease Expenditure
| Lever | Effect | Side effects |
|---|---|---|
| Ghost worker purge initiative | Lowers personnel costs | Takes 8–12 weeks, costs cash |
| Refuse godfather asks | Prevents overhead creep | Godfather resentment |
| Raise subventionCutRate | Lowers subvention bill | Political cost from LG chairmen |
| Kill projects | No contractor payments | Infra score stops improving |
| Stomach infrastructure diminishing returns | Limits stomach infra cost | Caps corruption spike after 2 uses |

## Corruption Drag on Grants

| Corruption Condition | Grant Effect |
|---|---|
| corruptionPressure > 75 for 3 consecutive weeks | Grants = 0 for 8 weeks; grantFreezeCount++ |
| grantFreezeCount ≥ 3 | grantsCompliance = 0 permanently (irreversible) |

## Emergency Loans

| Loan | APR | Condition |
|---|---|---|
| First emergency loan | 35% | cashReserve < 0 |
| Second emergency loan | Escalated | Already took one |
| Third (max) | Highest tier | Two already taken |
| Regular loans | Per terms | Available via debtEngine |
