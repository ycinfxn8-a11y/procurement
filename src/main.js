import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.js'
import { supabase } from './supabase.js'

async function getData() {
  const { data, error } = await supabase.from('obat').select('*')
  if (error) console.log('Error:', error)
  else console.log('Data:', data)
}

getData()

// Element UI
const authSection = document.getElementById('auth-section')
const mainContent = document.getElementById('main-content')
const userEmailSpan = document.getElementById('user-email')

// Langganan perubahan data (Real-time)
supabase
  .channel('public:pengadaan')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pengadaan' }, () => {
    fetchPengadaan()
  })
  .subscribe()

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
document.getElementById('btn-register').addEventListener('click', async () => {
  alert('AAAA!')
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) alert(error.message)
  else alert('Cek email kamu untuk konfirmasi pendaftaran!')

})

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

// 1. FUNGSI READ (Ambil Data)
const searchInput = document.getElementById('search-input');

// 1. Modifikasi Fungsi Fetch agar mendukung filter
async function fetchPengadaan(query = '') {
  list.innerHTML = '<li class="loading">Memuat data...</li>';

  let request = supabase
    .from('pengadaan')
    .select('*')
    .order('created_at', { ascending: false });

  // Jika ada query pencarian, tambahkan filter ILIKE
  if (query) {
    request = request.ilike('nama_barang', `%${query}%`);
  }

  const { data, error } = await request;

  if (error) {
    list.innerHTML = '<li class="error">Gagal memuat data.</li>';
    return console.error(error);
  }

  if (data.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:gray;">Barang tidak ditemukan.</p>';
    return;
  }

  list.innerHTML = data.map(item => `
    <li>
      <div>
        <strong>${item.nama_barang}</strong> <br>
        <small>${item.jumlah} Unit</small>
      </div>
      <button class="btn-delete" onclick="hapusData(${item.id})">Hapus</button>
    </li>
  `).join('');
}

// 2. Tambahkan Event Listener untuk Pencarian
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value;
  fetchPengadaan(searchTerm);
});

// 2. FUNGSI CREATE (Tambah Data)
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const nama_barang = document.getElementById('nama_barang').value
  const jumlah = document.getElementById('jumlah').value

  const { error } = await supabase
    .from('pengadaan')
    .insert([{ nama_barang, jumlah }])

  if (error) alert(error.message)
  else {
    form.reset()
    fetchPengadaan() // Refresh list
  }
})

// 3. FUNGSI DELETE (Hapus Data)
window.hapusData = async (id) => {
  const { error } = await supabase
    .from('pengadaan')
    .delete()
    .eq('id', id)

  if (error) alert(error.message)
  else fetchPengadaan()
}

// Jalankan saat pertama kali load
fetchPengadaan()

/* document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
` */

// setupCounter(document.querySelector('#counter'))
