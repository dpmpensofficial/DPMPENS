// ============================================================
// PAGE ROUTING LOGIC
// ============================================================
function showPage(pageId) {
  // Sembunyikan semua halaman
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  
  // Tunjukkan halaman yang dituju
  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // Perbarui status kelas aktif di menu navigasi
  const navLinks = document.querySelectorAll('nav ul li a');
  navLinks.forEach(link => link.classList.remove('active'));
  
  const activeNavLink = document.getElementById('nav-' + pageId);
  if (activeNavLink) {
    activeNavLink.classList.add('active');
  }
  
  // Gulir otomatis kembali ke posisi paling atas layar
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ============================================================
// LOGIKA HERO SLIDER UTAMA ("Selamat Datang di DPM PENS")
// ============================================================
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function changeSlide(direction) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  
  currentSlide = (currentSlide + direction + slides.length) % slides.length;
  
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function goToSlide(slideIndex) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  
  currentSlide = slideIndex;
  
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

// Menjalankan auto-play slider utama setiap 7 detik
setInterval(() => {
  changeSlide(1);
}, 7000);


// ============================================================
// LOGIKA SLIDER REKAYASA BARU: SLIDER PUBLIKASI DPM PENS
// ============================================================
let currentPubSlide = 0;
const pubSlides = document.querySelectorAll('.pub-slide');
const pubDots = document.querySelectorAll('.pub-dot');

function changePubSlide(direction) {
  if (pubSlides.length === 0) return;
  pubSlides[currentPubSlide].classList.remove('active');
  pubDots[currentPubSlide].classList.remove('active');
  
  currentPubSlide = (currentPubSlide + direction + pubSlides.length) % pubSlides.length;
  
  pubSlides[currentPubSlide].classList.add('active');
  pubDots[currentPubSlide].classList.add('active');
}

function goToPubSlide(slideIndex) {
  if (pubSlides.length === 0) return;
  pubSlides[currentPubSlide].classList.remove('active');
  pubDots[currentPubSlide].classList.remove('active');
  
  currentPubSlide = slideIndex;
  
  pubSlides[currentPubSlide].classList.add('active');
  pubDots[currentPubSlide].classList.add('active');
}

// Menjalankan auto-play slider publikasi setiap 6 detik secara terpisah
setInterval(() => {
  changePubSlide(1);
}, 6000);


// ============================================================
// SYSTEM TOAST NOTIFIKASI
// ============================================================
function showNotif(message) {
  const notif = document.getElementById('notif');
  notif.innerText = message;
  notif.classList.add('show');
  
  setTimeout(() => {
    notif.classList.remove('show');
  }, 3500);
}


// ============================================================
// INTEGRASI GOOGLE DRIVE — DOKUMEN OTOMATIS
// ============================================================
// Cara pakai (lihat panduan lengkap dari Claude):
// 1. Isi DRIVE_API_KEY dengan API Key dari Google Cloud Console.
// 2. Isi setiap "id" di DRIVE_FOLDERS dengan Folder ID Google Drive kamu.
// 3. Pastikan tiap folder di-share sebagai "Anyone with the link - Viewer".
// Setelah itu, setiap kali kamu upload file baru ke folder Drive terkait,
// file itu akan otomatis muncul di halaman "UU KM PENS" tanpa perlu edit kode lagi.

const DRIVE_API_KEY = 'AIzaSyDAp40S53feOEj6DPwslQExvfGJ2wiXoZU';

const DRIVE_FOLDERS = {
  uu:        { id: '1ZEF7OffqHCo0-8XNGc6Fxa3wqpOTnS23', label: 'Undang-Undang' },
  berita:    { id: '1KWMJnvLgmEc_DKKULWFO_GpbVysTdPQX',  label: 'Berita Acara' },
  publikasi: { id: '1vuekTp6GesHFy4OTWJoESG9mlQb3qMJd',  label: 'Publikasi' }
};

async function ambilFileDariFolder(folderId) {
  const fields = 'files(id,name,mimeType,webViewLink,webContentLink,modifiedTime)';
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&orderBy=modifiedTime desc&fields=${fields}&key=${DRIVE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil folder ' + folderId + ': ' + res.status);
  const data = await res.json();
  return data.files || [];
}

function buatElemenDokumen(file, kategoriKey, kategoriLabel) {
  const tanggal = new Date(file.modifiedTime).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const judul = file.name.replace(/\.[^/.]+$/, ''); // buang ekstensi file
  const link = file.webViewLink || '#';
  const linkUnduh = file.webContentLink || file.webViewLink || '#';

  const item = document.createElement('div');
  item.className = 'uu-item';
  item.setAttribute('data-kategori', kategoriKey);
  item.innerHTML = `
    <div class="uu-item-left">
      <div class="uu-nomor">${kategoriLabel} · Diperbarui ${tanggal}</div>
      <h3 class="uu-judul">${judul}</h3>
    </div>
    <div class="uu-item-right">
      <a class="uu-btn-view" href="${link}" target="_blank" rel="noopener">Lihat Dokumen</a>
      <a class="uu-btn-dl" href="${linkUnduh}" target="_blank" rel="noopener">Unduh</a>
    </div>
  `;
  return item;
}

// Ambil SEMUA file dari semua folder, dikembalikan sebagai daftar mentah
// { file, kategoriKey, kategoriLabel } supaya bisa dipakai ulang di halaman
// beranda (beberapa terbaru) maupun halaman Dokumen & Arsip (semua, dengan filter).
async function ambilSemuaDokumen() {
  const hasilPerKategori = await Promise.all(
    Object.entries(DRIVE_FOLDERS).map(async ([key, cfg]) => {
      const files = await ambilFileDariFolder(cfg.id);
      return files.map(f => ({ file: f, kategoriKey: key, kategoriLabel: cfg.label }));
    })
  );
  return hasilPerKategori.flat().sort(
    (a, b) => new Date(b.file.modifiedTime) - new Date(a.file.modifiedTime)
  );
}

function tampilkanPesan(container, pesan) {
  container.innerHTML = `<p style="text-align:center;color:var(--muted);">${pesan}</p>`;
}

async function muatDokumenDariDrive() {
  const containerBeranda = document.getElementById('beranda-dokumen-list');
  const containerArsip = document.getElementById('uu-list');
  if (!containerBeranda && !containerArsip) return;

  const belumDikonfigurasi = DRIVE_API_KEY.startsWith('ISI_') ||
    Object.values(DRIVE_FOLDERS).some(f => f.id.startsWith('ISI_'));

  if (belumDikonfigurasi) {
    const pesan = 'Integrasi Google Drive belum dikonfigurasi. Isi DRIVE_API_KEY dan DRIVE_FOLDERS di script.js.';
    if (containerBeranda) tampilkanPesan(containerBeranda, pesan);
    if (containerArsip) tampilkanPesan(containerArsip, pesan);
    return;
  }

  try {
    const semuaDokumen = await ambilSemuaDokumen();

    // --- Beranda: cukup tampilkan 4 dokumen paling baru dari semua kategori ---
    if (containerBeranda) {
      containerBeranda.innerHTML = '';
      if (semuaDokumen.length === 0) {
        tampilkanPesan(containerBeranda, 'Belum ada dokumen yang diunggah.');
      } else {
        semuaDokumen.slice(0, 4).forEach(({ file, kategoriKey, kategoriLabel }) => {
          containerBeranda.appendChild(buatElemenDokumen(file, kategoriKey, kategoriLabel));
        });
      }
    }

    // --- Halaman Dokumen & Arsip: tampilkan semua, bisa difilter per kategori ---
    if (containerArsip) {
      containerArsip.innerHTML = '';
      if (semuaDokumen.length === 0) {
        tampilkanPesan(containerArsip, 'Belum ada dokumen yang diunggah ke Drive.');
      } else {
        semuaDokumen.forEach(({ file, kategoriKey, kategoriLabel }) => {
          containerArsip.appendChild(buatElemenDokumen(file, kategoriKey, kategoriLabel));
        });
      }
    }
  } catch (err) {
    console.error('Gagal memuat dokumen dari Google Drive:', err);
    const pesanError = 'Gagal memuat dokumen. Periksa kembali API Key dan pengaturan folder Drive (harus "Anyone with the link").';
    if (containerBeranda) tampilkanPesan(containerBeranda, pesanError);
    if (containerArsip) tampilkanPesan(containerArsip, pesanError);
  }
}

document.addEventListener('DOMContentLoaded', muatDokumenDariDrive);


// ============================================================
// FILTER UNDANG-UNDANG (PAGE UU KM PENS)
// ============================================================
function filterUU(kategori, element) {
  // Atur kelas aktif tombol tab filter
  const tabs = document.querySelectorAll('.uu-tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  element.classList.add('active');
  
  // Saring deretan item UU berdasarkan atribut data-kategori
  const uuItems = document.querySelectorAll('.uu-item');
  uuItems.forEach(item => {
    if (kategori === 'semua' || item.getAttribute('data-kategori') === kategori) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}


// ============================================================
// FORM ASPIRASI LOGIC
// ============================================================
function submitAspirasi() {
  // Simulasi pengiriman form berhasil
  document.getElementById('aspirasi-form-content').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
}

function resetForm() {
  // Kembalikan form ke kondisi awal kosong
  document.getElementById('form-success').style.display = 'none';
  document.getElementById('aspirasi-form-content').style.display = 'block';
  
  // Mengosongkan inputan
  const inputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
  inputs.forEach(input => input.value = '');
}