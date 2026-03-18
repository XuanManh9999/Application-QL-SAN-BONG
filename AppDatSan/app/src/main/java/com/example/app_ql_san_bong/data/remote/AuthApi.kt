package com.example.app_ql_san_bong.data.remote

import com.example.app_ql_san_bong.core.network.ApiResponse
import retrofit2.http.Body
import retrofit2.http.POST

data class LoginRequest(val email: String, val password: String)
data class RegisterRequest(val fullName: String, val email: String, val phone: String?, val password: String)
data class ForgotPasswordRequest(val email: String)
data class ForgotPasswordOtpRequest(val email: String)
data class ResetPasswordOtpRequest(val email: String, val otp: String, val newPassword: String)

data class AuthUserDto(val id: String, val fullName: String, val email: String, val role: String)
data class LoginResultDto(val user: AuthUserDto, val accessToken: String, val refreshToken: String)

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): ApiResponse<LoginResultDto>

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): ApiResponse<AuthUserDto>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): ApiResponse<Any>

    @POST("auth/forgot-password-otp")
    suspend fun forgotPasswordOtp(@Body body: ForgotPasswordOtpRequest): ApiResponse<Any>

    @POST("auth/reset-password-otp")
    suspend fun resetPasswordOtp(@Body body: ResetPasswordOtpRequest): ApiResponse<Any>
}

