package com.example.app_ql_san_bong.ui.home

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentHomeBinding

class HomeFragment : Fragment(R.layout.fragment_home) {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentHomeBinding.bind(view)

        // Sau này có thể bind tên user từ Profile/Me
        binding.txtUserName.text = "Khách hàng"

        binding.cardQuickBooking.setOnClickListener {
            findNavController().navigate(R.id.bookingsFragment)
        }
        binding.cardArticles.setOnClickListener {
            findNavController().navigate(R.id.articlesFragment)
        }
        binding.cardHistory.setOnClickListener {
            findNavController().navigate(R.id.historyFragment)
        }
        binding.cardPromotions.setOnClickListener {
            findNavController().navigate(R.id.promotionsFragment)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

