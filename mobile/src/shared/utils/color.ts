/**
 * hex カラー文字列（#RGB / #RRGGBB）に不透明度を適用して rgba() 文字列を返す。
 * 「hex + アルファ2桁の文字列連結」はトークンが 6桁 hex である暗黙前提に依存するため、
 * トークン値の変更（3桁 hex 化・rgb() 化など）に頑健なこのヘルパーを使う。
 * hex として解釈できない色（rgba() 等）は変換せずそのまま返す（フェイルセーフ）。
 */
export function withAlpha(color: string, alpha: number): string {
    const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(color);
    if (!match) return color;

    let hex = match[1];
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((c) => c + c)
            .join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = Math.min(1, Math.max(0, alpha));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}
