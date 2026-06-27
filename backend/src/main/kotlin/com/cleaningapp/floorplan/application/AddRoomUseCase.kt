package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.floorplan.domain.RoomType
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * 部屋追加の入力。presentation の HTTP 形式とは切り離した、ユースケースの引数。
 */
data class AddRoomCommand(
    val userId: UUID,
    val name: String,
    val type: RoomType,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
)

/**
 * 部屋を追加するユースケース。
 * id とタイムスタンプはここで採番する（サーバーが確定させる値）。
 */
@Service
class AddRoomUseCase(
    private val roomRepository: RoomRepository,
) {
    fun execute(command: AddRoomCommand): Room {
        val now = Instant.now()
        val room =
            Room(
                id = UUID.randomUUID(),
                userId = command.userId,
                name = command.name,
                type = command.type,
                gridX = command.gridX,
                gridY = command.gridY,
                gridW = command.gridW,
                gridH = command.gridH,
                createdAt = now,
                updatedAt = now,
            )
        roomRepository.save(room)
        return room
    }
}
