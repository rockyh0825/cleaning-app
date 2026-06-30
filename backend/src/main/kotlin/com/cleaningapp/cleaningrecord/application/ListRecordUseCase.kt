package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * 掃除記録の一覧を取得するユースケース。
 * partId が指定された場合はパーツで絞り込み、省略時はユーザー全記録を返す。
 * page はゼロ起算（コントローラーが1始まりから変換して渡す）。
 */
@Service
class ListRecordUseCase(
    private val cleaningRecordRepository: CleaningRecordRepository,
) {
    fun execute(
        userId: UUID,
        partId: UUID?,
        page: Int,
        pageSize: Int,
    ): List<CleaningRecord> =
        if (partId != null) {
            cleaningRecordRepository.findByPartId(partId, page, pageSize)
        } else {
            cleaningRecordRepository.findByUserId(userId, page, pageSize)
        }
}
