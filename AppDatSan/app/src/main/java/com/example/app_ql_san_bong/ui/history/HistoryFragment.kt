package com.example.app_ql_san_bong.ui.history

import android.os.Bundle
import android.view.View
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.data.remote.BookingMeDto
import com.example.app_ql_san_bong.data.remote.PaymentTransactionMeDto
import com.example.app_ql_san_bong.databinding.FragmentHistoryBinding
import com.example.app_ql_san_bong.databinding.ItemHistoryBinding
import com.example.app_ql_san_bong.ui.auth.UiState
import com.example.app_ql_san_bong.ui.profile.HistoryViewModel
import com.example.app_ql_san_bong.ui.profile.MeVmFactory

class HistoryFragment : Fragment(R.layout.fragment_history) {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private val vm: HistoryViewModel by viewModels {
        MeVmFactory((requireActivity().application as FootballApp).meRepository)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentHistoryBinding.bind(view)

        val shouldRefresh = arguments?.getBoolean("refreshHistory") == true
        val paymentMsg = arguments?.getString("paymentMessage")
        val paymentSuccess = arguments?.getBoolean("paymentSuccess")
        if (!paymentMsg.isNullOrBlank() && paymentSuccess != null) {
            Toast.makeText(requireContext(), paymentMsg, Toast.LENGTH_SHORT).show()
            arguments?.remove("paymentMessage")
            arguments?.remove("paymentSuccess")
        }
        if (shouldRefresh) {
            arguments?.remove("refreshHistory")
        }

        val adapter = HistoryAdapter(onClickDetail = { showPaymentDetail(it) })
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

    private fun showPaymentDetail(item: BookingMeDto) {
        val paymentLines = if (item.paymentTransactions.isEmpty()) {
            "Chưa có giao dịch thanh toán nào cho booking này."
        } else {
            item.paymentTransactions.joinToString("\n\n") { tx ->
                buildTransactionLine(tx)
            }
        }

        val detail = buildString {
            append("Mã booking: ${item.bookingCode}\n")
            append("Sân: ${item.pitch?.name ?: "-"}\n")
            append("Ngày: ${item.bookingDate.take(10)}\n")
            append("Khung giờ: ${item.startTime} - ${item.endTime}\n")
            append("Trạng thái đặt sân: ${item.status}\n")
            append("Trạng thái thanh toán: ${item.paymentStatus}\n")
            append("Tạm tính: ${item.subtotalPrice?.toLong() ?: item.totalPrice.toLong()}đ\n")
            append("Giảm giá: ${item.discountAmount?.toLong() ?: 0}đ\n")
            append("Tổng tiền: ${item.totalPrice.toLong()}đ\n\n")
            append("--- Giao dịch thanh toán ---\n")
            append(paymentLines)
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Chi tiết thanh toán")
            .setMessage(detail)
            .setPositiveButton("Đóng", null)
            .show()
    }

    private fun buildTransactionLine(tx: PaymentTransactionMeDto): String {
        val paidAt = tx.paidAt?.take(19)?.replace("T", " ") ?: "-"
        val createdAt = tx.createdAt.take(19).replace("T", " ")
        return buildString {
            append("Mã GD: ${tx.txnRef}\n")
            append("Provider: ${tx.provider}\n")
            append("Trạng thái: ${tx.status}\n")
            append("Số tiền: ${tx.amount.toLong()}đ\n")
            append("Mã VNPay: ${tx.providerTxnNo ?: "-"}\n")
            append("Thời gian tạo: $createdAt\n")
            append("Thời gian thanh toán: $paidAt")
        }
    }

    override fun onResume() {
        super.onResume()
        vm.load()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private fun styleTag(view: android.widget.TextView, text: String, colorHex: String) {
    val color = Color.parseColor(colorHex)
    view.text = text
    view.setTextColor(color)
    val shape = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = 999f
        setColor(Color.argb(22, Color.red(color), Color.green(color), Color.blue(color)))
        setStroke(2, color)
    }
    view.background = shape
}

private class HistoryAdapter(
    private val onClickDetail: (BookingMeDto) -> Unit,
) : RecyclerView.Adapter<HistoryAdapter.VH>() {
    private val items = mutableListOf<BookingMeDto>()

    fun submit(data: List<BookingMeDto>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): VH {
        val v = android.view.LayoutInflater.from(parent.context).inflate(R.layout.item_history, parent, false)
        return VH(ItemHistoryBinding.bind(v), onClickDetail)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])
    override fun getItemCount(): Int = items.size

    class VH(
        private val binding: ItemHistoryBinding,
        private val onClickDetail: (BookingMeDto) -> Unit,
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: BookingMeDto) {
            val pitch = item.pitch?.name ?: "-"
            val txCount = item.paymentTransactions.size
            binding.txtTitle.text = "${item.bookingCode} • $pitch"
            binding.txtSub.text = "${item.bookingDate.take(10)} • ${item.startTime}-${item.endTime} • ${item.totalPrice.toLong()}đ"
            binding.txtStatus.text = "${item.status} • ${item.paymentStatus}"

            val bookingColor = when (item.status.uppercase()) {
                "CONFIRMED" -> "#16A34A"
                "PENDING" -> "#D97706"
                "CANCELLED" -> "#DC2626"
                else -> "#475569"
            }
            val paymentColor = when (item.paymentStatus.uppercase()) {
                "PAID" -> "#16A34A"
                "UNPAID" -> "#DC2626"
                else -> "#475569"
            }

            styleTag(binding.tagBookingStatus, item.status.uppercase(), bookingColor)
            styleTag(binding.tagPaymentStatus, item.paymentStatus.uppercase(), paymentColor)
            styleTag(binding.tagTxnCount, "$txCount GD", "#6D28D9")

            binding.root.setOnClickListener { onClickDetail(item) }
        }
    }
}

