import React from 'react';
import { User } from '../../types';
import { LogOut, Sparkles, LayoutGrid, Award, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';
import { MascotAvatar } from './MascotAvatar';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export default function Navbar({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenProfile
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-(--color-sea-fog) bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo Wordmark */}
        <button
          onClick={() => currentUser ? setActiveTab('main') : setActiveTab('landing')}
          className="flex items-center gap-0 cursor-pointer group focus:outline-none"
          id="nav-logo"
        >
          <Logo size={40} className="group-hover:scale-105 transition-transform duration-200 translate-x-2 " />
          <span className="text-2xl tracking-tight text-(--color-midnight-harbor) transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}>
            NPAM<span className="text-(--color-signal-blue)">SPACE</span>
          </span>
        </button>

        {/* Navigation Content */}
        <div className="flex items-center gap-4 sm:gap-6">
          {currentUser ? (
            <>
              {/* Back to Grid / Main button */}
              {activeTab !== 'main' && (
                <button
                  onClick={() => setActiveTab('main')}
                  className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-(--color-slate-channel) hover:text-(--color-midnight-harbor) cursor-pointer py-1.5 px-3 rounded-full hover:bg-(--color-ice-tint) transition-all"
                  id="nav-beranda"
                  aria-label="Kembali ke Beranda"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-(--color-signal-blue)" />
                  Menu Utama
                </button>
              )}

              {/* Verified Badge Indicators */}
              <div className="hidden sm:flex items-center gap-1.5">
                {currentUser.verificationLevel > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-50" />
                    <span>Terverifikasi Lvl {currentUser.verificationLevel}</span>
                  </div>
                )}
                {currentUser.isPlusSubscriber && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-50" />
                    <span>Space+ Member</span>
                  </div>
                )}
              </div>

              {/* User Avatar Action */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-full hover:bg-(--color-ice-tint) transition-all focus:outline-none text-left"
                id="nav-profile-btn"
                aria-label="Buka profil"
              >
                <div className="relative w-8 h-8 rounded-full bg-(--color-ice-tint) border border-(--color-sea-fog) overflow-hidden flex items-center justify-center">
                  {/* Render gorgeous high fidelity Mascot Avatar representing gender */}
                  <MascotAvatar size={32} gender={currentUser.gender} />
                  {currentUser.isPlusSubscriber && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-xs font-bold text-(--color-midnight-harbor)">{currentUser.name}</span>
                  <span className="text-[10px] text-(--color-slate-channel)">Semester {currentUser.semester}</span>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center justify-center p-2 rounded-full text-red-500 hover:bg-red-50 cursor-pointer transition-all focus:outline-none"
                id="nav-logout-btn"
                title="Keluar"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Public/Landing nav elements */}
              <button
                onClick={() => {
                  const el = document.getElementById('features-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-(--color-slate-channel) hover:text-(--color-midnight-harbor) cursor-pointer transition-colors"
              >
                Fitur Unggulan
              </button>

              <button
                onClick={() => setActiveTab('login')}
                className="text-sm font-semibold text-(--color-midnight-harbor) hover:text-(--color-signal-blue) cursor-pointer transition-colors"
                id="nav-login-link"
              >
                Masuk
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className="rounded-full bg-(--color-signal-blue) px-4 py-2 text-sm font-semibold text-white cursor-pointer shadow-md hover:opacity-90 transition-all hover:scale-103"
                id="nav-signup-btn"
              >
                Daftar Akun
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
