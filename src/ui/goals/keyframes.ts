export const GOAL_KEYFRAMES = `
@keyframes goal-blocking-pulse {
  0%, 100% { filter: drop-shadow(0 0 2px currentColor); opacity: 1; }
  50%      { filter: drop-shadow(0 0 9px currentColor); opacity: .9; }
}
@keyframes goal-flow {
  to { stroke-dashoffset: -100; }
}
@keyframes goal-lightup {
  0%   { filter: brightness(1) drop-shadow(0 0 0 rgba(22,163,74,0)); transform: scale(1); }
  30%  { filter: brightness(1.6) drop-shadow(0 0 14px rgba(22,163,74,.9)); transform: scale(1.3); }
  100% { filter: brightness(1) drop-shadow(0 0 0 rgba(22,163,74,0)); transform: scale(1); }
}
`
