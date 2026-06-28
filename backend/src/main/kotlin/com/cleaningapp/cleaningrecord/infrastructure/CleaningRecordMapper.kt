package com.cleaningapp.cleaningrecord.infrastructure

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import org.apache.ibatis.annotations.Delete
import org.apache.ibatis.annotations.Insert
import org.apache.ibatis.annotations.Mapper
import org.apache.ibatis.annotations.Param
import org.apache.ibatis.annotations.Select
import org.apache.ibatis.annotations.Update
import java.time.Instant
import java.util.UUID

/**
 * MyBatis Mapper for cleaning_record テーブル（アノテーション形式）。
 *
 * SELECT 結果 → CleaningRecord(data class, val でsetterなし) へのマッピングは
 * コンストラクタ引数名ベースの自動マッピングで行う:
 *   - application.yml: mybatis.configuration.arg-name-based-constructor-auto-mapping=true
 *   - build.gradle.kts: -java-parameters（引数名をバイトコードに残す）
 *   - map-underscore-to-camel-case=true で cleaned_at ↔ cleanedAt を解決
 *
 * note は NULL 許容なので jdbcType=VARCHAR を明示する。
 */
@Mapper
interface CleaningRecordMapper {
    @Insert(
        """
        INSERT INTO cleaning_record (id, part_id, user_id, cleaned_at, note, created_at, updated_at)
        VALUES (#{id}, #{partId}, #{userId}, #{cleanedAt}, #{note,jdbcType=VARCHAR}, #{createdAt}, #{updatedAt})
        """,
    )
    fun insert(record: CleaningRecord)

    @Select(
        """
        SELECT id, part_id, user_id, cleaned_at, note, created_at, updated_at
        FROM cleaning_record
        WHERE id = #{id}
        """,
    )
    fun selectById(
        @Param("id") id: UUID,
    ): CleaningRecord?

    @Select(
        """
        SELECT id, part_id, user_id, cleaned_at, note, created_at, updated_at
        FROM cleaning_record
        WHERE part_id = #{partId}
        ORDER BY cleaned_at DESC
        LIMIT #{limit} OFFSET #{offset}
        """,
    )
    fun selectByPartId(
        @Param("partId") partId: UUID,
        @Param("limit") limit: Int,
        @Param("offset") offset: Int,
    ): List<CleaningRecord>

    @Select(
        """
        SELECT id, part_id, user_id, cleaned_at, note, created_at, updated_at
        FROM cleaning_record
        WHERE user_id = #{userId}
        ORDER BY cleaned_at DESC
        LIMIT #{limit} OFFSET #{offset}
        """,
    )
    fun selectByUserId(
        @Param("userId") userId: UUID,
        @Param("limit") limit: Int,
        @Param("offset") offset: Int,
    ): List<CleaningRecord>

    @Select("SELECT COUNT(*) FROM cleaning_record WHERE part_id = #{partId}")
    fun countByPartId(
        @Param("partId") partId: UUID,
    ): Int

    @Select("SELECT COUNT(*) FROM cleaning_record WHERE user_id = #{userId}")
    fun countByUserId(
        @Param("userId") userId: UUID,
    ): Int

    @Select("SELECT MAX(cleaned_at) FROM cleaning_record WHERE part_id = #{partId}")
    fun selectMaxCleanedAtByPartId(
        @Param("partId") partId: UUID,
    ): Instant?

    @Update(
        """
        UPDATE cleaning_record
        SET cleaned_at = #{cleanedAt}, note = #{note,jdbcType=VARCHAR}, updated_at = #{updatedAt}
        WHERE id = #{id}
        """,
    )
    fun update(record: CleaningRecord)

    @Delete("DELETE FROM cleaning_record WHERE id = #{id}")
    fun deleteById(
        @Param("id") id: UUID,
    )
}
