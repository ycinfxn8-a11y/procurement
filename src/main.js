import './style.css'
// import javascriptLogo from './javascript.svg'
// import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.js'
import { supabase } from './supabase.js'

/* async function getData() {
  const { data, error } = await supabase.from('obat').select('*')
  if (error) console.log('Error:', error)
  else console.log('Data:', data)
}

getData() */

const menuSwitcher = document.getElementById('menu-switcher');
const pages = document.querySelectorAll('.content-page');

menuSwitcher.addEventListener('change', (e) => {
  const targetPage = e.target.value;

  pages.forEach(page => {
    if (page.id === targetPage) {
      page.style.display = 'block';
    } else {
      page.style.display = 'none';
    }
  });

  // Opsional: Refresh data setiap kali pindah halaman
  if (targetPage === 'page-transaksi') fetchPengadaan();
  if (targetPage === 'page-barang') {
    // fetchDaftarBarang(); 
    renderMasterBarang();
  }
  if (targetPage === 'page-penyedia') renderMasterPenyedia();
  if (targetPage === 'page-pbf') renderMasterPBF();
});

// Element UI
const pageTransaksi = document.getElementById('page-transaksi');
pageTransaksi.style.display = 'none';

const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const userEmailSpan = document.getElementById('user-email');

const formMaster = document.getElementById('form-master-barang');
const formPenyedia = document.getElementById('form-master-penyedia');
const formPBF = document.getElementById('form-master-pbf');



let selectedBarangId = null; // Variable untuk menyimpan ID barang yang dipilih

const inputCari = document.getElementById('input-cari-barang');
const hasilCari = document.getElementById('hasil-cari-barang');
const displayPilihan = document.getElementById('display-pilihan-barang');
const areaCari = document.getElementById('area-cari');
const namaTerpilih = document.getElementById('nama-barang-terpilih');
const btnBersihkan = document.getElementById('btn-bersihkan-pilihan');
const btnSubmit = document.getElementById('btn-submit-pengadaan');

// 1. Fungsi mencari barang di database (saat mengetik)
inputCari.addEventListener('input', async (e) => {
  const query = e.target.value;
  if (query.length < 1) {
    hasilCari.innerHTML = '';
    return;
  }

  const { data, error } = await supabase
    .from('barang')
    .select('id, nama_barang')
    .ilike('nama_barang', `%${query}%`)
    .limit(5); // Batasi hasil pencarian

  if (data) {
    hasilCari.innerHTML = data.map(b => `
      <li>
        <span>${b.nama_barang}</span>
        <button type="button" class="btn-pilih" onclick="pilihBarang('${b.id}', '${b.nama_barang}')">Pilih</button>
      </li>
    `).join('');
  }
});

// 2. Fungsi saat tombol "Pilih" diklik
window.pilihBarang = (id, nama) => {
  selectedBarangId = id;
  namaTerpilih.innerText = nama;
  
  // Tukar tampilan
  areaCari.style.display = 'none';
  displayPilihan.style.display = 'flex';
  hasilCari.innerHTML = '';
  inputCari.value = '';
  
  // Aktifkan tombol submit
  btnSubmit.disabled = false;
};

// 3. Fungsi tombol "Bersihkan Pilihan"
btnBersihkan.addEventListener('click', () => {
  selectedBarangId = null;
  
  // Kembalikan tampilan
  areaCari.style.display = 'block';
  displayPilihan.style.display = 'none';
  
  // Matikan tombol submit
  btnSubmit.disabled = true;
});



// 1. Simpan Master Barang Baru
formMaster.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nama_barang = document.getElementById('master-nama').value;
  const satuan = document.getElementById('master-satuan').value;

  const { error } = await supabase
    .from('barang')
    .insert([{ nama_barang, satuan }]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Barang berhasil ditambahkan!");
    formMaster.reset();
    // fetchDaftarBarang(); // Refresh isi dropdown agar barang baru muncul
    renderMasterBarang();
  }
});

