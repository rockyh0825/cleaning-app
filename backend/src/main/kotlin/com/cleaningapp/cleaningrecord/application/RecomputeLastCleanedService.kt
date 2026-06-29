package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * パーツの最終掃除日時（lastCleanedAt）を掃除記録から再計算するサービス。
 * 掃除記録の追加・編集・削除後に呼ばれる。
 * MAX(cleaned_at) を取得して Part を更新する。記録が0件の場合は null を設定する。
 */
@Service
class RecomputeLastCleanedService(
    private val cleaningRecordRepository: CleaningRecordRepository,
    private val partManagementPort: PartManagementPort,
) {
    fun recompute(partId: UUID) {
        val maxCleanedAt = cleaningRecordRepository.findMaxCleanedAtByPartId(partId)
        val part = partManagementPort.findById(partId) ?: return
        partManagementPort.update(part.copy(lastCleanedAt = maxCleanedAt))
    }
}
