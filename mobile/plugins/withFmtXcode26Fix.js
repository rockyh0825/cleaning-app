/**
 * Xcode 26 の clang では fmt 11.0.2（React Native 0.79 同梱）の
 * consteval フォーマット文字列検証がコンパイルエラーになる。
 * fmt は C++17 以下では consteval を自動無効化する（FMT_CPLUSPLUS < 201709L）ため、
 * Podfile の post_install に「fmt ターゲットのみ C++17 でビルドする」設定を注入する。
 *
 * ios/ は prebuild で再生成される（gitignore 対象）ため、
 * 手で Podfile を編集する代わりに config plugin として永続化している。
 * RN が fmt を新しい clang 対応版へ更新したら削除してよい。
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PATCH_MARKER = "fmt-xcode26-fix";
const PATCH = `
    # ${PATCH_MARKER}: Xcode 26 clang + fmt 11.0.2 の consteval エラー回避（plugins/withFmtXcode26Fix.js が注入）
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
`;

function withFmtXcode26Fix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      if (!contents.includes(PATCH_MARKER)) {
        // react_native_post_install が CLANG_CXX_LANGUAGE_STANDARD を全ターゲットに
        // 上書きするため、必ずその「後」に注入する必要がある
        const anchor = /(react_native_post_install\([\s\S]*?\n\s*\)\n)/;
        if (!anchor.test(contents)) {
          throw new Error(
            "withFmtXcode26Fix: Podfile に react_native_post_install 呼び出しが見つかりません",
          );
        }
        contents = contents.replace(anchor, `$1${PATCH}`);
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}

module.exports = withFmtXcode26Fix;
