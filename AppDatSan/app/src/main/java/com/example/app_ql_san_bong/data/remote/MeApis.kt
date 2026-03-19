package com.example.app_ql_san_bong.data.remote

import com.example.app_ql_san_bong.core.network.ApiResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH

data class MeDto(
    val id: String,
    val fullName: String,
    val email: String,
    val phone: String?,
    val role: String
)

data class UpdateMeRequest(
    val fullName: String?,
    val phone: String?
)

interface UsersMeApi {
    @GET("users/me")
    suspend fun me(): ApiResponse<MeDto>

    @PATCH("users/me")
    suspend fun updateMe(@Body body: UpdateMeRequest): ApiResponse<MeDto>
}

data class VenueMiniDto(val id: String, val name: String, val address: String)
data class PitchMiniDto(val id: String, val name: String, val pitchType: String, val venue: VenueMiniDto)

data class PaymentTransactionMeDto(
    val id: String,
    val provider: String,
    val status: String,
    val amount: Double,
    val txnRef: String,
    val providerTxnNo: String?,
    val paidAt: String?,
    val createdAt: String
)

data class BookingMeDto(
    val id: String,
    val bookingCode: String,
    val bookingDate: String,
    val startTime: String,
    val endTime: String,
    val subtotalPrice: Double? = null,
    val discountAmount: Double? = null,
    val totalPrice: Double,
    val status: String,
    val paymentStatus: String,
    val pitch: PitchMiniDto?,
    val paymentTransactions: List<PaymentTransactionMeDto> = emptyList()
)

interface BookingsMeApi {
    @GET("bookings/me")
    suspend fun myBookings(): ApiResponse<List<BookingMeDto>>
}

