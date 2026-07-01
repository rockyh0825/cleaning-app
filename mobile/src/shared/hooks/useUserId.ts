import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_UUID_KEY = "user-uuid";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function initUserId() {
      const stored = await AsyncStorage.getItem(USER_UUID_KEY);
      if (stored) {
        setUserId(stored);
      } else {
        const newUuid = generateUUID();
        await AsyncStorage.setItem(USER_UUID_KEY, newUuid);
        setUserId(newUuid);
      }
    }
    initUserId();
  }, []);

  return userId;
}
