package com.cleaningapp.cleaningrecord.presentation

/**
 * GET /cleaning-records のページングレスポンス。
 * openapi.yaml CleaningRecordList スキーマに対応。
 */
data class CleaningRecordListResponse(
    val items: List<CleaningRecordResponse>,
    val total: Int,
    val page: Int,
    val pageSize: Int,
)
