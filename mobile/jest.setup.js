import 'react-native-gesture-handler/jestSetup';

require('react-native-reanimated').setUpTests();

// SafeAreaProvider なしで useSafeAreaInsets を使うコンポーネントを描画できるようにする
// （ライブラリ公式の jest モック。insets は全辺 0 を返す）
jest.mock('react-native-safe-area-context', () =>
    require('react-native-safe-area-context/jest/mock').default,
);
