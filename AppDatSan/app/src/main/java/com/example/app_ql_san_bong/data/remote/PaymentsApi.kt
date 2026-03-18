package com.example.app_ql_san_bong.data.remote

import com.example.app_ql_san_bong.core.network.ApiResponse
import retrofit2.http.Body
import retrofit2.http.POST

data class CreateVnpayUrlRequest(
    val bookingId: String,
    val amount: Double? = null,
    val bankCode: String? = null,
    val locale: String? = "vn"
)

data class CreateVnpayUrlResult(
    val paymentUrl: String,
    val txnRef: String
)

interface PaymentsApi {
    @POST("payments/vnpay/create-url")
    suspend fun createUrl(@Body body: CreateVnpayUrlRequest): ApiResponse<CreateVnpayUrlResult>
}

