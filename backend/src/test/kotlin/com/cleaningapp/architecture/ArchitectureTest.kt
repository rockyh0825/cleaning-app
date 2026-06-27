package com.cleaningapp.architecture

import com.lemonappdev.konsist.api.Konsist
import com.lemonappdev.konsist.api.ext.list.withNameEndingWith
import com.lemonappdev.konsist.api.verify.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertTrue as assertCondition

class ArchitectureTest {
    companion object {
        private val springStereotypeAnnotations =
            setOf("Service", "Component", "Repository", "Controller", "RestController")
    }

    @Test
    fun `UseCase suffix classes reside in application package`() {
        Konsist
            .scopeFromProject()
            .classes()
            .withNameEndingWith("UseCase")
            .assertTrue { it.resideInPackage("..application..") }
    }

    @Test
    fun `Controller suffix classes reside in presentation package`() {
        Konsist
            .scopeFromProject()
            .classes()
            .withNameEndingWith("Controller")
            .assertTrue { it.resideInPackage("..presentation..") }
    }

    @Test
    fun `Mapper suffix classes reside in infrastructure package`() {
        Konsist
            .scopeFromProject()
            .classes()
            .withNameEndingWith("Mapper")
            .assertTrue { it.resideInPackage("..infrastructure..") }
    }

    @Test
    fun `domain classes do not use Spring stereotype annotations`() {
        Konsist
            .scopeFromProject()
            .classes()
            .filter { it.resideInPackage("..domain..") }
            .forEach { koClass ->
                val violations =
                    koClass.annotations
                        .filter { it.name in springStereotypeAnnotations }
                assertCondition(violations.isEmpty()) {
                    "${koClass.name} must not use Spring stereotype annotations " +
                        "(@Service/@Component/etc) in the domain layer, " +
                        "but found: ${violations.map { it.name }}"
                }
            }
    }
}
