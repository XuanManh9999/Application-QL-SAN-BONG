package com.example.app_ql_san_bong.ui.payments

import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.navOptions
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentVnpayWebviewBinding

class VnpayWebViewFragment : Fragment(R.layout.fragment_vnpay_webview) {
    private var _binding: FragmentVnpayWebviewBinding? = null
    private val binding get() = _binding!!
    private var handledResult = false

    private fun isVnpayReturnPath(url: String): Boolean {
        val u = url.lowercase()
        return u.contains("/api/v1/payments/vnpay/return")
    }

    private fun hasVnpayResultParams(url: String): Boolean {
        val u = url.lowercase()
        return u.contains("vnp_responsecode=") && u.contains("vnp_txnref=")
    }

    private fun extractResult(url: String): Triple<Boolean, String, String> {
        val uri = Uri.parse(url)
        val code = uri.getQueryParameter("vnp_ResponseCode")
        val bookingCode = uri.getQueryParameter("bookingCode")
        val txnRef = uri.getQueryParameter("vnp_TxnRef").orEmpty()
        val msg = if (code == "00") {
            bookingCode?.let { "Thanh toán thành công cho mã $it" } ?: "Thanh toán thành công"
        } else {
            "Thanh toán thất bại (${code ?: "N/A"})"
        }
        return Triple(code == "00", msg, txnRef)
    }

    private fun handleReturnUrl(url: String) {
        if (handledResult) return
        if (!hasVnpayResultParams(url)) return
        handledResult = true
        val (success, message, txnRef) = extractResult(url)
        goPaymentResult(success, message, txnRef)
    }

    private fun goPaymentResult(success: Boolean, message: String, txnRef: String) {
        val args = Bundle().apply {
            putBoolean("paymentSuccess", success)
            putString("paymentMessage", message)
            putString("txnRef", txnRef)
        }
        findNavController().navigate(
            R.id.paymentResultFragment,
            args,
            navOptions {
                popUpTo(R.id.bookingsFragment) { inclusive = false }
                launchSingleTop = true
            }
        )
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentVnpayWebviewBinding.bind(view)

        val payUrl = arguments?.getString("payUrl").orEmpty()
        binding.webView.settings.javaScriptEnabled = true
        binding.webView.settings.domStorageEnabled = true

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                if (isVnpayReturnPath(url)) {
                    // Cho phép WebView load URL return để backend xử lý callback và cập nhật DB.
                    return false
                }
                if (hasVnpayResultParams(url)) {
                    handleReturnUrl(url)
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                val safeUrl = url.orEmpty()
                if (safeUrl.isNotBlank()) {
                    handleReturnUrl(safeUrl)
                }
            }
        }

        if (payUrl.isNotBlank()) {
            binding.webView.loadUrl(payUrl)
        } else {
            findNavController().navigateUp()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding.webView.stopLoading()
        binding.webView.webViewClient = WebViewClient()
        _binding = null
    }
}

