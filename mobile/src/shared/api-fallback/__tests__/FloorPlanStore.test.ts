/**
 * FloorPlanStore の永続化テスト。
 * アプリ再起動（= 新しい FloorPlanStore インスタンス生成）を経ても
 * 部屋・家具データが AsyncStorage 経由で復元されることを検証する。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { FloorPlanStore } from "../FloorPlanStore";

describe("FloorPlanStore persistence", () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it("seeds_fixture_rooms_when_no_persisted_data_exists", async () => {
    // Arrange
    const store = new FloorPlanStore();

    // Act
    const rooms = await store.listRooms({ xUserId: "u1" });

    // Assert
    expect(rooms.length).toBeGreaterThanOrEqual(2);
  });

  it("persists_a_newly_created_room_to_async_storage", async () => {
    // Arrange
    const store = new FloorPlanStore();

    // Act
    await store.createRoom({
      xUserId: "u1",
      roomCreate: {
        name: "書斎",
        type: "OTHER" as never,
        gridX: 1,
        gridY: 1,
        gridW: 2,
        gridH: 2,
      },
    });

    // Assert
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("restores_a_created_room_in_a_new_store_instance_simulating_app_restart", async () => {
    // Arrange
    let persisted: string | null = null;
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(persisted),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((_key, value) => {
      persisted = value;
      return Promise.resolve();
    });
    const store = new FloorPlanStore();
    const created = await store.createRoom({
      xUserId: "u1",
      roomCreate: {
        name: "書斎",
        type: "OTHER" as never,
        gridX: 1,
        gridY: 1,
        gridW: 2,
        gridH: 2,
      },
    });

    // Act: 新しいインスタンス生成 = アプリ再起動を模倣
    const restarted = new FloorPlanStore();
    const rooms = await restarted.listRooms({ xUserId: "u1" });

    // Assert
    const restoredRoom = rooms.find((r) => r.id === created.id);
    expect(restoredRoom).toBeDefined();
    expect(restoredRoom?.name).toBe("書斎");
    expect(restoredRoom?.createdAt).toBeInstanceOf(Date);
  });

  it("does_not_reseed_fixtures_on_restart_once_data_has_been_persisted", async () => {
    // Arrange
    let persisted: string | null = null;
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(persisted),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((_key, value) => {
      persisted = value;
      return Promise.resolve();
    });
    const store = new FloorPlanStore();
    const before = await store.listRooms({ xUserId: "u1" });
    await store.deleteRoom({ xUserId: "u1", roomId: before[0].id });

    // Act: 再起動を模倣
    const restarted = new FloorPlanStore();
    const rooms = await restarted.listRooms({ xUserId: "u1" });

    // Assert: 削除した部屋が復活していない（再シードされていない）
    expect(rooms.map((r) => r.id)).not.toContain(before[0].id);
    expect(rooms.length).toBe(before.length - 1);
  });

  it("restores_furniture_attached_to_a_room_after_restart", async () => {
    // Arrange
    let persisted: string | null = null;
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(persisted),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((_key, value) => {
      persisted = value;
      return Promise.resolve();
    });
    const store = new FloorPlanStore();
    const [room] = await store.listRooms({ xUserId: "u1" });
    const furniture = await store.createFurniture({
      xUserId: "u1",
      roomId: room.id,
      furnitureCreate: { name: "本棚", gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
    });

    // Act
    const restarted = new FloorPlanStore();
    const floorPlan = await restarted.getFloorPlan({ xUserId: "u1" });

    // Assert
    const restoredRoom = floorPlan.rooms.find((r) => r.id === room.id)!;
    expect(restoredRoom.furniture.map((f) => f.id)).toContain(furniture.id);
  });

  it("defaults_rotation_to_zero_when_restoring_furniture_persisted_before_the_field_existed", async () => {
    // Arrange: rotation 導入前のビルドが書いた永続データ（rotation キーが無い）
    const legacyState = {
      rooms: [
        {
          id: "room-1",
          name: "リビング",
          type: "LIVING",
          gridX: 0,
          gridY: 0,
          gridW: 6,
          gridH: 5,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      furniture: [
        {
          id: "furniture-1",
          roomId: "room-1",
          name: "ソファ",
          presetKey: "sofa",
          gridX: 0,
          gridY: 0,
          gridW: 2,
          gridH: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      idSequence: 2,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(legacyState),
    );

    // Act
    const store = new FloorPlanStore();
    const floorPlan = await store.getFloorPlan({ xUserId: "u1" });

    // Assert: 未定義のまま回すと NaN になり描画が壊れるため 0 で補う
    const [furniture] = floorPlan.rooms[0].furniture;
    expect(furniture.rotation).toBe(0);
  });

  describe("EXPO_PUBLIC_MOCK_START_EMPTY flag", () => {
    const originalEnv = process.env.EXPO_PUBLIC_MOCK_START_EMPTY;

    afterEach(() => {
      process.env.EXPO_PUBLIC_MOCK_START_EMPTY = originalEnv;
    });

    it("starts_with_no_rooms_when_the_empty_start_flag_is_set", async () => {
      // Arrange
      process.env.EXPO_PUBLIC_MOCK_START_EMPTY = "true";

      // Act
      const store = new FloorPlanStore();
      const rooms = await store.listRooms({ xUserId: "u1" });

      // Assert
      expect(rooms).toHaveLength(0);
    });

    it("still_seeds_fixtures_when_the_empty_start_flag_is_not_set", async () => {
      // Arrange
      process.env.EXPO_PUBLIC_MOCK_START_EMPTY = undefined;

      // Act
      const store = new FloorPlanStore();
      const rooms = await store.listRooms({ xUserId: "u1" });

      // Assert
      expect(rooms.length).toBeGreaterThanOrEqual(2);
    });
  });
});
