package com.cleaningapp.cleaningrecord.presentation

import java.time.Instant

/**
 * PATCH /cleaning-records/{recordId} のリクエストボディ。
 * 省略したフィールドは変更しない（部分更新）。
 * clearNote=true でメモを null に戻せる。
 */
data class CleaningRecordUpdateRequest(
    val cleanedAt: Instant? = null,
    val note: String? = null,
    val clearNote: Boolean = false,
)
