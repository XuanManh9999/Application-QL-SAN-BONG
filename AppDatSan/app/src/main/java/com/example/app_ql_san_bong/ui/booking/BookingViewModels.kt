package com.example.app_ql_san_bong.ui.booking

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.app_ql_san_bong.data.remote.BusyBookingDto
import com.example.app_ql_san_bong.data.remote.PitchDto
import com.example.app_ql_san_bong.data.remote.VenueDto
import com.example.app_ql_san_bong.data.repo.BookingRepository
import com.example.app_ql_san_bong.ui.auth.UiState
import kotlinx.coroutines.launch

data class Slot(val start: String, val end: String)

class BookingViewModel(private val repo: BookingRepository) : ViewModel() {
    private val _venues = MutableLiveData<UiState<List<VenueDto>>>(UiState.Idle)
    val venues: LiveData<UiState<List<VenueDto>>> = _venues

    private val _pitches = MutableLiveData<UiState<List<PitchDto>>>(UiState.Idle)
    val pitches: LiveData<UiState<List<PitchDto>>> = _pitches

    private val _slots = MutableLiveData<UiState<List<Slot>>>(UiState.Idle)
    val slots: LiveData<UiState<List<Slot>>> = _slots

    private var openTime: String = "06:00"
    private var closeTime: String = "23:00"
    private var basePrice: Double = 300000.0

    fun loadVenues() {
        _venues.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.venues()
            _venues.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không tải được cụm sân") }
            )
        }
    }

    fun loadPitches(venueId: String?) {
        _pitches.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.pitches(venueId)
            _pitches.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không tải được sân") }
            )
        }
    }

    fun loadAvailability(date: String, pitchId: String) {
        _slots.value = UiState.Loading
        viewModelScope.launch {
            val pitch = repo.pitchDetail(pitchId).getOrNull()
            if (pitch != null) {
                openTime = pitch.venue.openTime
                closeTime = pitch.venue.closeTime
                basePrice = pitch.basePrice
            }
            val busy = repo.busy(date, pitchId)
            _slots.value = busy.fold(
                onSuccess = { UiState.Success(buildSlots(it)) },
                onFailure = { UiState.Error(it.message ?: "Không tải được lịch") }
            )
        }
    }

    fun createBooking(pitchId: String, date: String, slot: Slot): LiveData<UiState<Pair<String, Double>>> {
        val live = MutableLiveData<UiState<Pair<String, Double>>>(UiState.Loading)
        viewModelScope.launch {
            val r = repo.createBooking(pitchId, date, slot.start, slot.end, basePrice)
            live.value = r.fold(
                onSuccess = { UiState.Success(it to basePrice) },
                onFailure = { UiState.Error(it.message ?: "Không tạo được booking") }
            )
        }
        return live
    }

    private fun buildSlots(busy: List<BusyBookingDto>): List<Slot> {
        val startMin = toMin(openTime).coerceAtLeast(0)
        val endMin = toMin(closeTime).coerceAtLeast(startMin)
        val step = 30
        val duration = 90
        val busyRanges = busy.map { toMin(it.startTime) to toMin(it.endTime) }
        val slots = mutableListOf<Slot>()
        var t = startMin
        while (t + duration <= endMin) {
            val s = t
            val e = t + duration
            val conflict = busyRanges.any { (bs, be) -> maxOf(s, bs) < minOf(e, be) }
            if (!conflict) slots.add(Slot(fromMin(s), fromMin(e)))
            t += step
        }
        return slots
    }

    private fun toMin(time: String): Int {
        val parts = time.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
        return h * 60 + m
    }

    private fun fromMin(m: Int): String {
        val h = (m / 60).toString().padStart(2, '0')
        val mm = (m % 60).toString().padStart(2, '0')
        return "$h:$mm"
    }
}

class BookingVmFactory(private val repo: BookingRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(BookingViewModel::class.java)) {
            return BookingViewModel(repo) as T
        }
        throw IllegalArgumentException("Unknown ViewModel")
    }
}

