package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import org.springframework.stereotype.Service
import java.util.UUID

data class RoomWithFurnitureResult(
    val room: Room,
    val furniture: List<Furniture>,
)

data class FloorPlanResult(
    val rooms: List<RoomWithFurnitureResult>,
)

@Service
class GetFloorPlanUseCase(
    private val roomRepository: RoomRepository,
    private val furnitureRepository: FurnitureRepository,
) {
    fun execute(userId: UUID): FloorPlanResult {
        val rooms = roomRepository.findByUserId(userId)
        val roomsWithFurniture =
            rooms.map { room ->
                RoomWithFurnitureResult(
                    room = room,
                    furniture = furnitureRepository.findByRoomId(room.id),
                )
            }
        return FloorPlanResult(roomsWithFurniture)
    }
}
