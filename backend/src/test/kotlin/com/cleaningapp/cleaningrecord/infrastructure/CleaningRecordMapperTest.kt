package com.cleaningapp.cleaningrecord.infrastructure

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

/**
 * CleaningRecordMapper × CleaningRecordRepositoryImpl の振る舞いテスト。
 *
 * PostgreSQL 不要: CleaningRecordMapper をモックし、RepositoryImpl がマッパーを
 * 正しく呼び出すことを検証する。
 * Arrange → Act → Assert の3ステップで記述。
 */
@ExtendWith(MockKExtension::class)
class CleaningRecordMapperTest {
    @MockK
    private lateinit var cleaningRecordMapper: CleaningRecordMapper

    private val repository: CleaningRecordRepository by lazy {
        CleaningRecordRepositoryImpl(cleaningRecordMapper)
    }

    // ----------------------------------------------------------------
    // テストデータヘルパー
    // ----------------------------------------------------------------

    private fun createRecord(
        id: UUID = UUID.randomUUID(),
        partId: UUID = UUID.randomUUID(),
        userId: UUID = UUID.randomUUID(),
        cleanedAt: Instant = Instant.now(),
        note: String? = null,
    ): CleaningRecord {
        val now = Instant.now()
        return CleaningRecord(
            id = id,
            partId = partId,
            userId = userId,
            cleanedAt = cleanedAt,
            note = note,
            createdAt = now,
            updatedAt = now,
        )
    }

    // ----------------------------------------------------------------
    // 正常系: 記録を保存し、partId で絞り込んで取得できる
    // ----------------------------------------------------------------

    @Test
    fun `saves_record_and_can_retrieve_by_part_id`() {
        // Arrange
        val record = createRecord()
        justRun { cleaningRecordMapper.insert(record) }
        every { cleaningRecordMapper.selectByPartId(record.partId, any(), any()) } returns listOf(record)

        // Act
        val saved = repository.save(record)
        val found = repository.findByPartId(record.partId, page = 0, pageSize = 10)

        // Assert
        assertThat(saved).isEqualTo(record)
        assertThat(found).containsExactly(record)
        verify(exactly = 1) { cleaningRecordMapper.insert(record) }
        verify(exactly = 1) { cleaningRecordMapper.selectByPartId(record.partId, 10, 0) }
    }

    @Test
    fun `returns_empty_list_when_no_records_exist_for_part_id`() {
        // Arrange
        val partId = UUID.randomUUID()
        every { cleaningRecordMapper.selectByPartId(partId, any(), any()) } returns emptyList()

        // Act
        val result = repository.findByPartId(partId, page = 0, pageSize = 10)

        // Assert
        assertThat(result).isEmpty()
    }

    // ----------------------------------------------------------------
    // 正常系: MAX(cleaned_at) が正しく返る
    // ----------------------------------------------------------------

    @Test
    fun `returns_max_cleaned_at_for_given_part_id`() {
        // Arrange
        val partId = UUID.randomUUID()
        val expected = Instant.parse("2024-06-01T10:00:00Z")
        every { cleaningRecordMapper.selectMaxCleanedAtByPartId(partId) } returns expected

        // Act
        val result = repository.findMaxCleanedAtByPartId(partId)

        // Assert
        assertThat(result).isEqualTo(expected)
    }

    @Test
    fun `returns_null_max_cleaned_at_when_no_records_exist`() {
        // Arrange
        val partId = UUID.randomUUID()
        every { cleaningRecordMapper.selectMaxCleanedAtByPartId(partId) } returns null

        // Act
        val result = repository.findMaxCleanedAtByPartId(partId)

        // Assert
        assertThat(result).isNull()
    }

    // ----------------------------------------------------------------
    // 正常系: ページングで件数が制限される
    // ----------------------------------------------------------------

    @Test
    fun `passes_correct_limit_and_offset_for_first_page`() {
        // Arrange
        val partId = UUID.randomUUID()
        every { cleaningRecordMapper.selectByPartId(partId, 5, 0) } returns emptyList()

        // Act
        repository.findByPartId(partId, page = 0, pageSize = 5)

        // Assert — limit=5, offset=0 でマッパーを呼ぶ
        verify(exactly = 1) { cleaningRecordMapper.selectByPartId(partId, 5, 0) }
    }

    @Test
    fun `passes_correct_limit_and_offset_for_second_page`() {
        // Arrange
        val partId = UUID.randomUUID()
        every { cleaningRecordMapper.selectByPartId(partId, 5, 5) } returns emptyList()

        // Act
        repository.findByPartId(partId, page = 1, pageSize = 5)

        // Assert — limit=5, offset=5 でマッパーを呼ぶ
        verify(exactly = 1) { cleaningRecordMapper.selectByPartId(partId, 5, 5) }
    }

    @Test
    fun `passes_correct_limit_and_offset_for_third_page`() {
        // Arrange
        val partId = UUID.randomUUID()
        every { cleaningRecordMapper.selectByPartId(partId, 10, 20) } returns emptyList()

        // Act
        repository.findByPartId(partId, page = 2, pageSize = 10)

        // Assert — limit=10, offset=20 でマッパーを呼ぶ
        verify(exactly = 1) { cleaningRecordMapper.selectByPartId(partId, 10, 20) }
    }

    // ----------------------------------------------------------------
    // 正常系: part削除で記録が連鎖削除される（deleteById 経由）
    // ----------------------------------------------------------------

    @Test
    fun `delete_calls_mapper_delete_by_id_exactly_once`() {
        // Arrange
        val id = UUID.randomUUID()
        justRun { cleaningRecordMapper.deleteById(id) }

        // Act
        repository.delete(id)

        // Assert — マッパーの deleteById が1回だけ呼ばれる
        verify(exactly = 1) { cleaningRecordMapper.deleteById(id) }
    }

    @Test
    fun `find_by_id_returns_record_when_exists`() {
        // Arrange
        val record = createRecord()
        every { cleaningRecordMapper.selectById(record.id) } returns record

        // Act
        val result = repository.findById(record.id)

        // Assert
        assertThat(result).isEqualTo(record)
    }

    @Test
    fun `find_by_id_returns_null_when_not_exists`() {
        // Arrange
        val id = UUID.randomUUID()
        every { cleaningRecordMapper.selectById(id) } returns null

        // Act
        val result = repository.findById(id)

        // Assert
        assertThat(result).isNull()
    }
}
