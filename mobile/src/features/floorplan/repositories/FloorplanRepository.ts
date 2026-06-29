import type {
    Room as ApiRoom,
    Furniture as ApiFurniture,
    RoomWithFurniture as ApiRoomWithFurniture,
} from '@/shared/api/models';
import { DefaultApi } from '@/shared/api/apis/DefaultApi';
import type {
    CreateFurnitureInput,
    CreateRoomInput,
    Floorplan,
    Furniture,
    Room,
    RoomWithFurniture,
    UpdateFurnitureInput,
    UpdateRoomInput,
} from '../types';

/**
 * 間取りデータの CRUD を担うリポジトリ。
 * 生成された DefaultApi を薄くラップし、feature 内の型に変換する。
 * userId は呼び出し元が渡す（MVP では端末保存 UUID）。
 */
export class FloorplanRepository {
    constructor(private readonly api: DefaultApi) {}

    async getFloorplan(userId: string): Promise<Floorplan> {
        const data = await this.api.getFloorMap({ xUserId: userId });
        return { rooms: data.rooms.map((r: ApiRoomWithFurniture) => this.toRoomWithFurniture(r)) };
    }

    async listRooms(userId: string): Promise<Room[]> {
        const data = await this.api.listRooms({ xUserId: userId });
        return data.map((r) => this.toRoom(r));
    }

    async createRoom(userId: string, input: CreateRoomInput): Promise<Room> {
        const data = await this.api.createRoom({ xUserId: userId, roomCreate: input });
        return this.toRoom(data);
    }

    async updateRoom(userId: string, roomId: string, input: UpdateRoomInput): Promise<Room> {
        const data = await this.api.updateRoom({ xUserId: userId, roomId, roomUpdate: input });
        return this.toRoom(data);
    }

    async deleteRoom(userId: string, roomId: string): Promise<void> {
        return this.api.deleteRoom({ xUserId: userId, roomId });
    }

    async createFurniture(
        userId: string,
        roomId: string,
        input: CreateFurnitureInput,
    ): Promise<Furniture> {
        const data = await this.api.createFurniture({
            xUserId: userId,
            roomId,
            furnitureCreate: input,
        });
        return this.toFurniture(data);
    }

    async updateFurniture(
        userId: string,
        furnitureId: string,
        input: UpdateFurnitureInput,
    ): Promise<Furniture> {
        const data = await this.api.updateFurniture({
            xUserId: userId,
            furnitureId,
            furnitureUpdate: input,
        });
        return this.toFurniture(data);
    }

    async deleteFurniture(userId: string, furnitureId: string): Promise<void> {
        return this.api.deleteFurniture({ xUserId: userId, furnitureId });
    }

    private toRoom(api: ApiRoom): Room {
        return {
            id: api.id,
            name: api.name,
            type: api.type,
            gridX: api.gridX,
            gridY: api.gridY,
            gridW: api.gridW,
            gridH: api.gridH,
            createdAt: api.createdAt,
            updatedAt: api.updatedAt,
        };
    }

    private toFurniture(api: ApiFurniture): Furniture {
        return {
            id: api.id,
            roomId: api.roomId,
            name: api.name,
            presetKey: api.presetKey,
            gridX: api.gridX,
            gridY: api.gridY,
            gridW: api.gridW,
            gridH: api.gridH,
            createdAt: api.createdAt,
            updatedAt: api.updatedAt,
        };
    }

    private toRoomWithFurniture(api: ApiRoomWithFurniture): RoomWithFurniture {
        return {
            ...this.toRoom(api),
            furniture: api.furniture.map((f) => this.toFurniture(f)),
        };
    }
}
