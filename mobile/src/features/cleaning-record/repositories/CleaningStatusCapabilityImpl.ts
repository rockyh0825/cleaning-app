import type {
  AreaStatus,
  CleaningStatusCapability,
  OverdueArea,
} from "@/capabilities/CleaningStatusCapability";
import type { Part } from "../types";
import type { CleaningRecordRepository } from "./CleaningRecordRepository";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * CleaningStatusCapability の実装。
 * CleaningRecordRepository.listParts() を通じてパーツ情報を取得し、
 * 推奨周期と最終掃除日時から期限超過状態を判定する。
 */
export class CleaningStatusCapabilityImpl implements CleaningStatusCapability {
  constructor(private readonly repository: CleaningRecordRepository) {}

  /**
   * パーツ単位の「推奨周期に対する経過割合」を求める。
   * heatmap/usecases/computeElapsedRatio と同一ロジックだが、feature 境界を
   * 跨ぐ import を避けるため本クラス内の private ヘルパーとして持つ。
   * lastCleanedAt が null、または周期が 0 以下のときは Infinity。
   */
  private elapsedRatioOf(part: Part, now: number): number {
    if (part.lastCleanedAt === null) return Infinity;
    if (part.recommendedCycleDays <= 0) return Infinity;
    const cycleMs = part.recommendedCycleDays * DAY_MS;
    return (now - part.lastCleanedAt.getTime()) / cycleMs;
  }

  async getOverdueAreas(userId: string): Promise<OverdueArea[]> {
    const parts = await this.repository.listParts(userId);
    const now = Date.now();

    return parts
      .filter((part) => this.elapsedRatioOf(part, now) > 1.0)
      .map((part) => ({
        areaId: part.ownerId,
        partId: part.id,
        elapsedRatio: this.elapsedRatioOf(part, now),
      }));
  }

  async getAreaStatuses(userId: string): Promise<AreaStatus[]> {
    const parts = await this.repository.listParts(userId);
    const now = Date.now();

    const maxByArea = new Map<string, number>();
    for (const part of parts) {
      const ratio = this.elapsedRatioOf(part, now);
      const current = maxByArea.get(part.ownerId);
      if (current === undefined || ratio > current) {
        maxByArea.set(part.ownerId, ratio);
      }
    }

    return Array.from(maxByArea, ([areaId, maxElapsedRatio]) => ({
      areaId,
      maxElapsedRatio,
    }));
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
