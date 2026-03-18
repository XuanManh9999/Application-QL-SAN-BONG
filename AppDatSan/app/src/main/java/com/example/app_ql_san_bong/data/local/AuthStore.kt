package com.example.app_ql_san_bong.data.local

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore(name = "auth_store")

class AuthStore(private val context: Context) {
    private val KEY_ACCESS = stringPreferencesKey("access_token")
    private val KEY_REFRESH = stringPreferencesKey("refresh_token")
    private val KEY_USER_EMAIL = stringPreferencesKey("user_email")
    private val KEY_USER_NAME = stringPreferencesKey("user_name")
    private val KEY_USER_ID = stringPreferencesKey("user_id")

    val accessTokenFlow: Flow<String?> = context.dataStore.data.map { it[KEY_ACCESS] }

    fun accessTokenBlocking(): String? = runBlocking { context.dataStore.data.first()[KEY_ACCESS] }

    suspend fun saveAuth(accessToken: String, refreshToken: String, userId: String, userName: String, userEmail: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ACCESS] = accessToken
            prefs[KEY_REFRESH] = refreshToken
            prefs[KEY_USER_ID] = userId
            prefs[KEY_USER_NAME] = userName
            prefs[KEY_USER_EMAIL] = userEmail
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}

