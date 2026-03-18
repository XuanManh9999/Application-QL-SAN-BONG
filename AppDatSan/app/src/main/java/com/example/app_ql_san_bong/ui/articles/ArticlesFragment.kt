package com.example.app_ql_san_bong.ui.articles

import android.os.Bundle
import android.view.View
import android.text.Editable
import android.text.TextWatcher
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.data.remote.ArticleDto
import com.example.app_ql_san_bong.databinding.FragmentArticlesBinding
import com.example.app_ql_san_bong.databinding.ItemArticleBinding
import com.example.app_ql_san_bong.ui.auth.UiState
import java.text.SimpleDateFormat
import java.util.Locale

class ArticlesFragment : Fragment(R.layout.fragment_articles) {
    private var _binding: FragmentArticlesBinding? = null
    private val binding get() = _binding!!

    private val vm: ArticlesViewModel by viewModels {
        ArticlesVmFactory((requireActivity().application as FootballApp).articlesRepository)
    }

    private val allArticles = mutableListOf<ArticleDto>()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentArticlesBinding.bind(view)

        val adapter = ArticlesAdapter { article ->
            val args = Bundle().apply { putString("articleId", article.id) }
            findNavController().navigate(R.id.articleDetailFragment, args)
        }
        binding.rv.layoutManager = LinearLayoutManager(requireContext())
        binding.rv.adapter = adapter

        vm.state.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Idle -> Unit
                UiState.Loading -> {
                    binding.txtEmpty.visibility = View.GONE
                }
                is UiState.Error -> {
                    binding.txtEmpty.visibility = View.VISIBLE
                    binding.txtEmpty.text = st.message
                }
                is UiState.Success -> {
                    allArticles.clear()
                    allArticles.addAll(st.data)
                    adapter.submit(st.data)
                    binding.txtEmpty.visibility = if (st.data.isEmpty()) View.VISIBLE else View.GONE
                }
            }
        }

        vm.load()

        binding.edtSearchArticle.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val q = s?.toString().orEmpty().lowercase()
                val filtered = if (q.isBlank()) {
                    allArticles
                } else {
                    allArticles.filter {
                        it.title.lowercase().contains(q) ||
                                (it.summary ?: "").lowercase().contains(q)
                    }
                }
                adapter.submit(filtered)
                binding.txtEmpty.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private class ArticlesAdapter(
    private val onClick: (ArticleDto) -> Unit
) : RecyclerView.Adapter<ArticlesAdapter.VH>() {
    private val items = mutableListOf<ArticleDto>()

    fun submit(data: List<ArticleDto>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): VH {
        val v = android.view.LayoutInflater.from(parent.context).inflate(R.layout.item_article, parent, false)
        return VH(ItemArticleBinding.bind(v), onClick)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])
    override fun getItemCount(): Int = items.size

    class VH(private val binding: ItemArticleBinding, private val onClick: (ArticleDto) -> Unit) :
        RecyclerView.ViewHolder(binding.root) {
        fun bind(item: ArticleDto) {
            binding.txtTitle.text = item.title
            binding.txtSummary.text = item.summary ?: ""
            val meta = buildString {
                append(item.author?.fullName ?: "")
                if (!item.publishedAt.isNullOrBlank()) {
                    append(" • ")
                    append(item.publishedAt.take(10))
                }
            }.trim().ifBlank { item.createdAt.take(10) }
            binding.txtMeta.text = meta
            binding.root.setOnClickListener { onClick(item) }
        }
    }
}

