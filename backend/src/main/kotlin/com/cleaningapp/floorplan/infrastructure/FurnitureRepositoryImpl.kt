package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class FurnitureRepositoryImpl(
    private val furnitureMapper: FurnitureMapper,
) : FurnitureRepository {
    override fun findByRoomId(roomId: UUID): List<Furniture> = furnitureMapper.selectByRoomId(roomId)

    override fun findById(id: UUID): Furniture? = furnitureMapper.selectById(id)

    override fun save(furniture: Furniture) = furnitureMapper.insert(furniture)

    override fun update(furniture: Furniture) = furnitureMapper.update(furniture)

    override fun deleteById(id: UUID) = furnitureMapper.deleteById(id)
}