// Simpan Master Penyedia Baru
formPenyedia.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nama_penyedia = document.getElementById('nama-penyedia').value;

  const { error } = await supabase
    .from('penyedia')
    .insert([{ nama_penyedia }]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Penyedia berhasil ditambahkan!");
    formPenyedia.reset();
    renderMasterPenyedia();
  }
});

// Simpan Master PBF Baru
formPBF.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nama_pbf = document.getElementById('nama-pbf').value;

  const { error } = await supabase
    .from('pbf')
    .insert([{ nama_pbf }]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("PBF berhasil ditambahkan!");
    formPBF.reset();
    renderMasterPBF();
  }
});

// 2. Set tanggal default hari ini pada form pengadaan
document.getElementById('tanggal_transaksi').valueAsDate = new Date();

// Tambahkan Realtime untuk tabel barang juga agar sinkron antar tab
// supabase
//   .channel('public:barang')
//   .on('postgres_changes', { event: '*', schema: 'public', table: 'barang' }, () => {
//     fetchDaftarBarang();
//   })
//   .subscribe();

// Langganan perubahan data (Real-time)
const channel = supabase
  .channel('perubahan-pengadaan') // Nama bebas
  .on(
    'postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'pengadaan' 
    }, 
    (payload) => {
      console.log('Ada perubahan data!', payload);
      fetchPengadaan(); // Panggil fungsi untuk memperbarui list
    }
  )
  .subscribe((status) => {
    console.log('Status Realtime:', status);
  });

// --- LOGIKA AUTENTIKASI ---

// 1. Cek Status Login (Otomatis)
const appElement = document.getElementById('app');
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // User login
    authSection.style.display = 'none'
    mainContent.style.display = 'block'
    appElement.classList.add('wide'); // Tambah class wide
    userEmailSpan.innerText = `Halo, ${session.user.email}`
    updateDashboard();
    //fetchPengadaan() // Ambil data saat login
  } else {
    // User logout: Tampilkan login dan ciutkan box
    authSection.style.display = 'block'
    mainContent.style.display = 'none'
    appElement.classList.remove('wide'); // Hapus class wide
  }
})

// 2. Register
/* document.getElementById('btn-register').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) alert(error.message)
  else alert('Cek email kamu untuk konfirmasi pendaftaran!')

}) */

// 3. Login
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) alert(error.message)
})

// 4. Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  await supabase.auth.signOut()
})

const form = document.getElementById('form-pengadaan')
const list = document.getElementById('daftar-pengadaan')

/* async function fetchDaftarBarang() {
  const { data, error } = await supabase.from('barang').select('*').order('nama_barang');
  const selectBarang = document.getElementById('select-barang');
  
  if (data) {
    selectBarang.innerHTML = '<option value="">-- Pilih Barang --</option>' + 
      data.map(b => `<option value="${b.id}">${b.nama_barang}</option>`).join('');
  }
} */

async function renderMasterBarang() {
  const container = document.getElementById('list-master-barang');
  const dari = (halBarang - 1) * LIMIT;
  const ke = dari + LIMIT - 1;

  const { data, count } = await supabase
    .from('barang')
    .select('*', { count: 'exact' })
    .order('nama_barang')
    .range(dari, ke);
  
  if (data) {
    container.innerHTML = data.map(b => `
      <li>
        <div><strong>${b.nama_barang}</strong> (${b.satuan})</div>
        <div>
          <button class="btn-edit" onclick="bukaEditBarang('${b.id}')">Edit</button>
          <button class="btn-delete" onclick="hapusBarang('${b.id}')">Hapus</button>
        </div>
      </li>
    `).join('');

    document.getElementById('page-info-barang').innerText = `Hal. ${halBarang}`;
    document.getElementById('prev-barang').disabled = (halBarang === 1);
    document.getElementById('next-barang').disabled = (ke >= count - 1);
  }
}

