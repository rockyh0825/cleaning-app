package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.Part
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * [PartManagementPort] の実装。floorplan feature の MyBatis Mapper を通じて操作する。
 * cleaningrecord や heatmap などの他 feature から Part を操作する際に使うアダプター。
 * capabilities 経由でアクセスすることで feature 間の直接依存を回避する。
 */
@Component
class PartManagementAdapter(
    private val partMapper: PartMapper,
) : PartManagementPort {
    override fun findById(id: UUID): Part? = partMapper.selectById(id)

    override fun create(part: Part): Part {
        partMapper.insert(part)
        return part
    }

    override fun update(part: Part) = partMapper.update(part)

    override fun delete(id: UUID) = partMapper.deleteById(id)
}
