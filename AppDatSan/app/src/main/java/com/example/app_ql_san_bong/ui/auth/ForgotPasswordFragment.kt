package com.example.app_ql_san_bong.ui.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentForgotPasswordBinding

class ForgotPasswordFragment : Fragment(R.layout.fragment_forgot_password) {
    private var _binding: FragmentForgotPasswordBinding? = null
    private val binding get() = _binding!!

  private val vm: ForgotPasswordViewModel by viewModels {
    AuthVmFactory((requireActivity().application as FootballApp).authRepository)
  }

    private enum class PendingAction { SEND_OTP, RESET }
    private var pendingAction: PendingAction = PendingAction.SEND_OTP

    private fun goLogin() {
        val nav = findNavController()
        val popped = nav.popBackStack(R.id.loginFragment, false)
        if (!popped) nav.navigate(R.id.loginFragment)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentForgotPasswordBinding.bind(view)

        binding.txtBackLogin.setOnClickListener { goLogin() }
        binding.btnGoLogin.setOnClickListener { goLogin() }
        binding.btnSend.setOnClickListener {
      binding.txtError.visibility = View.GONE
      binding.txtMessage.visibility = View.GONE
      binding.btnGoLogin.visibility = View.GONE
      val email = binding.edtEmail.text?.toString().orEmpty().trim()
      if (email.isBlank()) {
        binding.txtError.visibility = View.VISIBLE
        binding.txtError.text = "Vui lòng nhập email"
        return@setOnClickListener
      }
      pendingAction = PendingAction.SEND_OTP
      vm.sendOtp(email)
        }

        binding.btnReset.setOnClickListener {
            binding.txtError.visibility = View.GONE
            binding.txtMessage.visibility = View.GONE
            binding.btnGoLogin.visibility = View.GONE
            val email = binding.edtEmail.text?.toString().orEmpty().trim()
            val otp = binding.edtOtp.text?.toString().orEmpty().trim()
            val pwd = binding.edtNewPassword.text?.toString().orEmpty()
            if (email.isBlank()) {
                binding.txtError.visibility = View.VISIBLE
                binding.txtError.text = "Vui lòng nhập email"
                return@setOnClickListener
            }
            if (otp.length < 4) {
                binding.txtError.visibility = View.VISIBLE
                binding.txtError.text = "Vui lòng nhập OTP"
                return@setOnClickListener
            }
            if (pwd.length < 6) {
                binding.txtError.visibility = View.VISIBLE
                binding.txtError.text = "Mật khẩu tối thiểu 6 ký tự"
                return@setOnClickListener
            }
            pendingAction = PendingAction.RESET
            vm.resetWithOtp(email, otp, pwd)
        }

    vm.state.observe(viewLifecycleOwner) { st ->
      when (st) {
        UiState.Idle -> Unit
        UiState.Loading -> {
            binding.btnSend.isEnabled = false
            binding.btnReset.isEnabled = false
        }
        is UiState.Error -> {
          binding.btnSend.isEnabled = true
          binding.btnReset.isEnabled = true
          binding.txtError.visibility = View.VISIBLE
          binding.txtError.text = st.message
          binding.btnGoLogin.visibility = View.VISIBLE
        }
        is UiState.Success -> {
          binding.btnSend.isEnabled = true
          binding.btnReset.isEnabled = true
          binding.txtMessage.visibility = View.VISIBLE
          binding.txtMessage.text = st.data
          when (pendingAction) {
            PendingAction.SEND_OTP -> {
              Toast.makeText(requireContext(), "Đã gửi OTP", Toast.LENGTH_SHORT).show()
              binding.groupReset.visibility = View.VISIBLE
            }
            PendingAction.RESET -> {
              Toast.makeText(requireContext(), "Đổi mật khẩu thành công", Toast.LENGTH_SHORT).show()
              binding.btnGoLogin.visibility = View.VISIBLE
            }
          }
        }
      }
    }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

