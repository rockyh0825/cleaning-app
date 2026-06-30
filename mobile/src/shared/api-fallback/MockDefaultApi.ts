/**
 * バックエンド未起動時に使われるメモリ内モック API。
 * 生成済み DefaultApi と同一の呼び出しインターフェースを実装し、
 * FallbackApi がネットワークエラー時にこちらへ委譲する。
 * データはセッション内メモリ（Map）のみで保持し、アプリ再起動でリセットされる。
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
import type {
  CleaningRecord,
  CleaningRecordList,
  FloorPlan,
  Furniture,
  Part,
  Room,
  RoomWithFurniture,
} from "@/shared/api/models";

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

function notFoundError(entity: string, id: string): Error {
  return new Error(`${entity} not found: ${id}`);
}

export class MockDefaultApi implements DefaultApiInterface {
  private readonly rooms = new Map<string, Room>();
  private readonly furniture = new Map<string, Furniture>();
  private readonly parts = new Map<string, Part>();
  private readonly cleaningRecords = new Map<string, CleaningRecord>();
  private idSequence = 0;

  constructor() {
    this.seedFixtures();
  }

  private nextId(prefix: string): string {
    this.idSequence += 1;
    return `mock-${prefix}-${this.idSequence}`;
  }

  private seedFixtures(): void {
    const now = new Date("2024-01-01T00:00:00.000Z");

    const livingRoom: Room = {
      id: this.nextId("room"),
      name: "リビング",
      type: "LIVING" as Room["type"],
      gridX: 0,
      gridY: 0,
      gridW: 6,
      gridH: 5,
      createdAt: now,
      updatedAt: now,
    };
    const bedroom: Room = {
      id: this.nextId("room"),
      name: "寝室",
      type: "BEDROOM" as Room["type"],
      gridX: 6,
      gridY: 0,
      gridW: 4,
      gridH: 4,
      createdAt: now,
      updatedAt: now,
    };
    const kitchen: Room = {
      id: this.nextId("room"),
      name: "キッチン",
      type: "KITCHEN" as Room["type"],
      gridX: 0,
      gridY: 5,
      gridW: 4,
      gridH: 3,
      createdAt: now,
      updatedAt: now,
    };
    [livingRoom, bedroom, kitchen].forEach((room) =>
      this.rooms.set(room.id, room),
    );

    const sofa: Furniture = {
      id: this.nextId("furniture"),
      roomId: livingRoom.id,
      name: "ソファ",
      presetKey: "sofa",
      gridX: 0,
      gridY: 0,
      gridW: 2,
      gridH: 1,
      createdAt: now,
      updatedAt: now,
    };
    const bed: Furniture = {
      id: this.nextId("furniture"),
      roomId: bedroom.id,
      name: "ベッド",
      presetKey: "bed",
      gridX: 0,
      gridY: 0,
      gridW: 2,
      gridH: 3,
      createdAt: now,
      updatedAt: now,
    };
    [sofa, bed].forEach((f) => this.furniture.set(f.id, f));

    [livingRoom, bedroom, kitchen].forEach((room) => {
      const floorPart: Part = {
        id: this.nextId("part"),
        ownerType: "ROOM" as Part["ownerType"],
        ownerId: room.id,
        name: "床",
        recommendedCycleDays: 7,
        lastCleanedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      this.parts.set(floorPart.id, floorPart);
    });
  }

  private toRoomWithFurniture(room: Room): RoomWithFurniture {
    const furnitureInRoom = Array.from(this.furniture.values()).filter(
      (f) => f.roomId === room.id,
    );
    return { ...room, furniture: furnitureInRoom };
  }

  private recomputeLastCleanedAt(partId: string): void {
    const part = this.parts.get(partId);
    if (!part) return;
    const recordsForPart = Array.from(this.cleaningRecords.values()).filter(
      (r) => r.partId === partId,
    );
    if (recordsForPart.length === 0) {
      this.parts.set(partId, { ...part, lastCleanedAt: null });
      return;
    }
    const latest = recordsForPart.reduce(
      (max, r) => (r.cleanedAt.getTime() > max.getTime() ? r.cleanedAt : max),
      recordsForPart[0].cleanedAt,
    );
    this.parts.set(partId, { ...part, lastCleanedAt: latest });
  }

  async getFloorPlan(
    _requestParameters: GetFloorPlanRequest,
  ): Promise<FloorPlan> {
    return {
      rooms: Array.from(this.rooms.values()).map((r) =>
        this.toRoomWithFurniture(r),
      ),
    };
  }

  async listRooms(_requestParameters: ListRoomsRequest): Promise<Array<Room>> {
    return Array.from(this.rooms.values());
  }

  async createRoom(requestParameters: CreateRoomRequest): Promise<Room> {
    const now = new Date();
    const room: Room = {
      id: this.nextId("room"),
      ...requestParameters.roomCreate,
      createdAt: now,
      updatedAt: now,
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async updateRoom(requestParameters: UpdateRoomRequest): Promise<Room> {
    const existing = this.rooms.get(requestParameters.roomId);
    if (!existing) throw notFoundError("Room", requestParameters.roomId);
    const updated: Room = {
      ...existing,
      ...requestParameters.roomUpdate,
      updatedAt: new Date(),
    };
    this.rooms.set(updated.id, updated);
    return updated;
  }

  async deleteRoom(requestParameters: DeleteRoomRequest): Promise<void> {
    const { roomId } = requestParameters;
    if (!this.rooms.has(roomId)) throw notFoundError("Room", roomId);
    const furnitureIdsInRoom = Array.from(this.furniture.values())
      .filter((f) => f.roomId === roomId)
      .map((f) => f.id);
    furnitureIdsInRoom.forEach((id) => this.furniture.delete(id));

    const ownerIds = new Set([roomId, ...furnitureIdsInRoom]);
    Array.from(this.parts.values())
      .filter((p) => ownerIds.has(p.ownerId))
      .forEach((p) => this.parts.delete(p.id));

    this.rooms.delete(roomId);
  }

  async createFurniture(
    requestParameters: CreateFurnitureRequest,
  ): Promise<Furniture> {
    if (!this.rooms.has(requestParameters.roomId)) {
      throw notFoundError("Room", requestParameters.roomId);
    }
    const now = new Date();
    const furniture: Furniture = {
      id: this.nextId("furniture"),
      roomId: requestParameters.roomId,
      ...requestParameters.furnitureCreate,
      createdAt: now,
      updatedAt: now,
    };
    this.furniture.set(furniture.id, furniture);
    return furniture;
  }

  async updateFurniture(
    requestParameters: UpdateFurnitureRequest,
  ): Promise<Furniture> {
    const existing = this.furniture.get(requestParameters.furnitureId);
    if (!existing)
      throw notFoundError("Furniture", requestParameters.furnitureId);
    const updated: Furniture = {
      ...existing,
      ...requestParameters.furnitureUpdate,
      updatedAt: new Date(),
    };
    this.furniture.set(updated.id, updated);
    return updated;
  }

  async deleteFurniture(
    requestParameters: DeleteFurnitureRequest,
  ): Promise<void> {
    const { furnitureId } = requestParameters;
    if (!this.furniture.has(furnitureId))
      throw notFoundError("Furniture", furnitureId);
    Array.from(this.parts.values())
      .filter((p) => p.ownerId === furnitureId)
      .forEach((p) => this.parts.delete(p.id));
    this.furniture.delete(furnitureId);
  }

  async listParts(requestParameters: ListPartsRequest): Promise<Array<Part>> {
    const all = Array.from(this.parts.values());
    if (requestParameters.ownerId === undefined) return all;
    return all.filter((p) => p.ownerId === requestParameters.ownerId);
  }

  async createPart(requestParameters: CreatePartRequest): Promise<Part> {
    const now = new Date();
    const part: Part = {
      id: this.nextId("part"),
      recommendedCycleDays: 7,
      lastCleanedAt: null,
      ...requestParameters.partCreate,
      createdAt: now,
      updatedAt: now,
    };
    this.parts.set(part.id, part);
    return part;
  }

  async updatePart(requestParameters: UpdatePartRequest): Promise<Part> {
    const existing = this.parts.get(requestParameters.partId);
    if (!existing) throw notFoundError("Part", requestParameters.partId);
    const updated: Part = {
      ...existing,
      ...requestParameters.partUpdate,
      updatedAt: new Date(),
    };
    this.parts.set(updated.id, updated);
    return updated;
  }

  async deletePart(requestParameters: DeletePartRequest): Promise<void> {
    const { partId } = requestParameters;
    if (!this.parts.has(partId)) throw notFoundError("Part", partId);
    Array.from(this.cleaningRecords.values())
      .filter((r) => r.partId === partId)
      .forEach((r) => this.cleaningRecords.delete(r.id));
    this.parts.delete(partId);
  }

  async createCleaningRecords(
    requestParameters: CreateCleaningRecordsRequest,
  ): Promise<Array<CleaningRecord>> {
    const { partIds, cleanedAt, note } = requestParameters.cleaningRecordCreate;
    const effectiveCleanedAt = cleanedAt ?? new Date();
    const created = partIds.map((partId) => {
      if (!this.parts.has(partId)) throw notFoundError("Part", partId);
      const now = new Date();
      const record: CleaningRecord = {
        id: this.nextId("record"),
        partId,
        cleanedAt: effectiveCleanedAt,
        note: note ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.cleaningRecords.set(record.id, record);
      return record;
    });
    partIds.forEach((partId) => this.recomputeLastCleanedAt(partId));
    return created;
  }

  async listCleaningRecords(
    requestParameters: ListCleaningRecordsRequest,
  ): Promise<CleaningRecordList> {
    const { partId, page = 1, pageSize = 20 } = requestParameters;
    let items = Array.from(this.cleaningRecords.values()).sort(
      (a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime(),
    );
    if (partId !== undefined) {
      items = items.filter((r) => r.partId === partId);
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return { items: pageItems, total, page, pageSize };
  }

  async updateCleaningRecord(
    requestParameters: UpdateCleaningRecordRequest,
  ): Promise<CleaningRecord> {
    const existing = this.cleaningRecords.get(requestParameters.recordId);
    if (!existing)
      throw notFoundError("CleaningRecord", requestParameters.recordId);
    const updated: CleaningRecord = {
      ...existing,
      ...requestParameters.cleaningRecordUpdate,
      updatedAt: new Date(),
    };
    this.cleaningRecords.set(updated.id, updated);
    this.recomputeLastCleanedAt(updated.partId);
    return updated;
  }

  async deleteCleaningRecord(
    requestParameters: DeleteCleaningRecordRequest,
  ): Promise<void> {
    const existing = this.cleaningRecords.get(requestParameters.recordId);
    if (!existing)
      throw notFoundError("CleaningRecord", requestParameters.recordId);
    this.cleaningRecords.delete(existing.id);
    this.recomputeLastCleanedAt(existing.partId);
  }
}
