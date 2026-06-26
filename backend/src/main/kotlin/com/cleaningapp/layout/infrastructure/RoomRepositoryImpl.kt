package com.cleaningapp.layout.infrastructure

import com.cleaningapp.layout.domain.Room
import com.cleaningapp.layout.domain.RoomRepository
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * RoomRepository（domainのポート）の MyBatis 実装。
 * Mapper への単純な委譲。ここが domain と MyBatis の境界。
 */
@Repository
class RoomRepositoryImpl(
    private val roomMapper: RoomMapper,
) : RoomRepository {
    override fun save(room: Room) = roomMapper.insert(room)

    override fun findByUserId(userId: UUID): List<Room> = roomMapper.selectByUserId(userId)
}
