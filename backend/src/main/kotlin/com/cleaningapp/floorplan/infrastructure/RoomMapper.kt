package com.cleaningapp.floorplan.infrastructure

import com.cleaningapp.floorplan.domain.Room
import org.apache.ibatis.annotations.Insert
import org.apache.ibatis.annotations.Mapper
import org.apache.ibatis.annotations.Param
import org.apache.ibatis.annotations.Select
import java.util.UUID

/**
 * MyBatis の Mapper（アノテーション形式）。SQLをKotlin内に直接書く。
 *
 * SELECT結果→Room(data class, valでsetterなし)へのマッピングは
 * 「コンストラクタ引数名ベースの自動マッピング」で行う:
 *   - application.yml: mybatis.configuration.arg-name-based-constructor-auto-mapping=true
 *   - build.gradle.kts: -java-parameters（引数名をバイトコードに残す）
 *   - map-underscore-to-camel-case=true で grid_x ↔ gridX を解決
 * これにより <resultMap>/<constructor> を書かずに data class を組み立てられる。
 */
@Mapper
interface RoomMapper {
    @Insert(
        """
        INSERT INTO room (id, user_id, name, type, grid_x, grid_y, grid_w, grid_h, created_at, updated_at)
        VALUES (#{id}, #{userId}, #{name}, #{type}, #{gridX}, #{gridY}, #{gridW}, #{gridH}, #{createdAt}, #{updatedAt})
        """,
    )
    fun insert(room: Room)

    @Select(
        """
        SELECT id, user_id, name, type, grid_x, grid_y, grid_w, grid_h, created_at, updated_at
        FROM room
        WHERE user_id = #{userId}
        ORDER BY created_at
        """,
    )
    fun selectByUserId(
        @Param("userId") userId: UUID,
    ): List<Room>
}
