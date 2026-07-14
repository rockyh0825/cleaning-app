/**
 * MockDefaultApi の部屋・家具データを保持するメモリストア。
 * パーツ・掃除記録（CleaningRecordStore の責務）は関知しない。
 * deleteRoom は配下の家具を削除し、その家具IDを呼び出し元に返すことで、
 * パーツ・掃除記録のカスケード削除をMockDefaultApi側で行えるようにする。
 *
 * データは AsyncStorage にも書き出す。バックエンド未起動を前提としたE2E検証
 * （#68）でアプリ再起動後もデータが復元されることを保証するための永続化。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CreateFurnitureRequest,
  CreateRoomRequest,
  DeleteFurnitureRequest,
  DeleteRoomRequest,
  GetFloorPlanRequest,
  ListRoomsRequest,
  UpdateFurnitureRequest,
  UpdateRoomRequest,
} from "@/shared/api/apis/DefaultApi";
import type {
  FloorPlan,
  Furniture,
  Room,
  RoomWithFurniture,
} from "@/shared/api/models";

function notFoundError(entity: string, id: string): Error {
  return new Error(`${entity} not found: ${id}`);
}

const STORAGE_KEY = "mock-floor-plan-store";

type PersistedState = {
  rooms: Room[];
  furniture: Furniture[];
  idSequence: number;
};

function reviveRoom(raw: Room): Room {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

function reviveFurniture(raw: Furniture): Furniture {
  return {
    ...raw,
    // rotation 導入前のビルドが永続化した家具にはこのキーが無い。
    // 未定義のまま回すと nextRotation(undefined) が NaN になり、
    // 占有サイズだけ入れ替わってグリフが回らない状態に陥るため既定値で補う。
    rotation: raw.rotation ?? 0,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

export class FloorPlanStore {
  private readonly rooms = new Map<string, Room>();
  private readonly furniture = new Map<string, Furniture>();
  private idSequence = 0;
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.hydrate();
  }

  get initialRoomIds(): string[] {
    return Array.from(this.rooms.keys());
  }

  private async hydrate(): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // E2E（Maestro）は「新規ユーザーの空状態」から検証するため、
      // このフラグが立っている間はデモ用フィクスチャをシードしない。
      if (process.env.EXPO_PUBLIC_MOCK_START_EMPTY !== "true") {
        this.seedFixtures();
      }
      return;
    }
    const state: PersistedState = JSON.parse(raw);
    state.rooms.forEach((room) => this.rooms.set(room.id, reviveRoom(room)));
    state.furniture.forEach((f) =>
      this.furniture.set(f.id, reviveFurniture(f)),
    );
    this.idSequence = state.idSequence;
  }

  private async persist(): Promise<void> {
    const state: PersistedState = {
      rooms: Array.from(this.rooms.values()),
      furniture: Array.from(this.furniture.values()),
      idSequence: this.idSequence,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      rotation: 0,
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
      rotation: 0,
      createdAt: now,
      updatedAt: now,
    };
    [sofa, bed].forEach((f) => this.furniture.set(f.id, f));
  }

  private toRoomWithFurniture(room: Room): RoomWithFurniture {
    const furnitureInRoom = Array.from(this.furniture.values()).filter(
      (f) => f.roomId === room.id,
    );
    return { ...room, furniture: furnitureInRoom };
  }

  async getFloorPlan(
    _requestParameters: GetFloorPlanRequest,
  ): Promise<FloorPlan> {
    await this.ready;
    return {
      rooms: Array.from(this.rooms.values()).map((r) =>
        this.toRoomWithFurniture(r),
      ),
    };
  }

  async listRooms(_requestParameters: ListRoomsRequest): Promise<Array<Room>> {
    await this.ready;
    return Array.from(this.rooms.values());
  }

  async createRoom(requestParameters: CreateRoomRequest): Promise<Room> {
    await this.ready;
    const now = new Date();
    const room: Room = {
      id: this.nextId("room"),
      ...requestParameters.roomCreate,
      createdAt: now,
      updatedAt: now,
    };
    this.rooms.set(room.id, room);
    await this.persist();
    return room;
  }

  async updateRoom(requestParameters: UpdateRoomRequest): Promise<Room> {
    await this.ready;
    const existing = this.rooms.get(requestParameters.roomId);
    if (!existing) throw notFoundError("Room", requestParameters.roomId);
    const updated: Room = {
      ...existing,
      ...requestParameters.roomUpdate,
      updatedAt: new Date(),
    };
    this.rooms.set(updated.id, updated);
    await this.persist();
    return updated;
  }

  /**
   * 部屋と配下の家具を削除する。
   * @returns カスケード削除された家具IDの一覧（パーツ・掃除記録のカスケードに使う）
   */
  async deleteRoom(
    requestParameters: DeleteRoomRequest,
  ): Promise<{ deletedFurnitureIds: string[] }> {
    await this.ready;
    const { roomId } = requestParameters;
    if (!this.rooms.has(roomId)) throw notFoundError("Room", roomId);
    const deletedFurnitureIds = Array.from(this.furniture.values())
      .filter((f) => f.roomId === roomId)
      .map((f) => f.id);
    deletedFurnitureIds.forEach((id) => this.furniture.delete(id));
    this.rooms.delete(roomId);
    await this.persist();
    return { deletedFurnitureIds };
  }

  async createFurniture(
    requestParameters: CreateFurnitureRequest,
  ): Promise<Furniture> {
    await this.ready;
    if (!this.rooms.has(requestParameters.roomId)) {
      throw notFoundError("Room", requestParameters.roomId);
    }
    const now = new Date();
    const furniture: Furniture = {
      id: this.nextId("furniture"),
      roomId: requestParameters.roomId,
      ...requestParameters.furnitureCreate,
      // 契約の default: 0 に合わせる（バックエンドの FurnitureCreateRequest.rotation と同じ既定）
      rotation: requestParameters.furnitureCreate.rotation ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.furniture.set(furniture.id, furniture);
    await this.persist();
    return furniture;
  }

  async updateFurniture(
    requestParameters: UpdateFurnitureRequest,
  ): Promise<Furniture> {
    await this.ready;
    const existing = this.furniture.get(requestParameters.furnitureId);
    if (!existing)
      throw notFoundError("Furniture", requestParameters.furnitureId);
    const updated: Furniture = {
      ...existing,
      ...requestParameters.furnitureUpdate,
      updatedAt: new Date(),
    };
    this.furniture.set(updated.id, updated);
    await this.persist();
    return updated;
  }

  async deleteFurniture(
    requestParameters: DeleteFurnitureRequest,
  ): Promise<void> {
    await this.ready;
    const { furnitureId } = requestParameters;
    if (!this.furniture.has(furnitureId))
      throw notFoundError("Furniture", furnitureId);
    this.furniture.delete(furnitureId);
    await this.persist();
  }
}
