import type { AchievementDefinition, AchievementId, ActiveExpedition, RunQuestState } from "@/lib/runquest/types";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "FIRST_MARK", title: "First Mark", description: "Complete your first expedition.", icon: "explore" },
  { id: "FRONTIER_FINDER", title: "Frontier Finder", description: "Reveal 3 new atlas cells in one expedition.", icon: "public" },
  { id: "LONG_RANGE", title: "Long Range", description: "Travel 2.5 km in a single expedition.", icon: "directions-run" },
  { id: "MASTER_CARTOGRAPHER", title: "Master Cartographer", description: "Master an atlas cell across separate expeditions.", icon: "auto-awesome" },
  { id: "CONTRACT_KEEPER", title: "Contract Keeper", description: "Complete your first daily Field Contract.", icon: "verified" },
  { id: "ATLAS_PATHFINDER", title: "Atlas Pathfinder", description: "Reach 800 total XP.", icon: "map" },
  { id: "EXPEDITION_ARCHIVIST", title: "Expedition Archivist", description: "Complete 10 expeditions.", icon: "history" },
];

export function getAchievement(id: AchievementId): AchievementDefinition {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id) ?? ACHIEVEMENTS[0];
}

export function evaluateNewAchievements(
  state: RunQuestState,
  expedition: ActiveExpedition,
  totalXpAfter: number,
  contractCompleted: boolean,
): AchievementId[] {
  const unlocked = new Set(state.profile.achievements.map((achievement) => achievement.id));
  const conditions: Record<AchievementId, boolean> = {
    FIRST_MARK: state.workouts.length === 0,
    FRONTIER_FINDER: expedition.newTileIds.length >= 3,
    LONG_RANGE: expedition.distanceMeters >= 2_500,
    MASTER_CARTOGRAPHER: Object.values(state.tiles).some((tile) => tile.mastery === "MASTERED"),
    CONTRACT_KEEPER: contractCompleted,
    ATLAS_PATHFINDER: totalXpAfter >= 800,
    EXPEDITION_ARCHIVIST: state.workouts.length + 1 >= 10,
  };
  return ACHIEVEMENTS.filter((achievement) => conditions[achievement.id] && !unlocked.has(achievement.id)).map((achievement) => achievement.id);
}
