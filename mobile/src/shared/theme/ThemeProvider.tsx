import React, { createContext } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './tokens';
import type { AppTheme } from './tokens';

// Provider 外で useAppTheme が呼ばれた場合はライトテーマにフォールバックする
export const ThemeContext = createContext<AppTheme>(lightTheme);

type Props = { children: React.ReactNode };

export function ThemeProvider({ children }: Props) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
