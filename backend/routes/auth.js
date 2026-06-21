const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth.middleware');
const User = require('../models/User');

// Helper to hash password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Helper to verify password
function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// ============================================================
// POST /register — Registrasi User Baru
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { nim, nama, email, password, prodi, role, foto_profil } = req.body;

    // Validasi input menggunakan User model
    const validation = User.validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        data: null,
      });
    }

    // Cek apakah email sudah terdaftar
    const { data: existingEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailError) {
      console.error('Check email error:', emailError);
    }

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar.',
        data: null,
      });
    }

    // Cek apakah NIM sudah terdaftar
    const { data: existingNim, error: nimError } = await supabase
      .from('users')
      .select('id')
      .eq('nim', nim)
      .maybeSingle();

    if (nimError) {
      console.error('Check NIM error:', nimError);
    }

    if (existingNim) {
      return res.status(400).json({
        success: false,
        message: 'NIM sudah terdaftar.',
        data: null,
      });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Insert user baru ke database
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([{
        nim,
        nama,
        email,
        password_hash: hashedPassword,
        prodi: prodi || null,
        role: role || 'student',
        foto_profil: foto_profil || null,
        verification_level: 1, // Start at Level 1 per PRD
        is_plus_subscriber: false,
        plus_expires_at: null,
      }])
      .select('id, nim, nama, email, role, prodi, foto_profil, created_at, verification_level, is_plus_subscriber, plus_expires_at')
      .single();

    if (insertError) {
      console.error('Register insert error:', insertError);
      return res.status(400).json({
        success: false,
        message: `Registrasi gagal: ${insertError.message}`,
        data: null,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, nim: user.nim, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: {
        token,
        user: User.sanitize(user),
      },
    });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// POST /login — Login User
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { emailOrNim, email, nim, password } = req.body;
    const identifier = emailOrNim || email || nim;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/NIM dan password wajib diisi.',
        data: null,
      });
    }

    // Cari user berdasarkan email atau NIM
    let query = supabase.from('users').select('*');
    if (identifier.includes('@')) {
      query = query.eq('email', identifier);
    } else {
      query = query.eq('nim', identifier);
    }

    const { data: user, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error('Fetch user error:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses login.',
        data: null,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau NIM tidak ditemukan.',
        data: null,
      });
    }

    // Verifikasi password
    const isPasswordCorrect = verifyPassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Password salah.',
        data: null,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, nim: user.nim, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: User.sanitize(user),
      },
    });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

// ============================================================
// GET /me — Ambil Data Profile User Berdasarkan Token
// ============================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, nim, nama, email, role, prodi, foto_profil, created_at, verification_level, is_plus_subscriber, plus_expires_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile berhasil diambil.',
      data: user,
    });
  } catch (err) {
    console.error('GET /auth/me error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      data: null,
    });
  }
});

module.exports = router;
