import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_UUID_KEY = 'user-uuid';

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
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

        async function initUserId() {
            const stored = await AsyncStorage.getItem(USER_UUID_KEY);
            if (stored) {
                if (!cancelled) setUserId(stored);
                return;
            }
            const newUuid = generateUUID();
            await AsyncStorage.setItem(USER_UUID_KEY, newUuid);
            if (!cancelled) setUserId(newUuid);
        }

        initUserId();
        return () => {
            cancelled = true;
        };
    }, []);

    return userId;
}
