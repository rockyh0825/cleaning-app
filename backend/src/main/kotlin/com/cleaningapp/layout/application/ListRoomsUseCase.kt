package com.cleaningapp.layout.application

import com.cleaningapp.layout.domain.Room
import com.cleaningapp.layout.domain.RoomRepository
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * ユーザーの部屋一覧を取得するユースケース。
 */
@Service
class ListRoomsUseCase(
    private val roomRepository: RoomRepository,
) {
    fun execute(userId: UUID): List<Room> = roomRepository.findByUserId(userId)
}
