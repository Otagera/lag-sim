const START_DATE = new Date('2027-05-29')

export function weekToDate(week: number): Date {
  const date = new Date(START_DATE)
  date.setDate(date.getDate() + (week - 1) * 7)
  return date
}

export function formatGameDate(week: number): string {
  return weekToDate(week).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatGameMonth(week: number): string {
  return weekToDate(week).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export type Season = 'dry' | 'wet'

export function seasonOf(week: number): Season {
  const date = weekToDate(week)
  const month = date.getMonth() + 1
  return month >= 6 && month <= 9 ? 'wet' : 'dry'
}

export function isEndSARSWindow(week: number): boolean {
  const date = weekToDate(week)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return month === 10 && day >= 17 && day <= 23
}

// Sallah (Eid-el-Kabir): ~June, approximated as month 6
export function isSallahPeriod(week: number): boolean {
  return weekToDate(week).getMonth() + 1 === 6
}

// Detty December: month 12
export function isDettyDecember(week: number): boolean {
  return weekToDate(week).getMonth() + 1 === 12
}

// Eyo Festival: traditionally May, approximated as last week of May or first week of term
// Since START_DATE = 2027-05-29, weeks 1-2 are in the Eyo window
export function isEyoFestival(week: number): boolean {
  const date = weekToDate(week)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return month === 5 && day >= 20
}

// Harmattan: dry Saharan winds December–February
export function isHarmattan(week: number): boolean {
  const month = weekToDate(week).getMonth() + 1
  return month === 12 || month === 1 || month === 2
}
