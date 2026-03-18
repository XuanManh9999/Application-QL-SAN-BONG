package com.example.app_ql_san_bong.ui.promotions

import android.os.Bundle
import android.view.View
import androidx.lifecycle.viewModelScope
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.data.remote.PromotionDto
import com.example.app_ql_san_bong.databinding.FragmentPromotionsBinding
import com.example.app_ql_san_bong.databinding.ItemPromotionBinding
import com.example.app_ql_san_bong.ui.auth.UiState
import kotlinx.coroutines.launch

class PromotionsFragment : Fragment(R.layout.fragment_promotions) {
    private var _binding: FragmentPromotionsBinding? = null
    private val binding get() = _binding!!

    private val vm: PromotionsViewModel by viewModels {
        PromotionsVmFactory((requireActivity().application as FootballApp).promotionsRepository)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentPromotionsBinding.bind(view)

        val adapter = PromotionsAdapter()
        binding.rvPromos.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPromos.adapter = adapter

        vm.state.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Loading -> {
                    binding.txtEmptyPromo.visibility = View.GONE
                }
                is UiState.Error -> {
                    binding.txtEmptyPromo.visibility = View.VISIBLE
                    binding.txtEmptyPromo.text = st.message
                }
                is UiState.Success -> {
                    adapter.submit(st.data)
                    binding.txtEmptyPromo.visibility = if (st.data.isEmpty()) View.VISIBLE else View.GONE
                }
                else -> Unit
            }
        }

        vm.load()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class PromotionsViewModel(
    private val repo: com.example.app_ql_san_bong.data.repo.PromotionsRepository
) : androidx.lifecycle.ViewModel() {
    private val _state = androidx.lifecycle.MutableLiveData<UiState<List<PromotionDto>>>(UiState.Loading)
    val state: androidx.lifecycle.LiveData<UiState<List<PromotionDto>>> = _state

    fun load() {
        _state.value = UiState.Loading
        viewModelScope.launch {
            val r = repo.available()
            _state.value = r.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Không load được mã giảm giá") }
            )
        }
    }
}

class PromotionsVmFactory(
    private val repo: com.example.app_ql_san_bong.data.repo.PromotionsRepository
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        return PromotionsViewModel(repo) as T
    }
}

private class PromotionsAdapter :
    RecyclerView.Adapter<PromotionsAdapter.VH>() {
    private val items = mutableListOf<PromotionDto>()

    fun submit(data: List<PromotionDto>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): VH {
        val v = android.view.LayoutInflater.from(parent.context)
            .inflate(R.layout.item_promotion, parent, false)
        return VH(ItemPromotionBinding.bind(v))
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])
    override fun getItemCount(): Int = items.size

    class VH(private val binding: ItemPromotionBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: PromotionDto) {
            binding.txtCode.text = item.code
            binding.txtName.text = item.name ?: (item.description ?: "")
            val meta = buildString {
                append(
                    when (item.type) {
                        "PERCENT" -> "Giảm ${item.value.toInt()}%"
                        else -> "Giảm ${item.value.toInt()} đ"
                    }
                )
                if (item.maxDiscount != null) {
                    append(" • Tối đa ${item.maxDiscount.toInt()} đ")
                }
                if (item.minOrder != null) {
                    append(" • ĐH tối thiểu ${item.minOrder.toInt()} đ")
                }
                if (!item.startAt.isNullOrBlank() && !item.endAt.isNullOrBlank()) {
                    append("\nHiệu lực: ${item.startAt.take(10)} - ${item.endAt.take(10)}")
                }
            }
            binding.txtMetaPromo.text = meta
        }
    }
}

