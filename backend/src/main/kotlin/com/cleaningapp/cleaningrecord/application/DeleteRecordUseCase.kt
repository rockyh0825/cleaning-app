package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * 掃除記録を削除し、対象パーツの lastCleanedAt を再計算するユースケース。
 */
@Service
class DeleteRecordUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val recomputeLastCleanedService: RecomputeLastCleanedService,
) {
    @Transactional
    fun execute(recordId: UUID) {
        val record =
            cleaningRecordRepository.findById(recordId)
                ?: throw NotFoundException("CleaningRecord not found: $recordId")
        cleaningRecordRepository.delete(recordId)
        recomputeLastCleanedService.execute(record.partId)
    }
}
