package com.example.app_ql_san_bong.ui.booking

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.example.app_ql_san_bong.FootballApp
import com.example.app_ql_san_bong.R
import com.example.app_ql_san_bong.data.remote.PitchDto
import com.example.app_ql_san_bong.data.remote.VenueDto
import com.example.app_ql_san_bong.databinding.FragmentBookingsBinding
import com.example.app_ql_san_bong.databinding.ItemSlotBinding
import com.example.app_ql_san_bong.ui.auth.UiState
import java.util.Calendar

class BookingsFragment : Fragment(R.layout.fragment_bookings) {
    private var _binding: FragmentBookingsBinding? = null
    private val binding get() = _binding!!

    private val vm: BookingViewModel by viewModels {
        BookingVmFactory((requireActivity().application as FootballApp).bookingRepository)
    }

    private var venues: List<VenueDto> = emptyList()
    private var pitches: List<PitchDto> = emptyList()
    private var selectedVenueId: String? = null
    private var selectedPitchId: String? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentBookingsBinding.bind(view)

        val slotAdapter = SlotAdapter { slot ->
            val pitchId = selectedPitchId ?: return@SlotAdapter
            val date = binding.edtDate.text?.toString().orEmpty()
            val live = vm.createBooking(pitchId, date, slot)
            live.observe(viewLifecycleOwner) { st ->
                when (st) {
                    UiState.Loading -> Unit
                    is UiState.Error -> Toast.makeText(requireContext(), st.message, Toast.LENGTH_SHORT).show()
                    is UiState.Success -> {
                        val (bookingId, baseAmount) = st.data
                        Toast.makeText(requireContext(), "Đã tạo booking, chuyển sang thanh toán...", Toast.LENGTH_SHORT).show()
                        val args = Bundle().apply {
                            putString("bookingId", bookingId)
                            putFloat("baseAmount", baseAmount.toFloat())
                        }
                        findNavController().navigate(R.id.paymentFragment, args)
                    }
                    else -> Unit
                }
            }
        }
        binding.rvSlots.layoutManager = LinearLayoutManager(requireContext())
        binding.rvSlots.adapter = slotAdapter

        val cal = Calendar.getInstance()
        setDate(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH))
        binding.edtDate.setOnClickListener {
            DatePickerDialog(requireContext(), { _, y, m, d ->
                setDate(y, m, d)
                refreshAvailability()
            }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
        }

        vm.venues.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Loading -> Unit
                is UiState.Error -> Toast.makeText(requireContext(), st.message, Toast.LENGTH_SHORT).show()
                is UiState.Success -> {
                    venues = st.data.filter { it.status == "ACTIVE" }
                    // hiển thị tên lên field nếu đã chọn
                    val current = venues.firstOrNull { it.id == selectedVenueId }
                    if (current != null) {
                        binding.spVenue.setText(current.name, false)
                    }
                }
                else -> Unit
            }
        }
        vm.pitches.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Loading -> Unit
                is UiState.Error -> Toast.makeText(requireContext(), st.message, Toast.LENGTH_SHORT).show()
                is UiState.Success -> {
                    pitches = st.data.filter { it.status == "ACTIVE" }
                    val current = pitches.firstOrNull { it.id == selectedPitchId }
                    if (current != null) {
                        binding.spPitch.setText("${current.name} (${current.pitchType})", false)
                    }
                }
                else -> Unit
            }
        }
        vm.slots.observe(viewLifecycleOwner) { st ->
            when (st) {
                UiState.Loading -> {
                    binding.txtEmpty.visibility = View.VISIBLE
                    binding.txtEmpty.text = "Đang tải khung giờ..."
                }
                is UiState.Error -> {
                    binding.txtEmpty.visibility = View.VISIBLE
                    binding.txtEmpty.text = st.message
                    slotAdapter.submit(emptyList())
                }
                is UiState.Success -> {
                    slotAdapter.submit(st.data)
                    binding.txtEmpty.visibility = if (st.data.isEmpty()) View.VISIBLE else View.GONE
                    if (st.data.isEmpty()) binding.txtEmpty.text = "Không còn khung giờ trống."
                }
                else -> Unit
            }
        }

        binding.spVenue.setOnClickListener { showVenuePicker() }
        binding.spPitch.setOnClickListener { showPitchPicker() }

        vm.loadVenues()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun setDate(y: Int, m: Int, d: Int) {
        val mm = (m + 1).toString().padStart(2, '0')
        val dd = d.toString().padStart(2, '0')
        binding.edtDate.setText("$y-$mm-$dd")
    }

    private fun refreshAvailability() {
        val pitchId = selectedPitchId ?: return
        val date = binding.edtDate.text?.toString().orEmpty()
        if (date.isBlank()) return
        vm.loadAvailability(date, pitchId)
    }

    private fun showVenuePicker() {
        if (venues.isEmpty()) {
            Toast.makeText(requireContext(), "Đang tải danh sách cụm sân...", Toast.LENGTH_SHORT).show()
            return
        }
        val dialogView = layoutInflater.inflate(R.layout.dialog_pick_item, null)
        val title = dialogView.findViewById<TextView>(R.id.txtTitle)
        val edtSearch = dialogView.findViewById<EditText>(R.id.edtSearch)
        val rv = dialogView.findViewById<RecyclerView>(R.id.rvItems)
        title.text = "Chọn cụm sân"
        val items = venues.map {
            PickItem(it.id, it.name, it.address ?: "")
        }
        val adapter = PickItemAdapter { item ->
            selectedVenueId = item.id
            selectedPitchId = null
            binding.spVenue.setText(item.title, false)
            binding.spPitch.setText("", false)
            vm.loadPitches(selectedVenueId)
        }
        rv.layoutManager = LinearLayoutManager(requireContext())
        rv.adapter = adapter
        adapter.submit(items)
        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .create()
        adapter.onItemPicked = {
            dialog.dismiss()
        }
        edtSearch.addTextChangedListener {
            adapter.filter(it?.toString().orEmpty())
        }
        dialog.show()
    }

    private fun showPitchPicker() {
        if (selectedVenueId == null) {
            Toast.makeText(requireContext(), "Vui lòng chọn cụm sân trước.", Toast.LENGTH_SHORT).show()
            return
        }
        if (pitches.isEmpty()) {
            Toast.makeText(requireContext(), "Đang tải danh sách sân...", Toast.LENGTH_SHORT).show()
            return
        }
        val dialogView = layoutInflater.inflate(R.layout.dialog_pick_item, null)
        val title = dialogView.findViewById<TextView>(R.id.txtTitle)
        val edtSearch = dialogView.findViewById<EditText>(R.id.edtSearch)
        val rv = dialogView.findViewById<RecyclerView>(R.id.rvItems)
        title.text = "Chọn sân"
        val items = pitches.map {
            val desc = buildString {
                append(it.pitchType ?: "")
                if (it.basePrice != null) {
                    if (isNotEmpty()) append(" • ")
                    append("${it.basePrice} đ/slot")
                }
            }
            PickItem(it.id, it.name, desc)
        }
        val adapter = PickItemAdapter { item ->
            selectedPitchId = item.id
            binding.spPitch.setText(item.title, false)
            refreshAvailability()
        }
        rv.layoutManager = LinearLayoutManager(requireContext())
        rv.adapter = adapter
        adapter.submit(items)
        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .create()
        adapter.onItemPicked = {
            dialog.dismiss()
        }
        edtSearch.addTextChangedListener {
            adapter.filter(it?.toString().orEmpty())
        }
        dialog.show()
    }
}

