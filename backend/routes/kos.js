const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth.middleware');
const Listing = require('../models/Listing');

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================
// GET /  —  Mengambil semua data kos
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kos_listings')
      .select('*, users(nama, foto_profil)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar kos.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar kos.',
      data,
    });
  } catch (err) {
    console.error('GET /kos error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /  —  Buat listing kos baru dengan upload multi-foto
//            (perlu login)
// ============================================================
router.post('/', authMiddleware, upload.array('foto', 10), async (req, res) => {
  try {
    const { nama_kos, alamat, harga_bulanan, gender, jarak_kampus, fasilitas, kontak } = req.body;

    // Validasi input menggunakan Listing model
    const validation = Listing.validateKos(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        data: null,
      });
    }

    // Upload semua foto ke Supabase Storage bucket "kos"
    const fotoUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Nama file unik menggunakan timestamp + nama asli
        const fileName = `${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from('kos')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: `Gagal mengupload foto: ${uploadError.message}`,
            data: null,
          });
        }

        // Ambil public URL dari file yang sudah di-upload
        const { data: urlData } = supabase.storage
          .from('kos')
          .getPublicUrl(fileName);

        fotoUrls.push(urlData.publicUrl);
      }
    }

    // Insert data kos ke database
    const { data, error } = await supabase
      .from('kos_listings')
      .insert([{
        user_id: req.user.id,
        nama_kos,
        alamat,
        harga_bulanan: parseInt(harga_bulanan, 10),
        gender: gender || null,
        jarak_kampus: parseFloat(jarak_kampus) || 0,
        fasilitas: fasilitas ? JSON.parse(fasilitas) : [],
        kontak,
        foto_urls: fotoUrls,
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal menyimpan data kos: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Listing kos berhasil dibuat.',
      data,
    });
  } catch (err) {
    console.error('POST /kos error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// DELETE /:id  —  Hapus data kos (Hanya pemilik yang bisa)
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Cek kepemilikan
    const { data: listing, error: checkError } = await supabase
      .from('kos_listings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing kos tidak ditemukan.',
        data: null,
      });
    }

    if (listing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus listing ini.',
        data: null,
      });
    }

    // 2. Hapus data
    const { error: deleteError } = await supabase
      .from('kos_listings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: `Gagal menghapus listing: ${deleteError.message}`,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Listing kos berhasil dihapus.',
      data: null,
    });
  } catch (err) {
    console.error('DELETE /kos/:id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

module.exports = router;
