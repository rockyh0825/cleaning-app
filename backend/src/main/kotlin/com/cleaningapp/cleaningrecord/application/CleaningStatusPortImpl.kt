package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.CleaningStatusPort
import com.cleaningapp.capabilities.OverdueArea
import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.cleaningrecord.domain.CleaningStatus
import com.cleaningapp.floorplan.domain.OwnerType
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * [CleaningStatusPort] の実装。
 * heatmap / notification feature に掃除状態を公開する。
 * PartManagementPort 経由でパーツを取得し、CleaningStatus.compute() で期限超過を判定する。
 */
@Service
class CleaningStatusPortImpl(
    private val partManagementPort: PartManagementPort,
) : CleaningStatusPort {
    override fun getLastCleanedAt(areaId: UUID): Instant? =
        partManagementPort
            .findByOwnerId(OwnerType.ROOM, areaId)
            .mapNotNull { it.lastCleanedAt }
            .maxOrNull()

    override fun getOverdueAreas(userId: UUID): List<OverdueArea> =
        partManagementPort.findAllByUserId(userId).mapNotNull { part ->
            val status = CleaningStatus.compute(part.lastCleanedAt, part.recommendedCycleDays)
            if (status.elapsedRatio > 1.0) {
                OverdueArea(
                    areaId = part.ownerId,
                    partId = part.id,
                    elapsedRatio = status.elapsedRatio,
                )
            } else {
                null
            }
        }
}
