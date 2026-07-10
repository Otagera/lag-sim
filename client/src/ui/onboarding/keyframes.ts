export const ONBOARDING_KEYFRAMES = `
@keyframes onboarding-step-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes onboarding-illustration-enter {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes onboarding-progress-fill {
  from { stroke-dashoffset: var(--onboarding-dash-from, 100); }
  to   { stroke-dashoffset: var(--onboarding-dash-to, 0); }
}
`
