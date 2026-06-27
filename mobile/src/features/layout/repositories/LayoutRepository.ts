import { DefaultApi } from '@/shared/api/apis/DefaultApi';
import type {
    CreateFurnitureInput,
    CreateRoomInput,
    FloorPlan,
    Furniture,
    Room,
    UpdateFurnitureInput,
    UpdateRoomInput,
} from '../types';

/**
 * 間取りデータの CRUD を担うリポジトリ。
 * 生成された DefaultApi を薄くラップし、feature 内の型に変換する。
 * userId は呼び出し元が渡す（MVP では端末保存 UUID）。
 */
export class LayoutRepository {
    constructor(private readonly api: DefaultApi) {}

    async getFloorPlan(userId: string): Promise<FloorPlan> {
        return this.api.getFloorPlan({ xUserId: userId });
    }

    async listRooms(userId: string): Promise<Room[]> {
        return this.api.listRooms({ xUserId: userId });
    }

    async createRoom(userId: string, input: CreateRoomInput): Promise<Room> {
        return this.api.createRoom({ xUserId: userId, roomCreate: input });
    }

    async updateRoom(userId: string, roomId: string, input: UpdateRoomInput): Promise<Room> {
        return this.api.updateRoom({ xUserId: userId, roomId, roomUpdate: input });
    }

    async deleteRoom(userId: string, roomId: string): Promise<void> {
        return this.api.deleteRoom({ xUserId: userId, roomId });
    }

    async createFurniture(
        userId: string,
        roomId: string,
        input: CreateFurnitureInput,
    ): Promise<Furniture> {
        return this.api.createFurniture({ xUserId: userId, roomId, furnitureCreate: input });
    }

    async updateFurniture(
        userId: string,
        furnitureId: string,
        input: UpdateFurnitureInput,
    ): Promise<Furniture> {
        return this.api.updateFurniture({
            xUserId: userId,
            furnitureId,
            furnitureUpdate: input,
        });
    }

    async deleteFurniture(userId: string, furnitureId: string): Promise<void> {
        return this.api.deleteFurniture({ xUserId: userId, furnitureId });
    }
}
