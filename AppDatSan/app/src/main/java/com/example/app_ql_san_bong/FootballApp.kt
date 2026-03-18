package com.example.app_ql_san_bong

import android.app.Application
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.data.repo.AuthRepository
import com.example.app_ql_san_bong.data.repo.ArticlesRepository
import com.example.app_ql_san_bong.data.repo.BookingRepository
import com.example.app_ql_san_bong.data.repo.MeRepository
import com.example.app_ql_san_bong.data.repo.PaymentsRepository
import com.example.app_ql_san_bong.data.repo.PromotionsRepository

class FootballApp : Application() {
    lateinit var authStore: AuthStore
        private set
    lateinit var authRepository: AuthRepository
        private set
    lateinit var articlesRepository: ArticlesRepository
        private set
    lateinit var bookingRepository: BookingRepository
        private set
    lateinit var meRepository: MeRepository
        private set
    lateinit var paymentsRepository: PaymentsRepository
        private set
    lateinit var promotionsRepository: PromotionsRepository
        private set

    override fun onCreate() {
        super.onCreate()
        authStore = AuthStore(this)
        authRepository = AuthRepository(authStore)
        articlesRepository = ArticlesRepository()
        bookingRepository = BookingRepository(authStore)
        meRepository = MeRepository(authStore)
        paymentsRepository = PaymentsRepository(authStore)
        promotionsRepository = PromotionsRepository(authStore)
    }
}

