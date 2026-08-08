import { activityCount } from "./content-counts";
import { ACTIVITY_KEYS, type ActivityKey, type ProfileProgress } from "./profile-data";

export type ActivityGroup = {
  id: "create" | "play-read" | "learn-discover";
  title: string;
  description: string;
  activities: ActivityKey[];
};

/** One map shared by Home, Studio, and resume routing. */
export const ACTIVITY_GROUPS: ActivityGroup[] = [
  {
    id: "create",
    title: "Create",
    description: "Make something of your own.",
    activities: ["draw", "color"],
  },
  {
    id: "play-read",
    title: "Play & Read",
    description: "Solve, match, and enjoy a story.",
    activities: ["puzzle", "stories"],
  },
  {
    id: "learn-discover",
    title: "Learn & Discover",
    description: "Follow questions into math, science, and the wider world.",
    activities: ["math", "science", "lab", "discover"],
  },
];

export function isActivityAvailable(activity: ActivityKey, ageWorld: number) {
  if (activity === "stories") return ageWorld < 2;
  if (activity === "discover") return ageWorld >= 2;
  return true;
}

export function activityGroupsForAge(ageWorld: number): ActivityGroup[] {
  return ACTIVITY_GROUPS.map((group) => ({
    ...group,
    activities: group.activities.filter((activity) => isActivityAvailable(activity, ageWorld)),
  })).filter((group) => group.activities.length > 0);
}

export function safeActivityForAge(activity: ActivityKey, ageWorld: number): ActivityKey {
  const knownActivity = ACTIVITY_KEYS.includes(activity);
  return knownActivity && isActivityAvailable(activity, ageWorld) ? activity : "draw";
}

export function safePageForActivity(activity: ActivityKey, ageWorld: number, page: number) {
  const total = activityCount(activity, ageWorld);
  const requested = Number.isFinite(page) ? Math.round(page) : 1;
  return Math.max(1, Math.min(total, requested));
}

export function safeResumeLocation(progress: ProfileProgress, ageWorld: number) {
  const activity = safeActivityForAge(progress.lastActivity, ageWorld);
  const rememberedPage = progress.activities[activity]?.lastPage || 1;
  return {
    activity,
    page: safePageForActivity(activity, ageWorld, rememberedPage),
  };
}
