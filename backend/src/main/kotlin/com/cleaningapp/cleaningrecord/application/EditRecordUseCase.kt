package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

data class EditRecordCommand(
    val recordId: UUID,
    val cleanedAt: Instant? = null,
    val note: String? = null,
)

/**
 * 掃除記録の cleaned_at / note を更新し、対象パーツの lastCleanedAt を再計算するユースケース。
 */
@Service
class EditRecordUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val recomputeLastCleanedService: RecomputeLastCleanedService,
) {
    @Transactional
    fun execute(command: EditRecordCommand): CleaningRecord {
        val record =
            cleaningRecordRepository.findById(command.recordId)
                ?: throw NotFoundException("CleaningRecord not found: ${command.recordId}")
        val updated =
            record.copy(
                cleanedAt = command.cleanedAt ?: record.cleanedAt,
                note = command.note ?: record.note,
                updatedAt = Instant.now(),
            )
        cleaningRecordRepository.update(updated)
        recomputeLastCleanedService.execute(record.partId)
        return updated
    }
}
