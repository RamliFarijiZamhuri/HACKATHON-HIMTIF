# Unpam Space

> *"Semua yang kamu butuhkan, dalam satu platform UNPAM SPACE"*

**Unpam Space** adalah platform digital terpadu untuk mahasiswa Universitas Pamulang (Unpam) — satu ruang yang menghubungkan info event kampus, pencarian kos, jual beli barang, penemuan barang hilang, komunitas/forum gaya Discord, dan denah kampus interaktif dalam satu aplikasi web yang terverifikasi.

Dibangun untuk **Hackathon HIMTIF 2026**.

---

## 📌 Daftar Isi

- [Latar Belakang](#-latar-belakang)
- [Fitur Utama](#-fitur-utama)
- [Pengalaman & Desain](#-pengalaman--desain)
- [Sistem Verifikasi](#-sistem-verifikasi)
- [Model Monetisasi](#-model-monetisasi)
- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Cara Menjalankan](#-cara-menjalankan)
- [Tim](#-tim)
- [Status Project](#-status-project)

---

## 🧩 Latar Belakang

Informasi dan kebutuhan sehari-hari mahasiswa Unpam selama ini tersebar di berbagai platform yang tidak saling terhubung — grup WhatsApp, Instagram, papan pengumuman fisik, serta platform umum seperti OLX atau Mamikos yang tidak spesifik untuk ekosistem Unpam. Lima masalah inti yang melatarbelakangi project ini:

1. **Jual beli barang tidak efisien** — transaksi terjadi di grup WhatsApp tanpa pencarian, filter, atau verifikasi identitas
2. **Info kos minim & tersebar** — listing kos sekitar Unpam sangat terbatas di platform nasional seperti Mamikos
3. **Info event terpencar** — pengumuman tersebar di Instagram, grup WA per jurusan, papan fisik, dan website kampus yang jarang update
4. **Tidak ada denah kampus digital** — mahasiswa baru sering tersesat karena tidak ada peta interaktif gedung/ruangan
5. **Tidak ada ruang komunitas terstruktur** — diskusi dan ajakan kolaborasi (mabar, PKM, project, komunitas IT) tersebar tanpa kategori atau indeks yang jelas

---

## ✨ Fitur Utama

| # | Fitur | Ringkasan |
|---|---|---|
| 1 | **Landing Page** | Hero imersif — judul "UNPAM SPACE" di tengah, background mengikuti kursor, scroll reveal, footer lengkap |
| 2 | **Autentikasi & Profil** | Login/registrasi dengan verifikasi NIM + dokumen identitas |
| 3 | **Main Page** | Pusat navigasi berbasis **grid kartu fitur** (bukan dashboard sidebar) — welcome animation + maskot karakter random |
| 4 | **Event Kampus** | Feed event dari HIMA/UKM/jurusan, filter kategori, simpan ke kalender, notifikasi H-1/H-0 |
| 5 | **Campus Map** | Denah interaktif gedung, lantai, ruang kelas, lab, parkiran — data eksklusif yang tak ada di Google Maps |
| 6 | **Marketplace COD** | Jual beli barang antar mahasiswa dengan identitas terverifikasi |
| 7 | **Pencarian Kos** | Direktori kos sekitar Unpam, filter harga/fasilitas/jarak, badge terverifikasi |
| 8 | **Barang Hilang/Temuan** | Papan laporan kehilangan & temuan dengan pencocokan otomatis dan sesi chat klaim |
| 9 | **Community / Forum** | Ruang sosial bergaya **Discord** — topik/kategori (Cari Teman, Mabar, PKM, Project, Bahas Matkul, Cyber Security, Cisco, dll.), post, balasan, upvote, DM |
| 10 | **Unpam Space+** | Subscription Rp13.000/bulan — badge & warna post eksklusif, posisi atas di pencarian Community, status boost otomatis |

---

## 🔐 Sistem Verifikasi

Verifikasi bertingkat berdasarkan risiko tiap fitur:

| Level | Nama | Dokumen | Akses |
|---|---|---|---|
| 0 | Tamu | — | Landing page, campus map publik, event publik |
| 1 | Terverifikasi Dasar | KTM + NIM | Semua fitur baca, Community/Forum, Barang Temuan |
| 2 | Terverifikasi Menengah | KTM + KTP + Foto Barang | Marketplace COD |
| 3 | Terverifikasi Penuh | KTM + KTP + Identitas Lengkap | Listing Kos, Posting Event Resmi |

Badge verifikasi (trust) dan badge subscription (eksklusivitas) bersifat **independen** — status pembayaran tidak memengaruhi atau menggantikan persepsi kredibilitas akun. Detail lengkap di bagian 6 PRD.

---

## 💰 Model Monetisasi

Pendekatan **freemium** — seluruh fitur inti tetap gratis untuk semua mahasiswa. Dua sumber pendapatan:

1. **Unpam Space+** (Rp13.000/bulan) — eksklusivitas tampilan profil & post di Community, status boost otomatis untuk listing milik sendiri

Target metrik monetisasi awal: 5% subscriber dari total pengguna terdaftar, conversion rate >3%, churn rate <15%.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan Singkat |
|---|---|---|
| Frontend | **Next.js (React)** | Routing otomatis per fitur sebagai route terpisah, SSR/SSG, scalable |
| Animasi | **Framer Motion** | Page transition, scroll animation, cursor-follow, micro-interaction |
| Styling | **Tailwind CSS** | Utility-first, cepat dikembangkan, selaras dengan Framer Motion |
| Icon | Lucide React / Heroicons | Ringan, konsisten |
| Backend | **Node.js + Express.js** | Ringan, ekosistem npm luas |
| Database | **Supabase (PostgreSQL)** | Data relasional + storage + GUI dashboard dalam satu paket |
| Autentikasi | **JWT custom** (bukan Supabase Auth) | Kontrol penuh tetap di backend sendiri |
| Storage File | Supabase Storage | Foto profil, barang, kos, dokumen verifikasi, asset maskot |
| Hosting | Vercel (frontend) + Railway/Render (backend) + Supabase (DB & storage) | Gratis untuk prototype, auto-deploy dari Git |

> **Catatan arsitektur penting:** Frontend Next.js **tidak pernah** terhubung langsung ke Supabase. Semua request melewati backend Express yang memvalidasi JWT terlebih dahulu. Row Level Security (RLS) di Supabase dimatikan karena autentikasi sepenuhnya dikendalikan backend — `service_role key` tidak pernah terekspos ke browser.

---

## 🚀 Cara Menjalankan

> Bagian ini akan diisi setelah setup project Next.js + Express selesai dilakukan tim Hacker. Placeholder sementara:

```bash
# Frontend
cd frontend
npm install
npm run dev          # berjalan di http://localhost:3000

# Backend
cd backend
npm install
npm run dev          # berjalan di http://localhost:5000 (sesuaikan PORT)
```

Environment variables (`.env`) untuk koneksi Supabase, JWT secret, dan konfigurasi storage akan didokumentasikan terpisah setelah setup awal selesai.

---

## 👥 Tim

| Anggota | Role | Tanggung Jawab |
|---|---|---|
| Hacker 1 | Backend Dev | Server, API, autentikasi, database schema, community & subscription |
| Hacker 2 | Frontend Dev | Landing page, Main Page (grid + maskot), marketplace, kos, integrasi API |
| Hipster | UI/UX Designer | Desain visual, animasi (cursor/scroll/typing), wireframe, halaman event & map, asset maskot |
| Hustler | PM & Presenter | PPT, narasi demo, dokumentasi, pengumpulan data survei |

---

### Fitur Prioritas Hackathon (Must Have)

- [ ] Landing page (hero center, cursor bg, scroll animation, footer)
- [ ] Login/Register
- [ ] Main Page (grid fitur + welcome animasi + maskot random)
- [ ] Halaman Event Kampus
- [ ] Marketplace COD
- [ ] Pencarian Kos
- [ ] Campus Map (denah statis interaktif)
- [ ] Profil Pengguna + Badge Verifikasi

### Belum Termasuk Fase Hackathon (Should Have — Pasca-Hackathon)

- Sistem notifikasi real-time
- Community/Forum gaya Discord (post, kategori, komentar, upvote, DM)
- Fitur Barang Temuan
- Rating & ulasan pengguna
- Verifikasi dokumen otomatis
- Unpam Space+ (Subscription) & Boost Pay-per-Use

Detail roadmap Q3 2025–Q2 2026 dan tabel risiko & mitigasi ada di bagian 12–13 PRD.

---

**Unpam Space** — *Semua yang kamu butuhkan, dalam satu platform UNPAM SPACE.*
