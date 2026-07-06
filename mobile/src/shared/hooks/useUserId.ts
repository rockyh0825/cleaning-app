import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const USER_UUID_KEY = "user-uuid";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * AsyncStorage から匿名ユーザーIDを読み込み、無ければ新規発行して保存する。
 * 「読み込み→(無ければ)生成して保存」を単一の非同期処理として完結させる。
 */
async function loadOrCreateUserId(): Promise<string> {
  const stored = await AsyncStorage.getItem(USER_UUID_KEY);
  if (stored) {
    return stored;
  }
  const newUuid = generateUUID();
  await AsyncStorage.setItem(USER_UUID_KEY, newUuid);
  return newUuid;
}

/**
 * 初期化 Promise をモジュールレベルでメモ化する。
 * 複数フックが同時マウントしても全呼び出しが同一 Promise を共有するため、
 * get→set が単一の処理に集約され UUID の二重発行を防ぐ。
 */
let initPromise: Promise<string> | null = null;

function getUserIdPromise(): Promise<string> {
  if (!initPromise) {
    initPromise = loadOrCreateUserId().catch((error) => {
      // 失敗時はキャッシュを破棄し、次回マウントで再試行できるようにする
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

/**
 * 端末保存の匿名ユーザーID（UUID v4）を返す。
 * 初回起動時は新規発行して AsyncStorage に保存する（MVP の認証代替）。
 * 読み込みが完了するまでは null を返す。
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUserIdPromise().then((id) => {
      if (!cancelled) setUserId(id);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return userId;
}

/**
 * テスト専用: モジュールレベルにメモ化された初期化 Promise を破棄する。
 * テスト間で Promise がリークしないよう beforeEach 等でリセットするために使う。
 */
export function resetUserIdCacheForTest(): void {
  initPromise = null;
}