private data class PickItem(val id: String, val title: String, val description: String)

private class PickItemAdapter(
    private val onPick: (PickItem) -> Unit
) : RecyclerView.Adapter<PickItemAdapter.VH>() {
    private val all = mutableListOf<PickItem>()
    private val visible = mutableListOf<PickItem>()
    var onItemPicked: (() -> Unit)? = null

    fun submit(data: List<PickItem>) {
        all.clear()
        all.addAll(data)
        visible.clear()
        visible.addAll(data)
        notifyDataSetChanged()
    }

    fun filter(q: String) {
        visible.clear()
        if (q.isBlank()) {
            visible.addAll(all)
        } else {
            val query = q.lowercase()
            visible.addAll(all.filter {
                it.title.lowercase().contains(query) ||
                        it.description.lowercase().contains(query)
            })
        }
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): VH {
        val v = android.view.LayoutInflater.from(parent.context)
            .inflate(R.layout.item_pick, parent, false)
        return VH(v, onPick, onItemPicked)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(visible[position])
    override fun getItemCount(): Int = visible.size

    class VH(
        itemView: View,
        private val onPick: (PickItem) -> Unit,
        private val onItemPicked: (() -> Unit)?
    ) : RecyclerView.ViewHolder(itemView) {
        private val title = itemView.findViewById<TextView>(R.id.txtTitle)
        private val desc = itemView.findViewById<TextView>(R.id.txtDesc)

        fun bind(item: PickItem) {
            title.text = item.title
            desc.text = item.description
            itemView.setOnClickListener {
                onPick(item)
                onItemPicked?.invoke()
            }
        }
    }
}

private class SlotAdapter(
    private val onBook: (Slot) -> Unit
) : RecyclerView.Adapter<SlotAdapter.VH>() {
    private val items = mutableListOf<Slot>()

    fun submit(data: List<Slot>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): VH {
        val v = android.view.LayoutInflater.from(parent.context).inflate(R.layout.item_slot, parent, false)
        return VH(ItemSlotBinding.bind(v), onBook)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])
    override fun getItemCount(): Int = items.size

    class VH(private val binding: ItemSlotBinding, private val onBook: (Slot) -> Unit) :
        RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Slot) {
            binding.txtTime.text = "${item.start} - ${item.end}"
            binding.btnBook.setOnClickListener { onBook(item) }
        }
    }
}

