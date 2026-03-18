package com.example.app_ql_san_bong.data.remote

import com.example.app_ql_san_bong.core.network.ApiResponse
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

data class ArticleAuthorDto(val id: String, val fullName: String)
data class ArticleDto(
    val id: String,
    val title: String,
    val slug: String,
    val summary: String?,
    val content: String?,
    val coverUrl: String?,
    val status: String,
    val author: ArticleAuthorDto?,
    val createdAt: String,
    val publishedAt: String?
)

interface ArticlesApi {
    @GET("public/articles")
    suspend fun list(@Query("q") q: String? = null): ApiResponse<List<ArticleDto>>

    @GET("public/articles/{id}")
    suspend fun get(@Path("id") id: String): ApiResponse<ArticleDto>
}

