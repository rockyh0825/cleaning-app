package com.cleaningapp.cleaningrecord.infrastructure

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.infrastructure.PartMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration
import org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * CleaningRecordMapper の MyBatis 統合テスト。
 * @MybatisTest + Flyway + PostgreSQL を使用するため、DB 接続が必要。
 *
 * NOTE: このテストは PostgreSQL が起動している環境でのみ実行可能。
 *       ローカル DB が起動している場合は @Disabled を外して実行すること。
 */
@Disabled("Requires PostgreSQL: start local DB before enabling")
@MybatisTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(FlywayAutoConfiguration::class, JdbcTemplateAutoConfiguration::class)
class CleaningRecordMapperTest {
    @Autowired
    private lateinit var cleaningRecordMapper: CleaningRecordMapper

    @Autowired
    private lateinit var partMapper: PartMapper

    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    // --------------- ヘルパー ---------------

    private fun insertPart(): Part {
        val part =
            Part(
                id = UUID.randomUUID(),
                ownerType = OwnerType.ROOM,
                ownerId = UUID.randomUUID(), // owner_id に FK 制約なし（part テーブルの仕様）
                name = "テストパーツ",
                recommendedCycleDays = 7,
                lastCleanedAt = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        partMapper.insert(part)
        return part
    }

    private fun insertRecord(
        partId: UUID,
        userId: UUID,
        cleanedAt: Instant = Instant.now(),
        note: String? = null,
    ): CleaningRecord {
        val record =
            CleaningRecord(
                id = UUID.randomUUID(),
                partId = partId,
                userId = userId,
                cleanedAt = cleanedAt,
                note = note,
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        cleaningRecordMapper.insert(record)
        return record
    }

    // --------------- 正常系テスト ---------------

    @Test
    fun `inserts_and_selectByPartId_returns_the_record`() {
        // Arrange
        val part = insertPart()
        val userId = UUID.randomUUID()
        val record = insertRecord(partId = part.id, userId = userId)

        // Act
        val results = cleaningRecordMapper.selectByPartId(part.id, 10, 0)

        // Assert
        assertThat(results).hasSize(1)
        assertThat(results.first().id).isEqualTo(record.id)
        assertThat(results.first().partId).isEqualTo(part.id)
        assertThat(results.first().userId).isEqualTo(userId)
    }

    @Test
    fun `selectMaxCleanedAtByPartId_returns_the_latest_cleaned_at`() {
        // Arrange
        val part = insertPart()
        val userId = UUID.randomUUID()
        // TIMESTAMPTZ は microsecond 精度なので microsecond までで比較
        val older = Instant.now().minus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MICROS)
        val newer = Instant.now().minus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MICROS)
        insertRecord(partId = part.id, userId = userId, cleanedAt = older)
        insertRecord(partId = part.id, userId = userId, cleanedAt = newer)

        // Act
        val max = cleaningRecordMapper.selectMaxCleanedAtByPartId(part.id)

        // Assert
        assertThat(max).isNotNull()
        assertThat(max!!.truncatedTo(ChronoUnit.MICROS)).isEqualTo(newer)
    }

    @Test
    fun `selectByPartId_with_pagination_limits_the_number_of_results`() {
        // Arrange
        val part = insertPart()
        val userId = UUID.randomUUID()
        val base = Instant.now()
        repeat(3) { i ->
            insertRecord(partId = part.id, userId = userId, cleanedAt = base.minus(i.toLong(), ChronoUnit.HOURS))
        }

        // Act: LIMIT 2, OFFSET 0 → 最新 2 件のみ返る
        val results = cleaningRecordMapper.selectByPartId(part.id, 2, 0)

        // Assert
        assertThat(results).hasSize(2)
    }

    @Test
    fun `cleaning_records_are_cascade_deleted_when_part_is_deleted`() {
        // Arrange
        val part = insertPart()
        val userId = UUID.randomUUID()
        insertRecord(partId = part.id, userId = userId)
        assertThat(cleaningRecordMapper.selectByPartId(part.id, 10, 0)).hasSize(1)

        // Act: part を削除 → cleaning_record が ON DELETE CASCADE で連鎖削除される
        jdbcTemplate.update("DELETE FROM part WHERE id = ?", part.id)

        // Assert
        val results = cleaningRecordMapper.selectByPartId(part.id, 10, 0)
        assertThat(results).isEmpty()
    }
}
