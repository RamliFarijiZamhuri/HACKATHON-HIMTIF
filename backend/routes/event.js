const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth.middleware');
const Event = require('../models/Event');

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================
// GET /  —  Mengambil semua event (terdekat duluan)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, users(nama, foto_profil)')
      .order('tanggal_mulai', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar event.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar event.',
      data,
    });
  } catch (err) {
    console.error('GET /event error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// GET /:id  —  Detail event by ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, users(nama, foto_profil), event_peserta(count)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail event.',
      data,
    });
  } catch (err) {
    console.error('GET /event/:id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /  —  Buat event baru (perlu login)
// ============================================================

router.post('/', authMiddleware, upload.single('poster'), async (req, res) => {
  try {
    let posterUrl = null;

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: `Gagal mengupload poster: ${uploadError.message}`,
          data: null,
        });
      }

      const { data: urlData } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

      posterUrl = urlData.publicUrl;
    }

    const { judul, deskripsi, lokasi, tanggal_mulai, tanggal_selesai, kategori } = req.body;

    const validation = Event.validate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        data: null,
      });
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        user_id: req.user.id,
        judul, deskripsi, lokasi, tanggal_mulai, tanggal_selesai, kategori,
        poster_url: posterUrl
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal membuat event: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Event berhasil dibuat.',
      data,
    });
  } catch (err) {
    console.error('POST /event error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /:id/daftar  —  Daftar jadi peserta event (perlu login)
// ============================================================
router.post('/:id/daftar', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_peserta')
      .insert([{ event_id: req.params.id, user_id: req.user.id }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal mendaftar event: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Berhasil mendaftar event.',
      data,
    });
  } catch (err) {
    console.error('POST /event/:id/daftar error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// DELETE /:id  —  Hapus data event (Hanya pembuat yang bisa)
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Cek kepemilikan
    const { data: eventData, error: checkError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !eventData) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan.',
        data: null,
      });
    }

    if (eventData.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus event ini.',
        data: null,
      });
    }

    // 2. Hapus data
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: `Gagal menghapus event: ${deleteError.message}`,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event berhasil dihapus.',
      data: null,
    });
  } catch (err) {
    console.error('DELETE /event/:id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

module.exports = router;