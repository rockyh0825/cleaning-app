import type { RoomType } from '@/shared/api/models/RoomType';

export type { RoomType };

// OpenAPI の minProperties: 1 を型レベルで強制するユーティリティ型
type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

/**
 * 家具の回転角（度・時計回り）。契約の enum [0, 90, 180, 270] と対応する。
 * 占有矩形を軸平行に保つため 90 度刻みのみ許容する。
 */
export type Rotation = 0 | 90 | 180 | 270;

export type Room = {
    id: string;
    name: string;
    type: RoomType;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    createdAt: Date;
    updatedAt: Date;
};

export type Furniture = {
    id: string;
    roomId: string;
    name: string;
    presetKey?: string | null;
    gridX: number;
    gridY: number;
    /** 回転後の占有幅（セル数）。rotation が 90/270 なら素材の高さと入れ替わる */
    gridW: number;
    /** 回転後の占有高さ（セル数）。rotation が 90/270 なら素材の幅と入れ替わる */
    gridH: number;
    rotation: Rotation;
    createdAt: Date;
    updatedAt: Date;
};

export type RoomWithFurniture = Room & { furniture: Furniture[] };

export type FloorPlan = { rooms: RoomWithFurniture[] };

export type CreateRoomInput = {
    name: string;
    type: RoomType;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
};

export type UpdateRoomInput = RequireAtLeastOne<{
    name: string;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
}>;

export type CreateFurnitureInput = {
    name: string;
    presetKey?: string | null;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    /** 省略時は未回転（0度） */
    rotation?: Rotation;
};

export type UpdateFurnitureInput = RequireAtLeastOne<{
    name: string;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    rotation: Rotation;
}>;
