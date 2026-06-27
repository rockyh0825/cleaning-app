package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.Furniture
import org.apache.ibatis.annotations.Delete
import org.apache.ibatis.annotations.Insert
import org.apache.ibatis.annotations.Mapper
import org.apache.ibatis.annotations.Param
import org.apache.ibatis.annotations.Select
import org.apache.ibatis.annotations.Update
import java.util.UUID

/**
 * MyBatis Mapper for furniture テーブル（アノテーション形式）。
 * presetKey は NULL 許容なので jdbcType=VARCHAR を明示する。
 */
@Mapper
interface FurnitureMapper {
    @Insert(
        """
        INSERT INTO furniture (id, room_id, name, preset_key, grid_x, grid_y, grid_w, grid_h, created_at, updated_at)
        VALUES (#{id}, #{roomId}, #{name}, #{presetKey,jdbcType=VARCHAR},
                #{gridX}, #{gridY}, #{gridW}, #{gridH}, #{createdAt}, #{updatedAt})
        """,
    )
    fun insert(furniture: Furniture)

    @Select(
        """
        SELECT id, room_id, name, preset_key, grid_x, grid_y, grid_w, grid_h, created_at, updated_at
        FROM furniture
        WHERE room_id = #{roomId}
        ORDER BY created_at
        """,
    )
    fun selectByRoomId(
        @Param("roomId") roomId: UUID,
    ): List<Furniture>

    @Select(
        """
        SELECT id, room_id, name, preset_key, grid_x, grid_y, grid_w, grid_h, created_at, updated_at
        FROM furniture
        WHERE id = #{id}
        """,
    )
    fun selectById(
        @Param("id") id: UUID,
    ): Furniture?

    @Update(
        """
        UPDATE furniture
        SET name = #{name}, grid_x = #{gridX}, grid_y = #{gridY},
            grid_w = #{gridW}, grid_h = #{gridH}, updated_at = #{updatedAt}
        WHERE id = #{id}
        """,
    )
    fun update(furniture: Furniture)

    @Delete("DELETE FROM furniture WHERE id = #{id}")
    fun deleteById(
        @Param("id") id: UUID,
    )
}
