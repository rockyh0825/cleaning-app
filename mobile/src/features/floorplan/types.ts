import type { RoomType } from '@/shared/api/models/RoomType';

export type { RoomType };

// OpenAPI の minProperties: 1 を型レベルで強制するユーティリティ型
type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

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
    gridW: number;
    gridH: number;
    createdAt: Date;
    updatedAt: Date;
};

export type RoomWithFurniture = Room & { furniture: Furniture[] };

export type Floorplan = { rooms: RoomWithFurniture[] };

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
};

export type UpdateFurnitureInput = RequireAtLeastOne<{
    name: string;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
}>;
