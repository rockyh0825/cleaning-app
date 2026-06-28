package com.cleaningapp.cleaningrecord.infrastructure

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

/**
 * CleaningRecordRepository の MyBatis 実装。
 * mapper を呼び出してドメイン層のインターフェースを満たす。
 *
 * page はシリーズ（1始まり）。OFFSET は (page - 1) * pageSize で計算する。
 */
@Repository
class CleaningRecordRepositoryImpl(
    private val mapper: CleaningRecordMapper,
) : CleaningRecordRepository {
    override fun save(record: CleaningRecord): CleaningRecord {
        mapper.insert(record)
        return record
    }

    override fun findById(id: UUID): CleaningRecord? = mapper.selectById(id)

    override fun findByPartId(
        partId: UUID,
        page: Int,
        pageSize: Int,
    ): List<CleaningRecord> = mapper.selectByPartId(partId, pageSize, (page - 1) * pageSize)

    override fun findByUserId(
        userId: UUID,
        page: Int,
        pageSize: Int,
    ): List<CleaningRecord> = mapper.selectByUserId(userId, pageSize, (page - 1) * pageSize)

    override fun countByPartId(partId: UUID): Int = mapper.countByPartId(partId)

    override fun countByUserId(userId: UUID): Int = mapper.countByUserId(userId)

    override fun findMaxCleanedAtByPartId(partId: UUID): Instant? = mapper.selectMaxCleanedAtByPartId(partId)

    override fun update(record: CleaningRecord): CleaningRecord {
        mapper.update(record)
        return record
    }

    override fun delete(id: UUID) = mapper.deleteById(id)
}