// Event Listener Tombol Barang
document.getElementById('prev-barang').onclick = () => { halBarang--; renderMasterBarang(); };
document.getElementById('next-barang').onclick = () => { halBarang++; renderMasterBarang(); };

// Panggil fungsi ini di dalam event listener menuSwitcher jika targetPage === 'page-barang'

// 1. FUNGSI READ (Ambil Data)
const searchInput = document.getElementById('search-input');

let halTransaksi = 1;
let halBarang = 1;
const LIMIT = 5; // Maksimal 5 item

// Ambil elemen filter
const filterStart = document.getElementById('filter-start-date');
const filterEnd = document.getElementById('filter-end-date');
const btnResetFilter = document.getElementById('btn-reset-filter');

// 1. Modifikasi Fungsi Fetch agar mendukung filter
async function fetchPengadaan(query = '') {
  const querySearch = document.getElementById('search-input').value;
  const startDate = filterStart.value;
  const endDate = filterEnd.value;

  list.innerHTML = '<li>Memuat...</li>';
  
  // Hitung range data
  const dari = (halTransaksi - 1) * LIMIT;
  const ke = dari + LIMIT - 1;

  let selectQuery = '*, barang(nama_barang), penyedia(nama_penyedia), pbf(nama_pbf)';
  if (querySearch) {
    selectQuery = '*, barang!inner(nama_barang), penyedia!inner(nama_penyedia), pbf!inner(nama_pbf)';
  }

  let request = supabase
    .from('pengadaan')
    .select(selectQuery, { count: 'exact' }) // Ambil 'count' untuk total data
    .order('tanggal_transaksi', { ascending: false })
    .range(dari, ke); // AMBIL DATA SESUAI RANGE

  // Filter Nama Barang (Search)
  if (querySearch) {
    request = request.ilike('barang.nama_barang', `%${querySearch}%`);
  }

  // Filter Rentang Tanggal
  if (startDate) {
    request = request.gte('tanggal_transaksi', startDate);
  }
  if (endDate) {
    request = request.lte('tanggal_transaksi', endDate);
  }

  const { data, count, error } = await request;
  if (error) return console.error(error);

  if (data) {
    list.innerHTML = data.map(item => `
      <li>
        <div style="flex-grow:1">
          <strong>${item.barang?.nama_barang}</strong> <br>
          <small>Penyedia: ${item.penyedia?.nama_penyedia || '-'} | PBF: ${item.pbf?.nama_pbf || '-'}</small> <br>
          <small>Harga: Rp${item.harga_barang.toLocaleString()} x ${item.jumlah} Unit</small>
        </div>
        <div style="text-align:right">
          <strong>Total: Rp${(item.harga_barang * item.jumlah).toLocaleString()}</strong> <br>
          <!--<button class="btn-print-single" onclick="cetakStruk('${item.id}')">🖨️</button>-->
          <button class="btn-edit" onclick="bukaEditTransaksi('${item.id}')">Edit</button>
          <button class="btn-delete" onclick="hapusData('${item.id}')">Hapus</button>
        </div>
      </li>
    `).join('');
  }  

  // Update Info Halaman
  document.getElementById('page-info-transaksi').innerText = `Hal. ${halTransaksi}`;
  
  // Atur tombol (disable jika di ujung data)
  document.getElementById('prev-transaksi').disabled = (halTransaksi === 1);
  document.getElementById('next-transaksi').disabled = (ke >= count - 1);
}

// Event Listeners untuk Filter
filterStart.addEventListener('change', () => { halTransaksi = 1; fetchPengadaan(); });
filterEnd.addEventListener('change', () => { halTransaksi = 1; fetchPengadaan(); });

btnResetFilter.addEventListener('click', () => {
  filterStart.value = '';
  filterEnd.value = '';
  searchInput.value = '';
  halTransaksi = 1;
  fetchPengadaan();
});

// Event Listener Tombol Transaksi
document.getElementById('prev-transaksi').onclick = () => { halTransaksi--; fetchPengadaan(); };
document.getElementById('next-transaksi').onclick = () => { halTransaksi++; fetchPengadaan(); };

