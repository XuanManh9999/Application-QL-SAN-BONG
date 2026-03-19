package com.example.app_ql_san_bong

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.navOptions
import androidx.navigation.ui.setupWithNavController
import com.example.app_ql_san_bong.data.local.AuthStore
import com.example.app_ql_san_bong.databinding.ActivityMainBinding
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navHost = supportFragmentManager.findFragmentById(R.id.nav_host) as NavHostFragment
        val navController = navHost.navController
        binding.bottomNav.setupWithNavController(navController)

        val authStore = AuthStore(this)
        val authDestinations = setOf(R.id.loginFragment, R.id.registerFragment, R.id.forgotPasswordFragment)

        navController.addOnDestinationChangedListener { _, destination, _ ->
            binding.bottomNav.visibility = if (authDestinations.contains(destination.id)) View.GONE else View.VISIBLE
        }

        // Enforce login for protected screens
        lifecycleScope.launch {
            val token = authStore.accessTokenFlow.first()
            val current = navController.currentDestination?.id
            if (!token.isNullOrBlank()) {
                if (current == R.id.loginFragment) {
                    navController.navigate(R.id.homeFragment, null, navOptions {
                        popUpTo(R.id.loginFragment) { inclusive = true }
                    })
                }
            }
        }

        // Guard: redirect to login if token missing
        navController.addOnDestinationChangedListener { _, destination, _ ->
            val currentId = destination.id
            if (authDestinations.contains(currentId)) return@addOnDestinationChangedListener
            val token = authStore.accessTokenBlocking()
            if (token.isNullOrBlank()) {
                navController.navigate(R.id.loginFragment, null, navOptions {
                    popUpTo(R.id.nav_graph) { inclusive = true }
                })
            }
        }

        // Auto-redirect when token is cleared (e.g. backend returns 401 because token expired)
        lifecycleScope.launch {
            authStore.accessTokenFlow.collect { token ->
                val currentId = navController.currentDestination?.id
                if (!token.isNullOrBlank()) return@collect
                if (currentId != null && !authDestinations.contains(currentId)) {
                    navController.navigate(R.id.loginFragment, null, navOptions {
                        popUpTo(R.id.nav_graph) { inclusive = true }
                        launchSingleTop = true
                    })
                }
            }
        }
    }
}

