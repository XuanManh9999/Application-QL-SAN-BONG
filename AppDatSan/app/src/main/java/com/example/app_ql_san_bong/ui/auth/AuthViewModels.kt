package com.example.app_ql_san_bong.ui.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.app_ql_san_bong.data.repo.AuthRepository
import kotlinx.coroutines.launch

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class LoginViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<Unit>>(UiState.Idle)
    val state: LiveData<UiState<Unit>> = _state

    fun login(email: String, password: String) {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.login(email, password)
            _state.value = r.fold(
                onSuccess = { UiState.Success(Unit) },
                onFailure = { UiState.Error(it.message ?: "Đăng nhập thất bại") }
            )
        }
    }
}

class RegisterViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<Unit>>(UiState.Idle)
    val state: LiveData<UiState<Unit>> = _state

    fun register(fullName: String, email: String, phone: String?, password: String) {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.register(fullName, email, phone, password)
            _state.value = r.fold(
                onSuccess = { UiState.Success(Unit) },
                onFailure = { UiState.Error(it.message ?: "Đăng ký thất bại") }
            )
        }
    }
}

class ForgotPasswordViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<String>>(UiState.Idle)
    val state: LiveData<UiState<String>> = _state

    fun sendOtp(email: String) {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.forgotPasswordOtp(email)
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không gửi được email") }
            )
        }
    }

    fun resetWithOtp(email: String, otp: String, newPassword: String) {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.resetPasswordOtp(email, otp, newPassword)
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không đổi được mật khẩu") }
            )
        }
    }
}

class AuthVmFactory(private val repo: AuthRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(LoginViewModel::class.java) -> LoginViewModel(repo) as T
            modelClass.isAssignableFrom(RegisterViewModel::class.java) -> RegisterViewModel(repo) as T
            modelClass.isAssignableFrom(ForgotPasswordViewModel::class.java) -> ForgotPasswordViewModel(repo) as T
            else -> throw IllegalArgumentException("Unknown ViewModel")
        }
    }
}

