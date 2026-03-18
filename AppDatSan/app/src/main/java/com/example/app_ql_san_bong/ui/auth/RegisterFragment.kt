package com.example.app_ql_san_bong.ui.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentRegisterBinding

class RegisterFragment : Fragment(R.layout.fragment_register) {
    private var _binding: FragmentRegisterBinding? = null
    private val binding get() = _binding!!

  private val vm: RegisterViewModel by viewModels {
    AuthVmFactory((requireActivity().application as FootballApp).authRepository)
  }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentRegisterBinding.bind(view)

        binding.txtBackLogin.setOnClickListener { findNavController().navigateUp() }
        binding.btnRegister.setOnClickListener {
      binding.txtError.visibility = View.GONE
      val fullName = binding.edtFullName.text?.toString().orEmpty().trim()
      val email = binding.edtEmail.text?.toString().orEmpty().trim()
      val phone = binding.edtPhone.text?.toString().orEmpty().trim().ifBlank { null }
      val pwd = binding.edtPassword.text?.toString().orEmpty()
      if (fullName.length < 2 || email.isBlank() || pwd.length < 6) {
        binding.txtError.visibility = View.VISIBLE
        binding.txtError.text = "Vui lòng nhập họ tên, email và mật khẩu (>= 6 ký tự)"
        return@setOnClickListener
      }
      vm.register(fullName, email, phone, pwd)
        }

    vm.state.observe(viewLifecycleOwner) { st ->
      when (st) {
        UiState.Idle -> Unit
        UiState.Loading -> binding.btnRegister.isEnabled = false
        is UiState.Error -> {
          binding.btnRegister.isEnabled = true
          binding.txtError.visibility = View.VISIBLE
          binding.txtError.text = st.message
        }
        is UiState.Success -> {
          binding.btnRegister.isEnabled = true
          Toast.makeText(requireContext(), "Đăng ký thành công", Toast.LENGTH_SHORT).show()
          findNavController().navigateUp()
        }
      }
    }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

