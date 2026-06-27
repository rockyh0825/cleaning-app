package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.domain.PartRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class PartRepositoryImpl(
    private val partMapper: PartMapper,
) : PartRepository {
    override fun findByOwnerId(ownerId: UUID): List<Part> = partMapper.selectByOwnerId(ownerId)

    override fun saveAll(parts: List<Part>) = parts.forEach(partMapper::insert)

    override fun update(part: Part) = partMapper.update(part)

    override fun deleteByOwnerId(ownerId: UUID) = partMapper.deleteByOwnerId(ownerId)
}
