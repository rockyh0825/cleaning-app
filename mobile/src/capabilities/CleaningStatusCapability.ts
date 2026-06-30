/**
 * notification / heatmap feature が掃除状態を読むための境界インターフェース。
 * 依存する側: notification/usecases/ScheduleCleaningReminderUseCase, heatmap
 * 実装する側: cleaning-record/repositories/CleaningStatusCapabilityImpl
 * feature 間の直接 import を禁止し、このインターフェース経由でのみアクセスする。
 */
export interface CleaningStatusCapability {
  /** userId が所有するパーツのうち推奨周期を超過しているものをエリアごとに返す */
  getOverdueAreas(userId: string): Promise<OverdueArea[]>;
  /** areaId のエリアに属するパーツの最新掃除日時を返す（記録なし → null） */
  getLastCleanedAt(userId: string, areaId: string): Promise<Date | null>;
}

export type OverdueArea = {
  areaId: string;
  partId: string;
  /** 推奨周期に対する経過割合。1.0 超で期限超過。lastCleanedAt が null のときは Infinity */
  elapsedRatio: number;
};
