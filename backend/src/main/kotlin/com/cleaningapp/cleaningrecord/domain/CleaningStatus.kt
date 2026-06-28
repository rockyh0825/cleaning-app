package com.cleaningapp.cleaningrecord.domain

import java.time.Duration
import java.time.Instant

/** 掃除状況のレベル。推奨周期に対する経過割合で判定する。 */
enum class CleaningStatusLevel { GREEN, YELLOW, RED }

/**
 * パーツの掃除状況（期限超過判定）ドメインモデル。
 * Spring/MyBatis に非依存な純粋 Kotlin。
 *
 * [elapsedRatio] 推奨周期に対する経過日数の割合。1.0 で期限ちょうど、1.0 超で期限超過。
 * [level] GREEN / YELLOW / RED の3段階。null（未掃除）は RED 扱い。
 */
data class CleaningStatus(
    val elapsedRatio: Double,
    val level: CleaningStatusLevel,
) {
    companion object {
        private const val YELLOW_THRESHOLD = 0.8

        /**
         * 推奨周期と最終掃除日時から掃除状況を算出する。
         *
         * @param lastCleanedAt 最終掃除日時。未掃除の場合 null → RED 扱い（elapsedRatio = Double.MAX_VALUE）
         * @param recommendedCycleDays 推奨掃除周期（日）
         * @param now 現在時刻（デフォルト: Instant.now()。テストで差し替え可能）
         */
        fun compute(
            lastCleanedAt: Instant?,
            recommendedCycleDays: Int,
            now: Instant = Instant.now(),
        ): CleaningStatus {
            if (lastCleanedAt == null) {
                return CleaningStatus(elapsedRatio = Double.MAX_VALUE, level = CleaningStatusLevel.RED)
            }
            val elapsedDays = Duration.between(lastCleanedAt, now).toDays().toDouble()
            val ratio = elapsedDays / recommendedCycleDays
            val level =
                when {
                    ratio >= 1.0 -> CleaningStatusLevel.RED
                    ratio >= YELLOW_THRESHOLD -> CleaningStatusLevel.YELLOW
                    else -> CleaningStatusLevel.GREEN
                }
            return CleaningStatus(elapsedRatio = ratio, level = level)
        }
    }
}
