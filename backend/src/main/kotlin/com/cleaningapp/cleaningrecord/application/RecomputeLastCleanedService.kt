package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.floorplan.domain.PartRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * パーツの lastCleanedAt を cleaning_record の MAX(cleaned_at) で再計算するサービス。
 * LogCleaningUseCase / DeleteRecordUseCase / EditRecordUseCase から呼ばれる。
 */
@Service
class RecomputeLastCleanedService(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val partRepository: PartRepository,
) {
    fun execute(partId: UUID) {
        val maxCleanedAt: Instant? = cleaningRecordRepository.findMaxCleanedAtByPartId(partId)
        val part =
            partRepository.findById(partId)
                ?: throw NotFoundException("Part not found: $partId")
        val updated =
            part.copy(
                lastCleanedAt = maxCleanedAt,
                updatedAt = Instant.now(),
            )
        partRepository.update(updated)
    }
}
