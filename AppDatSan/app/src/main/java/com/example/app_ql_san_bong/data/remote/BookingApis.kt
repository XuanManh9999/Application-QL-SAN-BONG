package com.example.app_ql_san_bong.data.remote

import com.example.app_ql_san_bong.core.network.ApiResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST
import retrofit2.http.Query

data class VenueDto(
    val id: String,
    val name: String,
    val address: String,
    val openTime: String,
    val closeTime: String,
    val status: String
)

data class PitchVenueDto(val id: String, val name: String, val address: String)
data class PitchDto(
    val id: String,
    val venueId: String,
    val name: String,
    val pitchType: String,
    val basePrice: Double,
    val status: String,
    val venue: PitchVenueDto?
)

data class PitchDetailVenueDto(
    val id: String,
    val name: String,
    val address: String,
    val openTime: String,
    val closeTime: String
)
data class PitchDetailDto(
    val id: String,
    val name: String,
    val pitchType: String,
    val basePrice: Double,
    val status: String,
    val venue: PitchDetailVenueDto
)

data class BusyBookingDto(
    val id: String,
    val startTime: String,
    val endTime: String,
    val status: String
)

data class CreateBookingRequest(
    val pitchId: String,
    val bookingDate: String,
    val startTime: String,
    val endTime: String,
    val subtotalPrice: Double
)

data class BookingCreatedDto(
    val id: String,
    val bookingCode: String,
    val totalPrice: Double,
    val status: String,
    val paymentStatus: String
)

interface VenuesApi {
    @GET("venues")
    suspend fun listVenues(): ApiResponse<List<VenueDto>>
}

interface PitchesApi {
    @GET("pitches")
    suspend fun listPitches(@Query("venueId") venueId: String? = null): ApiResponse<List<PitchDto>>

    @GET("pitches/{id}")
    suspend fun getPitch(@Path("id") id: String): ApiResponse<PitchDetailDto>
}

interface BookingsApi {
    @GET("bookings")
    suspend fun listBusy(@Query("date") date: String, @Query("pitchId") pitchId: String): ApiResponse<List<BusyBookingDto>>

    @POST("bookings")
    suspend fun create(@Body body: CreateBookingRequest): ApiResponse<BookingCreatedDto>
}

