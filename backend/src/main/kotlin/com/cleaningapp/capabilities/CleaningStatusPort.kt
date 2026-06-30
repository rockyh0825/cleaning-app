package com.cleaningapp.capabilities

import java.time.Instant
import java.util.UUID

/**
 * heatmap / notification feature が掃除状態を読むための境界インターフェース（Capability パターン）。
 * 依存する側: heatmap, notification feature
 * 実装する側: cleaningrecord feature の CleaningStatusPortImpl
 */
interface CleaningStatusPort {
    /** areaId（Room の UUID）の最新掃除日時を返す。記録なし → null */
    fun getLastCleanedAt(areaId: UUID): Instant?

    /** userId のすべてのパーツのうち期限超過（elapsedRatio > 1.0）のエリアリストを返す */
    fun getOverdueAreas(userId: UUID): List<OverdueArea>
}

data class OverdueArea(
    val areaId: UUID,
    val partId: UUID,
    val elapsedRatio: Double,
)
