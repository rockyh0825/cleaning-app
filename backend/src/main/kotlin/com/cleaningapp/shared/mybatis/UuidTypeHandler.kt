package com.cleaningapp.shared.mybatis

import org.apache.ibatis.type.BaseTypeHandler
import org.apache.ibatis.type.JdbcType
import org.apache.ibatis.type.MappedTypes
import java.sql.CallableStatement
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.util.UUID

/**
 * MyBatis は java.util.UUID 用の TypeHandler を標準で持たないため自前で用意する。
 * PostgreSQL JDBC は uuid 列と java.util.UUID を setObject/getObject で相互変換できる。
 *
 * application.yml の mybatis.type-handlers-package で登録される。
 */
@MappedTypes(UUID::class)
class UuidTypeHandler : BaseTypeHandler<UUID>() {
    override fun setNonNullParameter(
        ps: PreparedStatement,
        i: Int,
        parameter: UUID,
        jdbcType: JdbcType?,
    ) {
        ps.setObject(i, parameter)
    }

    override fun getNullableResult(
        rs: ResultSet,
        columnName: String,
    ): UUID? = rs.getObject(columnName, UUID::class.java)

    override fun getNullableResult(
        rs: ResultSet,
        columnIndex: Int,
    ): UUID? = rs.getObject(columnIndex, UUID::class.java)

    override fun getNullableResult(
        cs: CallableStatement,
        columnIndex: Int,
    ): UUID? = cs.getObject(columnIndex, UUID::class.java)
}
