import type { RoomType } from '@/shared/api/models/RoomType';

export type { RoomType };

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

export type FloorPlan = { rooms: RoomWithFurniture[] };

export type CreateRoomInput = {
    name: string;
    type: RoomType;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
};

export type UpdateRoomInput = {
    name?: string;
    gridX?: number;
    gridY?: number;
    gridW?: number;
    gridH?: number;
};

export type CreateFurnitureInput = {
    name: string;
    presetKey?: string | null;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
};

export type UpdateFurnitureInput = {
    name?: string;
    gridX?: number;
    gridY?: number;
    gridW?: number;
    gridH?: number;
};
