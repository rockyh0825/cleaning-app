package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import java.time.Instant
import java.util.UUID

/**
 * CleaningRecord ドメインモデルを JSON レスポンス用に変換するDTO。
 * userId は公開しない（内部用フィールドのため）。
 */
data class CleaningRecordResponse(
    val id: UUID,
    val partId: UUID,
    val cleanedAt: Instant,
    val note: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(record: CleaningRecord): CleaningRecordResponse =
            CleaningRecordResponse(
                id = record.id,
                partId = record.partId,
                cleanedAt = record.cleanedAt,
                note = record.note,
                createdAt = record.createdAt,
                updatedAt = record.updatedAt,
            )
    }
}
