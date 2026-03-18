package com.example.app_ql_san_bong.ui.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentLoginBinding

class LoginFragment : Fragment(R.layout.fragment_login) {
    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

  private val vm: LoginViewModel by viewModels {
    AuthVmFactory((requireActivity().application as FootballApp).authRepository)
  }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentLoginBinding.bind(view)

        binding.txtRegister.setOnClickListener {
            findNavController().navigate(R.id.action_login_to_register)
        }
        binding.txtForgot.setOnClickListener {
            findNavController().navigate(R.id.action_login_to_forgot)
        }
        binding.btnLogin.setOnClickListener {
      binding.txtError.visibility = View.GONE
      val email = binding.edtEmail.text?.toString().orEmpty().trim()
      val pwd = binding.edtPassword.text?.toString().orEmpty()
      if (email.isBlank() || pwd.length < 6) {
        binding.txtError.visibility = View.VISIBLE
        binding.txtError.text = "Vui lòng nhập email và mật khẩu (>= 6 ký tự)"
        return@setOnClickListener
      }
      vm.login(email, pwd)
        }

    vm.state.observe(viewLifecycleOwner) { st ->
      when (st) {
        UiState.Idle -> Unit
        UiState.Loading -> binding.btnLogin.isEnabled = false
        is UiState.Error -> {
          binding.btnLogin.isEnabled = true
          binding.txtError.visibility = View.VISIBLE
          binding.txtError.text = st.message
        }
        is UiState.Success -> {
          binding.btnLogin.isEnabled = true
          Toast.makeText(requireContext(), "Đăng nhập thành công", Toast.LENGTH_SHORT).show()
          findNavController().navigate(R.id.action_login_to_home)
        }
      }
    }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

