/**
 * CleaningRecordRepository のテスト。
 * shared/api は gitignore 対象の生成コードのため、テスト内にスタブ型を定義して依存を切る。
 */

// --- スタブ型 (生成コードを参照しない) ---

interface ApiCleaningRecord {
    id: string;
    partId: string;
    cleanedAt: Date;
    note?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ApiCleaningRecordList {
    items: ApiCleaningRecord[];
    total: number;
    page: number;
    pageSize: number;
}

// --- テスト用ファクトリ ---

const makeApiCleaningRecord = (overrides: Partial<ApiCleaningRecord> = {}): ApiCleaningRecord => ({
    id: 'record-1',
    partId: 'part-1',
    cleanedAt: new Date('2024-06-01T10:00:00Z'),
    note: null,
    createdAt: new Date('2024-06-01T10:00:00Z'),
    updatedAt: new Date('2024-06-01T10:00:00Z'),
    ...overrides,
});

// --- モック API ---

const mockApi = () =>
    ({
        createCleaningRecords: jest.fn(),
        listCleaningRecords: jest.fn(),
        deleteCleaningRecord: jest.fn(),
    }) as Record<string, jest.Mock>;

// CleaningRecordRepository を直接 import する（shared/api の型を通じた検証は不要）
const { CleaningRecordRepository } = require('../CleaningRecordRepository') as {
    CleaningRecordRepository: new (api: Record<string, jest.Mock>) => {
        createRecords(userId: string, input: { partIds: string[]; cleanedAt?: Date; note?: string | null }): Promise<ApiCleaningRecord[]>;
        listRecords(userId: string, params: { partId?: string; page?: number; pageSize?: number }): Promise<ApiCleaningRecord[]>;
        deleteRecord(userId: string, recordId: string): Promise<void>;
    };
};

describe('CleaningRecordRepository', () => {
    const userId = 'user-uuid-1';

    describe('createRecords', () => {
        it('returns_created_cleaning_records_list', async () => {
            // Arrange
            const api = mockApi();
            const records = [
                makeApiCleaningRecord({ id: 'record-1', partId: 'part-1' }),
                makeApiCleaningRecord({ id: 'record-2', partId: 'part-2' }),
            ];
            api.createCleaningRecords.mockResolvedValue(records);
            const repo = new CleaningRecordRepository(api);
            const input = { partIds: ['part-1', 'part-2'] };

            // Act
            const result = await repo.createRecords(userId, input);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('record-1');
            expect(result[0].partId).toBe('part-1');
            expect(result[1].id).toBe('record-2');
        });

        it('calls_api_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.createCleaningRecords.mockResolvedValue([makeApiCleaningRecord()]);
            const repo = new CleaningRecordRepository(api);
            const input = { partIds: ['part-1'] };

            // Act
            await repo.createRecords(userId, input);

            // Assert
            expect(api.createCleaningRecords).toHaveBeenCalledWith({
                xUserId: userId,
                cleaningRecordCreate: input,
            });
        });

        it('passes_optional_cleanedAt_and_note_to_api', async () => {
            // Arrange
            const api = mockApi();
            const cleanedAt = new Date('2024-06-01T12:00:00Z');
            api.createCleaningRecords.mockResolvedValue([makeApiCleaningRecord({ note: 'メモ' })]);
            const repo = new CleaningRecordRepository(api);
            const input = { partIds: ['part-1'], cleanedAt, note: 'メモ' };

            // Act
            await repo.createRecords(userId, input);

            // Assert
            expect(api.createCleaningRecords).toHaveBeenCalledWith({
                xUserId: userId,
                cleaningRecordCreate: input,
            });
        });

        it('returns_empty_list_when_api_returns_empty_array', async () => {
            // Arrange
            const api = mockApi();
            api.createCleaningRecords.mockResolvedValue([]);
            const repo = new CleaningRecordRepository(api);

            // Act
            const result = await repo.createRecords(userId, { partIds: ['part-1'] });

            // Assert
            expect(result).toHaveLength(0);
        });
    });

    describe('listRecords', () => {
        it('returns_list_of_cleaning_records', async () => {
            // Arrange
            const api = mockApi();
            const recordList: ApiCleaningRecordList = {
                items: [
                    makeApiCleaningRecord({ id: 'r1', partId: 'part-A' }),
                    makeApiCleaningRecord({ id: 'r2', partId: 'part-B' }),
                ],
                total: 2,
                page: 1,
                pageSize: 20,
            };
            api.listCleaningRecords.mockResolvedValue(recordList);
            const repo = new CleaningRecordRepository(api);

            // Act
            const result = await repo.listRecords(userId, {});

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('r1');
            expect(result[1].id).toBe('r2');
        });

        it('calls_api_with_partId_filter_when_provided', async () => {
            // Arrange
            const api = mockApi();
            api.listCleaningRecords.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
            const repo = new CleaningRecordRepository(api);

            // Act
            await repo.listRecords(userId, { partId: 'part-1' });

            // Assert
            expect(api.listCleaningRecords).toHaveBeenCalledWith({
                xUserId: userId,
                partId: 'part-1',
            });
        });

        it('calls_api_without_partId_when_not_provided', async () => {
            // Arrange
            const api = mockApi();
            api.listCleaningRecords.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
            const repo = new CleaningRecordRepository(api);

            // Act
            await repo.listRecords(userId, {});

            // Assert
            expect(api.listCleaningRecords).toHaveBeenCalledWith({
                xUserId: userId,
            });
        });

        it('returns_empty_list_when_no_records_exist', async () => {
            // Arrange
            const api = mockApi();
            api.listCleaningRecords.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
            const repo = new CleaningRecordRepository(api);

            // Act
            const result = await repo.listRecords(userId, {});

            // Assert
            expect(result).toHaveLength(0);
        });

        it('maps_record_fields_correctly', async () => {
            // Arrange
            const api = mockApi();
            const cleanedAt = new Date('2024-06-15T09:30:00Z');
            const record = makeApiCleaningRecord({
                id: 'record-abc',
                partId: 'part-xyz',
                cleanedAt,
                note: '丁寧に掃除した',
            });
            api.listCleaningRecords.mockResolvedValue({ items: [record], total: 1, page: 1, pageSize: 20 });
            const repo = new CleaningRecordRepository(api);

            // Act
            const result = await repo.listRecords(userId, {});

            // Assert
            expect(result[0].id).toBe('record-abc');
            expect(result[0].partId).toBe('part-xyz');
            expect(result[0].cleanedAt).toEqual(cleanedAt);
            expect(result[0].note).toBe('丁寧に掃除した');
        });
    });

    describe('deleteRecord', () => {
        it('calls_api_delete_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.deleteCleaningRecord.mockResolvedValue(undefined);
            const repo = new CleaningRecordRepository(api);

            // Act
            await repo.deleteRecord(userId, 'record-1');

            // Assert
            expect(api.deleteCleaningRecord).toHaveBeenCalledWith({
                xUserId: userId,
                recordId: 'record-1',
            });
        });

        it('resolves_without_returning_a_value', async () => {
            // Arrange
            const api = mockApi();
            api.deleteCleaningRecord.mockResolvedValue(undefined);
            const repo = new CleaningRecordRepository(api);

            // Act
            const result = await repo.deleteRecord(userId, 'record-1');

            // Assert
            expect(result).toBeUndefined();
        });
    });
});

export {};
