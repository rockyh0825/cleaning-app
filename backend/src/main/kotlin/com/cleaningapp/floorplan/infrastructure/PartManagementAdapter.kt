package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.domain.PartRepository
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * [PartManagementPort] の実装。[PartRepository] を通じて操作する。
 * cleaningrecord や heatmap などの他 feature から Part を操作する際に使うアダプター。
 * capabilities 経由でアクセスすることで feature 間の直接依存を回避する。
 */
@Component
class PartManagementAdapter(
    private val partRepository: PartRepository,
) : PartManagementPort {
    override fun findById(id: UUID): Part? = partRepository.findById(id)

    override fun create(part: Part): Part = partRepository.create(part)

    override fun update(part: Part) = partRepository.update(part)

    override fun delete(id: UUID) = partRepository.deleteById(id)
}
