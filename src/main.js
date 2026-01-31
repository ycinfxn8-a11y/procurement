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

// Element UI
const authSection = document.getElementById('auth-section')
const mainContent = document.getElementById('main-content')
const userEmailSpan = document.getElementById('user-email')

const formMaster = document.getElementById('form-master-barang');

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
    fetchDaftarBarang(); // Refresh isi dropdown agar barang baru muncul
  }
});

// 2. Set tanggal default hari ini pada form pengadaan
document.getElementById('tanggal_transaksi').valueAsDate = new Date();

// Tambahkan Realtime untuk tabel barang juga agar sinkron antar tab
supabase
  .channel('public:barang')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'barang' }, () => {
    fetchDaftarBarang();
  })
  .subscribe();

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

async function fetchDaftarBarang() {
  const { data, error } = await supabase.from('barang').select('*').order('nama_barang');
  const selectBarang = document.getElementById('select-barang');
  
  if (data) {
    selectBarang.innerHTML = '<option value="">-- Pilih Barang --</option>' + 
      data.map(b => `<option value="${b.id}">${b.nama_barang}</option>`).join('');
  }
}

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
  const barang_id = document.getElementById('select-barang').value;
  const jumlah = document.getElementById('jumlah').value;
  const tanggal_transaksi = document.getElementById('tanggal_transaksi').value;

  const { error } = await supabase
    .from('pengadaan')
    .insert([{ barang_id, jumlah, tanggal_transaksi }]);

  if (error) alert(error.message);
  else {
    form.reset();
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

// Jalankan saat pertama kali load
fetchPengadaan()
console.log("pertama load")
