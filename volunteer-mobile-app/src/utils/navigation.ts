import { Href, router } from "expo-router";

// Clear the stack so Back can't reach the old session
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

//----------------------------------- END OF FILE ---------------------------------//
