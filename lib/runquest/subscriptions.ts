export type RemovableSubscription = { remove?: () => void } | null | undefined;

/**
 * Expo Location's web subscriber can throw during removal in some SDK/browser
 * combinations. Web expeditions use demo mode, so no web location watch is
 * created; this platform guard also makes cleanup harmless for an interrupted
 * prior web session. Native subscriptions are still released deterministically.
 */
export function safelyRemoveSubscription(subscription: RemovableSubscription, platform: string): void {
  if (!subscription || typeof subscription.remove !== "function" || platform === "web") return;
  try {
    subscription.remove();
  } catch {
    // A platform emitter may already have disposed this subscription. Cleanup
    // must never prevent a completed expedition from being persisted.
  }
}
