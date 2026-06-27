package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
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
