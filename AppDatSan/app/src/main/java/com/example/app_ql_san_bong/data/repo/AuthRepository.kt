package com.example.app_ql_san_bong.data.repo

import com.example.app_ql_san_bong.core.network.ApiClient
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.data.remote.AuthApi
import com.example.app_ql_san_bong.data.remote.ForgotPasswordRequest
import com.example.app_ql_san_bong.data.remote.ForgotPasswordOtpRequest
import com.example.app_ql_san_bong.data.remote.LoginRequest
import com.example.app_ql_san_bong.data.remote.RegisterRequest
import com.example.app_ql_san_bong.data.remote.ResetPasswordOtpRequest
import retrofit2.HttpException
import java.io.IOException

class AuthRepository(private val authStore: AuthStore) {
    private val api: AuthApi = ApiClient.create(null).create(AuthApi::class.java)

    suspend fun login(email: String, password: String): Result<Unit> = runCatching {
        val res = api.login(LoginRequest(email, password))
        val data = res.data ?: error(res.message ?: "Đăng nhập thất bại")
        authStore.saveAuth(
            accessToken = data.accessToken,
            refreshToken = data.refreshToken,
            userId = data.user.id,
            userName = data.user.fullName,
            userEmail = data.user.email
        )
    }.mapCatching { Unit }.recoverCatching { e -> throw normalize(e) }

    suspend fun register(fullName: String, email: String, phone: String?, password: String): Result<Unit> = runCatching {
        val res = api.register(RegisterRequest(fullName, email, phone, password))
        if (res.success != true) error(res.message ?: "Đăng ký thất bại")
    }.mapCatching { Unit }.recoverCatching { e -> throw normalize(e) }

    suspend fun forgotPassword(email: String): Result<String> = runCatching {
        val res = api.forgotPassword(ForgotPasswordRequest(email))
        res.message ?: "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu"
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun forgotPasswordOtp(email: String): Result<String> = runCatching {
        val res = api.forgotPasswordOtp(ForgotPasswordOtpRequest(email))
        res.message ?: "Nếu email tồn tại, hệ thống đã gửi mã OTP đặt lại mật khẩu"
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun resetPasswordOtp(email: String, otp: String, newPassword: String): Result<String> = runCatching {
        val res = api.resetPasswordOtp(ResetPasswordOtpRequest(email, otp, newPassword))
        res.message ?: "Đổi mật khẩu thành công"
    }.recoverCatching { e -> throw normalize(e) }

    private fun normalize(e: Throwable): Throwable {
        return when (e) {
            is HttpException -> Exception("Lỗi mạng: ${e.code()}")
            is IOException -> Exception("Không có kết nối mạng")
            else -> Exception(e.message ?: "Đã có lỗi xảy ra")
        }
    }
}

