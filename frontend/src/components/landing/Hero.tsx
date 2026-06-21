import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, HelpCircle, CheckCircle, Sparkles, Building, ShoppingBag, Radio } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

const TYPEWRITER_PHRASES = [
  'Semua yang kamu butuhkan.',
  'Marketplace Mahasiswa.',
  'Pencarian Kos Nyaman.',
  'Denah Kampus Interaktif.',
  'Forum Komunitas Terverifikasi.'
];

export default function Hero({ onGetStarted, onLearnMore }: HeroProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fullPhrase = TYPEWRITER_PHRASES[currentPhraseIndex];

    const handleType = () => {
      if (!isDeleting) {
        // Typing characters
        setCurrentText(fullPhrase.substring(0, currentText.length + 1));

        if (currentText === fullPhrase) {
          // Pause before deleting
          setTypingSpeed(2000); // 2 seconds pause
          setIsDeleting(true);
        } else {
          setTypingSpeed(60); // fast typing
        }
      } else {
        // Deleting characters
        setCurrentText(fullPhrase.substring(0, currentText.length - 1));

        if (currentText === '') {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
          setTypingSpeed(300); // minor pause before typing next
        } else {
          setTypingSpeed(30); // fast deleting
        }
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex, typingSpeed]);

  return (
    <div className="relative isolate overflow-hidden bg-[#f8fafc] z-10 px-4 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center flex flex-col items-center">

        {/* Dynamic Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-bold text-(--color-signal-blue) mb-5"
        >
          <Sparkles className="w-3.5 h-3.5 text-(--color-signal-blue) animate-pulse" />
          <span>Platform Digital Terpadu Universitas Pamulang</span>
        </motion.div>

        {/* Big Stamped Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6 }}
          className="text-4xl tracking-tight text-(--color-midnight-harbor) sm:text-5xl md:text-8xl"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}
        >
          UNPAM SPACE
        </motion.h1>

        {/* Typewriter subheader bar */}
        <h2 className="mt-3 min-h-[30px] sm:min-h-[40px] text-lg sm:text-2xl font-extrabold text-(--color-signal-blue) tracking-tight flex items-center justify-center gap-1">
          <span>{currentText}</span>
          <span className="w-1.5 h-5 sm:h-7 bg-(--color-signal-blue) opacity-50 animate-[ping_1s_infinite] ml-0.5" />
        </h2>

        {/* Description body */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-(--color-slate-channel)"
        >
          Temukan event kampus, marketplace mahasiswa, pencarian kos, denah kampus, barang temuan, dan komunitas dalam satu ekosistem digital terintegrasi.
        </motion.p>

        {/* CTA Button Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto font-sans"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto rounded-lg bg-(--color-signal-blue) px-6 py-3 text-sm font-bold text-white shadow-sm hover:shadow hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            id="hero-primary-cta"
          >
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLearnMore}
            className="w-full sm:w-auto rounded-lg border border-(--color-sea-fog) bg-white px-6 py-3 text-sm font-bold text-(--color-midnight-harbor) hover:bg-slate-50 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1"
            id="hero-secondary-cta"
          >
            Pelajari Lebih Lanjut
          </button>
        </motion.div>

        {/* Quick Trust statistics bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 w-full max-w-3xl border-t border-(--color-sea-fog) pt-8 grid grid-cols-3 gap-4"
        >
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-3xl font-extrabold text-(--color-midnight-harbor) font-mono tracking-tight">5,000+</span>
            <span className="text-[10px] sm:text-xs text-(--color-pale-steel) uppercase font-bold tracking-widest">Mahasiswa Aktif</span>
          </div>
          <div className="flex flex-col items-center border-x border-(--color-sea-fog) px-2">
            <span className="text-xl sm:text-3xl font-extrabold text-(--color-midnight-harbor) font-mono tracking-tight">150+</span>
            <span className="text-[10px] sm:text-xs text-(--color-pale-steel) uppercase font-bold tracking-widest">Kos Terdaftar</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-3xl font-extrabold text-(--color-midnight-harbor) font-mono tracking-tight">1,200+</span>
            <span className="text-[10px] sm:text-xs text-(--color-pale-steel) uppercase font-bold tracking-widest">Umpan Forum</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
