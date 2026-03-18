package com.example.app_ql_san_bong.core.network

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

data class ApiError(
    val message: String
)

