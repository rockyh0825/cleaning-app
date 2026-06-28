export type OwnerType = 'ROOM' | 'FURNITURE';

export type Part = {
    id: string;
    ownerType: OwnerType;
    ownerId: string;
    name: string;
    recommendedCycleDays: number;
    lastCleanedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type CreatePartInput = {
    ownerType: OwnerType;
    ownerId: string;
    name: string;
    recommendedCycleDays?: number;
};

export type UpdatePartInput = {
    name?: string;
    recommendedCycleDays?: number;
};

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

export type UpdateRecordInput = {
    cleanedAt?: Date;
    note?: string | null;
};

export type ListRecordsParams = {
    partId?: string;
    page?: number;
    pageSize?: number;
};
