package com.example.app_ql_san_bong.core.network

import com.example.app_ql_san_bong.BuildConfig
import com.example.app_ql_san_bong.data.local.AuthStore
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

object ApiClient {
    fun create(authStore: AuthStore? = null): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val authInterceptor = Interceptor { chain ->
            val req = chain.request()
            val token = authStore?.accessTokenBlocking()
            val withAuth = if (!token.isNullOrBlank()) {
                req.newBuilder().addHeader("Authorization", "Bearer $token").build()
            } else req
            chain.proceed(withAuth)
        }

        val okHttp = OkHttpClient.Builder()
            .addInterceptor(logging)
            .addInterceptor(authInterceptor)
            .build()

        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(okHttp)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }
}

