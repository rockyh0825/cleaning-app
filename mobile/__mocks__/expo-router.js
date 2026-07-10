// expo-router の自動マニュアルモック（jest がテストごとに自動適用する）。
// 実体は expo-asset 等のネイティブ初期化を含み Jest では読み込めないため、
// テストが必要とする最小の面だけを提供する。
// 挙動を検証したいテストは従来どおり jest.mock('expo-router', factory) で上書きできる。
const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
};

module.exports = {
    router,
    useRouter: jest.fn(() => router),
    useLocalSearchParams: jest.fn(() => ({})),
    // フォーカス発火はテスト側が登録済みコールバックを明示的に呼んで再現する
    useFocusEffect: jest.fn(),
    Redirect: () => null,
};
