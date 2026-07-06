/**
 * MockDefaultApi のパーツ・掃除記録データを保持するメモリストア。
 * 部屋・家具（FloorPlanStore の責務）は関知しない。
 * 部屋・家具の削除に伴うパーツのカスケード削除は、所有者ID一覧を受け取る
 * `deletePartsForOwners` を MockDefaultApi から呼び出すことで行う。
 */

import type {
  CreateCleaningRecordsRequest,
  CreatePartRequest,
  DeleteCleaningRecordRequest,
  DeletePartRequest,
  ListCleaningRecordsRequest,
  ListPartsRequest,
  UpdateCleaningRecordRequest,
  UpdatePartRequest,
} from "@/shared/api/apis/DefaultApi";
import type {
  CleaningRecord,
  CleaningRecordList,
  Part,
} from "@/shared/api/models";

function notFoundError(entity: string, id: string): Error {
  return new Error(`${entity} not found: ${id}`);
}

export class CleaningRecordStore {
  private readonly parts = new Map<string, Part>();
  private readonly cleaningRecords = new Map<string, CleaningRecord>();
  private idSequence = 0;

  constructor(initialRoomIds: string[]) {
    this.seedFixtures(initialRoomIds);
  }

  private nextId(prefix: string): string {
    this.idSequence += 1;
    return `mock-${prefix}-${this.idSequence}`;
  }

  private seedFixtures(initialRoomIds: string[]): void {
    const now = new Date("2024-01-01T00:00:00.000Z");
    initialRoomIds.forEach((roomId) => this.seedFloorPart(roomId, now));
  }

  /**
   * 部屋のデフォルトパーツ「床」を作成する。
   * 起動時のフィクスチャ部屋に加え、起動後に UI から作成された部屋にも適用する
   * （これが無いと MOCK_START_EMPTY ビルドではパーツが一切存在せず、
   * 掃除記録フローに到達できない）。
   */
  seedFloorPart(roomId: string, timestamp: Date = new Date()): void {
    const floorPart: Part = {
      id: this.nextId("part"),
      ownerType: "ROOM" as Part["ownerType"],
      ownerId: roomId,
      name: "床",
      recommendedCycleDays: 7,
      lastCleanedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.parts.set(floorPart.id, floorPart);
  }

  private recomputeLastCleanedAt(partId: string): void {
    const part = this.parts.get(partId);
    if (!part) return;
    const recordsForPart = Array.from(this.cleaningRecords.values()).filter(
      (r) => r.partId === partId,
    );
    if (recordsForPart.length === 0) {
      this.parts.set(partId, { ...part, lastCleanedAt: null });
      return;
    }
    const latest = recordsForPart.reduce(
      (max, r) => (r.cleanedAt.getTime() > max.getTime() ? r.cleanedAt : max),
      recordsForPart[0].cleanedAt,
    );
    this.parts.set(partId, { ...part, lastCleanedAt: latest });
  }

  private deletePartCascade(partId: string): void {
    Array.from(this.cleaningRecords.values())
      .filter((r) => r.partId === partId)
      .forEach((r) => this.cleaningRecords.delete(r.id));
    this.parts.delete(partId);
  }

  /** 指定した所有者（部屋ID・家具ID）が持つパーツと、その掃除記録をまとめて削除する。 */
  deletePartsForOwners(ownerIds: string[]): void {
    const ownerIdSet = new Set(ownerIds);
    Array.from(this.parts.values())
      .filter((p) => ownerIdSet.has(p.ownerId))
      .forEach((p) => this.deletePartCascade(p.id));
  }

  async listParts(requestParameters: ListPartsRequest): Promise<Array<Part>> {
    const all = Array.from(this.parts.values());
    if (requestParameters.ownerId === undefined) return all;
    return all.filter((p) => p.ownerId === requestParameters.ownerId);
  }

  async createPart(requestParameters: CreatePartRequest): Promise<Part> {
    const now = new Date();
    const part: Part = {
      id: this.nextId("part"),
      recommendedCycleDays: 7,
      lastCleanedAt: null,
      ...requestParameters.partCreate,
      createdAt: now,
      updatedAt: now,
    };
    this.parts.set(part.id, part);
    return part;
  }

  async updatePart(requestParameters: UpdatePartRequest): Promise<Part> {
    const existing = this.parts.get(requestParameters.partId);
    if (!existing) throw notFoundError("Part", requestParameters.partId);
    const updated: Part = {
      ...existing,
      ...requestParameters.partUpdate,
      updatedAt: new Date(),
    };
    this.parts.set(updated.id, updated);
    return updated;
  }

  async deletePart(requestParameters: DeletePartRequest): Promise<void> {
    const { partId } = requestParameters;
    if (!this.parts.has(partId)) throw notFoundError("Part", partId);
    this.deletePartCascade(partId);
  }

  async createCleaningRecords(
    requestParameters: CreateCleaningRecordsRequest,
  ): Promise<Array<CleaningRecord>> {
    const { partIds, cleanedAt, note } = requestParameters.cleaningRecordCreate;
    const effectiveCleanedAt = cleanedAt ?? new Date();
    const created = partIds.map((partId) => {
      if (!this.parts.has(partId)) throw notFoundError("Part", partId);
      const now = new Date();
      const record: CleaningRecord = {
        id: this.nextId("record"),
        partId,
        cleanedAt: effectiveCleanedAt,
        note: note ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.cleaningRecords.set(record.id, record);
      return record;
    });
    partIds.forEach((partId) => this.recomputeLastCleanedAt(partId));
    return created;
  }

  async listCleaningRecords(
    requestParameters: ListCleaningRecordsRequest,
  ): Promise<CleaningRecordList> {
    const { partId, page = 1, pageSize = 20 } = requestParameters;
    let items = Array.from(this.cleaningRecords.values()).sort(
      (a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime(),
    );
    if (partId !== undefined) {
      items = items.filter((r) => r.partId === partId);
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return { items: pageItems, total, page, pageSize };
  }

  async updateCleaningRecord(
    requestParameters: UpdateCleaningRecordRequest,
  ): Promise<CleaningRecord> {
    const existing = this.cleaningRecords.get(requestParameters.recordId);
    if (!existing)
      throw notFoundError("CleaningRecord", requestParameters.recordId);
    const updated: CleaningRecord = {
      ...existing,
      ...requestParameters.cleaningRecordUpdate,
      updatedAt: new Date(),
    };
    this.cleaningRecords.set(updated.id, updated);
    this.recomputeLastCleanedAt(updated.partId);
    return updated;
  }

  async deleteCleaningRecord(
    requestParameters: DeleteCleaningRecordRequest,
  ): Promise<void> {
    const existing = this.cleaningRecords.get(requestParameters.recordId);
    if (!existing)
      throw notFoundError("CleaningRecord", requestParameters.recordId);
    this.cleaningRecords.delete(existing.id);
    this.recomputeLastCleanedAt(existing.partId);
  }
}
