package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import org.apache.ibatis.annotations.Delete
import org.apache.ibatis.annotations.Insert
import org.apache.ibatis.annotations.Mapper
import org.apache.ibatis.annotations.Param
import org.apache.ibatis.annotations.Select
import org.apache.ibatis.annotations.Update
import java.util.UUID

/**
 * MyBatis Mapper for part テーブル（アノテーション形式）。
 * owner_type は OwnerType enum → TEXT 変換。MyBatis の EnumTypeHandler が name() を使うため
 * DB 値（"ROOM"/"FURNITURE"）と enum 名が一致している限り自動変換される。
 * last_cleaned_at は NULL 許容なので jdbcType=TIMESTAMP を明示する。
 */
@Mapper
interface PartMapper {
    @Insert(
        """
        INSERT INTO part (id, owner_type, owner_id, name, recommended_cycle_days, last_cleaned_at, created_at, updated_at)
        VALUES (#{id}, #{ownerType}, #{ownerId}, #{name}, #{recommendedCycleDays},
                #{lastCleanedAt,jdbcType=TIMESTAMP}, #{createdAt}, #{updatedAt})
        """,
    )
    fun insert(part: Part)

    @Select(
        """
        SELECT id, owner_type, owner_id, name, recommended_cycle_days, last_cleaned_at, created_at, updated_at
        FROM part
        WHERE owner_type = #{ownerType} AND owner_id = #{ownerId}
        ORDER BY created_at
        """,
    )
    fun selectByOwnerId(
        @Param("ownerType") ownerType: OwnerType,
        @Param("ownerId") ownerId: UUID,
    ): List<Part>

    @Update(
        """
        UPDATE part
        SET name = #{name}, recommended_cycle_days = #{recommendedCycleDays},
            last_cleaned_at = #{lastCleanedAt,jdbcType=TIMESTAMP}, updated_at = #{updatedAt}
        WHERE id = #{id}
        """,
    )
    fun update(part: Part)

    @Select(
        """
        SELECT id, owner_type, owner_id, name, recommended_cycle_days, last_cleaned_at, created_at, updated_at
        FROM part
        WHERE id = #{id}
        """,
    )
    fun selectById(
        @Param("id") id: UUID,
    ): Part?

    @Delete("DELETE FROM part WHERE owner_type = #{ownerType} AND owner_id = #{ownerId}")
    fun deleteByOwnerId(
        @Param("ownerType") ownerType: OwnerType,
        @Param("ownerId") ownerId: UUID,
    )

    @Delete("DELETE FROM part WHERE id = #{id}")
    fun deleteById(
        @Param("id") id: UUID,
    )

    @Select(
        """
        SELECT p.id, p.owner_type, p.owner_id, p.name, p.recommended_cycle_days, p.last_cleaned_at, p.created_at, p.updated_at
        FROM part p
        JOIN room r ON (p.owner_type = 'ROOM' AND p.owner_id = r.id)
        WHERE r.user_id = #{userId}
        UNION ALL
        SELECT p.id, p.owner_type, p.owner_id, p.name, p.recommended_cycle_days, p.last_cleaned_at, p.created_at, p.updated_at
        FROM part p
        JOIN furniture f ON (p.owner_type = 'FURNITURE' AND p.owner_id = f.id)
        JOIN room r2 ON f.room_id = r2.id
        WHERE r2.user_id = #{userId}
        ORDER BY created_at
        """,
    )
    fun selectAllByUserId(
        @Param("userId") userId: UUID,
    ): List<Part>
}
