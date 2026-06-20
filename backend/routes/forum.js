const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// GET /  —  Mengambil semua forum threads (terbaru duluan)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('forum_threads')
      .select('*, users(nama, foto_profil)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar thread.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar thread.',
      data,
    });
  } catch (err) {
    console.error('GET /forum error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// GET /:id  —  Detail thread + semua komentar
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    // Ambil detail thread
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('*, users(nama, foto_profil)')
      .eq('id', req.params.id)
      .single();

    if (threadError || !thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread tidak ditemukan.',
        data: null,
      });
    }

    // Ambil semua komentar yang terikat pada thread ini
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select('*, users(nama, foto_profil)')
      .eq('thread_id', req.params.id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil komentar.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail thread.',
      data: {
        ...thread,
        comments,
      },
    });
  } catch (err) {
    console.error('GET /forum/:id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /  —  Buat thread baru (perlu login)
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { judul, konten, kategori } = req.body;

    // Validasi input
    if (!judul || !konten) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan konten wajib diisi.',
        data: null,
      });
    }

    const { data, error } = await supabase
      .from('forum_threads')
      .insert([{
        user_id: req.user.id,
        judul,
        konten,
        kategori: kategori || null,
      }])
      .select('*, users(nama, foto_profil)')
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal membuat thread: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Thread berhasil dibuat.',
      data,
    });
  } catch (err) {
    console.error('POST /forum error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /:id/comment  —  Buat komentar baru pada thread (perlu login)
// ============================================================
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { konten } = req.body;
    const threadId = req.params.id;

    if (!konten) {
      return res.status(400).json({
        success: false,
        message: 'Konten komentar wajib diisi.',
        data: null,
      });
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert([{
        thread_id: threadId,
        user_id: req.user.id,
        konten
      }])
      .select('*, users(nama, foto_profil)')
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Gagal menambahkan komentar: ${error.message}`,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Komentar berhasil ditambahkan.',
      data,
    });
  } catch (err) {
    console.error('POST /forum/:id/comment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /:id/like  —  Memberikan like pada thread
// ============================================================
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const threadId = req.params.id;

    // 1. Ambil data thread saat ini untuk melihat jumlah upvotes sekarang
    const { data: thread, error: fetchError } = await supabase
      .from('forum_threads')
      .select('upvotes')
      .eq('id', threadId)
      .maybeSingle();

    if (fetchError || !thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread forum tidak ditemukan.',
        data: null
      });
    }

    // 2. Update jumlah upvotes (tambahkan 1 dari nilai saat ini)
    const currentUpvotes = thread.upvotes || 0;
    const { data: updatedThread, error: updateError } = await supabase
      .from('forum_threads')
      .update({ upvotes: currentUpvotes + 1 })
      .eq('id', threadId)
      .select('id', 'upvotes')
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: `Gagal memberikan like: ${updateError.message}`,
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil menyukai thread ini.',
      data: {
        upvotes: updatedThread.upvotes
      }
    });

  } catch (err) {
    console.error('POST /forum/:id/like error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null
    });
  }
});

module.exports = router;