// 2. Tambahkan Event Listener untuk Pencarian
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value;
  fetchPengadaan(searchTerm);
});

// 2. FUNGSI CREATE (Tambah Data)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const { data: { user } } = await supabase.auth.getUser();
  const emailAdmin = user.email;
  // const displayName = data.user.user_metadata.display_name;

  if (!selectedBarangId) return alert("Pilih barang terlebih dahulu!");

  const jumlah = document.getElementById('jumlah').value;
/*   if (jumlah <= 0) {
    alert("Jumlah barang harus lebih dari 0!");
    return;
  } */
  const tanggal_transaksi = document.getElementById('tanggal_transaksi').value;
  const penyedia = document.getElementById('select-penyedia').value;
  const pbf = document.getElementById('select-pbf').value;
  const harga_barang = document.getElementById('harga_barang').value;

  const { error } = await supabase
    .from('pengadaan')
    .insert([{ 
      barang_id: selectedBarangId, 
      jumlah, 
      tanggal_transaksi,
      penyedia_id: penyedia,
      pbf_id: pbf,
      harga_barang
      // admin_email: emailAdmin
    }]);

  if (error) alert(error.message);
  else {
    form.reset();
    btnBersihkan.click(); // Reset pilihan barang

    document.getElementById('tab-1').checked = true;
    // Picu event change manual agar section 1 tampil kembali
    document.getElementById('tab-1').dispatchEvent(new Event('change'));

    fetchPengadaan();
    updateDashboard();
  }
});

// Hapus Transaksi
window.hapusData = async (id) => {
  if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
  
  const { error } = await supabase.from('pengadaan').delete().eq('id', id);
  if (error) alert(error.message);
  else fetchPengadaan();
};

// Hapus Master Barang
window.hapusBarang = async (id) => {
  if (!confirm("Yakin hapus barang ini? Menghapus master barang akan gagal jika sudah ada transaksi terkait.")) return;
  
  const { error } = await supabase.from('barang').delete().eq('id', id);
  if (error) alert("Gagal hapus: Barang mungkin sudah digunakan di data transaksi.");
  else renderMasterBarang();
};

window.bukaEditBarang = async (id) => {
  const { data } = await supabase.from('barang').select('*').eq('id', id).single();
  
  const fields = document.getElementById('edit-fields');
  document.getElementById('modal-title').innerText = "Edit Master Barang";
  
  fields.innerHTML = `
    <div class="modal-form-group">
      <label>Nama Barang</label>
      <input type="text" id="edit-nama" value="${data.nama_barang}">
    </div>
    <div class="modal-form-group">
      <label>Satuan</label>
      <input type="text" id="edit-satuan" value="${data.satuan}">
    </div>
  `;
  
  document.getElementById('modal-edit').style.display = 'flex';
  
  // Submit handler khusus Edit Barang
  document.getElementById('form-edit-global').onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('barang').update({
      nama_barang: document.getElementById('edit-nama').value,
      satuan: document.getElementById('edit-satuan').value
    }).eq('id', id);
    
    tutupModal();
    renderMasterBarang();
    //fetchDaftarBarang();
  };
};

window.bukaEditTransaksi = async (id) => {
  const { data } = await supabase.from('pengadaan').select('*').eq('id', id).single();
  
  const fields = document.getElementById('edit-fields');
  document.getElementById('modal-title').innerText = "Edit Transaksi";
  
  fields.innerHTML = `
    <input type="hidden" id="edit-id" value="${data.id}">
    <div class="modal-form-group">
      <label>Jumlah</label>
      <input type="number" id="edit-jumlah" value="${data.jumlah}">
    </div>
    <div class="modal-form-group">
      <label>Tanggal</label>
      <input type="date" id="edit-tanggal" value="${data.tanggal_transaksi}">
    </div>
  `;
  
  document.getElementById('modal-edit').style.display = 'flex';

  document.getElementById('form-edit-global').onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('pengadaan').update({
      jumlah: document.getElementById('edit-jumlah').value,
      tanggal_transaksi: document.getElementById('edit-tanggal').value
    }).eq('id', id);
    
    tutupModal();
    fetchPengadaan();
  };
};

