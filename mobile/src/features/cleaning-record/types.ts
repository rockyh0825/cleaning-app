export type CleaningRecord = {
    id: string;
    partId: string;
    cleanedAt: Date;
    note?: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateRecordInput = {
    partIds: string[];
    cleanedAt?: Date;
    note?: string | null;
};

export type ListRecordsParams = {
    partId?: string;
    page?: number;
    pageSize?: number;
};
