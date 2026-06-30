package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * 複数パーツの掃除を一括記録するユースケース。
 * 全レコードを1トランザクションで保存し、各パーツの lastCleanedAt を再計算する。
 */
@Service
class LogCleaningUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val recomputeLastCleanedService: RecomputeLastCleanedService,
) {
    @Transactional
    fun execute(
        userId: UUID,
        partIds: List<UUID>,
        cleanedAt: Instant,
        note: String?,
    ): List<CleaningRecord> {
        val now = Instant.now()
        val records =
            partIds.map { partId ->
                val record =
                    CleaningRecord(
                        id = UUID.randomUUID(),
                        partId = partId,
                        userId = userId,
                        cleanedAt = cleanedAt,
                        note = note,
                        createdAt = now,
                        updatedAt = now,
                    )
                cleaningRecordRepository.save(record)
            }

        partIds.forEach { partId -> recomputeLastCleanedService.recompute(partId) }

        return records
    }
}
