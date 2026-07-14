package com.cleaningapp.floorplan.presentation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

/**
 * 家具の回転角（度）が契約（api/openapi.yaml の Furniture.rotation）で
 * 許容する 0/90/180/270 のいずれかであることを検証する。
 *
 * jakarta.validation には「Int の列挙」を表す標準アノテーションが無いため独自定義する。
 * null は「未指定」を意味するため有効扱いとし、必須かどうかは適用先の型（Int / Int?）で表現する。
 */
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [RotationDegreesValidator::class])
annotation class RotationDegrees(
    val message: String = "rotation must be one of 0, 90, 180, 270",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

class RotationDegreesValidator : ConstraintValidator<RotationDegrees, Int> {
    override fun isValid(
        value: Int?,
        context: ConstraintValidatorContext?,
    ): Boolean = value == null || value in ALLOWED_DEGREES

    private companion object {
        val ALLOWED_DEGREES = setOf(0, 90, 180, 270)
    }
}
