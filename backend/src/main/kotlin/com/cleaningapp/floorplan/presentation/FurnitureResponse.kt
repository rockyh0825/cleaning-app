package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.domain.Furniture
import java.time.Instant
import java.util.UUID

data class FurnitureResponse(
    val id: UUID,
    val roomId: UUID,
    val name: String,
    val presetKey: String?,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(furniture: Furniture): FurnitureResponse =
            FurnitureResponse(
                id = furniture.id,
                roomId = furniture.roomId,
                name = furniture.name,
                presetKey = furniture.presetKey,
                gridX = furniture.gridX,
                gridY = furniture.gridY,
                gridW = furniture.gridW,
                gridH = furniture.gridH,
                createdAt = furniture.createdAt,
                updatedAt = furniture.updatedAt,
            )
    }
}
