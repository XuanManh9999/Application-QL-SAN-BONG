package com.example.app_ql_san_bong.ui.payments

import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentVnpayWebviewBinding

class VnpayWebViewFragment : Fragment(R.layout.fragment_vnpay_webview) {
    private var _binding: FragmentVnpayWebviewBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentVnpayWebviewBinding.bind(view)

        val payUrl = arguments?.getString("payUrl").orEmpty()
        binding.webView.settings.javaScriptEnabled = true
        binding.webView.settings.domStorageEnabled = true

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                // When VNPay redirects to backend return endpoint, close WebView and return to previous screen.
                if (url.contains("/api/v1/payments/vnpay/return")) {
                    findNavController().popBackStack(R.id.historyFragment, false)
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
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

