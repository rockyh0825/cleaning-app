package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * 掃除記録を編集するユースケース。
 * cleanedAt・note の部分更新をサポートする（null は変更なし）。
 * 更新後に lastCleanedAt を再計算する。
 */
@Service
class EditRecordUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val recomputeLastCleanedService: RecomputeLastCleanedService,
) {
    @Suppress("UnusedParameter")
    fun execute(
        userId: UUID,
        recordId: UUID,
        cleanedAt: Instant?,
        note: String?,
    ): CleaningRecord {
        val existing =
            cleaningRecordRepository.findById(recordId)
                ?: throw NotFoundException("CleaningRecord not found: $recordId")

        val updated =
            existing.copy(
                cleanedAt = cleanedAt ?: existing.cleanedAt,
                note = note ?: existing.note,
                updatedAt = Instant.now(),
            )
        val saved = cleaningRecordRepository.save(updated)
        recomputeLastCleanedService.recompute(saved.partId)

        return saved
    }
}
