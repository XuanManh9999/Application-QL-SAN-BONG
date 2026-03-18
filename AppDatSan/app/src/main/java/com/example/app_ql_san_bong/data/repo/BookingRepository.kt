package com.example.app_ql_san_bong.data.repo

import com.example.app_ql_san_bong.core.network.ApiClient
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.data.remote.BookingsApi
import com.example.app_ql_san_bong.data.remote.BusyBookingDto
import com.example.app_ql_san_bong.data.remote.CreateBookingRequest
import com.example.app_ql_san_bong.data.remote.PitchesApi
import com.example.app_ql_san_bong.data.remote.PitchDetailDto
import com.example.app_ql_san_bong.data.remote.PitchDto
import com.example.app_ql_san_bong.data.remote.VenuesApi
import com.example.app_ql_san_bong.data.remote.VenueDto
import retrofit2.HttpException
import java.io.IOException

class BookingRepository(authStore: AuthStore) {
    private val retrofit = ApiClient.create(authStore)
    private val venuesApi = retrofit.create(VenuesApi::class.java)
    private val pitchesApi = retrofit.create(PitchesApi::class.java)
    private val bookingsApi = retrofit.create(BookingsApi::class.java)

    suspend fun venues(): Result<List<VenueDto>> = runCatching {
        venuesApi.listVenues().data ?: emptyList()
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun pitches(venueId: String?): Result<List<PitchDto>> = runCatching {
        pitchesApi.listPitches(venueId).data ?: emptyList()
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun pitchDetail(id: String): Result<PitchDetailDto> = runCatching {
        pitchesApi.getPitch(id).data ?: error("Không tải được sân")
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun busy(date: String, pitchId: String): Result<List<BusyBookingDto>> = runCatching {
        bookingsApi.listBusy(date, pitchId).data ?: emptyList()
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun createBooking(pitchId: String, date: String, start: String, end: String, subtotal: Double): Result<String> = runCatching {
        val res = bookingsApi.create(CreateBookingRequest(pitchId, date, start, end, subtotal))
        res.data?.id ?: error(res.message ?: "Không tạo được booking")
    }.recoverCatching { e -> throw normalize(e) }

    private fun normalize(e: Throwable): Throwable {
        return when (e) {
            is HttpException -> Exception("Lỗi mạng: ${e.code()}")
            is IOException -> Exception("Không có kết nối mạng")
            else -> Exception(e.message ?: "Đã có lỗi xảy ra")
        }
    }
}

