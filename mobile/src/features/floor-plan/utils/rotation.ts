import type { Rotation } from '../types';

/** 1タップあたりの回転量（度）。時計回り */
const ROTATION_STEP = 90;
const FULL_TURN = 360;

/**
 * 時計回りに 90 度進めた角度を返す。270 の次は 360 ではなく 0 に戻る。
 */
export function nextRotation(rotation: Rotation): Rotation {
    return ((rotation + ROTATION_STEP) % FULL_TURN) as Rotation;
}

/**
 * 90/270 度では素材（未回転で設計されたアートワーク）の座標系の縦横が入れ替わる。
 * グリフ描画側が素材の寸法を決めるのに使う。
 */
export function isQuarterTurn(rotation: Rotation): boolean {
    return rotation === 90 || rotation === 270;
}

/**
 * 家具を時計回りに 90 度回した結果のパッチを返す。部屋は見ないし、拒否もしない。
 *
 * 90 度回すたびに占有矩形の縦横は必ず入れ替わるため gridW/gridH をスワップする。
 * こうすると占有矩形は常に軸平行のままなので、当たり判定・クランプ・リサイズは
 * 回転を一切意識しなくてよい（設計の要）。
 *
 * ピボットは家具の**中心**。左上を固定して回すと 3x1 が縦に伸びた分だけ下へせり出し、
 * それを部屋の中へクランプすると家具が一方向へ「歩く」。クランプは押し戻すだけで
 * 引き戻さない片道ラチェットなので、一周しても元の位置へ帰らず抜けた跡が余白として残る
 * （例: 4x4 の部屋の 3x1 を (1,2) から 4 回まわすと (1,1) に居座る）。
 * 中心ピボットなら回転は純粋な可逆変換になり、その場で回るという直感とも一致する。
 *
 * 収まるかどうかの判定は呼び出し側（fitsWithin）の責務。はみ出す回転もそのまま返し、
 * 保存するか保留にするかは画面が決める。ここで拒否すると「回せないので直せない」に陥る。
 */
export function rotateClockwise(furniture: {
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    rotation: Rotation;
}): { rotation: Rotation; gridW: number; gridH: number; gridX: number; gridY: number } {
    // 中心を保ったまま縦横を入れ替えると、左上は各軸へ ±(gridW - gridH)/2 だけ動く
    const halfDelta = (furniture.gridW - furniture.gridH) / 2;
    // 辺の長さの差が奇数だと中心が半セルずれ、丸めなしにはグリッドへ戻せない。
    // 0/180 では切り捨て・90/270 では切り上げと向きを対にすることで、往路で落とした
    // 半セルを復路で必ず拾い直す（同じ向きに丸めると 1 タップごとに半セルずつ歩く）
    const snap = isQuarterTurn(furniture.rotation) ? Math.ceil : Math.floor;

    return {
        rotation: nextRotation(furniture.rotation),
        gridW: furniture.gridH,
        gridH: furniture.gridW,
        gridX: snap(furniture.gridX + halfDelta),
        gridY: snap(furniture.gridY - halfDelta),
    };
}

/**
 * 家具の占有矩形が部屋の中に完全に収まっているか判定する。
 * 家具座標は部屋相対（0基点）なので、部屋側は原点とサイズだけで表せる。
 */
export function fitsWithin(
    furniture: { gridX: number; gridY: number; gridW: number; gridH: number },
    room: { gridW: number; gridH: number },
): boolean {
    return (
        furniture.gridX >= 0 &&
        furniture.gridY >= 0 &&
        furniture.gridX + furniture.gridW <= room.gridW &&
        furniture.gridY + furniture.gridH <= room.gridH
    );
}

/**
 * 回転後のフットプリント w×h(px) に、未回転の素材座標系で描いたグリフを収める
 * SVG transform を返す。0 度は transform 不要なので undefined。
 *
 * rotate() は原点まわりに回すため、素材はフットプリントの外（負の座標）へ出てしまう。
 * それを translate で押し戻して両者を一致させる。
 * transform は左から順に「後で適用」＝ rotate → translate の順で効く。
 */
export function rotationTransform(
    rotation: Rotation,
    w: number,
    h: number,
): string | undefined {
    switch (rotation) {
        case 90:
            // rotate(90) で x が [-w, 0] に写るため w だけ右へ戻す
            return `translate(${w}, 0) rotate(90)`;
        case 180:
            // rotate(180) で x,y ともに負側へ写るため両軸を戻す
            return `translate(${w}, ${h}) rotate(180)`;
        case 270:
            // rotate(270) で y が [-h, 0] に写るため h だけ下へ戻す
            return `translate(0, ${h}) rotate(270)`;
        default:
            return undefined;
    }
}
