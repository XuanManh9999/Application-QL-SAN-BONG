package com.example.app_ql_san_bong.data.repo

import com.example.app_ql_san_bong.core.network.ApiClient
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.data.remote.BookingMeDto
import com.example.app_ql_san_bong.data.remote.BookingsMeApi
import com.example.app_ql_san_bong.data.remote.MeDto
import com.example.app_ql_san_bong.data.remote.UpdateMeRequest
import com.example.app_ql_san_bong.data.remote.UsersMeApi
import retrofit2.HttpException
import java.io.IOException

class MeRepository(private val authStore: AuthStore) {
    private val retrofit = ApiClient.create(authStore)
    private val usersApi = retrofit.create(UsersMeApi::class.java)
    private val bookingsApi = retrofit.create(BookingsMeApi::class.java)

    suspend fun me(): Result<MeDto> = runCatching {
        usersApi.me().data ?: error("Không tải được profile")
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun update(fullName: String?, phone: String?): Result<MeDto> = runCatching {
        usersApi.updateMe(UpdateMeRequest(fullName, phone)).data ?: error("Không cập nhật được")
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun myBookings(): Result<List<BookingMeDto>> = runCatching {
        bookingsApi.myBookings().data ?: emptyList()
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun logout() {
        authStore.clear()
    }

    private fun normalize(e: Throwable): Throwable {
        return when (e) {
            is HttpException -> Exception("Lỗi mạng: ${e.code()}")
            is IOException -> Exception("Không có kết nối mạng")
            else -> Exception(e.message ?: "Đã có lỗi xảy ra")
        }
    }
}

