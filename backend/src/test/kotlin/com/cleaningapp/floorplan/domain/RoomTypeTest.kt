package com.cleaningapp.floorplan.domain

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource

class RoomTypeTest {

    @Test
    fun `kitchen_returns_preset_parts_with_correct_names_and_cycles`() {
        // Arrange & Act
        val parts = RoomType.KITCHEN.presetParts()

        // Assert
        assertThat(parts).hasSize(4)
        assertThat(parts.map { it.name }).containsExactly("シンク", "コンロ", "換気扇", "床")
        assertThat(parts.map { it.recommendedCycleDays }).containsExactly(3, 7, 30, 7)
    }

    @Test
    fun `bathroom_returns_preset_parts_with_correct_names_and_cycles`() {
        // Arrange & Act
        val parts = RoomType.BATHROOM.presetParts()

        // Assert
        assertThat(parts).hasSize(4)
        assertThat(parts.map { it.name }).containsExactly("浴槽", "床", "鏡", "排水口")
        assertThat(parts.map { it.recommendedCycleDays }).containsExactly(3, 7, 7, 14)
    }

    @Test
    fun `toilet_returns_preset_parts_with_correct_names_and_cycles`() {
        // Arrange & Act
        val parts = RoomType.TOILET.presetParts()

        // Assert
        assertThat(parts).hasSize(3)
        assertThat(parts.map { it.name }).containsExactly("便器", "床", "壁")
        assertThat(parts.map { it.recommendedCycleDays }).containsExactly(7, 7, 30)
    }

    @Test
    fun `bedroom_returns_preset_parts_with_correct_names_and_cycles`() {
        // Arrange & Act
        val parts = RoomType.BEDROOM.presetParts()

        // Assert
        assertThat(parts).hasSize(2)
        assertThat(parts.map { it.name }).containsExactly("床", "寝具まわり")
        assertThat(parts.map { it.recommendedCycleDays }).containsExactly(7, 7)
    }

    @Test
    fun `living_returns_preset_parts_with_correct_names_and_cycles`() {
        // Arrange & Act
        val parts = RoomType.LIVING.presetParts()

        // Assert
        assertThat(parts).hasSize(3)
        assertThat(parts.map { it.name }).containsExactly("床", "窓", "エアコンフィルター")
        assertThat(parts.map { it.recommendedCycleDays }).containsExactly(7, 30, 30)
    }

    @Test
    fun `other_returns_single_floor_preset_part`() {
        // Arrange & Act
        val parts = RoomType.OTHER.presetParts()

        // Assert
        assertThat(parts).hasSize(1)
        assertThat(parts[0].name).isEqualTo("床")
        assertThat(parts[0].recommendedCycleDays).isEqualTo(7)
    }

    @ParameterizedTest
    @EnumSource(RoomType::class)
    fun `all_room_types_return_non_empty_preset_parts`(roomType: RoomType) {
        // Arrange & Act
        val parts = roomType.presetParts()

        // Assert
        assertThat(parts).isNotEmpty
    }

    @ParameterizedTest
    @EnumSource(RoomType::class)
    fun `all_preset_parts_have_positive_recommended_cycle_days`(roomType: RoomType) {
        // Arrange & Act
        val parts = roomType.presetParts()

        // Assert
        assertThat(parts.map { it.recommendedCycleDays }).allMatch { it > 0 }
    }
}
