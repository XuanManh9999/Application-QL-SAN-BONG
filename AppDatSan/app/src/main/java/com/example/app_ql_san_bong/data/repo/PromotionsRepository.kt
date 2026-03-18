package com.example.app_ql_san_bong.data.repo

import com.example.app_ql_san_bong.core.network.ApiClient
import com.example.app_ql_san_bong.core.network.ApiResponse
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.data.remote.ApplyPromotionRequest
import com.example.app_ql_san_bong.data.remote.ApplyPromotionResult
import com.example.app_ql_san_bong.data.remote.PromotionDto
import com.example.app_ql_san_bong.data.remote.PromotionsApi
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import retrofit2.HttpException
import java.io.IOException

class PromotionsRepository(authStore: AuthStore) {
    private val api = ApiClient.create(authStore).create(PromotionsApi::class.java)
    private val moshi = Moshi.Builder().build()

    suspend fun available(): Result<List<PromotionDto>> = runCatching {
        val res = api.available()
        res.data ?: emptyList()
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun apply(code: String, amount: Double): Result<ApplyPromotionResult> = runCatching {
        val res = api.apply(ApplyPromotionRequest(code.trim(), amount))
        res.data ?: error(res.message ?: "Không áp dụng được mã")
    }.recoverCatching { e -> throw normalize(e) }

    private fun normalize(e: Throwable): Throwable {
        return when (e) {
            is HttpException -> Exception(parseHttpError(e) ?: "Lỗi mạng: ${e.code()}")
            is IOException -> Exception("Không có kết nối mạng")
            else -> Exception(e.message ?: "Đã có lỗi xảy ra")
        }
    }

    private fun parseHttpError(e: HttpException): String? {
        val raw = try {
            e.response()?.errorBody()?.string()
        } catch (_: Throwable) {
            null
        } ?: return null

        return try {
            val type = Types.newParameterizedType(ApiResponse::class.java, Any::class.java)
            val adapter = moshi.adapter<ApiResponse<Any>>(type)
            val parsed = adapter.fromJson(raw)
            parsed?.message?.takeIf { it.isNotBlank() } ?: "Lỗi mạng: ${e.code()}"
        } catch (_: Throwable) {
            null
        }
    }
}