function tutupModal() {
  document.getElementById('modal-edit').style.display = 'none';
}

document.getElementById('btn-tutup-modal').onclick = tutupModal;

/*document.getElementById('btn-export').addEventListener('click', async () => {
  // 1. Ambil semua data
  const { data, error } = await supabase
    .from('pengadaan')
    .select('*, barang(nama_barang)') 
    .order('tanggal_transaksi', { ascending: false });

  if (error) return alert('Gagal mengambil data untuk export');

  // 2. Buat header CSV
  let csvContent = "Tanggal;Nama Barang;Jumlah\n";

  csvContent += data.map(item => `${new Date(item.tanggal_transaksi).toLocaleDateString()};${item.barang?.nama_barang || 'Terhapus'};${item.jumlah};`).join('\n');

  // 3. Masukkan data ke CSV */

/*   data.forEach(item => {
    const row = `${new Date(item.tanggal_transaksi).toLocaleDateString()},${barang.nama_barang},${item.jumlah}\n`;
    csvContent += row;
  }); */

  /* // 4. Proses Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "laporan_pengadaan.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});*/

async function updateDashboard() {
  // 1. Ambil data harga dan jumlah untuk hitung total biaya
  const { data: allData, error } = await supabase
    .from('pengadaan')
    .select('harga_barang, jumlah, tanggal_transaksi');

  if (error) return console.error(error);

  // 2. Hitung Total Pengeluaran (Sum of Price * Quantity)
  const totalBiaya = allData.reduce((acc, curr) => {
    return acc + (Number(curr.harga_barang) * Number(curr.jumlah));
  }, 0);

  // 3. Hitung Total Unit Masuk
  const totalUnit = allData.reduce((acc, curr) => acc + Number(curr.jumlah), 0);

  // 4. Hitung Transaksi Hari Ini
  const hariIni = new Date().toISOString().split('T')[0];
  const transaksiHariIni = allData.filter(item => item.tanggal_transaksi === hariIni).length;

  // 5. Hitung Total Jenis Barang (Master)
  const { count: countBarang } = await supabase
    .from('barang')
    .select('*', { count: 'exact', head: true });

  // UPDATE UI dengan format Rupiah
  document.getElementById('stat-total-biaya').innerText = `Rp ${totalBiaya.toLocaleString('id-ID')}`;
  document.getElementById('stat-total-unit').innerText = totalUnit;
  document.getElementById('stat-total-barang').innerText = countBarang || 0;
  document.getElementById('stat-transaksi-hari-ini').innerText = transaksiHariIni;

}

// Tambahkan updateDashboard() ke dalam switcher menu
menuSwitcher.addEventListener('change', (e) => {
  const targetPage = e.target.value;

  fetchDropdownData()
  if (targetPage === 'page-dashboard') updateDashboard();
});

/* document.getElementById('btn-print').onclick = () => {
  window.print();
}; */

window.cetakStruk = async (id) => {
  /* // 1. Ambil data lengkap transaksi tersebut
  const { data, error } = await supabase
    .from('pengadaan')
    .select('*, barang(nama_barang)')
    .eq('id', id)
    .single();

  if (error) return alert("Gagal mengambil data struk");

  // 2. Isi data ke elemen struk
  document.getElementById('s-id').innerText = data.id; //.substring(0, 8).toUpperCase();
  document.getElementById('s-tanggal').innerText = data.tanggal_transaksi;
  document.getElementById('s-admin').innerText = data.admin_email || 'N/A';
  document.getElementById('s-nama').innerText = data.barang.nama_barang;
  document.getElementById('s-jumlah').innerText = data.jumlah + " Unit";
  document.getElementById('s-waktu-cetak').innerText = new Date().toLocaleString();

  // 3. Panggil perintah cetak
  window.print(); */
};

