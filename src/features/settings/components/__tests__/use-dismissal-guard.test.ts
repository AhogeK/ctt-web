import { describe, expect, it } from 'vite-plus/test'
import { useDismissalGuard } from '../use-dismissal-guard'

function escapeEvent(): Event {
  return new Event('keydown', { cancelable: true })
}

describe('useDismissalGuard', () => {
  it('lets a dismissal through while nothing is at stake', () => {
    const event = escapeEvent()

    useDismissalGuard(() => false)(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('cancels the dismissal once a one-time value is on screen', () => {
    const event = escapeEvent()

    useDismissalGuard(() => true)(event)

    expect(event.defaultPrevented).toBe(true)
  })
})
