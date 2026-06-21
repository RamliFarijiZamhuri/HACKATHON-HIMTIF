const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth.middleware');
const Listing = require('../models/Listing');

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================
// GET /  —  Mengambil semua listing marketplace
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*, users(nama, foto_profil)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar marketplace.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar marketplace.',
      data,
    });
  } catch (err) {
    console.error('GET /marketplace error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /  —  Buat listing baru dengan upload foto
//            (perlu login)
// ============================================================
router.post('/', authMiddleware, upload.array('foto', 5), async (req, res) => {
  try {
    const fotoUrls = [];

    // Upload tiap foto ke Supabase Storage bucket "marketplace"
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { error: uploadError } = await supabase.storage
          .from('marketplace')
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

        const { data: urlData } = supabase.storage
          .from('marketplace')
          .getPublicUrl(fileName);

        fotoUrls.push(urlData.publicUrl);
      }
    }

    const { judul, deskripsi, harga, kategori, kondisi } = req.body;

    // Validasi input menggunakan Listing model
    const validation = Listing.validateMarketplace(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        data: null,
      });
    }

    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert([{
        user_id: req.user.id,
        judul, deskripsi, harga, kategori, kondisi,
        foto_urls: fotoUrls,
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal membuat listing: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Listing marketplace berhasil dibuat.',
      data,
    });
  } catch (err) {
    console.error('POST /marketplace error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});
// ============================================================
// DELETE /:id  —  Hapus listing (Hanya pemilik yang bisa)
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Cek kepemilikan
    const { data: listing, error: checkError } = await supabase
      .from('marketplace_listings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing tidak ditemukan.',
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
      .from('marketplace_listings')
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
      message: 'Listing berhasil dihapus.',
      data: null,
    });
  } catch (err) {
    console.error('DELETE /marketplace/:id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

module.exports = router;