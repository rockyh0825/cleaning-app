package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

data class LogCleaningCommand(
    val userId: UUID,
    val partIds: List<UUID>,
    val cleanedAt: Instant = Instant.now(),
    val note: String? = null,
)

/**
 * 複数 partId を1トランザクションで CleaningRecord として記録し、
 * 各パーツの lastCleanedAt を再計算するユースケース。
 */
@Service
class LogCleaningUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val recomputeLastCleanedService: RecomputeLastCleanedService,
) {
    @Transactional
    fun execute(command: LogCleaningCommand) {
        val now = Instant.now()
        command.partIds.forEach { partId ->
            val record =
                CleaningRecord(
                    id = UUID.randomUUID(),
                    partId = partId,
                    userId = command.userId,
                    cleanedAt = command.cleanedAt,
                    note = command.note,
                    createdAt = now,
                    updatedAt = now,
                )
            cleaningRecordRepository.save(record)
        }
        command.partIds.forEach { partId ->
            recomputeLastCleanedService.execute(partId)
        }
    }
}
