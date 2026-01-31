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
});

// Element UI
const authSection = document.getElementById('auth-section')
const mainContent = document.getElementById('main-content')
const userEmailSpan = document.getElementById('user-email')

const formMaster = document.getElementById('form-master-barang');



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
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // User login
    authSection.style.display = 'none'
    mainContent.style.display = 'block'
    userEmailSpan.innerText = `Halo, ${session.user.email}`
    fetchPengadaan() // Ambil data saat login
  } else {
    // User logout
    authSection.style.display = 'block'
    mainContent.style.display = 'none'
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
  const { data } = await supabase.from('barang').select('*').order('nama_barang');
  const container = document.getElementById('list-master-barang');
  
  if (data) {
    container.innerHTML = data.map(b => `
      <li>
        <div>
          <strong>${b.nama_barang}</strong> <br>
          <small>Satuan: ${b.satuan}</small>
        </div>
      </li>
    `).join('');
  }
}

// Panggil fungsi ini di dalam event listener menuSwitcher jika targetPage === 'page-barang'

// 1. FUNGSI READ (Ambil Data)
// const searchInput = document.getElementById('search-input');

// 1. Modifikasi Fungsi Fetch agar mendukung filter
async function fetchPengadaan(query = '') {
  list.innerHTML = '<li>Memuat...</li>';

  // Perhatikan format select: '*, barang(nama_barang)' ini adalah JOIN
  let request = supabase
    .from('pengadaan')
    .select('*, barang(nama_barang)') 
    .order('tanggal_transaksi', { ascending: false });

  if (query) {
    // Cari berdasarkan nama barang di tabel relasi
    request = request.ilike('barang.nama_barang', `%${query}%`);
  }

  const { data, error } = await request;
  if (error) return console.error(error);

  list.innerHTML = data.map(item => `
    <li>
      <div>
        <strong>${item.barang?.nama_barang || 'Terhapus'}</strong> <br>
        <small>${item.jumlah} Unit - Tgl: ${item.tanggal_transaksi}</small>
      </div>
      <button class="btn-delete" onclick="hapusData('${item.id}')">Hapus</button>
    </li>
  `).join('');
}

// 2. Tambahkan Event Listener untuk Pencarian
/* searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value;
  fetchPengadaan(searchTerm);
}); */

// 2. FUNGSI CREATE (Tambah Data)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedBarangId) return alert("Pilih barang terlebih dahulu!");

  const jumlah = document.getElementById('jumlah').value;
  if (jumlah <= 0) {
    alert("Jumlah barang harus lebih dari 0!");
    return;
  }
  const tanggal_transaksi = document.getElementById('tanggal_transaksi').value;

  const { error } = await supabase
    .from('pengadaan')
    .insert([{ 
      barang_id: selectedBarangId, 
      jumlah, 
      tanggal_transaksi 
    }]);

  if (error) alert(error.message);
  else {
    form.reset();
    btnBersihkan.click(); // Reset pilihan barang
    fetchPengadaan();
  }
});

// 3. FUNGSI DELETE (Hapus Data)
window.hapusData = async (id) => {
  const { error } = await supabase
    .from('pengadaan')
    .delete()
    .eq('id', id)

  if (error) alert(error.message)
  //selse fetchPengadaan()
}

document.getElementById('btn-export').addEventListener('click', async () => {
  // 1. Ambil semua data
  const { data, error } = await supabase
    .from('pengadaan')
    .select('*, barang(nama_barang)') 
    .order('tanggal_transaksi', { ascending: false });

  if (error) return alert('Gagal mengambil data untuk export');

  // 2. Buat header CSV
  let csvContent = "Tanggal;Nama Barang;Jumlah\n";

  csvContent += data.map(item => `${new Date(item.tanggal_transaksi).toLocaleDateString()};${item.barang?.nama_barang || 'Terhapus'};${item.jumlah};`).join('\n');

  // 3. Masukkan data ke CSV
/*   data.forEach(item => {
    const row = `${new Date(item.tanggal_transaksi).toLocaleDateString()},${barang.nama_barang},${item.jumlah}\n`;
    csvContent += row;
  }); */

  // 4. Proses Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "laporan_pengadaan.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

async function updateDashboard() {
  // 1. Hitung Total Jenis Barang
  const { count: countBarang } = await supabase
    .from('barang')
    .select('*', { count: 'exact', head: true });

  // 2. Hitung Total Unit (Sum dari kolom jumlah)
  const { data: dataUnit } = await supabase
    .from('pengadaan')
    .select('jumlah');
  const totalUnit = dataUnit?.reduce((acc, curr) => acc + curr.jumlah, 0) || 0;

  // 3. Hitung Transaksi Hari Ini
  const hariIni = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  const { count: countHariIni } = await supabase
    .from('pengadaan')
    .select('*', { count: 'exact', head: true })
    .eq('tanggal_transaksi', hariIni);

  // Update UI
  document.getElementById('stat-total-barang').innerText = countBarang || 0;
  document.getElementById('stat-total-unit').innerText = totalUnit;
  document.getElementById('stat-transaksi-hari-ini').innerText = countHariIni || 0;
}

// Tambahkan updateDashboard() ke dalam switcher menu
menuSwitcher.addEventListener('change', (e) => {
  const targetPage = e.target.value;
  // ... logika display block/none yang sudah ada ...
  
  if (targetPage === 'page-dashboard') updateDashboard();
});

// Jalankan saat pertama kali load
updateDashboard();

// Jalankan saat pertama kali load
fetchPengadaan()
// fetchDaftarBarang()