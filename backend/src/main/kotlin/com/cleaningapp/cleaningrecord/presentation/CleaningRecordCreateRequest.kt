package com.cleaningapp.cleaningrecord.presentation

import jakarta.validation.constraints.NotEmpty
import java.time.Instant
import java.util.UUID

/**
 * POST /cleaning-records のリクエストボディ。
 * partIds は1件以上必須。cleanedAt 省略時はコントローラーがサーバー時刻を補完する。
 */
data class CleaningRecordCreateRequest(
    @field:NotEmpty val partIds: List<UUID>,
    val cleanedAt: Instant? = null,
    val note: String? = null,
)
