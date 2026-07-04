import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { AppTheme } from './tokens';

export function useAppTheme(): AppTheme {
    return useContext(ThemeContext);
}
