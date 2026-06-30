/**
 * バックエンド未起動時に MockDefaultApi へ自動 fallback するラッパー。
 * real(実API) を呼び出し、ネットワークエラー（FetchError）の場合のみ
 * mock(MockDefaultApi) に委譲する。HTTP エラー（ResponseError = 4xx/5xx）は
 * fallback せずそのまま throw する。
 *
 * DefaultApi を継承するのは、生成コードの repositories（例: FloorPlanRepository）が
 * コンストラクタ引数を `DefaultApi` 型で受け取っているため、di.ts からそのまま
 * 注入できるようにするための型適合が目的（実際の HTTP 処理は real/mock に委譲する）。
 */

import { DefaultApi } from "@/shared/api/apis/DefaultApi";
import type {
  CreateCleaningRecordsRequest,
  CreateFurnitureRequest,
  CreatePartRequest,
  CreateRoomRequest,
  DeleteCleaningRecordRequest,
  DeleteFurnitureRequest,
  DeletePartRequest,
  DeleteRoomRequest,
  GetFloorPlanRequest,
  ListCleaningRecordsRequest,
  ListPartsRequest,
  ListRoomsRequest,
  UpdateCleaningRecordRequest,
  UpdateFurnitureRequest,
  UpdatePartRequest,
  UpdateRoomRequest,
} from "@/shared/api/apis/DefaultApi";
import { FetchError } from "@/shared/api/runtime";
import type { MockDefaultApi } from "./MockDefaultApi";

export class FallbackApi extends DefaultApi {
  constructor(
    private readonly real: DefaultApi,
    private readonly mock: MockDefaultApi,
  ) {
    super();
  }

  private async withFallback<T>(
    realCall: () => Promise<T>,
    mockCall: () => Promise<T>,
  ): Promise<T> {
    try {
      return await realCall();
    } catch (e) {
      if (e instanceof FetchError) {
        return await mockCall();
      }
      throw e;
    }
  }

  override async getFloorPlan(requestParameters: GetFloorPlanRequest) {
    return this.withFallback(
      () => this.real.getFloorPlan(requestParameters),
      () => this.mock.getFloorPlan(requestParameters),
    );
  }

  override async listRooms(requestParameters: ListRoomsRequest) {
    return this.withFallback(
      () => this.real.listRooms(requestParameters),
      () => this.mock.listRooms(requestParameters),
    );
  }

  override async createRoom(requestParameters: CreateRoomRequest) {
    return this.withFallback(
      () => this.real.createRoom(requestParameters),
      () => this.mock.createRoom(requestParameters),
    );
  }

  override async updateRoom(requestParameters: UpdateRoomRequest) {
    return this.withFallback(
      () => this.real.updateRoom(requestParameters),
      () => this.mock.updateRoom(requestParameters),
    );
  }

  override async deleteRoom(requestParameters: DeleteRoomRequest) {
    return this.withFallback(
      () => this.real.deleteRoom(requestParameters),
      () => this.mock.deleteRoom(requestParameters),
    );
  }

  override async createFurniture(requestParameters: CreateFurnitureRequest) {
    return this.withFallback(
      () => this.real.createFurniture(requestParameters),
      () => this.mock.createFurniture(requestParameters),
    );
  }

  override async updateFurniture(requestParameters: UpdateFurnitureRequest) {
    return this.withFallback(
      () => this.real.updateFurniture(requestParameters),
      () => this.mock.updateFurniture(requestParameters),
    );
  }

  override async deleteFurniture(requestParameters: DeleteFurnitureRequest) {
    return this.withFallback(
      () => this.real.deleteFurniture(requestParameters),
      () => this.mock.deleteFurniture(requestParameters),
    );
  }

  override async listParts(requestParameters: ListPartsRequest) {
    return this.withFallback(
      () => this.real.listParts(requestParameters),
      () => this.mock.listParts(requestParameters),
    );
  }

  override async createPart(requestParameters: CreatePartRequest) {
    return this.withFallback(
      () => this.real.createPart(requestParameters),
      () => this.mock.createPart(requestParameters),
    );
  }

  override async updatePart(requestParameters: UpdatePartRequest) {
    return this.withFallback(
      () => this.real.updatePart(requestParameters),
      () => this.mock.updatePart(requestParameters),
    );
  }

  override async deletePart(requestParameters: DeletePartRequest) {
    return this.withFallback(
      () => this.real.deletePart(requestParameters),
      () => this.mock.deletePart(requestParameters),
    );
  }

  override async createCleaningRecords(
    requestParameters: CreateCleaningRecordsRequest,
  ) {
    return this.withFallback(
      () => this.real.createCleaningRecords(requestParameters),
      () => this.mock.createCleaningRecords(requestParameters),
    );
  }

  override async listCleaningRecords(
    requestParameters: ListCleaningRecordsRequest,
  ) {
    return this.withFallback(
      () => this.real.listCleaningRecords(requestParameters),
      () => this.mock.listCleaningRecords(requestParameters),
    );
  }

  override async updateCleaningRecord(
    requestParameters: UpdateCleaningRecordRequest,
  ) {
    return this.withFallback(
      () => this.real.updateCleaningRecord(requestParameters),
      () => this.mock.updateCleaningRecord(requestParameters),
    );
  }

  override async deleteCleaningRecord(
    requestParameters: DeleteCleaningRecordRequest,
  ) {
    return this.withFallback(
      () => this.real.deleteCleaningRecord(requestParameters),
      () => this.mock.deleteCleaningRecord(requestParameters),
    );
  }
}
