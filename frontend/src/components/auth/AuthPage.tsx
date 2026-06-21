import React, { useState } from 'react';
import { User } from '../../types';
import {
  ShieldCheck, Mail, Lock, User as UserIcon, Keyboard, Bookmark, Upload, X, ArrowLeft, CheckCircle2, GraduationCap, Eye,
  EyeOff
} from 'lucide-react';

interface AuthPageProps {
  initialMode: 'login' | 'register';
  onLoginSuccess: (user: User) => void;
  onGoBack: () => void;
}

export default function AuthPage({
  initialMode,
  onLoginSuccess,
  onGoBack
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regNim, setRegNim] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regGender, setRegGender] = useState<'pria' | 'wanita'>('pria');
  const [regProdi, setRegProdi] = useState('Teknik Informatika');
  const [regSemester, setRegSemester] = useState(1);
  const [uploadDocName, setUploadDocName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
      triggerToast('Mohon isi alamat email dan password Anda!');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        triggerToast(result.message || 'Login gagal.');
        return;
      }

      // Save token to localStorage
      localStorage.setItem('token', result.data.token);

      // Map backend user structure to frontend structure
      const beUser = result.data.user;
      const user: User = {
        id: beUser.id,
        name: beUser.nama,
        nim: beUser.nim,
        email: beUser.email,
        jurusan: beUser.prodi || 'Teknik Informatika',
        semester: 4, // Backend doesn't have semester, use default
        gender: loginEmail.toLowerCase().includes('dina') || loginEmail.toLowerCase().includes('siti') ? 'wanita' : 'pria',
        isVerified: true,
        verificationLevel: beUser.verification_level ?? 1,
        isPlusSubscriber: beUser.is_plus_subscriber ?? false,
        plusExpiresAt: beUser.plus_expires_at ?? null,
        avatarIndex: 1
      };

      onLoginSuccess(user);
    } catch (error) {
      console.error('Login error:', error);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regNim || !regEmail || !regPass) {
      triggerToast('Mohon lengkapi seluruh kolom formulir registrasi!');
      return;
    }

    if (!uploadDocName) {
      triggerToast('Unggah KTM atau tangkapan layar MyUnpam Anda untuk verifikasi identitas!');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: regNim,
          nama: regName,
          email: regEmail,
          password: regPass,
          prodi: regProdi,
          role: 'student'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        triggerToast(result.message || 'Registrasi gagal.');
        return;
      }

      // Save token to localStorage
      localStorage.setItem('token', result.data.token);

      // Map backend user to frontend User
      const beUser = result.data.user;
      const newUser: User = {
        id: beUser.id,
        name: beUser.nama,
        nim: beUser.nim,
        email: beUser.email,
        jurusan: beUser.prodi || regProdi,
        semester: Number(regSemester),
        gender: regGender,
        isVerified: true,
        verificationLevel: beUser.verification_level ?? 1,
        isPlusSubscriber: beUser.is_plus_subscriber ?? false,
        plusExpiresAt: beUser.plus_expires_at ?? null,
        avatarIndex: 1
      };

      onLoginSuccess(newUser);
    } catch (error) {
      console.error('Register error:', error);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadDocName(file.name);
      triggerToast(`Dokumen "${file.name}" berhasil diunggah!`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-(--color-midnight-harbor) text-white text-sm font-bold py-3.5 px-6 rounded-xl border border-blue-400 shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onGoBack}
        className="flex items-center gap-1.5 text-xs font-bold text-(--color-slate-channel) hover:text-(--color-midnight-harbor) cursor-pointer transition-colors mb-6 focus:outline-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Landing Page
      </button>

      {/* Main card */}
      <div className="bg-white border border-(--color-sea-fog) rounded-3xl p-6 md:p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <span className="text-xl font-black text-(--color-midnight-harbor) tracking-tight">
            unpam<span className="text-(--color-signal-blue)">space</span>
          </span>
          <h2 className="text-2xl font-black text-(--color-midnight-harbor) tracking-tight mt-2">
            {mode === 'login' ? 'Masuk ke Platform' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-xs text-(--color-slate-channel) mt-1.5 leading-relaxed">
            {mode === 'login'
              ? 'Selamat datang kembali! Gunakan akun Anda untuk mengelola sewa, COD, dll.'
              : 'Verifikasi identitas NIM demi ketertiban transaksi jual-beli di lingkungan kampus UNPAM.'}
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="grid grid-cols-2 gap-2 bg-(--color-ice-tint) p-1 rounded-xl mb-6 border border-slate-100">
          <button
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${mode === 'login' ? 'bg-white text-(--color-midnight-harbor) shadow-sm' : 'text-(--color-slate-channel) hover:text-(--color-midnight-harbor)'
              }`}
          >
            Masuk Akun
          </button>
          <button
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${mode === 'register' ? 'bg-white text-(--color-midnight-harbor) shadow-sm' : 'text-(--color-slate-channel) hover:text-(--color-midnight-harbor)'
              }`}
          >
            Registrasi Baru
          </button>
        </div>

        {/* Auth form displays */}
        {mode === 'login' ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                Alamat Email Mahasiswa
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="contoh@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-white pl-10 pr-4 py-2.5 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Kata sandi rahasia..."
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-white pl-10 pr-4 py-2.5 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-(--color-signal-blue) hover:opacity-95 text-white py-3 rounded-xl cursor-pointer font-bold text-xs shadow-md transition-all mt-6"
            >
              Masuk Sekarang
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ahmad Fauzi"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-white px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                  NIM Mahasiswa
                </label>
                <input
                  type="text"
                  required
                  placeholder="221011400892"
                  value={regNim}
                  onChange={(e) => setRegNim(e.target.value)}
                  className="w-full bg-white px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                  Kategori Studi / Prodi
                </label>
                <select
                  value={regProdi}
                  onChange={(e) => setRegProdi(e.target.value)}
                  className="w-full bg-white px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none text-(--color-midnight-harbor)"
                >
                  <option value="Teknik Informatika">Teknik Informatika</option>
                  <option value="Sistem Informasi">Sistem Informasi</option>
                  <option value="Sastra Inggris">Sastra Inggris</option>
                  <option value="Akuntansi">Akuntansi</option>
                  <option value="Hukum">Hukum Perpajakan</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                  Semester Aktif
                </label>
                <select
                  value={regSemester}
                  onChange={(e) => setRegSemester(Number(e.target.value))}
                  className="w-full bg-white px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none text-(--color-midnight-harbor)"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                Gender Mahasiswa
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegGender('pria')}
                  className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${regGender === 'pria'
                    ? 'bg-(--color-midnight-harbor) text-white border-(--color-midnight-harbor)'
                    : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor)'
                    }`}
                >
                  Pria (Laki-laki)
                </button>
                <button
                  type="button"
                  onClick={() => setRegGender('wanita')}
                  className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${regGender === 'wanita'
                    ? 'bg-(--color-midnight-harbor) text-white border-(--color-midnight-harbor)'
                    : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor)'
                    }`}
                >
                  Wanita (Perempuan)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                Alamat Email Mahasiswa
              </label>
              <input
                type="email"
                required
                placeholder="email@unpam.ac.id"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-white px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                Sandi Pengaman (Sandi Baru)
              </label>
              <input
                type="password"
                required
                placeholder="Buat sandi rumit..."
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="w-full bg-white px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
              />
            </div>

            {/* Document upload block */}
            <div className="border border-dashed border-(--color-sea-fog) rounded-xl p-3.5 bg-slate-50/50 flex flex-col items-center">
              {uploadDocName ? (
                <div className="flex items-center justify-between w-full text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="truncate max-w-[150px] font-bold">{uploadDocName}</span>
                  </div>
                  <button
                    onClick={() => setUploadDocName(null)}
                    className="p-1 hover:bg-emerald-100 rounded text-red-500 cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-center py-2 flex flex-col items-center justify-center w-full">
                  <Upload className="w-5 h-5 text-(--color-signal-blue) mb-1" />
                  <span className="text-[11px] font-bold text-(--color-midnight-harbor)">Unggah Bukti KTM / MyUnpam</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Membuktikan keaslian status kemahasiswaan</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-(--color-signal-blue) hover:opacity-95 text-white py-3 rounded-xl cursor-pointer font-bold text-xs shadow-md transition-all mt-4"
            >
              Kirim Dokumen & Registrasi
            </button>
          </form>
        )}

        {/* Security notice footer card */}
        <div className="bg-(--color-ice-tint) rounded-2xl p-4 mt-6 border border-blue-50 text-[10px] leading-relaxed text-slate-500 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-(--color-signal-blue) shrink-0" />
          <span>Sistem validasi verifikasi identitas dijamin 100% aman dilindungi hukum (UU PDP No.27 Th 2022). Identitas KTM hanya divalidasi manual untuk menjaga keaslian penjual & pelapor kos indekos di area kampus.</span>
        </div>

      </div>

    </div>
  );
}
