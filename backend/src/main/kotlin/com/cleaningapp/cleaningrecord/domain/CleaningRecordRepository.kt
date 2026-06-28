package com.cleaningapp.cleaningrecord.domain

import java.time.Instant
import java.util.UUID

/**
 * 掃除記録リポジトリのインターフェース。
 * infrastructure 層（MyBatis）が実装する。domain 層はこの抽象に依存する。
 */
interface CleaningRecordRepository {
    fun save(record: CleaningRecord): CleaningRecord

    fun findById(id: UUID): CleaningRecord?

    fun findByPartId(
        partId: UUID,
        page: Int,
        pageSize: Int,
    ): List<CleaningRecord>

    fun findByUserId(
        userId: UUID,
        page: Int,
        pageSize: Int,
    ): List<CleaningRecord>

    fun countByPartId(partId: UUID): Int

    fun countByUserId(userId: UUID): Int

    fun findMaxCleanedAtByPartId(partId: UUID): Instant?

    fun update(record: CleaningRecord): CleaningRecord

    fun delete(id: UUID)
}
