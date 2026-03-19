package com.example.app_ql_san_bong.ui.payments

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.navOptions
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentPaymentResultBinding

class PaymentResultFragment : Fragment(R.layout.fragment_payment_result) {
    private var _binding: FragmentPaymentResultBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentPaymentResultBinding.bind(view)

        val success = arguments?.getBoolean("paymentSuccess") ?: false
        val message = arguments?.getString("paymentMessage").orEmpty()
        val txnRef = arguments?.getString("txnRef").orEmpty()

        binding.txtIcon.text = if (success) "✅" else "❌"
        binding.txtTitle.text = if (success) "Thanh toán thành công" else "Thanh toán thất bại"
        binding.txtTitle.setTextColor(resources.getColor(if (success) R.color.success else R.color.error, null))
        binding.txtMessage.text = if (message.isBlank()) {
            if (success) "Giao dịch đã được ghi nhận thành công." else "Giao dịch không thành công, vui lòng thử lại."
        } else message
        binding.txtTxnRef.text = if (txnRef.isBlank()) "" else "Mã giao dịch: $txnRef"

        binding.btnViewHistory.setOnClickListener {
            val args = Bundle().apply {
                putBoolean("refreshHistory", true)
                putBoolean("paymentSuccess", success)
                putString("paymentMessage", message)
            }
            findNavController().navigate(
                R.id.historyFragment,
                args,
                navOptions {
                    popUpTo(R.id.bookingsFragment) { inclusive = false }
                    launchSingleTop = true
                }
            )
        }

        binding.btnBackHome.setOnClickListener {
            findNavController().navigate(
                R.id.homeFragment,
                null,
                navOptions {
                    popUpTo(R.id.homeFragment) { inclusive = false }
                    launchSingleTop = true
                }
            )
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
