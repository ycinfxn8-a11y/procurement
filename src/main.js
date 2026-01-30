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


const form = document.getElementById('form-pengadaan')
const list = document.getElementById('daftar-pengadaan')

// 1. FUNGSI READ (Ambil Data)
async function fetchPengadaan() {
  const { data, error } = await supabase
    .from('pengadaan')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return console.error(error)

  list.innerHTML = data.map(item => `
    <li>
      <strong>${item.nama_barang}</strong> - ${item.jumlah} unit
      <button onclick="hapusData(${item.id})">Hapus</button>
    </li>
  `).join('')
}

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
