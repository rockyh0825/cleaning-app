package com.cleaningapp.cleaningrecord.infrastructure

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import org.apache.ibatis.annotations.Delete
import org.apache.ibatis.annotations.Insert
import org.apache.ibatis.annotations.Mapper
import org.apache.ibatis.annotations.Param
import org.apache.ibatis.annotations.Select
import java.time.Instant
import java.util.UUID

/**
 * MyBatis Mapper for cleaning_record テーブル（アノテーション形式）。
 *
 * SELECT 結果 → CleaningRecord(data class, val でセッターなし) へのマッピングは
 * 「コンストラクタ引数名ベースの自動マッピング」で行う:
 *   - application.yml: mybatis.configuration.arg-name-based-constructor-auto-mapping=true
 *   - build.gradle.kts: -java-parameters（引数名をバイトコードに残す）
 *   - map-underscore-to-camel-case=true で part_id ↔ partId を解決
 *
 * UUID は UuidTypeHandler（shared/mybatis）が PostgreSQL の uuid 型と相互変換する。
 * Instant は MyBatis 内蔵の InstantTypeHandler が TIMESTAMPTZ と相互変換する。
 * note は NULL 許容のため jdbcType=VARCHAR を明示する。
 */
@Mapper
interface CleaningRecordMapper {
    @Insert(
        """
        INSERT INTO cleaning_record (id, part_id, user_id, cleaned_at, note, created_at, updated_at)
        VALUES (#{id}, #{partId}, #{userId}, #{cleanedAt}, #{note,jdbcType=VARCHAR},
                #{createdAt}, #{updatedAt})
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
        SELECT MAX(cleaned_at)
        FROM cleaning_record
        WHERE part_id = #{partId}
        """,
    )
    fun selectMaxCleanedAtByPartId(
        @Param("partId") partId: UUID,
    ): Instant?

    @Delete("DELETE FROM cleaning_record WHERE id = #{id}")
    fun deleteById(
        @Param("id") id: UUID,
    )
}
