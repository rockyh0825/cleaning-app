package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.domain.PartRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

data class CreatePartCommand(
    val ownerType: OwnerType,
    val ownerId: UUID,
    val name: String,
    val recommendedCycleDays: Int,
)

data class UpdatePartCommand(
    val partId: UUID,
    val name: String? = null,
    val recommendedCycleDays: Int? = null,
)

/**
 * Part（掃除単位）の作成・更新・削除を行うユースケース。
 * cleaning-record feature から Part を管理する際に使う。
 */
@Service
class ManagePartUseCase(
    private val partRepository: PartRepository,
) {
    fun create(command: CreatePartCommand): Part {
        val now = Instant.now()
        val part =
            Part(
                id = UUID.randomUUID(),
                ownerType = command.ownerType,
                ownerId = command.ownerId,
                name = command.name,
                recommendedCycleDays = command.recommendedCycleDays,
                lastCleanedAt = null,
                createdAt = now,
                updatedAt = now,
            )
        partRepository.save(part)
        return part
    }

    fun update(command: UpdatePartCommand): Part {
        val part =
            partRepository.findById(command.partId)
                ?: throw NotFoundException("Part not found: ${command.partId}")
        val updated =
            part.copy(
                name = command.name ?: part.name,
                recommendedCycleDays = command.recommendedCycleDays ?: part.recommendedCycleDays,
                updatedAt = Instant.now(),
            )
        partRepository.update(updated)
        return updated
    }

    @Transactional
    fun delete(partId: UUID) {
        partRepository.findById(partId)
            ?: throw NotFoundException("Part not found: $partId")
        partRepository.delete(partId)
    }
}
