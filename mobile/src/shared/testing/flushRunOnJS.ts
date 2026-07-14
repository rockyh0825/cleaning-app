import { act } from '@testing-library/react-native';

/**
 * ジェスチャーのコールバック（onEnd 等）は runOnJS 経由で JS スレッドに渡るため、
 * 状態更新は次のマクロタスクで反映される。waitFor のポーリング待ちに任せると
 * 解決まで 1 秒近くかかり CI の実行速度によってはデフォルトのタイムアウトを
 * 超えるため、テスト側から明示的に流し切る。
 *
 * fireGestureHandler の直後に await して使う。
 */
export async function flushRunOnJS(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setImmediate(resolve));
    });
}
