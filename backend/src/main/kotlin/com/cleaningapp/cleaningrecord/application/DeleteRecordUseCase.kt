package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * 掃除記録を削除するユースケース。
 * 削除後に当該パーツの lastCleanedAt を再計算する（記録が0件になった場合は null に更新される）。
 */
@Service
class DeleteRecordUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val recomputeLastCleanedService: RecomputeLastCleanedService,
) {
    @Suppress("UnusedParameter")
    fun execute(
        userId: UUID,
        recordId: UUID,
    ) {
        val record =
            cleaningRecordRepository.findById(recordId)
                ?: throw NotFoundException("CleaningRecord not found: $recordId")

        cleaningRecordRepository.delete(recordId)
        recomputeLastCleanedService.recompute(record.partId)
    }
}
