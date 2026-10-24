import { Ionicons } from "@expo/vector-icons";

export interface NewsItem {
  key: string;
  title: string;
  topic: string;
  icon: keyof typeof Ionicons.glyphMap;
  body: string;
}

// No news endpoint yet so stories live here
export const VOLUNTEER_NEWS: NewsItem[] = [
  {
    key: "orientation",
    title: "New volunteer orientation",
    topic: "Getting started",
    icon: "school-outline",
    body: "New to the team? Orientation walks you through safety and hygiene routines and how the rehabilitation centre runs day to day. Ask your coordinator when the next session is on.",
  },
  {
    key: "release-days",
    title: "Release days",
    topic: "Rehabilitation",
    icon: "water-outline",
    body: "Once rehabilitated birds are healthy and waterproof again they're released back to the wild. Volunteers who helped care for them are sometimes invited along, so keep an eye on your notifications.",
  },
  {
    key: "training-reminder",
    title: "Keep your training moving",
    topic: "Training",
    icon: "ribbon-outline",
    body: "Some areas need a trainer's sign-off before you can work there. Check the Training tab to see your next skill, then ask a trainer on shift to sign you off.",
  },
  {
    key: "chick-rearing",
    title: "Chick-rearing season",
    topic: "Seasonal",
    icon: "egg-outline",
    body: "During chick-rearing season the centre cares for abandoned penguin chicks and feeding rounds get busy. Extra hands make a real difference, so keep your availability up to date.",
  },
  {
    key: "availability",
    title: "Your availability shapes the roster",
    topic: "Reminder",
    icon: "calendar-outline",
    body: "Rosters are built from the availability you submit. Updating it whenever your plans change helps coordinators match you to shifts that suit you.",
  },
];
