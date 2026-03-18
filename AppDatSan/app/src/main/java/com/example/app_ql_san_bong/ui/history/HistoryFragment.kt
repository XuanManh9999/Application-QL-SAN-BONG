package com.example.app_ql_san_bong.ui.history

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.data.remote.BookingMeDto
import com.example.app_ql_san_bong.databinding.FragmentHistoryBinding
import com.example.app_ql_san_bong.databinding.ItemHistoryBinding
import com.example.app_ql_san_bong.ui.auth.UiState
import com.example.app_ql_san_bong.ui.profile.MeVmFactory
import com.example.app_ql_san_bong.ui.profile.HistoryViewModel

class HistoryFragment : Fragment(R.layout.fragment_history) {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private val vm: HistoryViewModel by viewModels {
        MeVmFactory((requireActivity().application as FootballApp).meRepository)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentHistoryBinding.bind(view)
        val adapter = HistoryAdapter()
        binding.rv.layoutManager = LinearLayoutManager(requireContext())
        binding.rv.adapter = adapter

        vm.state.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Idle -> Unit
                UiState.Loading -> {
                    binding.txtEmpty.visibility = View.VISIBLE
                    binding.txtEmpty.text = "Đang tải..."
                }
                is UiState.Error -> {
                    binding.txtEmpty.visibility = View.VISIBLE
                    binding.txtEmpty.text = st.message
                }
                is UiState.Success -> {
                    adapter.submit(st.data)
                    binding.txtEmpty.visibility = if (st.data.isEmpty()) View.VISIBLE else View.GONE
                    if (st.data.isEmpty()) binding.txtEmpty.text = "Chưa có booking."
                }
            }
        }

        vm.load()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private class HistoryAdapter : RecyclerView.Adapter<HistoryAdapter.VH>() {
    private val items = mutableListOf<BookingMeDto>()

    fun submit(data: List<BookingMeDto>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): VH {
        val v = android.view.LayoutInflater.from(parent.context).inflate(R.layout.item_history, parent, false)
        return VH(ItemHistoryBinding.bind(v))
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])
    override fun getItemCount(): Int = items.size

    class VH(private val binding: ItemHistoryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: BookingMeDto) {
            val pitch = item.pitch?.name ?: "-"
            binding.txtTitle.text = "${item.bookingCode} • $pitch"
            binding.txtSub.text = "${item.bookingDate.take(10)} • ${item.startTime}-${item.endTime} • ${item.totalPrice.toLong()}đ"
            binding.txtStatus.text = "${item.status} • ${item.paymentStatus}"
        }
    }
}

