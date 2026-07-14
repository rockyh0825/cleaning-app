import type { Rotation } from '../types';
import { clampWithin } from '@/shared/utils/grid';

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
 * 家具を部屋の中で時計回りに 90 度回した結果のパッチを返す。
 *
 * 90 度回すたびに占有矩形の縦横は必ず入れ替わるため gridW/gridH をスワップする。
 * こうすると占有矩形は常に軸平行のままなので、当たり判定・クランプ・リサイズは
 * 回転を一切意識しなくてよい（設計の要）。
 *
 * 入れ替えたサイズが部屋に収まらない場合は、縮めるのではなく回転自体を諦めて null を返す。
 * サイズを部屋に合わせて切り詰めると、次の回転で元のサイズへ戻れず情報が永久に失われる
 * （例: 4x2 の部屋の 3x1 を 4 回まわすと 2x1 に痩せる）。位置のクランプは移動で復元できるので許容する。
 *
 * @returns 回転後の rotation・占有サイズ・クランプ済み座標。収まらない場合は null
 */
export function rotateClockwiseWithin(
    furniture: {
        gridX: number;
        gridY: number;
        gridW: number;
        gridH: number;
        rotation: Rotation;
    },
    room: { gridW: number; gridH: number },
): { rotation: Rotation; gridW: number; gridH: number; gridX: number; gridY: number } | null {
    const rotated = { w: furniture.gridH, h: furniture.gridW };

    if (rotated.w > room.gridW || rotated.h > room.gridH) return null;

    // 家具座標は部屋相対（0基点）。可動域は部屋サイズの相対矩形
    const clamped = clampWithin(
        { x: furniture.gridX, y: furniture.gridY, w: rotated.w, h: rotated.h },
        { x: 0, y: 0, w: room.gridW, h: room.gridH },
    );

    return {
        rotation: nextRotation(furniture.rotation),
        gridW: clamped.w,
        gridH: clamped.h,
        gridX: clamped.x,
        gridY: clamped.y,
    };
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
