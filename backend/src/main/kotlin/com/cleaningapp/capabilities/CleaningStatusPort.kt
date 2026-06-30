package com.cleaningapp.capabilities

import java.time.Instant
import java.util.UUID

/**
 * heatmap / notification feature が掃除状態を読むための境界インターフェース（Capability パターン）。
 * 依存する側: heatmap, notification feature
 * 実装する側: cleaningrecord feature の CleaningStatusPortImpl
 */
interface CleaningStatusPort {
    /**
     * areaId（Room の UUID）に属する ROOM タイプパーツの最新掃除日時を返す。
     * 対象パーツが存在しない、またはすべて未掃除の場合は null。
     */
    fun getLastCleanedAt(areaId: UUID): Instant?

    /**
     * userId に属するすべての ROOM タイプパーツのうち期限超過（elapsedRatio > 1.0）のエリアリストを返す。
     * OverdueArea.areaId は常に Room の UUID。FURNITURE タイプパーツは対象外。
     */
    fun getOverdueAreas(userId: UUID): List<OverdueArea>
}

data class OverdueArea(
    val areaId: UUID,
    val partId: UUID,
    val elapsedRatio: Double,
)
