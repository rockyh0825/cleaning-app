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
 *
 * NOTE: OwnerType を floorplan.domain から直接 import しているが、これは PartManagementPort の
 * シグネチャが OwnerType を公開しているため避けられない。cleaningrecord 内の他ユースケース
 * （CreatePartUseCase 等）も同様のパターンを踏襲している既存の設計上の制約。
 * 将来的には OwnerType を capabilities パッケージへ移動することで解消できる。
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

    // FURNITURE パーツの ownerId は furniture.id であり Room UUID ではないため ROOM のみを対象にする。
    // areaId（= part.ownerId）が常に Room UUID となり getLastCleanedAt と整合する。
    override fun getOverdueAreas(userId: UUID): List<OverdueArea> =
        partManagementPort
            .findAllByUserId(userId)
            .filter { it.ownerType == OwnerType.ROOM }
            .mapNotNull { part ->
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
