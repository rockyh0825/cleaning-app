package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import java.time.Instant
import java.util.UUID

/**
 * Part ドメインモデルを JSON レスポンス用に変換するDTO。
 * openapi.yaml Part スキーマに対応。
 */
data class PartResponse(
    val id: UUID,
    val ownerType: OwnerType,
    val ownerId: UUID,
    val name: String,
    val recommendedCycleDays: Int,
    val lastCleanedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(part: Part): PartResponse =
            PartResponse(
                id = part.id,
                ownerType = part.ownerType,
                ownerId = part.ownerId,
                name = part.name,
                recommendedCycleDays = part.recommendedCycleDays,
                lastCleanedAt = part.lastCleanedAt,
                createdAt = part.createdAt,
                updatedAt = part.updatedAt,
            )
    }
}
