import type {
  CleaningStatusCapability,
  OverdueArea,
} from "@/capabilities/CleaningStatusCapability";
import type { CleaningRecordRepository } from "./CleaningRecordRepository";

/**
 * CleaningStatusCapability の実装。
 * CleaningRecordRepository.listParts() を通じてパーツ情報を取得し、
 * 推奨周期と最終掃除日時から期限超過状態を判定する。
 */
export class CleaningStatusCapabilityImpl implements CleaningStatusCapability {
  constructor(private readonly repository: CleaningRecordRepository) {}

  async getOverdueAreas(userId: string): Promise<OverdueArea[]> {
    const parts = await this.repository.listParts(userId);
    const now = Date.now();

    return parts
      .filter((part) => {
        if (part.lastCleanedAt === null) return true;
        const cycleMs = part.recommendedCycleDays * 24 * 60 * 60 * 1000;
        return now - part.lastCleanedAt.getTime() > cycleMs;
      })
      .map((part) => {
        const elapsedRatio =
          part.lastCleanedAt === null
            ? Infinity
            : (now - part.lastCleanedAt.getTime()) /
              (part.recommendedCycleDays * 24 * 60 * 60 * 1000);
        return {
          areaId: part.ownerId,
          partId: part.id,
          elapsedRatio,
        };
      });
  }

  async getLastCleanedAt(userId: string, areaId: string): Promise<Date | null> {
    const parts = await this.repository.listParts(userId);
    const areaParts = parts.filter((p) => p.ownerId === areaId);
    if (areaParts.length === 0) return null;

    const dates = areaParts
      .map((p) => p.lastCleanedAt)
      .filter((d): d is Date => d !== null);

    if (dates.length === 0) return null;

    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }
}
