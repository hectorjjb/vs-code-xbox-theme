// Xbox achievements service — TypeScript sample
import { z } from "zod";

const AchievementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  gamerscore: z.number().int().min(0).max(200),
  rarity: z.enum(["common", "rare", "legendary"]),
  unlockedAt: z.date().optional(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

interface PlayerStats<T extends Achievement> {
  readonly gamertag: string;
  readonly achievements: ReadonlyArray<T>;
  readonly totalGamerscore: number;
}

class AchievementsClient {
  #cache = new Map<string, Achievement[]>();

  constructor(private readonly endpoint = "https://api.xbox.com/v3") {}

  /** Fetches and validates the player's achievement list. */
  async getAchievements(gamertag: string): Promise<PlayerStats<Achievement>> {
    if (this.#cache.has(gamertag)) {
      return this.#toStats(gamertag, this.#cache.get(gamertag)!);
    }

    const response = await fetch(`${this.endpoint}/players/${gamertag}/achievements`);
    if (!response.ok) {
      throw new Error(`Xbox API ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const parsed = z.array(AchievementSchema).parse(payload);
    this.#cache.set(gamertag, parsed);
    return this.#toStats(gamertag, parsed);
  }

  #toStats(gamertag: string, list: Achievement[]): PlayerStats<Achievement> {
    return {
      gamertag,
      achievements: Object.freeze([...list]),
      totalGamerscore: list.reduce((sum, a) => sum + a.gamerscore, 0),
    };
  }
}

const client = new AchievementsClient();
const stats = await client.getAchievements("MajorNelson");
console.log(`${stats.gamertag} has ${stats.totalGamerscore}G across ${stats.achievements.length} achievements.`);
