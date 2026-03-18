package com.example.app_ql_san_bong.data.remote

import com.example.app_ql_san_bong.core.network.ApiResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class ApplyPromotionRequest(val code: String, val amount: Double)
data class ApplyPromotionResult(
    val promotionId: String,
    val code: String,
    val type: String,
    val originalAmount: Double,
    val discountAmount: Double,
    val finalAmount: Double
)

interface PromotionsApi {
    @GET("promotions/available")
    suspend fun available(): ApiResponse<List<PromotionDto>>

    @POST("promotions/apply")
    suspend fun apply(@Body body: ApplyPromotionRequest): ApiResponse<ApplyPromotionResult>
}

data class PromotionDto(
    val id: String,
    val code: String,
    val name: String?,
    val description: String?,
    val type: String,
    val value: Double,
    val maxDiscount: Double?,
    val minOrder: Double?,
    val startAt: String?,
    val endAt: String?
)

