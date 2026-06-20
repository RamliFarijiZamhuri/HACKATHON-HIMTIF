/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';

// Component imports
import CursorBackground from './components/animations/CursorBackground';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import AuthPage from './components/auth/AuthPage';
import MainSelectionPage from './components/features/main/MainSelectionPage';
import EventPage from './components/features/event/EventPage';
import CampusMapPage from './components/features/map/CampusMapPage';
import MarketplacePage from './components/features/marketplace/MarketplacePage';
import KosFinderPage from './components/features/kos/KosFinderPage';
import LostFoundPage from './components/features/temuan/LostFoundPage';
import CommunityPage from './components/features/community/CommunityPage';
import SubscriptionPage from './components/features/plus/SubscriptionPage';
import ProfileSettingsPage from './components/features/profile/ProfileSettingsPage';

// Lucide icons for Profile Modal
import { Award, Sparkles, LogOut, CheckCircle2, ShieldCheck, X, GraduationCap, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Policy & S&K overlay modal states
  const [policyModalTitle, setPolicyModalTitle] = useState<string | null>(null);
  const [policyModalContent, setPolicyModalContent] = useState<string | null>(null);

  // Profile Drawer details state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load user from localStorage if exists
  useEffect(() => {
    const savedUser = localStorage.getItem('unpam_space_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setCurrentUser(parsed);
        setActiveTab('main'); // auto go to main page if logged in
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('unpam_space_user', JSON.stringify(user));
    setActiveTab('main');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('unpam_space_user');
    setActiveTab('landing');
    setShowProfileModal(false);
  };

  const handleActivatePlus = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      isPlusSubscriber: true,
      plusExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('unpam_space_user', JSON.stringify(updatedUser));
  };

  const handleToggleGender = () => {
    if (!currentUser) return;
    const nextGender = currentUser.gender === 'pria' ? 'wanita' as const : 'pria' as const;
    const updatedUser: User = {
      ...currentUser,
      gender: nextGender
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('unpam_space_user', JSON.stringify(updatedUser));
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Dynamic Cursor follow particle background */}
      {(activeTab === 'landing' || activeTab === 'login' || activeTab === 'register') && (
        <CursorBackground />
      )}

      {/* Navigation Header bar and brand actions */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Primary content area router switcher */}
      <main className="flex-1 z-10">
        {activeTab === 'landing' && (
          <div className="space-y-4">
            <Hero
              onGetStarted={() => currentUser ? setActiveTab('main') : setActiveTab('register')}
              onLearnMore={() => {
                const el = document.getElementById('features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <Features
              onSelectFeature={setActiveTab}
              isLoggedIn={currentUser !== null}
              onOpenAuth={() => setActiveTab('register')}
            />
          </div>
        )}

        {/* Auth routes */}
        {activeTab === 'login' && (
          <AuthPage
            initialMode="login"
            onLoginSuccess={handleLoginSuccess}
            onGoBack={() => setActiveTab('landing')}
          />
        )}

        {activeTab === 'register' && (
          <AuthPage
            initialMode="register"
            onLoginSuccess={handleLoginSuccess}
            onGoBack={() => setActiveTab('landing')}
          />
        )}

        {/* Logged in Grid Main home Menu */}
        {activeTab === 'main' && currentUser && (
          <MainSelectionPage
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />
        )}

        {/* Feature routes */}
        {activeTab === 'event' && currentUser && (
          <EventPage
            currentUser={currentUser}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'map' && currentUser && (
          <CampusMapPage
            currentUser={currentUser}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'marketplace' && currentUser && (
          <MarketplacePage
            currentUser={currentUser}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'kos' && currentUser && (
          <KosFinderPage
            currentUser={currentUser}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'temuan' && currentUser && (
          <LostFoundPage
            currentUser={currentUser}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'community' && currentUser && (
          <CommunityPage
            currentUser={currentUser}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'plus' && currentUser && (
          <SubscriptionPage
            currentUser={currentUser}
            onActivatePlus={handleActivatePlus}
            onGoBack={() => setActiveTab('main')}
          />
        )}

        {activeTab === 'profile' && currentUser && (
          <ProfileSettingsPage
            currentUser={currentUser}
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('unpam_space_user', JSON.stringify(updated));
            }}
            onLogout={handleLogout}
            onGoBack={() => setActiveTab('main')}
          />
        )}
      </main>

      {/* Global standard Footer layout */}
      <Footer
        onOpenPolicy={(title, content) => {
          setPolicyModalTitle(title);
          setPolicyModalContent(content);
        }}
      />

      {/* Overlay Policy Documents Modal */}
      {policyModalTitle && policyModalContent && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-(--color-sea-fog) max-w-md w-full shadow-2xl p-6 relative animate-[zoomIn_0.15s_ease-out]">
            <button
              onClick={() => {
                setPolicyModalTitle(null);
                setPolicyModalContent(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-(--color-midnight-harbor) border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-5 h-5 text-(--color-signal-blue)" />
              {policyModalTitle}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
              {policyModalContent}
            </p>
            <button
              onClick={() => {
                setPolicyModalTitle(null);
                setPolicyModalContent(null);
              }}
              className="w-full mt-6 bg-(--color-midnight-harbor) text-white font-bold py-3 rounded-full cursor-pointer text-xs"
            >
              Saya Mengerti & Setuju
            </button>
          </div>
        </div>
      )}

      {/* Redundant modal removed as settings is now a fully fleshed out dashboard page */}

    </div>
  );
}