async function fetchDropdownData() {
  const { data: pnd } = await supabase.from('penyedia').select('*').order('nama_penyedia');
  const { data: pbf } = await supabase.from('pbf').select('*').order('nama_pbf');

  if (pnd) {
    document.getElementById('select-penyedia').innerHTML = 
      '<option value="">-- Pilih Penyedia --</option>' + 
      pnd.map(p => `<option value="${p.id}">${p.nama_penyedia}</option>`).join('');
  }
  if (pbf) {
    document.getElementById('select-pbf').innerHTML = 
      '<option value="">-- Pilih PBF --</option>' + 
      pbf.map(p => `<option value="${p.id}">${p.nama_pbf}</option>`).join('');
  }
}

async function renderMasterPenyedia() {
  const { data } = await supabase.from('penyedia').select('*').order('nama_penyedia');
  const listPnd = document.getElementById('list-master-penyedia');
  listPnd.innerHTML = data.map(p => `
    <li>
      <span>${p.nama_penyedia}</span>
      <div>
        <button class="btn-edit" onclick="bukaEditPenyedia('${p.id}', '${p.nama_penyedia}')">Edit</button>
        <button class="btn-delete" onclick="hapusPenyedia('${p.id}')">Hapus</button>
      </div>
    </li>
  `).join('');
}

window.bukaEditPenyedia = async (id) => {
  const { data } = await supabase.from('penyedia').select('*').eq('id', id).single();
  
  const fields = document.getElementById('edit-fields');
  document.getElementById('modal-title').innerText = "Edit Master Penyedia";
  
  fields.innerHTML = `
    <div class="modal-form-group">
      <label>Nama Penyedia</label>
      <input type="text" id="edit-nama" value="${data.nama_penyedia}">
    </div>
  `;
  
  document.getElementById('modal-edit').style.display = 'flex';
  
  document.getElementById('form-edit-global').onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('penyedia').update({
      nama_penyedia: document.getElementById('edit-nama').value
    }).eq('id', id);
    
    tutupModal();
    renderMasterPenyedia();
    //fetchDaftarBarang();
  };
};

window.hapusPenyedia = async (id) => {
  if (!confirm("Hapus penyedia ini?")) return;
  await supabase.from('penyedia').delete().eq('id', id);
  renderMasterPenyedia();
  fetchDropdownData();
};

async function renderMasterPBF() {
  const { data } = await supabase.from('pbf').select('*').order('nama_pbf');
  const listPbf = document.getElementById('list-master-pbf');
  listPbf.innerHTML = data.map(p => `
    <li>
      <span>${p.nama_pbf}</span>
      <div>
        <button class="btn-edit" onclick="bukaEditPBF('${p.id}', '${p.nama_pbf}')">Edit</button>
        <button class="btn-delete" onclick="hapusPBF('${p.id}')">Hapus</button>
      </div>
    </li>
  `).join('');
}

window.bukaEditPBF = async (id) => {
  const { data } = await supabase.from('pbf').select('*').eq('id', id).single();
  
  const fields = document.getElementById('edit-fields');
  document.getElementById('modal-title').innerText = "Edit Master PBF";
  
  fields.innerHTML = `
    <div class="modal-form-group">
      <label>Nama PBF</label>
      <input type="text" id="edit-nama" value="${data.nama_pbf}">
    </div>
  `;
  
  document.getElementById('modal-edit').style.display = 'flex';
  
  document.getElementById('form-edit-global').onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('pbf').update({
      nama_pbf: document.getElementById('edit-nama').value
    }).eq('id', id);
    
    tutupModal();
    renderMasterPBF();
  };
};

window.hapusPBF = async (id) => {
  if (!confirm("Hapus PBF ini?")) return;
  await supabase.from('pbf').delete().eq('id', id);
  renderMasterPBF();
  fetchDropdownData();
};

