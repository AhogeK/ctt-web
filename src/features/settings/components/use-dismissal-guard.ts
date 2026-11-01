/**
 * Refuses every way out of a dialog while the screen holds something the reader cannot get back.
 *
 * Both second-factor dialogs carry a one-time value: the recovery-code batch, or a request the
 * server is still answering. The server keeps only hashes and a request in flight can finish after
 * the dialog is gone, so a dismissal has to wait until neither is true.
 *
 * @param isBlocked - Whether a dismissal must be refused right now
 * @returns A handler for the dialog's escape, outside-pointer and outside-interaction events
 */
export function useDismissalGuard(isBlocked: () => boolean) {
  return function preventDismissal(event: Event): void {
    if (isBlocked()) event.preventDefault()
  }
}
