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
