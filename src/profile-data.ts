export type ActivityKey = "draw" | "color" | "puzzle" | "math" | "science" | "discover";

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  createdAt: string;
};

export type ActivityProgress = {
  completed: string[];
  lastPage: number;
};

export type ProfileProgress = {
  activities: Record<ActivityKey, ActivityProgress>;
  lastActivity: ActivityKey;
  legacyCompleted: number;
};

export type FamilyData = {
  version: 2;
  profiles: ChildProfile[];
  activeProfileId: string | null;
  progress: Record<string, ProfileProgress>;
};

export const PROFILE_STORAGE_KEY = "colorquest-family-v2";
export const PROFILE_AVATARS = ["🦊", "🐼", "🦁", "🐬", "🦋", "🚀", "🌈", "🔬"];
export const ACTIVITY_KEYS: ActivityKey[] = ["draw", "color", "puzzle", "math", "science", "discover"];

export function ageWorldFor(age: number) {
  if (age <= 3) return 0;
  if (age <= 6) return 1;
  if (age <= 9) return 2;
  return 3;
}

export function emptyProgress(legacyCompleted = 0): ProfileProgress {
  return {
    activities: {
      draw: { completed: [], lastPage: 1 },
      color: { completed: [], lastPage: 1 },
      puzzle: { completed: [], lastPage: 1 },
      math: { completed: [], lastPage: 1 },
      science: { completed: [], lastPage: 1 },
      discover: { completed: [], lastPage: 1 },
    },
    lastActivity: "draw",
    legacyCompleted,
  };
}

export function emptyFamilyData(): FamilyData {
  return { version: 2, profiles: [], activeProfileId: null, progress: {} };
}

function validProfile(profile: unknown): profile is ChildProfile {
  if (!profile || typeof profile !== "object") return false;
  const item = profile as Partial<ChildProfile>;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.age === "number" && typeof item.avatar === "string";
}

export function loadFamilyData(): FamilyData {
  if (typeof window === "undefined") return emptyFamilyData();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "null") as Partial<FamilyData> | null;
    if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.profiles)) return emptyFamilyData();
    const profiles = parsed.profiles.filter(validProfile);
    const activeProfileId = profiles.some((profile) => profile.id === parsed.activeProfileId)
      ? parsed.activeProfileId || null
      : profiles[0]?.id || null;
    const progress = { ...(parsed.progress || {}) } as Record<string, ProfileProgress>;
    for (const profile of profiles) {
      if (!progress[profile.id]?.activities) progress[profile.id] = emptyProgress();
    }
    return { version: 2, profiles, activeProfileId, progress };
  } catch {
    return emptyFamilyData();
  }
}

export function saveFamilyData(data: FamilyData) {
  if (typeof window !== "undefined") window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
}

export function makeProfile(name: string, age: number, avatar: string): ChildProfile {
  const safeName = name.trim().slice(0, 20) || "Explorer";
  const safeAge = Math.max(1, Math.min(12, Math.round(age)));
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, name: safeName, age: safeAge, avatar, createdAt: new Date().toISOString() };
}

export function completedCount(progress?: ProfileProgress) {
  if (!progress) return 0;
  return progress.legacyCompleted + ACTIVITY_KEYS.reduce(
    (total, activity) => total + new Set(progress.activities[activity]?.completed || []).size,
    0,
  );
}

export function completionPercent(progress: ProfileProgress | undefined, activity: ActivityKey, total: number) {
  if (!progress || total <= 0) return 0;
  return Math.min(100, Math.round(((progress.activities[activity]?.completed.length || 0) / total) * 100));
}

export function recordLocation(
  data: FamilyData,
  profileId: string,
  activity: ActivityKey,
  page: number,
): FamilyData {
  const current = data.progress[profileId] || emptyProgress();
  return {
    ...data,
    progress: {
      ...data.progress,
      [profileId]: {
        ...current,
        lastActivity: activity,
        activities: {
          ...current.activities,
          [activity]: { ...current.activities[activity], lastPage: Math.max(1, page) },
        },
      },
    },
  };
}

export function recordCompletion(
  data: FamilyData,
  profileId: string,
  activity: ActivityKey,
  ageWorld: number,
  page: number,
): FamilyData {
  const located = recordLocation(data, profileId, activity, page);
  const current = located.progress[profileId];
  const key = `${ageWorld}:${page}`;
  const completed = current.activities[activity].completed.includes(key)
    ? current.activities[activity].completed
    : [...current.activities[activity].completed, key];
  return {
    ...located,
    progress: {
      ...located.progress,
      [profileId]: {
        ...current,
        activities: {
          ...current.activities,
          [activity]: { ...current.activities[activity], completed },
        },
      },
    },
  };
}
