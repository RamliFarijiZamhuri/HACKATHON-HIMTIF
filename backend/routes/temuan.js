const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth.middleware');
const Temuan = require('../models/Temuan');

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================
// GET /  —  Mengambil semua laporan barang hilang / temuan
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('temuan_listings')
      .select('*, users(nama, foto_profil)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar laporan barang.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar laporan.',
      data,
    });
  } catch (err) {
    console.error('GET /temuan error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /  —  Buat laporan baru (perlu login)
// ============================================================
router.post('/', authMiddleware, upload.single('foto'), async (req, res) => {
  try {
    let fotoUrl = null;

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from('temuan')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
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
        .from('temuan')
        .getPublicUrl(fileName);

      fotoUrl = urlData.publicUrl;
    }

    const { type, title, description, location, contact } = req.body;

    const validation = Temuan.validate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        data: null,
      });
    }

    const { data, error } = await supabase
      .from('temuan_listings')
      .insert([{
        user_id: req.user.id,
        type, title, description, location, contact,
        status: 'aktif',
        foto_url: fotoUrl,
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal membuat laporan: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat.',
      data,
    });
  } catch (err) {
    console.error('POST /temuan error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// DELETE /:id  —  Hapus data laporan barang (Hanya pemilik yang bisa)
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Cek kepemilikan
    const { data: listing, error: checkError } = await supabase
      .from('temuan_listings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !listing) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan.',
        data: null,
      });
    }

    if (listing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus laporan ini.',
        data: null,
      });
    }

    // 2. Hapus data
    const { error: deleteError } = await supabase
      .from('temuan_listings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: `Gagal menghapus laporan: ${deleteError.message}`,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Laporan berhasil dihapus.',
      data: null,
    });
  } catch (err) {
    console.error('DELETE /temuan/:id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

module.exports = router;
