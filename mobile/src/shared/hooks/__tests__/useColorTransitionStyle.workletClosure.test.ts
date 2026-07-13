import { transformSync } from '@babel/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * useAnimatedStyle の worklet は Babel プラグインが閉包（__closure）に詰めた変数
 * だけを UI スレッドへ運ぶ。computed key（[property]: ...）のみで参照した変数は
 * プラグイン（3.17 系）が捕捉せず、実行時に「Property 'property' doesn't exist」で
 * クラッシュする（issue #173）。実機と同じ Babel 設定で変換し、閉包に property が
 * 含まれることを回帰テストとして保証する。
 */
describe('useColorTransitionStyle worklet closure', () => {
    it('captures_property_argument_in_worklet_closure_so_ui_thread_can_resolve_it', () => {
        // Arrange: フックの実ソースを実機と同じ Babel 設定で変換する
        const hookPath = path.resolve(__dirname, '../useColorTransitionStyle.ts');
        const source = fs.readFileSync(hookPath, 'utf8');

        // Act
        const result = transformSync(source, {
            filename: hookPath,
            presets: ['babel-preset-expo'],
            plugins: ['react-native-reanimated/plugin'],
            babelrc: false,
            configFile: false,
        });

        // Assert: useAnimatedStyle worklet（progress を参照するもの）の閉包に
        // property が捕捉されていること
        const closures = [...result!.code!.matchAll(/__closure\s*=\s*\{([^}]*)\}/g)].map(
            (m) => m[1],
        );
        const styleWorkletClosure = closures.find((c) => c.includes('progress'));
        expect(styleWorkletClosure).toBeDefined();
        expect(styleWorkletClosure).toContain('property');
    });
});
