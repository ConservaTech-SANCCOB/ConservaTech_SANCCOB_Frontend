import { Href, router } from "expo-router";

/**
 * Replaces the whole root history with `href`, so Back (or the iOS swipe) can't return
 * to screens from before — e.g. the welcome/login screens after logging in, or the
 * trainer PIN/select screens after a trainer logs out. A plain `router.replace` only
 * swaps the top screen and leaves everything underneath it reachable.
 */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
