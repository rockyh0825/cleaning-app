import type { CleaningRecord as ApiCleaningRecord } from "@/shared/api/models/CleaningRecord";
import type { Part as ApiPart } from "@/shared/api/models/Part";
import { DefaultApi } from "@/shared/api/apis/DefaultApi";
import type {
  CleaningRecord,
  CreateRecordInput,
  CreatePartInput,
  ListRecordsParams,
  Part,
  UpdatePartInput,
  UpdateRecordInput,
} from "../types";

/**
 * 掃除記録の CRUD を担うリポジトリ。
 * 生成された DefaultApi を薄くラップし、feature 内の型に変換する。
 * userId は呼び出し元が渡す（MVP では端末保存 UUID）。
 */
export class CleaningRecordRepository {
  constructor(private readonly api: DefaultApi) {}

  async createRecords(
    userId: string,
    input: CreateRecordInput,
  ): Promise<CleaningRecord[]> {
    const data = await this.api.createCleaningRecords({
      xUserId: userId,
      cleaningRecordCreate: input,
    });
    return data.map((r) => this.toCleaningRecord(r));
  }

  async listRecords(
    userId: string,
    params: ListRecordsParams,
  ): Promise<CleaningRecord[]> {
    const requestParams: Parameters<typeof this.api.listCleaningRecords>[0] = {
      xUserId: userId,
      ...(params.partId !== undefined && { partId: params.partId }),
      ...(params.page !== undefined && { page: params.page }),
      ...(params.pageSize !== undefined && { pageSize: params.pageSize }),
    };
    const data = await this.api.listCleaningRecords(requestParams);
    return data.items.map((r) => this.toCleaningRecord(r));
  }

  async updateRecord(
    userId: string,
    recordId: string,
    input: UpdateRecordInput,
  ): Promise<CleaningRecord> {
    const data = await this.api.updateCleaningRecord({
      xUserId: userId,
      recordId,
      cleaningRecordUpdate: input,
    });
    return this.toCleaningRecord(data);
  }

  async deleteRecord(userId: string, recordId: string): Promise<void> {
    return this.api.deleteCleaningRecord({ xUserId: userId, recordId });
  }

  async createPart(userId: string, input: CreatePartInput): Promise<Part> {
    const data = await this.api.createPart({
      xUserId: userId,
      partCreate: input,
    });
    return this.toPart(data);
  }

  async updatePart(
    userId: string,
    partId: string,
    input: UpdatePartInput,
  ): Promise<Part> {
    const data = await this.api.updatePart({
      xUserId: userId,
      partId,
      partUpdate: input,
    });
    return this.toPart(data);
  }

  async deletePart(userId: string, partId: string): Promise<void> {
    return this.api.deletePart({ xUserId: userId, partId });
  }

  async listParts(userId: string): Promise<Part[]> {
    const data = await this.api.listParts({ xUserId: userId });
    return data.map((p) => this.toPart(p));
  }

  private toCleaningRecord(api: ApiCleaningRecord): CleaningRecord {
    return {
      id: api.id,
      partId: api.partId,
      cleanedAt: api.cleanedAt,
      note: api.note,
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
    };
  }

  private toPart(api: ApiPart): Part {
    return {
      id: api.id,
      ownerType: api.ownerType as Part["ownerType"],
      ownerId: api.ownerId,
      name: api.name,
      recommendedCycleDays: api.recommendedCycleDays,
      lastCleanedAt: api.lastCleanedAt ?? null,
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
    };
  }
}
