/**
 * バックエンド未起動時に使われるメモリ内モック API。
 * 生成済み DefaultApi と同一の呼び出しインターフェースを実装し、
 * FallbackApi がネットワークエラー時にこちらへ委譲する。
 * データはセッション内メモリ（Map）のみで保持し、アプリ再起動でリセットされる。
 *
 * 実体は FloorPlanStore（部屋・家具）と CleaningRecordStore（パーツ・掃除記録）への
 * 委譲のみを行う。部屋・家具の削除に伴うパーツ・掃除記録のカスケード削除のみ、
 * 両ストアにまたがるためここで orchestrate する。
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
  private readonly cleaningRecordStore = new CleaningRecordStore(
    this.floorPlanStore.initialRoomIds,
  );

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
    this.cleaningRecordStore.deletePartsForOwners([
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
    this.cleaningRecordStore.deletePartsForOwners([
      requestParameters.furnitureId,
    ]);
  }

  async listParts(requestParameters: ListPartsRequest) {
    return this.cleaningRecordStore.listParts(requestParameters);
  }

  async createPart(requestParameters: CreatePartRequest) {
    return this.cleaningRecordStore.createPart(requestParameters);
  }

  async updatePart(requestParameters: UpdatePartRequest) {
    return this.cleaningRecordStore.updatePart(requestParameters);
  }

  async deletePart(requestParameters: DeletePartRequest) {
    return this.cleaningRecordStore.deletePart(requestParameters);
  }

  async createCleaningRecords(requestParameters: CreateCleaningRecordsRequest) {
    return this.cleaningRecordStore.createCleaningRecords(requestParameters);
  }

  async listCleaningRecords(requestParameters: ListCleaningRecordsRequest) {
    return this.cleaningRecordStore.listCleaningRecords(requestParameters);
  }

  async updateCleaningRecord(requestParameters: UpdateCleaningRecordRequest) {
    return this.cleaningRecordStore.updateCleaningRecord(requestParameters);
  }

  async deleteCleaningRecord(requestParameters: DeleteCleaningRecordRequest) {
    return this.cleaningRecordStore.deleteCleaningRecord(requestParameters);
  }
}
