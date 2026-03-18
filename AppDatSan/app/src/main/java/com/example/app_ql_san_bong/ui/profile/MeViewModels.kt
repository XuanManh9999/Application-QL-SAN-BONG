package com.example.app_ql_san_bong.ui.profile

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.app_ql_san_bong.data.remote.BookingMeDto
import com.example.app_ql_san_bong.data.remote.MeDto
import com.example.app_ql_san_bong.data.repo.MeRepository
import com.example.app_ql_san_bong.ui.auth.UiState
import kotlinx.coroutines.launch

class ProfileViewModel(private val repo: MeRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<MeDto>>(UiState.Idle)
    val state: LiveData<UiState<MeDto>> = _state

    fun load() {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.me()
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không tải được profile") }
            )
        }
    }

    fun save(fullName: String?, phone: String?) {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.update(fullName, phone)
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không cập nhật được") }
            )
        }
    }

    fun logout() {
        viewModelScope.launch { repo.logout() }
    }
}

class HistoryViewModel(private val repo: MeRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<List<BookingMeDto>>>(UiState.Idle)
    val state: LiveData<UiState<List<BookingMeDto>>> = _state

    fun load() {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.myBookings()
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không tải được lịch sử") }
            )
        }
    }
}

class MeVmFactory(private val repo: MeRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(ProfileViewModel::class.java) -> ProfileViewModel(repo) as T
            modelClass.isAssignableFrom(HistoryViewModel::class.java) -> HistoryViewModel(repo) as T
            else -> throw IllegalArgumentException("Unknown ViewModel")
        }
    }
}

