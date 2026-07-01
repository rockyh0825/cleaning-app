/**
 * MockDefaultApi のテスト。
 * バックエンド未起動時の fallback 先として使われるメモリ内モック実装の
 * CRUD 整合性を検証する。
 */

import { MockDefaultApi } from "../MockDefaultApi";

describe("MockDefaultApi", () => {
  const userId = "user-uuid-1";

  describe("listRooms", () => {
    it("returns_fixture_rooms_on_initial_state", async () => {
      // Arrange
      const mock = new MockDefaultApi();

      // Act
      const rooms = await mock.listRooms({ xUserId: userId });

      // Assert
      expect(rooms.length).toBeGreaterThanOrEqual(2);
      expect(rooms[0]).toHaveProperty("id");
      expect(rooms[0]).toHaveProperty("name");
    });
  });

  describe("parts fixtures", () => {
    it("seeds_a_floor_part_for_each_fixture_room_on_initial_state", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const rooms = await mock.listRooms({ xUserId: userId });

      // Act
      const parts = await mock.listParts({
        xUserId: userId,
        ownerId: rooms[0].id,
      });

      // Assert
      expect(parts.some((p) => p.name === "床")).toBe(true);
    });
  });

  describe("getFloorPlan", () => {
    it("returns_fixture_rooms_with_furniture_on_initial_state", async () => {
      // Arrange
      const mock = new MockDefaultApi();

      // Act
      const floorPlan = await mock.getFloorPlan({ xUserId: userId });

      // Assert
      expect(floorPlan.rooms.length).toBeGreaterThanOrEqual(2);
      const roomWithFurniture = floorPlan.rooms.find(
        (r) => r.furniture.length > 0,
      );
      expect(roomWithFurniture).toBeDefined();
    });
  });

  describe("createRoom", () => {
    it("adds_new_room_to_memory_and_is_retrievable_via_get_floor_plan", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const before = await mock.listRooms({ xUserId: userId });

      // Act
      const created = await mock.createRoom({
        xUserId: userId,
        roomCreate: {
          name: "新しい部屋",
          type: "OTHER" as never,
          gridX: 10,
          gridY: 10,
          gridW: 2,
          gridH: 2,
        },
      });

      // Assert
      expect(created.id).toBeTruthy();
      expect(created.name).toBe("新しい部屋");
      const floorPlan = await mock.getFloorPlan({ xUserId: userId });
      expect(floorPlan.rooms.map((r) => r.id)).toContain(created.id);
      expect(floorPlan.rooms.length).toBe(before.length + 1);
    });
  });

  describe("deleteRoom", () => {
    it("removes_room_from_memory_and_excludes_it_from_subsequent_list", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const before = await mock.listRooms({ xUserId: userId });
      const targetId = before[0].id;

      // Act
      await mock.deleteRoom({ xUserId: userId, roomId: targetId });

      // Assert
      const after = await mock.listRooms({ xUserId: userId });
      expect(after.map((r) => r.id)).not.toContain(targetId);
      expect(after.length).toBe(before.length - 1);
    });

    it("also_removes_furniture_belonging_to_the_deleted_room", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const floorPlanBefore = await mock.getFloorPlan({ xUserId: userId });
      const roomWithFurniture = floorPlanBefore.rooms.find(
        (r) => r.furniture.length > 0,
      )!;

      // Act
      await mock.deleteRoom({ xUserId: userId, roomId: roomWithFurniture.id });

      // Assert
      const floorPlanAfter = await mock.getFloorPlan({ xUserId: userId });
      expect(floorPlanAfter.rooms.map((r) => r.id)).not.toContain(
        roomWithFurniture.id,
      );
    });

    it("also_removes_cleaning_records_belonging_to_parts_owned_by_the_deleted_room", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "ROOM" as never,
          ownerId: room.id,
          name: "壁",
        },
      });
      await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id] },
      });

      // Act
      await mock.deleteRoom({ xUserId: userId, roomId: room.id });

      // Assert
      const records = await mock.listCleaningRecords({
        xUserId: userId,
        partId: part.id,
      });
      expect(records.items).toHaveLength(0);
    });

    it("also_removes_cleaning_records_belonging_to_parts_owned_by_furniture_in_the_deleted_room", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const furniture = await mock.createFurniture({
        xUserId: userId,
        roomId: room.id,
        furnitureCreate: { name: "棚", gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
      });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "FURNITURE" as never,
          ownerId: furniture.id,
          name: "扉",
        },
      });
      await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id] },
      });

      // Act
      await mock.deleteRoom({ xUserId: userId, roomId: room.id });

      // Assert
      const records = await mock.listCleaningRecords({
        xUserId: userId,
        partId: part.id,
      });
      expect(records.items).toHaveLength(0);
    });
  });

  describe("createFurniture", () => {
    it("attaches_new_furniture_to_target_room_and_is_retrievable", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const rooms = await mock.listRooms({ xUserId: userId });
      const targetRoomId = rooms[0].id;

      // Act
      const created = await mock.createFurniture({
        xUserId: userId,
        roomId: targetRoomId,
        furnitureCreate: {
          name: "新しい家具",
          gridX: 0,
          gridY: 0,
          gridW: 1,
          gridH: 1,
        },
      });

      // Assert
      expect(created.roomId).toBe(targetRoomId);
      const floorPlan = await mock.getFloorPlan({ xUserId: userId });
      const room = floorPlan.rooms.find((r) => r.id === targetRoomId)!;
      expect(room.furniture.map((f) => f.id)).toContain(created.id);
    });
  });

  describe("deleteFurniture", () => {
    it("also_removes_cleaning_records_belonging_to_parts_owned_by_the_deleted_furniture", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const furniture = await mock.createFurniture({
        xUserId: userId,
        roomId: room.id,
        furnitureCreate: { name: "棚", gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
      });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "FURNITURE" as never,
          ownerId: furniture.id,
          name: "扉",
        },
      });
      await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id] },
      });

      // Act
      await mock.deleteFurniture({
        xUserId: userId,
        furnitureId: furniture.id,
      });

      // Assert
      const records = await mock.listCleaningRecords({
        xUserId: userId,
        partId: part.id,
      });
      expect(records.items).toHaveLength(0);
    });
  });

  describe("updateRoom / updateFurniture", () => {
    it("throws_when_updating_a_room_that_does_not_exist", async () => {
      // Arrange
      const mock = new MockDefaultApi();

      // Act & Assert
      await expect(
        mock.updateRoom({
          xUserId: userId,
          roomId: "missing-room",
          roomUpdate: { name: "x" },
        }),
      ).rejects.toThrow();
    });

    it("updates_existing_room_fields_and_keeps_other_fields_unchanged", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });

      // Act
      const updated = await mock.updateRoom({
        xUserId: userId,
        roomId: room.id,
        roomUpdate: { name: "改名後" },
      });

      // Assert
      expect(updated.name).toBe("改名後");
      expect(updated.gridX).toBe(room.gridX);
    });
  });

  describe("parts CRUD", () => {
    it("creates_part_and_makes_it_retrievable_via_list_parts_filtered_by_owner", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });

      // Act
      const created = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "ROOM" as never,
          ownerId: room.id,
          name: "壁",
        },
      });

      // Assert
      const parts = await mock.listParts({ xUserId: userId, ownerId: room.id });
      expect(parts.map((p) => p.id)).toContain(created.id);
    });

    it("removes_part_and_its_cleaning_records_on_delete_part", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "ROOM" as never,
          ownerId: room.id,
          name: "壁",
        },
      });
      await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id] },
      });

      // Act
      await mock.deletePart({ xUserId: userId, partId: part.id });

      // Assert
      const remainingParts = await mock.listParts({ xUserId: userId });
      expect(remainingParts.map((p) => p.id)).not.toContain(part.id);
      const records = await mock.listCleaningRecords({
        xUserId: userId,
        partId: part.id,
      });
      expect(records.items).toHaveLength(0);
    });
  });

  describe("cleaning records CRUD", () => {
    it("creates_records_and_updates_last_cleaned_at_on_the_target_part", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "ROOM" as never,
          ownerId: room.id,
          name: "壁",
        },
      });
      expect(part.lastCleanedAt).toBeNull();

      // Act
      const cleanedAt = new Date("2024-06-01T00:00:00.000Z");
      const [record] = await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id], cleanedAt, note: "メモ" },
      });

      // Assert
      expect(record.partId).toBe(part.id);
      expect(record.note).toBe("メモ");
      const updatedParts = await mock.listParts({
        xUserId: userId,
        ownerId: room.id,
      });
      const updatedPart = updatedParts.find((p) => p.id === part.id)!;
      expect(updatedPart.lastCleanedAt).toEqual(cleanedAt);
    });

    it("recomputes_last_cleaned_at_to_null_after_deleting_the_only_record", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "ROOM" as never,
          ownerId: room.id,
          name: "壁",
        },
      });
      const [record] = await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id] },
      });

      // Act
      await mock.deleteCleaningRecord({ xUserId: userId, recordId: record.id });

      // Assert
      const updatedParts = await mock.listParts({
        xUserId: userId,
        ownerId: room.id,
      });
      expect(
        updatedParts.find((p) => p.id === part.id)!.lastCleanedAt,
      ).toBeNull();
    });

    it("paginates_list_cleaning_records_results", async () => {
      // Arrange
      const mock = new MockDefaultApi();
      const [room] = await mock.listRooms({ xUserId: userId });
      const part = await mock.createPart({
        xUserId: userId,
        partCreate: {
          ownerType: "ROOM" as never,
          ownerId: room.id,
          name: "壁",
        },
      });
      await mock.createCleaningRecords({
        xUserId: userId,
        cleaningRecordCreate: { partIds: [part.id, part.id, part.id] },
      });

      // Act
      const page1 = await mock.listCleaningRecords({
        xUserId: userId,
        partId: part.id,
        page: 1,
        pageSize: 2,
      });

      // Assert
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);
    });
  });
});
