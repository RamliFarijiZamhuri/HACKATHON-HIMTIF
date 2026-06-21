import React, { useState } from 'react';
import { User } from '../../../types';
import { MascotAvatar } from '../../layout/MascotAvatar';
import {
  User as UserIcon,
  Shield,
  Star,
  Bell,
  Lock,
  LogOut,
  HelpCircle,
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Zap,
  Calendar,
  Rocket,
  ArrowRight,
  ShieldCheck,
  Laptop,
  Smartphone,
  Info,
  Settings,
  ArrowLeft,
  X,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfileSettingsPageProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onGoBack: () => void;
}

// Preset dynamic avatar options for maximum fidelity
const AVATAR_PRESETS = [
  {
    id: 'male_cartoon',
    name: 'Mascot 3D Putra (Hoodie Biru)',
    emoji: '🔵'
  },
  {
    id: 'female_cartoon',
    name: 'Mascot 3D Putri (Hijab Violet)',
    emoji: '🟣'
  },
  {
    id: 'ahmad',
    name: 'Ahmad Sudrajat (Realistic Male)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVeLEaOaZ-_OBMuqaHQoq1jUx7BL67jiU9CMix5tHT62vZ-oEaJLTdZuEnqVFUtyPad--fNW9maRPwI7Wds1wYJew7WRIULpUSYorUUBrHufsCNfjuqrzrSUMIuZOmS14VEJhr8OyLxsqWnFYmAgUiibMNGKgTRB4k_jzjiN-We1S9ttk0KOdfypm-YqmWVaD4pvJhGIeHovjuFq9xEiUs-1EQO7ja9tb2mEhEmc7eZlGCMPmpqLCRuH64lKozJ3heRYy-cL2heiI'
  },
  {
    id: 'female_student',
    name: 'Ayu Lestari (Realistic Female)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'
  }
];

