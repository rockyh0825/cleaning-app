package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * パーツを新規作成するユースケース。
 * Part への直接アクセスは [PartManagementPort] を通じて行い、floorplan feature への直接依存を回避する。
 */
@Service
class CreatePartUseCase(
    private val partManagementPort: PartManagementPort,
) {
    // userId: 将来の認可チェック（自分のデータのみ操作可能）で使用する予定
    @Suppress("UnusedParameter")
    fun execute(
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
}
