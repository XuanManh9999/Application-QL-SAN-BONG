package com.example.app_ql_san_bong.data.repo

import com.example.app_ql_san_bong.core.network.ApiClient
import com.example.app_ql_san_bong.core.network.ApiResponse
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.data.remote.CreateVnpayUrlRequest
import com.example.app_ql_san_bong.data.remote.PaymentsApi
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import retrofit2.HttpException
import java.io.IOException

class PaymentsRepository(authStore: AuthStore) {
    private val api = ApiClient.create(authStore).create(PaymentsApi::class.java)
    private val moshi = Moshi.Builder().build()

    suspend fun createVnpayUrl(bookingId: String, amount: Double? = null): Result<String> = runCatching {
        val res = api.createUrl(CreateVnpayUrlRequest(bookingId = bookingId, amount = amount))
        res.data?.paymentUrl ?: error(res.message ?: "Không tạo được URL thanh toán")
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

        // Backend thường trả { success:false, message:"...", errors:[...] }
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

