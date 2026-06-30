/**
 * FallbackApi のテスト。
 * real(実API) の呼び出し結果に応じて mock(MockDefaultApi) への fallback を
 * 行うかどうかを検証する。
 *
 * fallback 判定は runtime.ts の FetchError / ResponseError のクラス識別に
 * 依存するため、ここでは生成コード(runtime.ts)を実際にimportして使う。
 */

import { FetchError, ResponseError } from "@/shared/api/runtime";
import { FallbackApi } from "../FallbackApi";

function fakeApi() {
  return {
    getFloorPlan: jest.fn(),
    listRooms: jest.fn(),
    createRoom: jest.fn(),
    updateRoom: jest.fn(),
    deleteRoom: jest.fn(),
    createFurniture: jest.fn(),
    updateFurniture: jest.fn(),
    deleteFurniture: jest.fn(),
    listParts: jest.fn(),
    createPart: jest.fn(),
    updatePart: jest.fn(),
    deletePart: jest.fn(),
    createCleaningRecords: jest.fn(),
    listCleaningRecords: jest.fn(),
    updateCleaningRecord: jest.fn(),
    deleteCleaningRecord: jest.fn(),
  };
}

describe("FallbackApi", () => {
  const userId = "user-uuid-1";

  it("returns_real_api_result_when_real_succeeds", async () => {
    // Arrange
    const real = fakeApi();
    const mock = fakeApi();
    real.listRooms.mockResolvedValue([{ id: "real-room-1" }]);

    const api = new FallbackApi(real as any, mock as any);

    // Act
    const result = await api.listRooms({ xUserId: userId });

    // Assert
    expect(result).toEqual([{ id: "real-room-1" }]);
    expect(mock.listRooms).not.toHaveBeenCalled();
  });

  it("falls_back_to_mock_result_when_real_throws_network_error", async () => {
    // Arrange
    const real = fakeApi();
    const mock = fakeApi();
    real.listRooms.mockRejectedValue(
      new FetchError(new TypeError("Failed to fetch")),
    );
    mock.listRooms.mockResolvedValue([{ id: "mock-room-1" }]);

    const api = new FallbackApi(real as any, mock as any);

    // Act
    const result = await api.listRooms({ xUserId: userId });

    // Assert
    expect(result).toEqual([{ id: "mock-room-1" }]);
    expect(mock.listRooms).toHaveBeenCalledWith({ xUserId: userId });
  });

  it("rethrows_without_fallback_when_real_returns_http_error", async () => {
    // Arrange
    const real = fakeApi();
    const mock = fakeApi();
    const notFoundResponse = new Response(null, { status: 404 });
    real.listRooms.mockRejectedValue(
      new ResponseError(notFoundResponse, "Not Found"),
    );

    const api = new FallbackApi(real as any, mock as any);

    // Act & Assert
    await expect(api.listRooms({ xUserId: userId })).rejects.toBeInstanceOf(
      ResponseError,
    );
    expect(mock.listRooms).not.toHaveBeenCalled();
  });

  it("falls_back_to_mock_on_write_methods_as_well", async () => {
    // Arrange
    const real = fakeApi();
    const mock = fakeApi();
    real.createRoom.mockRejectedValue(
      new FetchError(new TypeError("Failed to fetch")),
    );
    mock.createRoom.mockResolvedValue({ id: "mock-room-created" });

    const api = new FallbackApi(real as any, mock as any);
    const roomCreate = {
      name: "x",
      type: "OTHER",
      gridX: 0,
      gridY: 0,
      gridW: 1,
      gridH: 1,
    };

    // Act
    const result = await api.createRoom({
      xUserId: userId,
      roomCreate: roomCreate as never,
    });

    // Assert
    expect(result).toEqual({ id: "mock-room-created" });
    expect(mock.createRoom).toHaveBeenCalledWith({
      xUserId: userId,
      roomCreate,
    });
  });
});