const radioTabs = document.querySelectorAll('input[name="section-tab"]');
const tabContents = document.querySelectorAll('.tab-content');

radioTabs.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const targetId = e.target.value;

    tabContents.forEach(content => {
      if (content.id === targetId) {
        content.style.display = 'block';
      } else {
        content.style.display = 'none';
      }
    });
  });
});

window.bukaModalExport = async () => {
  // Ambil data dropdown terbaru untuk filter
  const { data: pnd } = await supabase.from('penyedia').select('*').order('nama_penyedia');
  const { data: pbf } = await supabase.from('pbf').select('*').order('nama_pbf');

  // Isi Select Penyedia di Modal Export
  const selectPnd = document.getElementById('export-penyedia');
  selectPnd.innerHTML = '<option value="">-- Semua Penyedia --</option>' + 
    (pnd ? pnd.map(p => `<option value="${p.id}">${p.nama_penyedia}</option>`).join('') : '');

  // Isi Select PBF di Modal Export
  const selectPbf = document.getElementById('export-pbf');
  selectPbf.innerHTML = '<option value="">-- Semua PBF --</option>' + 
    (pbf ? pbf.map(p => `<option value="${p.id}">${p.nama_pbf}</option>`).join('') : '');

  document.getElementById('modal-export').style.display = 'flex';
};

window.tutupModalExport = () => {
  document.getElementById('modal-export').style.display = 'none';
};

// 2. Fungsi Proses Download CSV
document.getElementById('form-export-csv').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const startDate = document.getElementById('export-start-date').value;
  const endDate = document.getElementById('export-end-date').value;
  const penyediaId = document.getElementById('export-penyedia').value;
  const pbfId = document.getElementById('export-pbf').value;

  const btnSubmit = e.target.querySelector('button[type="submit"]');
  btnSubmit.innerText = "Sedang Mengunduh...";
  btnSubmit.disabled = true;

  try {
    // Bangun Query Supabase
    let query = supabase
      .from('pengadaan')
      .select('*, barang(nama_barang, satuan), penyedia(nama_penyedia), pbf(nama_pbf)')
      .order('tanggal_transaksi', { ascending: false });

    // Terapkan Filter jika diisi
    if (startDate) query = query.gte('tanggal_transaksi', startDate);
    if (endDate) query = query.lte('tanggal_transaksi', endDate);
    if (penyediaId) query = query.eq('penyedia_id', penyediaId);
    if (pbfId) query = query.eq('pbf_id', pbfId);

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) {
      alert("Tidak ada data yang sesuai dengan filter tersebut.");
      return;
    }

    // Konversi ke CSV
    downloadCSV(data);
    tutupModalExport();

  } catch (err) {
    alert("Gagal export: " + err.message);
  } finally {
    btnSubmit.innerText = "⬇️ Download CSV";
    btnSubmit.disabled = false;
  }
});

// 3. Helper: Konversi JSON ke CSV & Trigger Download
function downloadCSV(data) {
  const headers = ['Tanggal', 'Nama Barang', 'Satuan', 'Jumlah', 'Harga Satuan', 'Total Harga', 'Penyedia', 'PBF'];
  
  const csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach(row => {
    const total = (row.harga_barang || 0) * (row.jumlah || 0);
    const values = [
      row.tanggal_transaksi,
      `"${row.barang?.nama_barang || 'Terhapus'}"`, // Pakai kutip biar aman jika ada koma
      row.barang?.satuan || '-',
      row.jumlah,
      row.harga_barang || 0,
      total,
      `"${row.penyedia?.nama_penyedia || '-'}"`,
      `"${row.pbf?.nama_pbf || '-'}"`
    ];
    csvRows.push(values.join(';'));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `Laporan_Pengadaan_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Jalankan saat pertama kali load
updateDashboard();
fetchPengadaan()
fetchDropdownData()
// fetchDaftarBarang()