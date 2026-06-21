import React, { useState, useEffect, useRef } from 'react';
import { KosGender, KosProperty, User } from '../../../types';
import { Home, Search, Plus, CheckCircle, ArrowLeft, PlusCircle, Check, Eye, Trash2, X, Sparkles, Filter, ShieldAlert, Heart, ImagePlus } from 'lucide-react';

interface KosFinderPageProps {
  currentUser: User;
  onGoBack: () => void;
}

export default function KosFinderPage({ currentUser, onGoBack }: KosFinderPageProps) {
  const [kosList, setKosList] = useState<KosProperty[]>([]);
  const [activeGender, setActiveGender] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comparison list
  const [compareList, setCompareList] = useState<KosProperty[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Add Kos States
  const [formTitle, setFormTitle] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formGender, setFormGender] = useState<KosGender>('putra');
  const [formDist, setFormDist] = useState<number>(0.5);
  const [wifiChecked, setWifiChecked] = useState(true);
  const [acChecked, setAcChecked] = useState(false);
  const [wcChecked, setWcChecked] = useState(true);
  const [formPhone, setFormPhone] = useState('');
  const [formPhotos, setFormPhotos] = useState<File[]>([]);
  const [formPhotoPreviews, setFormPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (formPhotos.length + files.length > 10) {
      triggerToast('Maksimal 10 foto kos!');
      return;
    }
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      triggerToast('Beberapa foto melebihi batas 5MB dan dilewati.');
    }
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setFormPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    setFormPhotos(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setFormPhotos(prev => prev.filter((_, i) => i !== index));
    setFormPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchKosList();
  }, []);

  const fetchKosList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kos`);
      const result = await response.json();
      if (response.ok && result.success) {
        const mappedKos: KosProperty[] = result.data.map((k: any) => ({
          id: k.id,
          title: k.nama_kos,
          address: k.alamat,
          priceMonthly: Number(String(k.harga_bulanan).replace(/\D/g, '')) || 0,
          gender: k.gender,
          facilities: k.fasilitas || [],
          distanceFromCampus: k.jarak_kampus,
          photoIndex: Math.floor(Math.random() * 4) + 1,
          photoUrl: k.foto_urls && k.foto_urls.length > 0 ? k.foto_urls[0] : undefined,
          contactPhone: k.kontak,
          reporterName: k.users?.nama || 'Unknown Reporter',
          reporterVerLevel: k.users?.verification_level || 3,
          isVerified: true,
          isBoosted: k.status === 'boosted',
          views: 1
        }));
        setKosList(mappedKos);
      }
    } catch (err) {
      console.error('Failed to fetch kos:', err);
    }
  };

  const handleCreateKos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.verificationLevel < 3) {
      triggerToast('Gagal: Registrasi Listing Kos memerlukan level Verifikasi 3 (KTM + Akun Lengkap)!');
      return;
    }

    if (!formTitle || !formAddress || !formPrice) {
      triggerToast('Mohon isi semua data kos-kosan!');
      return;
    }

    const compiledFacilities = ['WiFi', 'Kasur'];
    if (acChecked) compiledFacilities.push('AC');
    if (wcChecked) compiledFacilities.push('Kamar Mandi Dalam');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nama_kos', formTitle);
      formData.append('alamat', formAddress);
      formData.append('harga_bulanan', formPrice.toString());
      formData.append('gender', formGender);
      formData.append('jarak_kampus', formDist.toString());
      formData.append('kontak', formPhone);
      formData.append('fasilitas', JSON.stringify(compiledFacilities));

      // Append selected photos
      formPhotos.forEach(file => {
        formData.append('foto', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/kos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        triggerToast('Sukses mendaftarkan kos terverifikasi baru!');
        fetchKosList();
        setShowAddModal(false);
        setFormTitle('');
        setFormAddress('');
        setFormPrice('');
        setFormPhotos([]);
        setFormPhotoPreviews([]);
      } else {
        triggerToast(result.message || 'Gagal menambahkan kos.');
      }
    } catch (err) {
      console.error('Create kos error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleDeleteKos = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus listing kos ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setKosList(kosList.filter(k => k.id !== id));
        triggerToast('Listing kos berhasil dihapus!');
      } else {
        triggerToast(result.message || 'Gagal menghapus listing kos.');
      }
    } catch (err) {
      console.error('Delete kos error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(f => f !== id));
      triggerToast('Terhapus dari kos disimpan');
    } else {
      setFavorites([...favorites, id]);
      triggerToast('Berhasil disimpan ke kos favorit Anda!');
    }
  };

  const handleAddToCompare = (kos: KosProperty) => {
    if (compareList.find(c => c.id === kos.id)) {
      setCompareList(compareList.filter(c => c.id !== kos.id));
      return;
    }

    if (compareList.length >= 3) {
      triggerToast('Batas limit: Maksimal perbandingan adalah 3 kos sekaligus!');
      return;
    }

    setCompareList([...compareList, kos]);
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID') + '/bln';
  };

  const sortedKos = [...kosList].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return b.views - a.views;
  });

  const filteredKos = sortedKos.filter((k) => {
    const matchesGender = activeGender === 'all' || k.gender === activeGender;
    const parsedKosPrice = parseInt(String(k.priceMonthly), 10) || 0;
    const parsedMaxPrice = parseInt(String(maxPrice), 10) || 0;
    const matchesPrice = parsedKosPrice <= parsedMaxPrice;
    
    const matchesSearch = k.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          k.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGender && matchesPrice && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-(--color-midnight-harbor) text-white text-sm font-bold py-3.5 px-6 rounded-xl border border-blue-400/30 shadow-2xl flex items-center gap-2 animate-[slideIn_0.2s_ease-out]">
          <CheckCircle className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section with back navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-(--color-slate-channel) hover:text-(--color-midnight-harbor) cursor-pointer transition-colors mb-2 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Menu
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-(--color-midnight-harbor)">
            Pencarian Kos Terdekat
          </h1>
          <p className="text-sm text-(--color-slate-channel) mt-1">
            Direktori indekos dekat lingkungan Universitas Pamulang yang di-list oleh sesama mahasiswa untuk kenyamanan bersama.
          </p>
        </div>

        <button
          onClick={() => {
            if (currentUser.verificationLevel < 3) {
              triggerToast('Penginputan listing kos memerlukan Autentikasi Mahasiswa Lvl 3!');
            } else {
              setShowAddModal(true);
            }
          }}
          className="flex items-center justify-center gap-1.5 rounded-full bg-(--color-signal-blue) text-white px-5 py-3 font-bold text-sm cursor-pointer shadow-md hover:scale-103 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Info Kos
        </button>
      </div>

      {/* Side-by-Side Comparison Box Drawer if compareList has elements */}
      {compareList.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-8 animate-[slideIn_0.25s_ease-out]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-100">
            <div>
              <h3 className="font-extrabold text-sm text-(--color-midnight-harbor) flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-(--color-signal-blue) fill-current animate-spin" />
                Bandingkan Kos-Kosan ({compareList.length}/3 Terpilih)
              </h3>
              <p className="text-[11px] text-(--color-slate-channel)">Garis perbandingan spesifikasi akomodasi secara berdampingan.</p>
            </div>
            <button
              onClick={() => setCompareList([])}
              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer focus:outline-none"
            >
              Bersihkan Bandingkan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {compareList.map((kos) => (
              <div key={kos.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative">
                <button
                  onClick={() => setCompareList(compareList.filter(c => c.id !== kos.id))}
                  className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-red-500 rounded-full cursor-pointer hover:bg-slate-50 focus:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] uppercase font-bold text-(--color-signal-blue) block mb-1">
                  Aturan: {kos.gender}
                </span>
                <h4 className="font-extrabold text-xs text-(--color-midnight-harbor) line-clamp-1 mb-1">{kos.title}</h4>
                <p className="font-black text-xs text-emerald-600 mb-2">{formatRupiah(kos.priceMonthly)}</p>
                
                <div className="space-y-1.5 text-[11px] font-semibold text-(--color-slate-channel) pt-2 border-t border-slate-50">
                  <p>📍 Jarak: <span className="text-slate-800">{kos.distanceFromCampus} KM ke UNPAM</span></p>
                  <p className="leading-relaxed">🔹 Fasilitas: <span className="text-slate-800 font-mono text-[10px] block mt-0.5">{kos.facilities.join(', ')}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Price Range Sizing sliders */}
      <div className="bg-(--color-ice-tint) rounded-2xl p-5 mb-8 border border-(--color-sea-fog) grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Search bar Area */}
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-slate-channel)" />
          <input
            type="text"
            placeholder="Cari jalan kencana, pamulang asri, dekat unpam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 text-sm rounded-xl border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
          />
        </div>

        {/* Gender rule toggler keys */}
        <div className="lg:col-span-4 flex items-center gap-1.5 overflow-x-auto">
          {[
            { value: 'all', label: 'Semu Aturan' },
            { value: 'putra', label: 'Khusus Putra' },
            { value: 'putri', label: 'Khusus Putri' },
            { value: 'campur', label: 'Campur (Keluarga)' }
          ].map(g => (
            <button
              key={g.value}
              onClick={() => setActiveGender(g.value)}
              className={`px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                activeGender === g.value
                  ? 'bg-(--color-signal-blue) border-(--color-signal-blue) text-white'
                  : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Price Slider */}
        <div className="lg:col-span-4 flex items-center gap-3 w-full">
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Batas Tarif</span>
            <span className="text-xs font-bold text-(--color-midnight-harbor)">{formatRupiah(maxPrice)}</span>
          </div>
          <input
            type="range"
            min={500000}
            max={5000000}
            step={50000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="flex-grow accent-blue-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

      </div>

      {/* Kos Listings Grid */}
      {filteredKos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-(--color-sea-fog) px-4">
          <p className="text-slate-400 font-bold text-lg mb-1">Hunian Kos tidak ditemukan</p>
          <p className="text-sm text-slate-400">Silakan perluas jangkauan tarif bulanan atau ubah parameter aturan gender Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredKos.map((kos) => {
            const isMine = kos.reporterName === currentUser.name;
            const isFav = favorites.includes(kos.id);
            const isSelectedToCompare = compareList.some(c => c.id === kos.id);

            return (
              <div
                key={kos.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  kos.isBoosted 
                    ? 'border-amber-300 ring-2 ring-amber-50' 
                    : 'border-(--color-sea-fog) hover:border-(--color-signal-blue)'
                }`}
              >
                {/* Upper block vector and indicators */}
                <div className="aspect-video bg-slate-100 relative overflow-hidden border-b border-slate-50">
                  {kos.photoUrl ? (
                    <img
                      src={kos.photoUrl}
                      alt={kos.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <Home className="w-8 h-8 text-(--color-slate-channel) mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] uppercase font-bold text-(--color-slate-channel)">Sewa Hunian Pelajar</span>
                    </div>
                  )}

                  {/* Absolute tabs */}
                  <span className={`absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                    kos.gender === 'putra' ? 'bg-blue-100 text-blue-800' :
                    kos.gender === 'putri' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    Kos {kos.gender}
                  </span>

                  {kos.isVerified && (
                    <span className="absolute bottom-2.5 left-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />
                      Terverifikasi
                    </span>
                  )}

                  <button
                    onClick={() => toggleFavorite(kos.id)}
                    className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-white text-rose-500 rounded-full cursor-pointer font-bold border border-rose-100 shadow-xs focus:outline-none"
                    title="Simpan Kos"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xl font-black text-emerald-600 block mb-1">
                      {formatRupiah(kos.priceMonthly)}
                    </span>
                    <h3 className="text-base font-bold text-(--color-midnight-harbor)">
                      {kos.title}
                    </h3>
                    <p className="text-xs text-(--color-slate-channel) leading-relaxed mt-1 truncate">
                      📍 {kos.address}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1">
                      {kos.facilities.map((fac, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Distance from campus marker row */}
                  <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-(--color-slate-channel)">
                    <span>Jalan kaki: {kos.distanceFromCampus} KM</span>
                    <span className="text-[10px] text-(--color-pale-steel)">Rujukan: Mahasiswa PA</span>
                  </div>
                </div>

                {/* Bottom comparative and phone call triggers */}
                <div className="bg-(--color-ice-tint) px-5 py-3 border-t border-(--color-sea-fog) flex items-center gap-1.5">
                  <button
                    onClick={() => handleAddToCompare(kos)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all text-center flex justify-center items-center gap-1 ${
                      isSelectedToCompare
                        ? 'bg-(--color-slate-channel) border-(--color-slate-channel) text-white'
                        : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
                    }`}
                  >
                    {isSelectedToCompare ? <Check className="w-3 h-3" /> : null}
                    {isSelectedToCompare ? 'Terpilih' : 'Hubungkan Banding'}
                  </button>

                  <a
                    href={`https://wa.me/${kos.contactPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-(--color-signal-blue) hover:opacity-95 text-white py-2 px-3 rounded-xl cursor-not-allowed text-center font-bold text-xs flex items-center justify-center gap-1.5 focus:outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerToast(`Hubungi pelapor kos "${kos.reporterName}" via WA di: ${kos.contactPhone}`);
                    }}
                  >
                    <span>Hubungi WA</span>
                  </a>

                  {isMine && (
                    <button
                      onClick={() => handleDeleteKos(kos.id)}
                      className="p-2 border border-red-200 text-red-500 rounded-xl cursor-pointer hover:bg-red-50 transition-all focus:outline-none"
                      title="Hapus listing kos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Kos Modal Form Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-3xl shadow-2xl overflow-hidden animate-[zoomIn_0.15s_ease-out] flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-(--color-signal-blue)" />
                Form Pendaftaran Kos Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKos} className="flex flex-col flex-grow overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Nama Indekos / Judul Listing
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Kos Putri Kirana Surya Kencana"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Tarif Bulanan (IDR)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="Misal: 800000"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Aturan Gender Kos
                        </label>
                        <select
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value as KosGender)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        >
                          <option value="putra">Khusus Putra</option>
                          <option value="putri">Khusus Putri</option>
                          <option value="campur">Campur</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1.5">
                        Centang Fasilitas Bawaan Tersedia
                      </label>
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-(--color-midnight-harbor) cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wifiChecked}
                            onChange={(e) => setWifiChecked(e.target.checked)}
                            className="rounded accent-blue-500"
                          />
                          Free WiFi Kenceng
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-(--color-midnight-harbor) cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acChecked}
                            onChange={(e) => setAcChecked(e.target.checked)}
                            className="rounded accent-blue-500"
                          />
                          Tempat tidur AC / Blower
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-(--color-midnight-harbor) cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wcChecked}
                            onChange={(e) => setWcChecked(e.target.checked)}
                            className="rounded accent-blue-500"
                          />
                          Kamar Mandi Di Dalam
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Estimasi Jarak (KM)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          required
                          placeholder="Misal: 0.3"
                          value={formDist}
                          onChange={(e) => setFormDist(Number(e.target.value))}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Kontak WhatsApp
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: 08129933"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Alamat Lengkap Kos
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Jl. Surya Kencana Gg. Melati No. 4, Pamulang Barat"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Foto Kondisi Kos (Maks 10)
                      </label>
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <ImagePlus className="w-4 h-4 text-slate-500" />
                          Pilih Foto
                        </button>
                        <input
                          type="file"
                          ref={photoInputRef}
                          multiple
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <span className="text-[11px] text-slate-400">format JPG/PNG maks 5MB</span>
                      </div>
                      {formPhotoPreviews.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-slate-100 p-1 rounded-lg">
                          {formPhotoPreviews.map((preview, index) => (
                            <div key={index} className="relative w-12 h-12 border border-slate-200 rounded-lg overflow-hidden shrink-0 group">
                              <img src={preview} alt="preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 font-semibold text-xs shrink-0">
                <div className="flex items-center gap-1 text-slate-400 mr-auto max-w-[200px] leading-tight">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Akuntabilitas pelaporan terikat KTM Anda secara hukum.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-(--color-sea-fog) text-xs text-(--color-midnight-harbor) hover:bg-slate-50 cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-(--color-signal-blue) text-white text-xs hover:bg-(--color-signal-blue)/90 cursor-pointer"
                >
                  Terbitkan Info Kos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
