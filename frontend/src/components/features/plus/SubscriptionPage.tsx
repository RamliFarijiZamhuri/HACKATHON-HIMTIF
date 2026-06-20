import React, { useState } from 'react';
import { User } from '../../../types';
import { CheckCircle, ArrowLeft, Sparkles, ShieldCheck, Zap, Receipt, Check, CreditCard, ChevronRight, X } from 'lucide-react';

interface SubscriptionPageProps {
  currentUser: User;
  onActivatePlus: () => void;
  onGoBack: () => void;
}

export default function SubscriptionPage({
  currentUser,
  onActivatePlus,
  onGoBack
}: SubscriptionPageProps) {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const priceMonthly = 13000;

  const benefits = [
    { title: 'Badge Premium Eksklusif', desc: 'Dapatkan lambang mahkota bintang premium di semua penampilan profil dan forum Anda.' },
    { title: 'Warna Post Khusus di Forum', desc: 'Tingkatkan keterbacaan utas post Anda di Community dengan border oranye gradien neon yang menyala.' },
    { title: 'Prioritas Atas Otomatis', desc: 'Semua listing kos & barang jualan Anda otomatis ditingkatkan posisinya di puncak teratas (Boosted).' },
    { title: 'Posisi Cari Teman Teratas', desc: 'Profil Anda akan disarankan paling atas pada saat mahasiswa lain mencari teman kolaborasi.' },
    { title: 'Analitik Pelacakan Pengunjung', desc: 'Akses data diagram analitik grafis mengenai jumlah pembaca dan pelamar listing Anda.' }
  ];

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onActivatePlus();
    setShowCheckoutModal(false);
    setToastMessage('Selamat! Member Unpam Space+ Anda berhasil diaktifkan!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-(--color-midnight-harbor) text-white text-sm font-bold py-3.5 px-6 rounded-xl border border-amber-400 shadow-2xl flex items-center gap-2 animate-[slideIn_0.2s_ease-out]">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header back */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-(--color-slate-channel) hover:text-(--color-midnight-harbor) cursor-pointer transition-colors mb-2 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Menu
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-(--color-midnight-harbor) flex items-center gap-2">
            Unpam Space+ Club
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">VIP Member</span>
          </h1>
          <p className="text-sm text-(--color-slate-channel) mt-1">
            Bergabunglah dengan keanggotaan elit Unpam Space+ untuk membuka kustomisasi ekspresi dan memprioritaskan listing bisnis kos & barang Anda.
          </p>
        </div>
      </div>

      {/* High-fidelity Comparison Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
        
        {/* Left Side: Benefits list (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 border border-(--color-sea-fog) shadow-md space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-(--color-slate-channel) uppercase tracking-wide mb-6 pb-2 border-b border-slate-100">
              Kenapa Harus Upgrade ke Space+ ?
            </h3>
            
            <div className="space-y-5">
              {benefits.map((ben, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="p-1 bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-(--color-midnight-harbor)">{ben.title}</h4>
                    <p className="text-xs text-(--color-slate-channel) leading-relaxed mt-0.5">{ben.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-(--color-ice-tint) p-4 rounded-xl text-xs leading-relaxed text-(--color-slate-channel) flex items-start gap-2 border border-blue-100">
            <ShieldCheck className="w-5 h-5 text-(--color-signal-blue) shrink-0 mt-0.5" />
            <span>Keanggotaan berbayar dirancang murni sebagai kustomisasi estetika visual dan analytics visibilitas bisnis — semua akses fitur utama (cari kos, COD, forum) tetap GRATIS selamanya bagi semua civitas akademik.</span>
          </div>
        </div>

        {/* Right Side: Subscription Pitch Receipt & CTA (5 cols) */}
        <div className="lg:col-span-5 bg-(--color-midnight-harbor) text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Decorative glowing backdrops */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400 opacity-20 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-500 opacity-20 blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-1 bg-amber-400/10 text-amber-400 border border-amber-300/30 rounded-full px-3 py-1 text-[11px] font-bold w-fit mb-6">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Membership Elit</span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight mb-2">Unpam Space+</h3>
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm mb-6">
              Hanya seharga satu cangkir es kopi susu per bulan, dukung pengembangan website kampus dan prioritaskan visibilitas reputasi Anda.
            </p>

            {/* Price list panel */}
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 mb-8 font-mono">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xs text-slate-400 font-sans">Biaya Bulanan</span>
                <span className="text-3xl font-black text-amber-400">Rp 13.000<span className="text-xs text-slate-400 font-sans"> /bln</span></span>
              </div>
              <hr className="border-slate-800 my-2" />
              <div className="space-y-1.5 text-[10px] font-semibold text-slate-300 font-sans">
                <p className="flex justify-between"><span>Status Berlangganan:</span> <span className="font-bold text-emerald-400">{currentUser.isPlusSubscriber ? 'Aktif' : 'Belum Berlangganan'}</span></p>
                <p className="flex justify-between"><span>Siklus Pembayaran:</span> <span>30 Hari (Auto-Renewal)</span></p>
                <p className="flex justify-between"><span>Pintu COD & Listing:</span> <span className="text-amber-400">Pucuk Prioritas Otomatis</span></p>
              </div>
            </div>
          </div>

          <div className="relative">
            {currentUser.isPlusSubscriber ? (
              <div className="w-full text-center py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-400/30 rounded-xl font-bold text-xs">
                ✓ Layanan Anda Aktif Menemani Perjalanan Kampus
              </div>
            ) : (
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-4 rounded-xl cursor-pointer text-xs flex justify-center items-center gap-1.5 transition-all shadow-lg hover:shadow-xl hover:scale-103"
              >
                <CreditCard className="w-4 h-4 text-slate-950 fill-slate-950" />
                Gabung Space+ Sekarang
              </button>
            )}

            <p className="text-center text-[10px] text-slate-400 mt-3">
              Pembayaran aman terlindungi. Batalkan langganan kapan saja dari panel profil denda minimal.
            </p>
          </div>

        </div>

      </div>

      {/* Checkout Simulator Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-md shadow-2xl overflow-hidden animate-[zoomIn_0.15s_ease-out]">
            <div className="px-5 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5 font-mono">
                <Receipt className="w-4 h-4 text-(--color-signal-blue)" />
                Kwitansi Tagihan Digital
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5 font-mono text-xs">
              
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2 font-sans">
                  Detail Pelanggan
                </span>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] space-y-1 text-(--color-midnight-harbor) font-sans">
                  <p className="flex justify-between"><span>Nama Mahasiswa:</span> <span className="font-bold">{currentUser.name}</span></p>
                  <p className="flex justify-between"><span>NIM Kuliah:</span> <span className="font-bold">{currentUser.nim}</span></p>
                  <p className="flex justify-between"><span>Program Studi:</span> <span className="font-bold">{currentUser.jurusan}</span></p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2 font-sans">
                  Metode Pembayaran (E-Wallet)
                </span>
                <div className="grid grid-cols-2 gap-2 font-sans font-bold text-slate-700">
                  <div className="p-3.5 border border-(--color-sea-fog) rounded-xl flex items-center justify-between bg-slate-50 relative shrink-0">
                    <span>GoPay / ShopeePay</span>
                    <span className="w-3.5 h-3.5 bg-(--color-signal-blue) rounded-full border border-white flex items-center justify-center text-[7px] text-white">✓</span>
                  </div>
                  <div className="p-3.5 border border-(--color-sea-fog) text-slate-300 rounded-xl flex items-center justify-between opacity-50 shrink-0">
                    <span>Dana / LinkAja</span>
                  </div>
                </div>
              </div>

              <div className="bg-(--color-ice-tint) p-4 rounded-xl border border-blue-50 space-y-2">
                <p className="flex justify-between text-(--color-midnight-harbor)">
                  <span className="font-sans font-semibold">Subtotal bulanan:</span>
                  <span>Rp 13.000</span>
                </p>
                <p className="flex justify-between text-(--color-midnight-harbor)">
                  <span className="font-sans font-semibold">PPN / Pajak (0%):</span>
                  <span>Rp 0</span>
                </p>
                <hr className="border-blue-100" />
                <p className="flex justify-between text-(--color-midnight-harbor) font-black text-sm">
                  <span className="font-sans">Total Tagihan:</span>
                  <span className="text-(--color-signal-blue)">Rp 13.000</span>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 font-sans font-bold">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-3 text-xs border border-(--color-sea-fog) text-(--color-midnight-harbor) rounded-xl hover:bg-slate-50 cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs bg-amber-400 text-slate-900 rounded-xl hover:bg-amber-500 cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-slate-900 fill-slate-900" />
                  Konfirmasi Bayar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
