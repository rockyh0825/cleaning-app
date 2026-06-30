package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class DeletePartUseCaseTest {
    @MockK
    private lateinit var partManagementPort: PartManagementPort

    private val useCase by lazy { DeletePartUseCase(partManagementPort) }

    private val userId = UUID.randomUUID()
    private val partId = UUID.randomUUID()
    private val ownerId = UUID.randomUUID()

    private fun makePart() =
        Part(
            id = partId,
            ownerType = OwnerType.ROOM,
            ownerId = ownerId,
            name = "テストパーツ",
            recommendedCycleDays = 7,
            lastCleanedAt = null,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `deletes_part_when_it_exists`() {
        // Arrange
        every { partManagementPort.findById(partId) } returns makePart()
        justRun { partManagementPort.delete(partId) }

        // Act
        useCase.execute(userId, partId)

        // Assert
        verify(exactly = 1) { partManagementPort.delete(partId) }
    }

    @Test
    fun `throws_not_found_exception_when_deleting_non_existent_part`() {
        // Arrange
        every { partManagementPort.findById(partId) } returns null

        // Act / Assert
        assertThatThrownBy {
            useCase.execute(userId, partId)
        }.isInstanceOf(NotFoundException::class.java)
    }
}
