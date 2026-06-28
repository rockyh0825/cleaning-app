import type { CleaningRecord as ApiCleaningRecord } from '@/shared/api/models/CleaningRecord';
import { DefaultApi } from '@/shared/api/apis/DefaultApi';
import type { CleaningRecord, CreateRecordInput, ListRecordsParams } from '../types';

/**
 * 掃除記録の CRUD を担うリポジトリ。
 * 生成された DefaultApi を薄くラップし、feature 内の型に変換する。
 * userId は呼び出し元が渡す（MVP では端末保存 UUID）。
 */
export class CleaningRecordRepository {
    constructor(private readonly api: DefaultApi) {}

    async createRecords(userId: string, input: CreateRecordInput): Promise<CleaningRecord[]> {
        const data = await this.api.createCleaningRecords({
            xUserId: userId,
            cleaningRecordCreate: input,
        });
        return data.map((r) => this.toCleaningRecord(r));
    }

    async listRecords(userId: string, params: ListRecordsParams): Promise<CleaningRecord[]> {
        const requestParams: Parameters<typeof this.api.listCleaningRecords>[0] = {
            xUserId: userId,
            ...(params.partId !== undefined && { partId: params.partId }),
            ...(params.page !== undefined && { page: params.page }),
            ...(params.pageSize !== undefined && { pageSize: params.pageSize }),
        };
        const data = await this.api.listCleaningRecords(requestParams);
        return data.items.map((r) => this.toCleaningRecord(r));
    }

    async deleteRecord(userId: string, recordId: string): Promise<void> {
        return this.api.deleteCleaningRecord({ xUserId: userId, recordId });
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
}
