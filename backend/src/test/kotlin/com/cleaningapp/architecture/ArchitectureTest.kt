package com.cleaningapp.architecture

import com.lemonappdev.konsist.api.Konsist
import com.lemonappdev.konsist.api.ext.list.withNameEndingWith
import com.lemonappdev.konsist.api.ext.list.withPackage
import com.lemonappdev.konsist.api.verify.assertTrue
import org.junit.jupiter.api.Test

class ArchitectureTest {
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
    fun `domain classes do not depend on Spring`() {
        Konsist
            .scopeFromProject()
            .files()
            .withPackage("..domain..")
            .assertTrue {
                it.imports.none { import -> import.name.startsWith("org.springframework") }
            }
    }
}
