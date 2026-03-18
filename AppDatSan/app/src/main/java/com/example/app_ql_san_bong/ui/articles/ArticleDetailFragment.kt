package com.example.app_ql_san_bong.ui.articles

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.databinding.FragmentArticleDetailBinding
import com.example.app_ql_san_bong.ui.auth.UiState
import org.commonmark.parser.Parser
import org.commonmark.renderer.html.HtmlRenderer

class ArticleDetailFragment : Fragment(R.layout.fragment_article_detail) {
    private var _binding: FragmentArticleDetailBinding? = null
    private val binding get() = _binding!!

    private val vm: ArticleDetailViewModel by viewModels {
        ArticlesVmFactory((requireActivity().application as FootballApp).articlesRepository)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentArticleDetailBinding.bind(view)
        val id = arguments?.getString("articleId").orEmpty()

        binding.webView.settings.javaScriptEnabled = false
        binding.webView.settings.domStorageEnabled = false
        binding.webView.settings.loadWithOverviewMode = true
        binding.webView.settings.useWideViewPort = true

        vm.state.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Idle -> Unit
                UiState.Loading -> binding.txtTitle.text = "Đang tải..."
                is UiState.Error -> binding.txtTitle.text = st.message
                is UiState.Success -> {
                    val a = st.data
                    binding.txtTitle.text = a.title
                    val raw = a.content ?: ""
                    val bodyHtml = if (looksLikeHtml(raw)) {
                        raw
                    } else {
                        markdownToHtml(raw)
                    }
                    val full = wrapHtml(bodyHtml)
                    // baseURL is non-null to keep data: images and relative links stable
                    binding.webView.loadDataWithBaseURL("https://app.local/", full, "text/html", "utf-8", null)
                }
            }
        }

        if (id.isNotBlank()) vm.load(id)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private fun looksLikeHtml(s: String): Boolean {
    val t = s.trim()
    if (t.isEmpty()) return false
    return t.contains("<") && t.contains(">") && Regex("</?[a-zA-Z][\\s\\S]*>").containsMatchIn(t)
}

private fun markdownToHtml(md: String): String {
    if (md.isBlank()) return ""
    val parser = Parser.builder().build()
    val doc = parser.parse(md)
    val renderer = HtmlRenderer.builder().escapeHtml(true).build()
    return renderer.render(doc)
}

private fun wrapHtml(body: String): String {
    val css = """
        :root { color-scheme: light; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          line-height: 1.55;
          padding: 14px;
          color: #111827;
        }
        h1,h2,h3 { line-height: 1.25; }
        p { margin: 0 0 12px; }
        img { max-width: 100%; height: auto; border-radius: 10px; }
        blockquote {
          margin: 12px 0;
          padding: 10px 12px;
          border-left: 4px solid #6D28D9;
          background: rgba(109,40,217,0.06);
          border-radius: 10px;
        }
        pre, code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        pre {
          white-space: pre-wrap;
          background: #0b1220;
          color: #e5e7eb;
          padding: 12px;
          border-radius: 12px;
          overflow-x: auto;
        }
        a { color: #6D28D9; text-decoration: none; }
        ul, ol { padding-left: 20px; }
    """.trimIndent()

    return """
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>$css</style>
          </head>
          <body>$body</body>
        </html>
    """.trimIndent()
}