export default function ProfileSettingsPage({
  currentUser,
  onUpdateUser,
  onLogout,
  onGoBack
}: ProfileSettingsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'subscription' | 'notifications' | 'privacy'>('profile');
  
  // Profile edit fields
  const [fullName, setFullName] = useState(currentUser.name || 'Ahmad Sudrajat');
  const [email, setEmail] = useState(currentUser.email || 'ahmad.sudrajat@student.unpam.ac.id');
  const [prodi, setProdi] = useState(currentUser.jurusan || 'Teknik Informatika');
  const [semester, setSemester] = useState(currentUser.semester || 6);
  const [currentAvatarId, setCurrentAvatarId] = useState(currentUser.gender === 'wanita' ? 'female_cartoon' : 'male_cartoon');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // General settings toggles
  const [emailNotification, setEmailNotification] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Toast status alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification level state (0–3 per PRD)
  const [verificationLevel, setVerificationLevel] = useState<0 | 1 | 2 | 3>((currentUser.verificationLevel ?? 1) as 0 | 1 | 2 | 3);
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [verifModalTarget, setVerifModalTarget] = useState<0 | 1 | 2 | 3>(2);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [verifSubmitting, setVerifSubmitting] = useState(false);

  // Space+ Upgrade states
  const [showSpacePlusModal, setShowSpacePlusModal] = useState(false);
  const [spacePlusPaymentMethod, setSpacePlusPaymentMethod] = useState<'qris' | 'gopay' | 'spay' | 'va'>('qris');
  const [spacePlusSubmitting, setSpacePlusSubmitting] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      triggerToast('Nama Lengkap tidak boleh kosong!');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      triggerToast('Masukkan email kampus yang valid!');
      return;
    }

    const updated: User = {
      ...currentUser,
      name: fullName,
      email: email,
      jurusan: prodi,
      semester: Number(semester),
      gender: (currentAvatarId === 'female_student' || currentAvatarId === 'female_cartoon') ? 'wanita' : 'pria'
    };

    onUpdateUser(updated);
    triggerToast('✓ Informasi profil berhasil diperbaharui!');
  };

  const handleToggleSub = () => {
    if (!currentUser.isPlusSubscriber) {
      setShowSpacePlusModal(true);
      return;
    }
    
    const updated: User = {
      ...currentUser,
      isPlusSubscriber: false,
      plusExpiresAt: null
    };
    onUpdateUser(updated);
    triggerToast('✓ Perpanjangan UNPAM SPACE+ dibatalkan.');
  };

  const handleConfirmSpacePlus = async () => {
    setSpacePlusSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/upgrade-space-plus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ durationMonths: 1 })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        triggerToast(result.message || 'Gagal aktivasi Space+');
        return;
      }

      setShowSpacePlusModal(false);
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const expires = `${futureDate.getDate()} ${futureDate.toLocaleString('id-ID', { month: 'short' })} ${futureDate.getFullYear()}`;
      
      const updated: User = {
        ...currentUser,
        isPlusSubscriber: true,
        plusExpiresAt: expires
      };
      onUpdateUser(updated);
      triggerToast('✓ Layanan UNPAM SPACE+ Berhasil diaktifkan!');
    } catch (err) {
      console.error('Space+ error:', err);
      triggerToast('Gagal terhubung ke server.');
    } finally {
      setSpacePlusSubmitting(false);
    }
  };

  const handleAvatarSelect = (id: string) => {
    setCurrentAvatarId(id);
    setShowAvatarPicker(false);
    
    const isFemale = id === 'female_student' || id === 'female_cartoon';
    const updated: User = {
      ...currentUser,
      gender: isFemale ? 'wanita' : 'pria'
    };
    onUpdateUser(updated);
    triggerToast('✓ Foto avatar profil berhasil diganti!');
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus akun Unpam Space Anda secara permanen? Semua data posting, sewaan, dan wishlist Anda akan dihapus selamanya dari cluster sandboxed server.');
    if (confirm) {
      triggerToast('Menghapus akun Anda dari unpam space...');
      setTimeout(() => {
        onLogout();
      }, 1500);
    }
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      triggerToast('Masukkan password saat ini!');
      return;
    }
    if (newPassword.length < 6) {
      triggerToast('Password baru minimal 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('Konfirmasi password tidak cocok!');
      return;
    }
    triggerToast('✓ Password Anda berhasil diperbaharui secara aman!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Helper to render Avatar based on active choices
  const renderAvatar = (sizeClass = "w-32 h-32 md:w-40 md:h-40") => {
    const activePreset = AVATAR_PRESETS.find(p => p.id === currentAvatarId);
    return (
      <div className={`space-plus-border relative ${sizeClass} overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.02]`}>
        <div className="w-full h-full rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
          {activePreset?.url ? (
            <img 
              src={activePreset.url} 
              alt="Profil Student" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <MascotAvatar size="100%" gender={activePreset?.id === 'female_cartoon' ? 'wanita' : 'pria'} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#0f172a] text-white text-xs font-bold py-3.5 px-6 rounded-xl border border-indigo-500 shadow-2xl flex items-center gap-2 animate-[slideIn_0.15s_ease-out]">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb / Go Back action bar */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Menu Utama</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* SIDEBAR NAVIGATION COLUMN */}
        <aside className="w-full lg:w-64 bg-white border border-slate-200 rounded-xl p-4 shrink-0 shadow-xs h-fit">
          <div className="mb-4 pb-4 border-b border-slate-100 px-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight line-clamp-1">{currentUser.name || fullName}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">NIM: {currentUser.nim}</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all text-left cursor-pointer focus:outline-none ${
                activeSubTab === 'profile' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>Profil Pengguna</span>
            </button>

            <button
              onClick={() => setActiveSubTab('security')}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all text-left cursor-pointer focus:outline-none ${
                activeSubTab === 'security' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Keamanan Sandi</span>
            </button>

            <button
              onClick={() => setActiveSubTab('subscription')}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all text-left cursor-pointer focus:outline-none ${
                activeSubTab === 'subscription' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Star className="w-4 h-4 shrink-0" />
              <span>Membership VIP</span>
            </button>

            <button
              onClick={() => setActiveSubTab('notifications')}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all text-left cursor-pointer focus:outline-none ${
                activeSubTab === 'notifications' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notifikasi Sistem</span>
            </button>

            <button
              onClick={() => setActiveSubTab('privacy')}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all text-left cursor-pointer focus:outline-none ${
                activeSubTab === 'privacy' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Kebijakan Privasi</span>
            </button>
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            {/* Upgrade banner if not VIP */}
            {!currentUser.isPlusSubscriber && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-center">
                <p className="text-[10px] font-extrabold text-indigo-700 tracking-wider uppercase">Tingkatkan Pengalaman</p>
                <button 
                  onClick={handleToggleSub}
                  className="w-full mt-2 font-black text-xs py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-all cursor-pointer shadow-xs focus:outline-none"
                >
                  Upgrade ke Space+
                </button>
              </div>
            )}

            <a 
              href="#help"
              onClick={(e) => {
                e.preventDefault();
                triggerToast('✓ Membuka Unpam Space Help Desk Center...');
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Help Center</span>
            </a>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left focus:outline-none"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT (BENTO NESTING GRID FOR ACTIVE SUBTABS) */}
        <section className="flex-1 space-y-6">
          
          {/* 1. PROFILE SETTINGS TAB */}
          {activeSubTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Profile Header Main Card (Col-span-3, Full Width) */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 shadow-xs relative">
                <div className="relative shrink-0">
                  {renderAvatar()}
                  
                  {/* Edit Photo Indicator button */}
                  <button 
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md border-2 border-white transition-all cursor-pointer focus:outline-none hover:scale-105"
                    title="Ubah Foto Profil"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Micro avatar picker popover */}
                  {showAvatarPicker && (
                    <div className="absolute top-1/2 left-full md:left-full md:top-0 -translate-y-1/2 md:translate-y-0 ml-3 z-30 bg-white border border-slate-200 p-3 rounded-xl shadow-xl w-60 space-y-2.5 animate-[fadeIn_0.15s_ease-out]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Avatar</span>
                        <button onClick={() => setShowAvatarPicker(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {AVATAR_PRESETS.map((p) => (
                           <button
                            key={p.id}
                            onClick={() => handleAvatarSelect(p.id)}
                            className={`flex items-center gap-2.5 p-1.5 rounded-lg text-left text-xs font-semibold cursor-pointer transition-colors ${
                              currentAvatarId === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                              {p.url ? (
                                <img src={p.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <MascotAvatar size={28} gender={p.id === 'female_cartoon' ? 'wanita' : 'pria'} />
                              )}
                            </div>
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Text details for Name & Status Indicators */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {currentUser.name || fullName}
                    </h1>
                    
                    {/* Dynamic Verification Pill badge (PRD-compliant) */}
                    <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold mx-auto md:mx-0 shrink-0 select-none uppercase tracking-wider border ${
                      verificationLevel === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' :
                      verificationLevel === 1 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      verificationLevel === 2 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {verificationLevel >= 1 ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {verificationLevel === 0 ? 'Tamu (Belum Verifikasi)' :
                         verificationLevel === 1 ? 'Terverifikasi Dasar (Lvl 1)' :
                         verificationLevel === 2 ? 'Terverifikasi Menengah (Lvl 2)' :
                         'Terverifikasi Penuh (Lvl 3)'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-500">
                    Mahasiswa {currentUser.jurusan || prodi} • NIM {currentUser.nim}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
                    <span className="bg-slate-100 hover:bg-slate-200/80 transition-colors text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      Smt {currentUser.semester || semester}
                    </span>
                    <span className="bg-slate-100 hover:bg-slate-200/80 transition-colors text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      Kampus Viktor
                    </span>
                    {currentUser.isPlusSubscriber && (
                      <span className="bg-amber-400/90 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                        Space+ Member
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Verification Level - PRD compliant 4-level system */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Status Verifikasi</span>
                  </h3>
                  {/* Live badge showing current level */}
                  <div className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full select-none ${
                    verificationLevel === 0 ? 'bg-slate-100 text-slate-500' :
                    verificationLevel === 1 ? 'bg-blue-100 text-blue-700' :
                    verificationLevel === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {verificationLevel === 0 ? 'Tamu' :
                     verificationLevel === 1 ? 'Lvl 1 · Dasar' :
                     verificationLevel === 2 ? 'Lvl 2 · Menengah' :
                     'Lvl 3 · Penuh ✓'}
                  </div>
                </div>

                {/* Dual badge explanation note */}
                <div className="mb-4 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-start">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                    <strong>Badge Verifikasi</strong> (kepercayaan) dan <strong>Badge Space+</strong> (premium) bersifat independen — verifikasi tidak dapat dibeli, hanya melalui upload dokumen.
                  </p>
                </div>

                {/* 4-level step tracker */}
                <div className="space-y-3 relative flex-1">
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                  {[
                    {
                      level: 0,
                      name: 'Tamu',
                      docs: '—',
                      features: 'Landing page, Campus Map, Event publik',
                      color: 'slate'
                    },
                    {
                      level: 1,
                      name: 'Terverifikasi Dasar',
                      docs: 'KTM + NIM',
                      features: 'Semua fitur baca, Community/Forum, Barang Temuan',
                      color: 'blue'
                    },
                    {
                      level: 2,
                      name: 'Terverifikasi Menengah',
                      docs: 'KTM + KTP + Foto Barang',
                      features: 'Marketplace COD, Jual Beli',
                      color: 'amber'
                    },
                    {
                      level: 3,
                      name: 'Terverifikasi Penuh',
                      docs: 'KTM + KTP + Identitas Lengkap Mahasiswa',
                      features: 'Listing Kos, Posting Event Resmi',
                      color: 'emerald'
                    }
                  ].map((step) => {
                    const isDone = verificationLevel >= step.level;
                    const isCurrent = verificationLevel === step.level;
                    const isNext = verificationLevel === step.level - 1;
                    return (
                      <div key={step.level} className={`flex items-start gap-3 relative rounded-lg p-2 transition-colors ${isCurrent ? 'bg-indigo-50/60' : ''}`}>
                        {/* Level circle */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 shrink-0 text-xs font-black border-2 transition-all ${
                          isDone && step.level < verificationLevel
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {isDone && step.level < verificationLevel
                            ? <Check className="w-3.5 h-3.5" />
                            : step.level}
                        </div>

                        <div className="pt-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-xs font-extrabold leading-none ${isCurrent ? 'text-indigo-700' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                              {step.name}
                            </p>
                            {isCurrent && (
                              <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">Aktif</span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                            <span className="font-semibold text-slate-500">Dokumen:</span> {step.docs}
                          </p>
                          <p className="text-[9px] text-slate-400 leading-tight">
                            <span className="font-semibold text-slate-500">Akses:</span> {step.features}
                          </p>

                          {/* Upgrade button for next level */}
                          {isNext && step.level > 0 && (
                            <button
                              onClick={() => {
                                setVerifModalTarget(step.level as 0 | 1 | 2 | 3);
                                setUploadedFiles({});
                                setShowVerifModal(true);
                              }}
                              className="mt-1.5 text-[9px] font-black text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-all cursor-pointer focus:outline-none"
                            >
                              Ajukan Naik ke Level {step.level} →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Already at max level note */}
                {verificationLevel >= 3 && (
                  <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-2 items-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-[10px] text-emerald-700 font-bold">Verifikasi Penuh — semua fitur platform dapat diakses.</p>
                  </div>
                )}
              </div>

              {/* ===== VERIFICATION UPLOAD MODAL ===== */}
              {showVerifModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative">
                    <button
                      onClick={() => setShowVerifModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 select-none">
                        <Shield className="w-3 h-3" />
                        Ajukan Verifikasi Level {verifModalTarget}
                      </div>
                      <h2 className="text-base font-black text-slate-900">
                        {verifModalTarget === 1 ? 'Terverifikasi Dasar' :
                         verifModalTarget === 2 ? 'Terverifikasi Menengah' :
                         'Terverifikasi Penuh'}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload dokumen identitas yang diperlukan. Seluruh berkas dienkripsi sesuai UU PDP Indonesia.
                      </p>
                    </div>

                    {/* Documents required per level */}
                    <div className="space-y-3">
                      {verifModalTarget >= 1 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                            Kartu Tanda Mahasiswa (KTM)
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setUploadedFiles(f => ({ ...f, ktm: e.target.files?.[0] || null }))}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition-all border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                          />
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                            Nomor Induk Mahasiswa (NIM)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 201011400001"
                            defaultValue={currentUser.nim}
                            readOnly
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
                          />
                        </div>
                      )}
                      {verifModalTarget >= 2 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                            KTP (Kartu Tanda Penduduk)
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setUploadedFiles(f => ({ ...f, ktp: e.target.files?.[0] || null }))}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer transition-all border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                          />
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                            Foto Barang (untuk keperluan transaksi)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setUploadedFiles(f => ({ ...f, fotoBarang: e.target.files?.[0] || null }))}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer transition-all border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                          />
                        </div>
                      )}
                      {verifModalTarget >= 3 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Identitas Lengkap Mahasiswa Pelapor
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setUploadedFiles(f => ({ ...f, identitasLengkap: e.target.files?.[0] || null }))}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer transition-all border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                          />
                          <p className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 leading-relaxed">
                            <strong>Catatan:</strong> Dokumen yang diverifikasi adalah identitas mahasiswa yang menginput listing kos, bukan identitas pemilik kos. Ini memastikan akuntabilitas informasi yang diinput.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Alur info */}
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                        <strong className="text-slate-600">Alur:</strong> Upload Dokumen → Review Admin → Persetujuan → Akses Fitur
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">Data dienkripsi &amp; tidak disimpan permanen setelah verifikasi selesai (UU PDP).</p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={async () => {
                        setVerifSubmitting(true);
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch(`${import.meta.env.VITE_API_URL}/user/upgrade-verification`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ targetLevel: verifModalTarget })
                          });
                          const result = await response.json();
                          if (!response.ok || !result.success) {
                            triggerToast(result.message || 'Gagal mengajukan verifikasi.');
                            setVerifSubmitting(false);
                            return;
                          }
                          
                          setVerifSubmitting(false);
                          setShowVerifModal(false);
                          setVerificationLevel(verifModalTarget);
                          const updated: User = { ...currentUser, verificationLevel: verifModalTarget };
                          onUpdateUser(updated);
                          triggerToast(`✓ Dokumen Level ${verifModalTarget} berhasil dikirim! (Otomatis diterima untuk versi demo ini)`);
                        } catch (err) {
                          console.error('Upgrade verif error:', err);
                          triggerToast('Gagal terhubung ke server.');
                          setVerifSubmitting(false);
                        }
                      }}
                      disabled={verifSubmitting}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-none shadow-md"
                    >
                      {verifSubmitting ? 'Mengirim Dokumen...' : `Kirim Dokumen untuk Verifikasi Level ${verifModalTarget}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Space+ Premium Subscription promotional/active Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-950 hover:to-indigo-900 transition-all border border-indigo-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden h-full">
                <div className="z-10 text-left space-y-4 max-w-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-md backdrop-blur-xs select-none">
                      <span className="text-[9px] font-black tracking-widest uppercase">Unpam Space+</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold select-none ${
                      currentUser.isPlusSubscriber ? 'bg-emerald-400 text-slate-950 animate-pulse' : 'bg-slate-400 text-white'
                    }`}>
                      {currentUser.isPlusSubscriber ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
                    {currentUser.isPlusSubscriber ? 'Optimalkan Kampusmu' : 'Akses Eksklusif Unpam Space+'}
                  </h2>

                  <ul className="text-xs text-indigo-200 space-y-1.5 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                      <span>Boost otomatis listing Marketplace & Kos di peringkat teratas</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                      <span>Lencana Space+ VIP berwibawa pada foto profil & data forum</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Perpanjangan berikutnya: {currentUser.plusExpiresAt || '12 Des 2026'}</span>
                    </li>
                  </ul>

                  <button 
                    onClick={handleToggleSub}
                    className="bg-white text-indigo-950 px-5 py-2 rounded-lg font-black font-sans text-xs hover:bg-slate-100 transition-all active:scale-98 cursor-pointer shadow-md focus:outline-none inline-block mt-2"
                  >
                    {currentUser.isPlusSubscriber ? 'Kelola Langganan' : 'Daftar Sekarang (Rp 13.000/bln)'}
                  </button>
                </div>

                <div className="hidden md:block opacity-10 absolute -right-6 -bottom-6 rotate-12 pointer-events-none">
                  <Rocket className="w-60 h-60 text-white fill-current" />
                </div>
              </div>

              {/* Edit Profile fields inputs form (col-span-2) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-4 flex items-center gap-1">
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  <span>Informasi Profil</span>
                </h3>

                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-800 font-bold">Nama Lengkap</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-xs font-semibold text-slate-800 transition-colors"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold">Nomor Induk Mahasiswa (NIM)</label>
                    <input
                      type="text"
                      value={currentUser.nim}
                      readOnly
                      disabled
                      className="w-full bg-slate-100 border border-slate-200/70 p-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed select-none rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-800 font-bold">Email Kampus</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-xs font-semibold text-slate-800 transition-colors"
                      placeholder="nim@student.unpam.ac.id"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-800 font-bold">Program Studi</label>
                    <select
                      value={prodi}
                      onChange={(e) => setProdi(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-xs font-semibold text-slate-800 transition-colors"
                    >
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Teknik Industri">Teknik Industri</option>
                      <option value="Sastra Inggris">Sastra Inggris</option>
                      <option value="Manajemen">Manajemen</option>
                      <option value="Akuntansi">Akuntansi</option>
                      <option value="Hukum">Hukum</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-800 font-bold">Semester</label>
                    <input
                      type="number"
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-xs font-semibold text-slate-800 transition-colors"
                      min="1"
                      max="14"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer select-none focus:outline-none"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>

              {/* General Settings switches panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-fit space-y-4">
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>Pengaturan Umum</span>
                </h3>

                <div className="space-y-3.5">
                  {/* Email notifier toggle */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Notifikasi Email</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Update harian sewaan & marketplace</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={emailNotification} 
                        onChange={() => setEmailNotification(!emailNotification)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Public profile searchable switch */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Profil Publik</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Akun dapat dicari oleh alumni</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={publicProfile} 
                        onChange={() => setPublicProfile(!publicProfile)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* 2FA switcher toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">2FA Security</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Gunakan kode login OTP tambahan</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={twoFactorAuth} 
                        onChange={() => {
                          setTwoFactorAuth(!twoFactorAuth);
                          triggerToast(!twoFactorAuth ? '✓ Autentikasi 2FA berhasil diaktifkan!' : '✓ Autentikasi 2FA dinonaktifkan.');
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun Permanen</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. SECURITY SETTINGS TAB */}
          {activeSubTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Kredensial Akun Unpam Space</h3>
                <p className="text-xs text-slate-400 mt-0.5">Perbaharui kata sandi login Anda secara berkala untuk perlindungan penuh.</p>
              </div>

              <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-md">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-800 font-bold">Password Saat Ini</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 pr-10 text-xs font-semibold text-slate-800 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-800 font-bold">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 pr-10 text-xs font-semibold text-slate-800 transition-colors"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-800 font-bold">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 pr-10 text-xs font-semibold text-slate-800 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs cursor-pointer transition-colors focus:outline-none shadow-xs"
                >
                  Ubah Kata Sandi
                </button>
              </form>

              {/* Trusted active physical devices tracking */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800">Sesi Login Perangkat Terpercaya</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">macOS Chrome (Sesi ini)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Tangerang, Banten • Aktif saat ini</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold py-0.5 px-2 rounded-full">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-md">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">Infinix Note 30</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Ciputat, Banten • Login 2 jam lalu</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast('✓ Sesi perangkat Infinix berhasil dicabut secara aman.')}
                      className="text-xs text-red-500 hover:text-red-700 font-bold font-mono focus:outline-none cursor-pointer"
                    >
                      REVOKE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. SUBSCRIPTION PLANS DETAILS TAB */}
          {activeSubTab === 'subscription' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 animate-[fadeIn_0.1s_ease-out]">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Kelola Paket Langganan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Layanan keanggotaan premium yang dibuat khusus untuk kenyamanan mahasiswa Universitas Pamulang.</p>
              </div>

              {/* Plans Compare grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free standard */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Standard Free</h4>
                    <span className="text-2xl font-black text-slate-950 block mt-2">Rp 0 <span className="text-xs text-slate-400 font-medium">/ selamanya</span></span>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Cari Info Kos & Temuan</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Posting Max 3 Listing marketplace</li>
                      <li className="flex items-center gap-1.5 text-slate-300 line-through"><X className="w-3.5 h-3.5 shrink-0" /> Auto-boost listing ke teratas</li>
                      <li className="flex items-center gap-1.5 text-slate-300 line-through"><X className="w-3.5 h-3.5 shrink-0" /> Lencana premium bintang emas</li>
                    </ul>
                  </div>
                  {!currentUser.isPlusSubscriber && (
                    <div className="mt-6 text-center text-xs font-bold text-slate-500 py-1.5 bg-slate-100 rounded-lg">
                      PAKET AKTIF SAAT INI
                    </div>
                  )}
                </div>

                {/* Platinum Space+ */}
                <div className="border-2 border-indigo-600 rounded-xl p-4 flex flex-col justify-between bg-indigo-50/20 relative">
                  <span className="absolute top-3 right-3 bg-amber-400 text-indigo-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow-2xs select-none tracking-wider">REKOMENDASI</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest leading-none">Unpam Space+</h4>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    </div>
                    <span className="text-2xl font-black text-slate-950 block mt-2">Rp 13.000 <span className="text-xs text-slate-400 font-medium">/ bulan</span></span>
                    
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Unlimited posting produk & sewaan</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Listing Otomatis didorong di urutan Utama</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Lencana eksklusif mahkota emas VIP</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Akses bot prioritas event & lomba</li>
                    </ul>
                  </div>

                  <button 
                    onClick={handleToggleSub}
                    className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs focus:outline-none transition-colors"
                  >
                    {currentUser.isPlusSubscriber ? 'BATALKAN LANGGANAN' : 'UPGRADE SEKARANG'}
                  </button>
                </div>
              </div>

              {/* Billing history table mockup */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-800 mb-2">Riwayat Transaksi Tagihan</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500 font-medium border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-2.5 font-bold text-slate-700">No Faktur</th>
                        <th className="p-2.5 font-bold text-slate-700">Tanggal Transaksi</th>
                        <th className="p-2.5 font-bold text-slate-700">Metode Bayar</th>
                        <th className="p-2.5 font-bold text-slate-700">Jumlah</th>
                        <th className="p-2.5 font-bold text-slate-700 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900">#US-97214</td>
                        <td className="p-2.5">12 Nov 2024</td>
                        <td className="p-2.5">GOPAY E-Wallet</td>
                        <td className="p-2.5">Rp 13.000</td>
                        <td className="p-2.5 text-right"><span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Lunas</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900">#US-91045</td>
                        <td className="p-2.5">12 Okt 2024</td>
                        <td className="p-2.5">QRIS Scan Dana</td>
                        <td className="p-2.5">Rp 13.000</td>
                        <td className="p-2.5 text-right"><span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Lunas</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS TUNES DETAIL TAB */}
          {activeSubTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Setelan Notifikasi Sistem</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sesuaikan saluran mana saja Anda ingin dikirimi update real-time kampus.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Temuan &amp; Kehilangan Terdekat</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Dapatkan notifikasi instan jika ada pengumuman barang yang cocok dalam radius kampus.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Update Kos &amp; Kamar Kontrakan Baru</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Kirim pesan jika ada pemilik baru yang merilis listing kos dekat Universitas Pamulang.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Ulasan &amp; Balasan Forum</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Hubungi saya melalui rincian push alert jika ada mahasiswa lain membalas thread komunitas milik saya.</p>
                  </div>
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Seminar, Organisasi, &amp; Lomba Baru</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Notifikasi penawaran kepanitiaan seminar ber-sertifikat prodi.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* 5. PRIVACY SETTINGS TAB */}
          {activeSubTab === 'privacy' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Kerahasiaan &amp; Hak Data Pengguna</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola visibilitas file personalia serta ekspor atau log kepemilikan sandi yang terenkripsi.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-800">Prinsip Privasi Unpam Space</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Sesuai undang-undang PDP Indonesia, seluruh dokumen identitas (NIM &amp; Foto Mahasiswa) yang diunggah untuk kelayakan log level verifikasi disimpan di kompartmen terenkripsi s3-bucket dan tidak pernah dipindahkan ke pihak ketiga non-afiliasi kampus.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800">Kelola Eksport Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-800">Unduh Data Saya (.json)</p>
                      <p className="text-[9px] text-slate-400">Unduh seluruh thread forum, riwayat pencarian kos, barang temuan, dan rincian transaksi.</p>
                      <button 
                        onClick={() => triggerToast('✓ Unduhan berkas data.json berhasil dimulai.')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none cursor-pointer"
                      >
                        EKSPOR DATA LENGKAP →
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-800">Bersihkan Penelusuran</p>
                      <p className="text-[9px] text-slate-400">Bersihkan berkas riwayat cookie lokal bento grid, filter pencarian peta gedung, dsb.</p>
                      <button 
                        onClick={() => triggerToast('✓ Berhasil membersihkan seluruh berkas cache penelusuran!')}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 focus:outline-none cursor-pointer"
                      >
                        BERSIHKAN CACHE SEKARANG →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SPACE+ UPGRADE CHECKOUT MODAL ===== */}
          {showSpacePlusModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative">
                <button
                  onClick={() => setShowSpacePlusModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 select-none">
                    <Sparkles className="w-3 h-3" />
                    Premium Checkout
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Unpam Space+
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Selesaikan pembayaran untuk mengaktifkan fitur premium eksklusif selama 1 bulan penuh.
                  </p>
                </div>

                {/* Receipt Details */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Paket Langganan</span>
                    <span className="font-black text-slate-900">Space+ (1 Bulan)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Harga Dasar</span>
                    <span className="font-bold text-slate-800">Rp 12.000</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Biaya Admin (QRIS/E-Wallet)</span>
                    <span className="font-bold text-slate-800">Rp 1.000</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 border-dashed flex justify-between items-center">
                    <span className="font-black text-slate-900">Total Tagihan</span>
                    <span className="text-lg font-black text-indigo-600">Rp 13.000</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-800">Pilih Metode Pembayaran</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'qris', name: 'QRIS', desc: 'Semua E-Wallet' },
                      { id: 'gopay', name: 'GoPay', desc: 'Instan' },
                      { id: 'spay', name: 'ShopeePay', desc: 'Instan' },
                      { id: 'va', name: 'Virtual Account', desc: 'BCA, Mandiri, BNI' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSpacePlusPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all focus:outline-none ${
                          spacePlusPaymentMethod === method.id 
                            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100' 
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${spacePlusPaymentMethod === method.id ? 'text-indigo-700' : 'text-slate-700'}`}>{method.name}</span>
                          {spacePlusPaymentMethod === method.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 block">{method.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleConfirmSpacePlus}
                  disabled={spacePlusSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-none shadow-md flex justify-center items-center gap-2"
                >
                  {spacePlusSubmitting ? (
                    'Memproses Pembayaran...'
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Bayar Rp 13.000 Sekarang
                    </>
                  )}
                </button>
                <p className="text-[9px] text-center text-slate-400 mt-2">Transaksi aman dengan enkripsi 256-bit SSL.</p>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
