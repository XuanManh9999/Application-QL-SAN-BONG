package com.example.app_ql_san_bong.ui.articles

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.app_ql_san_bong.data.remote.ArticleDto
import com.example.app_ql_san_bong.data.repo.ArticlesRepository
import com.example.app_ql_san_bong.ui.auth.UiState
import kotlinx.coroutines.launch

class ArticlesViewModel(private val repo: ArticlesRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<List<ArticleDto>>>(UiState.Idle)
    val state: LiveData<UiState<List<ArticleDto>>> = _state

    fun load() {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.list()
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không tải được bài viết") }
            )
        }
    }
}

class ArticleDetailViewModel(private val repo: ArticlesRepository) : ViewModel() {
    private val _state = MutableLiveData<UiState<ArticleDto>>(UiState.Idle)
    val state: LiveData<UiState<ArticleDto>> = _state

    fun load(id: String) {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.get(id)
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không tải được bài viết") }
            )
        }
    }
}

class ArticlesVmFactory(private val repo: ArticlesRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(ArticlesViewModel::class.java) -> ArticlesViewModel(repo) as T
            modelClass.isAssignableFrom(ArticleDetailViewModel::class.java) -> ArticleDetailViewModel(repo) as T
            else -> throw IllegalArgumentException("Unknown ViewModel")
        }
    }
}

