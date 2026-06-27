package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.domain.PartRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
class PartRepositoryImpl(
    private val partMapper: PartMapper,
) : PartRepository {
    override fun findByOwnerId(
        ownerType: OwnerType,
        ownerId: UUID,
    ): List<Part> = partMapper.selectByOwnerId(ownerType, ownerId)

    @Transactional
    override fun saveAll(parts: List<Part>) = parts.forEach(partMapper::insert)

    override fun update(part: Part) = partMapper.update(part)

    override fun deleteByOwnerId(
        ownerType: OwnerType,
        ownerId: UUID,
    ) = partMapper.deleteByOwnerId(ownerType, ownerId)
}
