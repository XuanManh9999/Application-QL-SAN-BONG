package com.example.app_ql_san_bong.ui.payments

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentPaymentBinding
import kotlinx.coroutines.launch

class PaymentFragment : Fragment(R.layout.fragment_payment) {
    private var _binding: FragmentPaymentBinding? = null
    private val binding get() = _binding!!

    private var bookingId: String = ""
    private var baseAmount: Double = 0.0
    private var finalAmount: Double = 0.0

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentPaymentBinding.bind(view)

        bookingId = arguments?.getString("bookingId").orEmpty()
        baseAmount = (arguments?.getFloat("baseAmount") ?: 0f).toDouble()
        finalAmount = baseAmount

        binding.txtAmount.text = "Tạm tính: ${baseAmount.toLong()} đ"

        binding.btnApply.setOnClickListener {
            binding.txtError.visibility = View.GONE
            val code = binding.edtPromo.text?.toString().orEmpty().trim()
            if (code.isBlank()) {
                binding.txtPromoResult.visibility = View.GONE
                finalAmount = baseAmount
                binding.txtAmount.text = "Tạm tính: ${baseAmount.toLong()} đ"
                return@setOnClickListener
            }
            val promoRepo = (requireActivity().application as FootballApp).promotionsRepository
            viewLifecycleOwner.lifecycleScope.launch {
                val r = promoRepo.apply(code, baseAmount)
                r.fold(
                    onSuccess = {
                        finalAmount = it.finalAmount
                        binding.txtPromoResult.visibility = View.VISIBLE
                        binding.txtPromoResult.text = "Giảm: ${it.discountAmount.toLong()} đ • Còn: ${it.finalAmount.toLong()} đ"
                        binding.txtAmount.text = "Tạm tính: ${it.finalAmount.toLong()} đ"
                    },
                    onFailure = { e ->
                        binding.txtError.visibility = View.VISIBLE
                        binding.txtError.text = e.message ?: "Không áp dụng được mã"
                        finalAmount = baseAmount
                        binding.txtAmount.text = "Tạm tính: ${baseAmount.toLong()} đ"
                    }
                )
            }
        }

        binding.btnPay.setOnClickListener {
            if (bookingId.isBlank()) {
                binding.txtError.visibility = View.VISIBLE
                binding.txtError.text = "Thiếu bookingId"
                return@setOnClickListener
            }
            val payRepo = (requireActivity().application as FootballApp).paymentsRepository
            viewLifecycleOwner.lifecycleScope.launch {
                val r = payRepo.createVnpayUrl(bookingId, finalAmount)
                r.fold(
                    onSuccess = { url ->
                        val args = Bundle().apply { putString("payUrl", url) }
                        findNavController().navigate(R.id.vnpayWebViewFragment, args)
                    },
                    onFailure = { e ->
                        binding.txtError.visibility = View.VISIBLE
                        binding.txtError.text = e.message ?: "Không tạo được URL VNPay"
                    }
                )
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

