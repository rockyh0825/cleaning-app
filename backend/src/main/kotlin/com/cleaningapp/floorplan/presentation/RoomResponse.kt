package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomType
import java.time.Instant
import java.util.UUID

data class RoomResponse(
    val id: UUID,
    val name: String,
    val type: RoomType,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(room: Room): RoomResponse =
            RoomResponse(
                id = room.id,
                name = room.name,
                type = room.type,
                gridX = room.gridX,
                gridY = room.gridY,
                gridW = room.gridW,
                gridH = room.gridH,
                createdAt = room.createdAt,
                updatedAt = room.updatedAt,
            )
    }
}
