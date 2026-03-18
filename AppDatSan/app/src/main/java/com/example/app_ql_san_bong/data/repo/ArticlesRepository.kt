package com.example.app_ql_san_bong.data.repo

import com.example.app_ql_san_bong.core.network.ApiClient
import com.example.app_ql_san_bong.data.remote.ArticlesApi
import retrofit2.HttpException
import java.io.IOException

class ArticlesRepository {
    private val api: ArticlesApi = ApiClient.create(null).create(ArticlesApi::class.java)

    suspend fun list(): Result<List<com.example.app_ql_san_bong.data.remote.ArticleDto>> = runCatching {
        val res = api.list()
        res.data ?: emptyList()
    }.recoverCatching { e -> throw normalize(e) }

    suspend fun get(id: String): Result<com.example.app_ql_san_bong.data.remote.ArticleDto> = runCatching {
        val res = api.get(id)
        res.data ?: error("Không tìm thấy bài viết")
    }.recoverCatching { e -> throw normalize(e) }

    private fun normalize(e: Throwable): Throwable {
        return when (e) {
            is HttpException -> Exception("Lỗi mạng: ${e.code()}")
            is IOException -> Exception("Không có kết nối mạng")
            else -> Exception(e.message ?: "Đã có lỗi xảy ra")
        }
    }
}

