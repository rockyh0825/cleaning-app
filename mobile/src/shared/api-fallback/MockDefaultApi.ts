/**
 * バックエンド未起動時に使われるメモリ内モック API。
 * 生成済み DefaultApi と同一の呼び出しインターフェースを実装し、
 * FallbackApi がネットワークエラー時にこちらへ委譲する。
 * 部屋・家具（FloorPlanStore）は AsyncStorage に永続化されアプリ再起動後も復元される。
 * パーツ・掃除記録（CleaningRecordStore）はセッション内メモリのみで、アプリ再起動でリセットされる
 * （本アプリのE2E検証スコープはfloor-plan側のみのため、cleaning-record側の永続化は対象外）。
 *
 * 実体は FloorPlanStore（部屋・家具）と CleaningRecordStore（パーツ・掃除記録）への
 * 委譲のみを行う。部屋・家具の削除に伴うパーツ・掃除記録のカスケード削除のみ、
 * 両ストアにまたがるためここで orchestrate する。
 * FloorPlanStore の永続化データ読み込みは非同期のため、CleaningRecordStore の
 * 初期パーツ（部屋ごとの「床」）を正しくシードするには hydrate 完了を待つ必要があり、
 * `cleaningRecordStoreReady` でその完了後に構築したインスタンスを取り回す。
 */

import type { DefaultApi } from "@/shared/api/apis/DefaultApi";
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
import { CleaningRecordStore } from "./CleaningRecordStore";
import { FloorPlanStore } from "./FloorPlanStore";

export type DefaultApiInterface = Pick<
  DefaultApi,
  | "getFloorPlan"
  | "listRooms"
  | "createRoom"
  | "updateRoom"
  | "deleteRoom"
  | "createFurniture"
  | "updateFurniture"
  | "deleteFurniture"
  | "listParts"
  | "createPart"
  | "updatePart"
  | "deletePart"
  | "createCleaningRecords"
  | "listCleaningRecords"
  | "updateCleaningRecord"
  | "deleteCleaningRecord"
>;

export class MockDefaultApi implements DefaultApiInterface {
  private readonly floorPlanStore = new FloorPlanStore();
  private readonly cleaningRecordStoreReady: Promise<CleaningRecordStore>;

  constructor() {
    this.cleaningRecordStoreReady = this.floorPlanStore.ready.then(
      () => new CleaningRecordStore(this.floorPlanStore.initialRoomIds),
    );
  }

  async getFloorPlan(requestParameters: GetFloorPlanRequest) {
    return this.floorPlanStore.getFloorPlan(requestParameters);
  }

  async listRooms(requestParameters: ListRoomsRequest) {
    return this.floorPlanStore.listRooms(requestParameters);
  }

  async createRoom(requestParameters: CreateRoomRequest) {
    return this.floorPlanStore.createRoom(requestParameters);
  }

  async updateRoom(requestParameters: UpdateRoomRequest) {
    return this.floorPlanStore.updateRoom(requestParameters);
  }

  async deleteRoom(requestParameters: DeleteRoomRequest): Promise<void> {
    const { deletedFurnitureIds } =
      await this.floorPlanStore.deleteRoom(requestParameters);
    const cleaningRecordStore = await this.cleaningRecordStoreReady;
    cleaningRecordStore.deletePartsForOwners([
      requestParameters.roomId,
      ...deletedFurnitureIds,
    ]);
  }

  async createFurniture(requestParameters: CreateFurnitureRequest) {
    return this.floorPlanStore.createFurniture(requestParameters);
  }

  async updateFurniture(requestParameters: UpdateFurnitureRequest) {
    return this.floorPlanStore.updateFurniture(requestParameters);
  }

  async deleteFurniture(
    requestParameters: DeleteFurnitureRequest,
  ): Promise<void> {
    await this.floorPlanStore.deleteFurniture(requestParameters);
    const cleaningRecordStore = await this.cleaningRecordStoreReady;
    cleaningRecordStore.deletePartsForOwners([
      requestParameters.furnitureId,
    ]);
  }

  async listParts(requestParameters: ListPartsRequest) {
    return (await this.cleaningRecordStoreReady).listParts(requestParameters);
  }

  async createPart(requestParameters: CreatePartRequest) {
    return (await this.cleaningRecordStoreReady).createPart(
      requestParameters,
    );
  }

  async updatePart(requestParameters: UpdatePartRequest) {
    return (await this.cleaningRecordStoreReady).updatePart(
      requestParameters,
    );
  }

  async deletePart(requestParameters: DeletePartRequest) {
    return (await this.cleaningRecordStoreReady).deletePart(
      requestParameters,
    );
  }

  async createCleaningRecords(requestParameters: CreateCleaningRecordsRequest) {
    return (await this.cleaningRecordStoreReady).createCleaningRecords(
      requestParameters,
    );
  }

  async listCleaningRecords(requestParameters: ListCleaningRecordsRequest) {
    return (await this.cleaningRecordStoreReady).listCleaningRecords(
      requestParameters,
    );
  }

  async updateCleaningRecord(requestParameters: UpdateCleaningRecordRequest) {
    return (await this.cleaningRecordStoreReady).updateCleaningRecord(
      requestParameters,
    );
  }

  async deleteCleaningRecord(requestParameters: DeleteCleaningRecordRequest) {
    return (await this.cleaningRecordStoreReady).deleteCleaningRecord(
      requestParameters,
    );
  }
}
