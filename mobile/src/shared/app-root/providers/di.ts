/**
 * DI配線。Capability インターフェースと実装を繋ぐ。
 * ビジネスロジックは持たない。
 *
 * 注意: DefaultApi は `scripts/generate-api-client.sh` で生成されるコードのため
 * gitignore 対象。本番環境では生成後にインポート可能になる。
 *
 * api は FallbackApi でラップしており、実APIがネットワークエラー（バックエンド未起動）
 * の場合のみ MockDefaultApi（メモリ内フィクスチャ）へ自動 fallback する。
 * 4xx/5xx は fallback せずそのままエラーを伝播する。
 */

import { DefaultApi } from "@/shared/api/apis/DefaultApi";
import { Configuration } from "@/shared/api/runtime";
import { MockDefaultApi } from "@/shared/api-fallback/MockDefaultApi";
import { FallbackApi } from "@/shared/api-fallback/FallbackApi";
import { FloorPlanRepository } from "@/features/floor-plan/repositories/FloorPlanRepository";
import { FloorPlanCapabilityImpl } from "@/features/floor-plan/repositories/FloorPlanCapabilityImpl";
import type { FloorPlanCapability } from "@/capabilities/FloorPlanCapability";
import { CleaningRecordRepository } from "@/features/cleaning-record/repositories/CleaningRecordRepository";
import { CleaningStatusCapabilityImpl } from "@/features/cleaning-record/repositories/CleaningStatusCapabilityImpl";
import type { CleaningStatusCapability } from "@/capabilities/CleaningStatusCapability";

const realApi = new DefaultApi(
  new Configuration({ basePath: "http://localhost:8080" }),
);
const mockApi = new MockDefaultApi();
export const api: DefaultApi = new FallbackApi(realApi, mockApi);

const floorPlanRepository = new FloorPlanRepository(api);
const cleaningRecordRepository = new CleaningRecordRepository(api);

export const floorPlanCapability: FloorPlanCapability =
  new FloorPlanCapabilityImpl(floorPlanRepository);
export const cleaningStatusCapability: CleaningStatusCapability =
  new CleaningStatusCapabilityImpl(cleaningRecordRepository);
