/**
 * DI配線。Capability インターフェースと実装を繋ぐ。
 * ビジネスロジックは持たない。
 *
 * 注意: DefaultApi は `scripts/generate-api-client.sh` で生成されるコードのため
 * gitignore 対象。本番環境では生成後にインポート可能になる。
 * 現時点では stub として any 型でインスタンスを渡す。
 */

import { FloorPlanRepository } from "@/features/floor-plan/repositories/FloorPlanRepository";
import { FloorPlanCapabilityImpl } from "@/features/floor-plan/repositories/FloorPlanCapabilityImpl";
import type { FloorPlanCapability } from "@/capabilities/FloorPlanCapability";
import { CleaningRecordRepository } from "@/features/cleaning-record/repositories/CleaningRecordRepository";
import { CleaningStatusCapabilityImpl } from "@/features/cleaning-record/repositories/CleaningStatusCapabilityImpl";
import type { CleaningStatusCapability } from "@/capabilities/CleaningStatusCapability";

// DefaultApi は生成コードのため stub を使用
// 本番では: import { DefaultApi } from '@/shared/api/apis/DefaultApi';
const apiStub: any = {};

const floorPlanRepository = new FloorPlanRepository(apiStub);
const cleaningRecordRepository = new CleaningRecordRepository(apiStub);

export const floorPlanCapability: FloorPlanCapability =
  new FloorPlanCapabilityImpl(floorPlanRepository);
export const cleaningStatusCapability: CleaningStatusCapability =
  new CleaningStatusCapabilityImpl(cleaningRecordRepository);
