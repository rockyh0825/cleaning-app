package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * パーツの CRUD 操作ユースケース。
 * cleaningrecord feature からパーツを管理する際に使う。
 * Part への直接アクセスは [PartManagementPort] を通じて行い、floorplan feature への直接依存を回避する。
 */
@Service
class ManagePartUseCase(
    private val partManagementPort: PartManagementPort,
) {
    @Suppress("UnusedParameter")
    fun createPart(
        userId: UUID,
        ownerType: OwnerType,
        ownerId: UUID,
        name: String,
        recommendedCycleDays: Int,
    ): Part {
        val now = Instant.now()
        val part =
            Part(
                id = UUID.randomUUID(),
                ownerType = ownerType,
                ownerId = ownerId,
                name = name,
                recommendedCycleDays = recommendedCycleDays,
                lastCleanedAt = null,
                createdAt = now,
                updatedAt = now,
            )
        return partManagementPort.create(part)
    }

    @Suppress("UnusedParameter")
    fun updatePart(
        userId: UUID,
        partId: UUID,
        name: String?,
        recommendedCycleDays: Int?,
    ): Part {
        val existing =
            partManagementPort.findById(partId)
                ?: throw NotFoundException("Part not found: $partId")

        val updated =
            existing.copy(
                name = name ?: existing.name,
                recommendedCycleDays = recommendedCycleDays ?: existing.recommendedCycleDays,
                updatedAt = Instant.now(),
            )
        partManagementPort.update(updated)
        return updated
    }

    @Suppress("UnusedParameter")
    fun deletePart(
        userId: UUID,
        partId: UUID,
    ) {
        partManagementPort.delete(partId)
    }
}
