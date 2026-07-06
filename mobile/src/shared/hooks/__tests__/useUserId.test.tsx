import { renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useUserId,
  USER_UUID_KEY,
  resetUserIdCacheForTest,
} from "../useUserId";

describe("useUserId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // モジュールレベルにメモ化された初期化 Promise をテスト間でリークさせない
    resetUserIdCacheForTest();
  });

  it("returns_stored_uuid_when_uuid_exists_in_async_storage", async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("existing-uuid");

    // Act
    const { result } = renderHook(() => useUserId());

    // Assert
    await waitFor(() => {
      expect(result.current).toBe("existing-uuid");
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("generates_and_saves_new_uuid_when_no_uuid_exists", async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Act
    const { result } = renderHook(() => useUserId());

    // Assert
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      USER_UUID_KEY,
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    );
  });

  it("issues_a_single_shared_uuid_when_multiple_hooks_mount_before_initialization_completes", async () => {
    // Arrange: 未保存の端末（例: ディープリンク起動で複数画面が同時マウント）
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Act: 初期化完了前に複数のフックが同時マウントする
    const { result: first } = renderHook(() => useUserId());
    const { result: second } = renderHook(() => useUserId());

    // Assert
    await waitFor(() => {
      expect(first.current).not.toBeNull();
      expect(second.current).not.toBeNull();
    });
    // 全フックが同一 UUID を返し、保存は一度だけ（二重発行しない）
    expect(first.current).toBe(second.current);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it("retries_initialization_on_next_mount_after_first_load_fails", async () => {
    // Arrange: 1回目の読み込みは失敗、2回目は保存済み値を返す
    (AsyncStorage.getItem as jest.Mock)
      .mockRejectedValueOnce(new Error("storage unavailable"))
      .mockResolvedValueOnce("recovered-uuid");

    // Act: 1回目のマウントは初期化に失敗する
    const { result: failed, unmount } = renderHook(() => useUserId());

    // Assert: 初期化失敗時は userId が null のまま維持される
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });
    expect(failed.current).toBeNull();
    unmount();

    // Act: 2回目のマウントで再試行し、保存済み値を取得できる
    const { result: retried } = renderHook(() => useUserId());

    // Assert
    await waitFor(() => {
      expect(retried.current).toBe("recovered-uuid");
    });
  });
});
