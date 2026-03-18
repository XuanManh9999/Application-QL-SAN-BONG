package com.example.app_ql_san_bong.ui.profile

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentProfileBinding
import com.example.app_ql_san_bong.ui.auth.UiState

class ProfileFragment : Fragment(R.layout.fragment_profile) {
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private val vm: ProfileViewModel by viewModels {
        MeVmFactory((requireActivity().application as FootballApp).meRepository)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentProfileBinding.bind(view)

        binding.btnSave.setOnClickListener {
            binding.txtError.visibility = View.GONE
            val name = binding.edtFullName.text?.toString()?.trim()
            val phone = binding.edtPhone.text?.toString()?.trim()
            vm.save(name, phone)
        }
        binding.btnLogout.setOnClickListener {
            vm.logout()
            // back to login
            findNavController().navigate(R.id.loginFragment, null,
                androidx.navigation.NavOptions.Builder()
                    .setPopUpTo(R.id.nav_graph, true)
                    .build()
            )
        }

        vm.state.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Idle -> Unit
                UiState.Loading -> binding.btnSave.isEnabled = false
                is UiState.Error -> {
                    binding.btnSave.isEnabled = true
                    binding.txtError.visibility = View.VISIBLE
                    binding.txtError.text = st.message
                }
                is UiState.Success -> {
                    binding.btnSave.isEnabled = true
                    val me = st.data
                    binding.edtFullName.setText(me.fullName)
                    binding.edtPhone.setText(me.phone ?: "")
                    binding.edtEmail.setText(me.email)
                    Toast.makeText(requireContext(), "Đã cập nhật", Toast.LENGTH_SHORT).show()
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

