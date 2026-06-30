package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@ExtendWith(MockKExtension::class)
class CleaningStatusPortImplTest {
    @MockK
    private lateinit var partManagementPort: PartManagementPort

    private val portImpl by lazy { CleaningStatusPortImpl(partManagementPort) }

    private val userId = UUID.randomUUID()
    private val areaId = UUID.randomUUID()

    private fun makePart(
        id: UUID = UUID.randomUUID(),
        ownerId: UUID = areaId,
        ownerType: OwnerType = OwnerType.ROOM,
        lastCleanedAt: Instant?,
        cycleDays: Int = 7,
    ): Part {
        val now = Instant.now()
        return Part(
            id = id,
            ownerType = ownerType,
            ownerId = ownerId,
            name = "テストパーツ",
            recommendedCycleDays = cycleDays,
            lastCleanedAt = lastCleanedAt,
            createdAt = now,
            updatedAt = now,
        )
    }

    @Test
    fun `returns_only_overdue_parts_when_getting_overdue_areas`() {
        // Arrange
        val overduePartId = UUID.randomUUID()
        val freshPartId = UUID.randomUUID()
        val overdueRoomId = UUID.randomUUID()
        val freshRoomId = UUID.randomUUID()
        // 10日前に掃除、周期7日 → elapsedRatio > 1.0（期限超過）
        val overduePart =
            makePart(
                id = overduePartId,
                ownerId = overdueRoomId,
                lastCleanedAt = Instant.now().minus(10, ChronoUnit.DAYS),
                cycleDays = 7,
            )
        // 3日前に掃除、周期7日 → elapsedRatio < 1.0（期限内）
        val freshPart =
            makePart(
                id = freshPartId,
                ownerId = freshRoomId,
                lastCleanedAt = Instant.now().minus(3, ChronoUnit.DAYS),
                cycleDays = 7,
            )
        every { partManagementPort.findAllByUserId(userId) } returns listOf(overduePart, freshPart)

        // Act
        val result = portImpl.getOverdueAreas(userId)

        // Assert
        assertThat(result).hasSize(1)
        assertThat(result.first().partId).isEqualTo(overduePartId)
        assertThat(result.first().areaId).isEqualTo(overdueRoomId)
        assertThat(result.first().elapsedRatio).isGreaterThan(1.0)
    }

    @Test
    fun `returns_latest_last_cleaned_at_for_given_area`() {
        // Arrange
        val partId1 = UUID.randomUUID()
        val partId2 = UUID.randomUUID()
        val olderDate = Instant.parse("2024-01-01T00:00:00Z")
        val newerDate = Instant.parse("2024-01-10T00:00:00Z")
        val part1 = makePart(id = partId1, lastCleanedAt = olderDate)
        val part2 = makePart(id = partId2, lastCleanedAt = newerDate)
        every { partManagementPort.findByOwnerId(OwnerType.ROOM, areaId) } returns listOf(part1, part2)

        // Act
        val result = portImpl.getLastCleanedAt(areaId)

        // Assert
        assertThat(result).isEqualTo(newerDate)
    }

    @Test
    fun `returns_null_when_no_parts_exist_for_area`() {
        // Arrange
        every { partManagementPort.findByOwnerId(OwnerType.ROOM, areaId) } returns emptyList()

        // Act
        val result = portImpl.getLastCleanedAt(areaId)

        // Assert
        assertThat(result).isNull()
    }

    @Test
    fun `returns_empty_list_when_no_parts_exist_for_user`() {
        // Arrange
        every { partManagementPort.findAllByUserId(userId) } returns emptyList()

        // Act
        val result = portImpl.getOverdueAreas(userId)

        // Assert
        assertThat(result).hasSize(0)
    }

    @Test
    fun `returns_never_cleaned_part_as_overdue_when_last_cleaned_at_is_null`() {
        // Arrange: 未掃除（lastCleanedAt = null）→ CleaningStatus.compute が Double.MAX_VALUE を返し期限超過扱い
        val roomId = UUID.randomUUID()
        val partId = UUID.randomUUID()
        val neverCleanedPart = makePart(id = partId, ownerId = roomId, lastCleanedAt = null, cycleDays = 7)
        every { partManagementPort.findAllByUserId(userId) } returns listOf(neverCleanedPart)

        // Act
        val result = portImpl.getOverdueAreas(userId)

        // Assert
        assertThat(result).hasSize(1)
        assertThat(result.first().partId).isEqualTo(partId)
        assertThat(result.first().elapsedRatio).isEqualTo(Double.MAX_VALUE)
    }

    @Test
    fun `excludes_furniture_parts_from_overdue_areas`() {
        // Arrange: FURNITURE タイプのパーツは areaId が Room UUID でないため除外する
        val furnitureId = UUID.randomUUID()
        val furniturePart =
            makePart(
                ownerId = furnitureId,
                ownerType = OwnerType.FURNITURE,
                lastCleanedAt = Instant.now().minus(30, ChronoUnit.DAYS),
                cycleDays = 7,
            )
        every { partManagementPort.findAllByUserId(userId) } returns listOf(furniturePart)

        // Act
        val result = portImpl.getOverdueAreas(userId)

        // Assert: FURNITURE は除外されるため空リスト
        assertThat(result).hasSize(0)
    }
}
