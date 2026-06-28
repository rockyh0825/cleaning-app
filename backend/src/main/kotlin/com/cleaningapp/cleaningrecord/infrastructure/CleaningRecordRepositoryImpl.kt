package com.cleaningapp.cleaningrecord.infrastructure

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

/**
 * CleaningRecordRepository（domain のポート）の MyBatis 実装。
 * Mapper への単純な委譲。ここが domain と MyBatis の境界。
 *
 * [findByPartId] のページネーション: page=0 から始まるゼロ起算。
 *   offset = page * pageSize として Mapper に渡す。
 */
@Repository
class CleaningRecordRepositoryImpl(
    private val cleaningRecordMapper: CleaningRecordMapper,
) : CleaningRecordRepository {
    override fun save(record: CleaningRecord): CleaningRecord {
        cleaningRecordMapper.insert(record)
        return record
    }

    override fun update(record: CleaningRecord): CleaningRecord {
        cleaningRecordMapper.update(record)
        return record
    }

    override fun findById(id: UUID): CleaningRecord? = cleaningRecordMapper.selectById(id)

    override fun findByPartId(
        partId: UUID,
        page: Int,
        pageSize: Int,
    ): List<CleaningRecord> {
        val offset = page * pageSize
        return cleaningRecordMapper.selectByPartId(partId, pageSize, offset)
    }

    override fun findMaxCleanedAtByPartId(partId: UUID): Instant? =
        cleaningRecordMapper.selectMaxCleanedAtByPartId(partId)

    override fun delete(id: UUID) = cleaningRecordMapper.deleteById(id)
}
