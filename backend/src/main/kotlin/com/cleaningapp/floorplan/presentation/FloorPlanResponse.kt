package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.application.FloorPlanResult
import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomType
import java.time.Instant
import java.util.UUID

data class RoomWithFurnitureResponse(
    val id: UUID,
    val name: String,
    val type: RoomType,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
    val furniture: List<FurnitureResponse>,
) {
    companion object {
        fun from(
            room: Room,
            furniture: List<Furniture>,
        ): RoomWithFurnitureResponse =
            RoomWithFurnitureResponse(
                id = room.id,
                name = room.name,
                type = room.type,
                gridX = room.gridX,
                gridY = room.gridY,
                gridW = room.gridW,
                gridH = room.gridH,
                createdAt = room.createdAt,
                updatedAt = room.updatedAt,
                furniture = furniture.map(FurnitureResponse::from),
            )
    }
}

data class FloorPlanResponse(
    val rooms: List<RoomWithFurnitureResponse>,
) {
    companion object {
        fun from(result: FloorPlanResult): FloorPlanResponse =
            FloorPlanResponse(
                rooms =
                    result.rooms.map { (room, furniture) ->
                        RoomWithFurnitureResponse.from(room, furniture)
                    },
            )
    }
}
