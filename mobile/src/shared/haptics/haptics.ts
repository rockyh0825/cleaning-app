import * as Haptics from 'expo-haptics';

/**
 * ハプティクス（触覚フィードバック）の薄いラッパー。
 * - 呼び出し側が await せず fire-and-forget で使えるよう同期 API にする
 * - Web・シミュレータ・非対応端末では Promise が reject されるため必ず握りつぶす
 *   （フィードバックが出ないだけで、操作自体は成立している）
 */

/** チェックの ON/OFF など選択状態が変わったときの軽いフィードバック */
export function hapticSelection(): void {
    Haptics.selectionAsync().catch(() => {
        // 非対応環境では何もしない
    });
}

/** 記録完了など主要操作の成功フィードバック */
export function hapticSuccess(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {
            // 非対応環境では何もしない
        },
    );
}

/** 記録失敗などエラー発生のフィードバック */
export function hapticError(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {
            // 非対応環境では何もしない
        },
    );
}
