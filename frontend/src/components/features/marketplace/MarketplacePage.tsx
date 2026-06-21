import React, { useState, useEffect, useRef } from 'react';
import { MarketCategory, MarketItem, User } from '../../../types';
import { ShoppingBag, Search, Plus, CheckCircle, ArrowLeft, Tag, Phone, MessageSquare, PlusCircle, Trash2, X, Eye, Sparkles, ImagePlus } from 'lucide-react';

interface MarketplacePageProps {
  currentUser: User;
  onGoBack: () => void;
}

export default function MarketplacePage({ currentUser, onGoBack }: MarketplacePageProps) {
  const [products, setProducts] = useState<MarketItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deal simulation states
  const [dealProduct, setDealProduct] = useState<MarketItem | null>(null);
  const [simulatedMessage, setSimulatedMessage] = useState('');
  const [simulatedChatHistory, setSimulatedChatHistory] = useState<{ sender: 'user' | 'seller'; text: string }[]>([]);

  // Add Item States
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCondition, setFormCondition] = useState<'baru' | 'bekas'>('bekas');
  const [formCategory, setFormCategory] = useState<MarketCategory>('buku');
  const [formPhone, setFormPhone] = useState('');
  const [formPhotos, setFormPhotos] = useState<File[]>([]);
  const [formPhotoPreviews, setFormPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (formPhotos.length + files.length > 5) {
      triggerToast('Maksimal 5 foto barang!');
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

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'buku', label: 'Buku & Modul' },
    { value: 'elektronik', label: 'Elektronik' },
    { value: 'peralatan', label: 'Peralatan Kuliah' },
    { value: 'fashion', label: 'Fashion / Jas' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/marketplace`);
      const result = await response.json();
      if (response.ok && result.success) {
        const mappedProducts: MarketItem[] = result.data.map((p: any) => ({
          id: p.id,
          title: p.judul,
          description: p.deskripsi,
          price: p.harga,
          condition: p.kondisi,
          category: p.kategori,
          photoIndex: Math.floor(Math.random() * 4) + 1, // Using placeholder logic for photoIndex
          photoUrl: p.foto_urls && p.foto_urls.length > 0 ? p.foto_urls[0] : undefined,
          sellerId: p.user_id,
          sellerName: p.users?.nama || 'Unknown Seller',
          sellerPhone: '0812XXXXXX', // Update backend if it stores phone number later
          sellerVerLevel: p.users?.verification_level || 2,
          createdAt: p.created_at,
          isBoosted: p.status === 'boosted',
          boostExpiresAt: null,
          views: 1
        }));
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.verificationLevel < 2) {
      triggerToast('Gagal: Akun harus Terverifikasi Tingkat 2 (KTM) untuk berjualan!');
      return;
    }

    if (!formTitle || !formDesc || !formPrice) {
      triggerToast('Mohon isi semua data penawaran!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // We will use FormData since backend expects 'foto' via multer, but for now we might send no file or handle it as JSON if we don't upload image
      // To simplify, let's just use FormData so backend accepts it properly.
      const formData = new FormData();
      formData.append('judul', formTitle);
      formData.append('deskripsi', formDesc);
      formData.append('harga', formPrice.toString());
      formData.append('kondisi', formCondition);
      formData.append('kategori', formCategory);
      // Append selected photos
      formPhotos.forEach(file => {
        formData.append('foto', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/marketplace`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        triggerToast(
          currentUser.isPlusSubscriber 
            ? 'Sukses! Listing terpublikasikan dan otomatis di-BOOST (Benefit Space+)' 
            : 'Penawaran barang berhasil di-listing!'
        );
        fetchProducts(); // Refresh list

        setShowAddModal(false);
        setFormTitle('');
        setFormDesc('');
        setFormPrice('');
        setFormPhotos([]);
        setFormPhotoPreviews([]);
      } else {
        triggerToast(result.message || 'Gagal mempublikasikan listing.');
      }
    } catch (err) {
      console.error('Create listing error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus listing ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/marketplace/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setProducts(products.filter(p => p.id !== id));
        triggerToast('Listing berhasil dihapus!');
      } else {
        triggerToast(result.message || 'Gagal menghapus listing.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleBoostListing = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, isBoosted: true, views: p.views + 25 } : p));
    triggerToast('Listing diprioritaskan di pucuk teratas!');
  };

  const openDealDialog = (product: MarketItem) => {
    setDealProduct(product);
    setSimulatedChatHistory([
      { sender: 'seller', text: `Halo! Saya ${product.sellerName}. Benar, barang "${product.title}" masih ada dan bisa kita COD langsung pas istirahat jam kelas di lobby utama. Ada yang ingin ditanyakan?` }
    ]);
  };

  const handleSendSimMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedMessage.trim()) return;
    
    const nextChat = [
      ...simulatedChatHistory,
      { sender: 'user' as const, text: simulatedMessage }
    ];
    setSimulatedChatHistory(nextChat);
    setSimulatedMessage('');

    // Simulated reply after delay
    setTimeout(() => {
      setSimulatedChatHistory(prev => [
        ...prev,
        { sender: 'seller', text: 'Siap bro, sepakat harganya. Boleh tolong kabari saya via Whatsapp di nomor ' + dealProduct?.sellerPhone + ' biar kita atur ketemuan pas jam ganti kelas ya!' }
      ]);
    }, 1200);
  };

  // Format currency
  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Sorted product list: Boosted listings go first
  const sortedProducts = [...products].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const filteredProducts = sortedProducts.filter((p) => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
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

      {/* Header with back navigation */}
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
            Marketplace COD Kampus
          </h1>
          <p className="text-sm text-(--color-slate-channel) mt-1">
            Jual beli perlengkapan kuliah, jas almamater, buku kuliah bekas sesama mahasiswa UNPAM secara aman melalui metode COD.
          </p>
        </div>

        <button
          onClick={() => {
            if (currentUser.verificationLevel < 2) {
              triggerToast('Untuk berjualan Anda wajib mengupload bukti KTM (Terverifikasi Lvl 2)!');
            } else {
              setShowAddModal(true);
            }
          }}
          className="flex items-center justify-center gap-1.5 rounded-full bg-(--color-signal-blue) text-white px-5 py-3 font-bold text-sm cursor-pointer shadow-md hover:scale-103 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Mulai Menjual Barang
        </button>
      </div>

      {/* Search and Category Select */}
      <div className="bg-(--color-ice-tint) rounded-2xl p-4 mb-8 border border-(--color-sea-fog) flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-slate-channel)" />
          <input
            type="text"
            placeholder="Cari buku, laptop asus, almamater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 text-sm rounded-full border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
          />
        </div>

        {/* Categories scroll row */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full cursor-pointer border transition-all ${
                activeCategory === cat.value
                  ? 'bg-(--color-signal-blue) border-(--color-signal-blue) text-white shadow-sm'
                  : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-(--color-sea-fog) px-4">
          <p className="text-slate-400 font-bold text-lg mb-1">Belum ada listing aktif</p>
          <p className="text-sm text-slate-400">Silakan ganti kategori atau daftarkan penawaran barang pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((p) => {
            const isMine = p.sellerId === currentUser.id;
            return (
              <div
                key={p.id}
                className={`relative bg-white rounded-2xl border flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
                  p.isBoosted 
                    ? 'border-amber-300 ring-2 ring-amber-100' 
                    : 'border-(--color-sea-fog) hover:border-(--color-signal-blue)'
                }`}
              >
                {/* Image layout / photo */}
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative p-4 border-b border-slate-100 overflow-hidden">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.title} className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <div className="text-center">
                      <ShoppingBag className="w-8 h-8 text-(--color-slate-channel) mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] uppercase font-bold text-(--color-slate-channel)">{p.category} product</span>
                    </div>
                  )}

                  {/* Absolute badgers */}
                  <span className={`absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    p.condition === 'baru' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {p.condition}
                  </span>

                  {p.isBoosted && (
                    <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-950 fill-current" />
                      Priority
                    </span>
                  )}
                </div>

                {/* Details text area */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-lg font-black text-(--color-midnight-harbor) tracking-tight block">
                      {formatRupiah(p.price)}
                    </span>
                    <h3 className="text-sm font-bold text-(--color-midnight-harbor) line-clamp-1 mt-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-(--color-slate-channel) line-clamp-2 mt-1.5 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Metadata bottom rows */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-(--color-slate-channel)">
                    <div>
                      <span className="block font-bold text-(--color-midnight-harbor) truncate max-w-[100px]">
                        Seller: {p.sellerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{p.views + (p.isBoosted ? 12 : 0)} views</span>
                    </div>
                  </div>
                </div>

                {/* Control Actions footer bar */}
                <div className="bg-(--color-ice-tint) px-4 py-3 border-t border-(--color-sea-fog) flex items-center gap-1.5">
                  {isMine ? (
                    <>
                      <button
                        onClick={() => handleDeleteListing(p.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl cursor-pointer flex-1 text-center font-bold text-xs flex justify-center items-center gap-1 transition-all"
                        title="Hapus listing barang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>

                      {!p.isBoosted && (
                        <button
                          onClick={() => handleBoostListing(p.id)}
                          className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl cursor-pointer flex-1 text-center font-bold text-xs flex justify-center items-center gap-1 transition-all"
                          title="Sewa boost listing"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          Boost
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => openDealDialog(p)}
                      className="w-full bg-(--color-signal-blue) hover:opacity-95 text-white py-2 px-3 rounded-xl cursor-pointer text-center font-bold text-xs flex items-center justify-center gap-1 transition-all focus:outline-none"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Hubungi & COD
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* simulated direct deal chat modal */}
      {dealProduct && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-md shadow-2xl flex flex-col h-[500px] overflow-hidden animate-[zoomIn_0.15s_ease-out]">
            {/* Header info */}
            <div className="px-5 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-bold text-sm block">COD Deal Terminal</h4>
                <p className="text-[10px] text-slate-300">Menegosiasikan: {dealProduct.title}</p>
              </div>
              <button
                onClick={() => setDealProduct(null)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat list messages area scrollable */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
              {simulatedChatHistory.map((chat, idx) => {
                const isMe = chat.sender === 'user';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                      isMe 
                        ? 'bg-(--color-signal-blue) text-white rounded-tr-none' 
                        : 'bg-white border border-(--color-sea-fog) text-(--color-midnight-harbor) rounded-tl-none'
                    }`}>
                      <span className="block font-black text-[9px] mb-0.5 uppercase tracking-wide opacity-75">
                        {isMe ? 'Kamu (Pembeli)' : `${dealProduct.sellerName} (Penjual)`}
                      </span>
                      {chat.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input dialog */}
            <form onSubmit={handleSendSimMessage} className="p-3 border-t border-(--color-sea-fog) bg-white shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Tulis pesan negosiasi COD..."
                value={simulatedMessage}
                onChange={(e) => setSimulatedMessage(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
              />
              <button
                type="submit"
                className="bg-(--color-signal-blue) text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Kirim
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Listing Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-3xl shadow-2xl overflow-hidden animate-[zoomIn_0.15s_ease-out] flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-(--color-signal-blue)" />
                Form Pasang Listing Barang Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="flex flex-col flex-grow overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Nama Barang / Judul Listing
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Jas Almamater UNPAM size XL"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Harga Jual (IDR Rupiah)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="Misal: 100000"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Kategori Barang
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as MarketCategory)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        >
                          <option value="buku">Buku & Modul Kuliah</option>
                          <option value="elektronik">Peralatan Elektronik</option>
                          <option value="peralatan">Peralatan Tulis & Seminar</option>
                          <option value="fashion">Fashion & Almamater</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Deskripsi Barang (Keterangan Minus/Kelebihan)
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Deskripsikan kondisi barang secara sejujur-jujurnya agar transaksi aman. Sertakan info tempat biasa Anda kelar kelas untuk COD di kampus..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Kondisi Barang
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormCondition('bekas')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                              formCondition === 'bekas'
                                ? 'bg-(--color-midnight-harbor) text-white border-(--color-midnight-harbor)'
                                : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor)'
                            }`}
                          >
                            Bekas
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCondition('baru')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                              formCondition === 'baru'
                                ? 'bg-(--color-midnight-harbor) text-white border-(--color-midnight-harbor)'
                                : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor)'
                            }`}
                          >
                            Baru
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Nomer WhatsApp
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: 0812998877"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                    </div>

                    {/* Upload Foto Barang */}
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Upload Foto Barang (Maks. 5)
                      </label>
                      <input
                        type="file"
                        ref={photoInputRef}
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      {formPhotoPreviews.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap max-h-24 overflow-y-auto border border-slate-100 p-1 rounded-lg">
                          {formPhotoPreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--color-sea-fog) bg-slate-50">
                              <img src={preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhoto(idx)}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full cursor-pointer transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {formPhotoPreviews.length < 5 && (
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-(--color-sea-fog) hover:border-(--color-signal-blue) bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all group"
                        >
                          <ImagePlus className="w-6 h-6 text-(--color-slate-channel) group-hover:text-(--color-signal-blue) transition-colors" />
                          <span className="text-[11px] font-bold text-(--color-slate-channel) group-hover:text-(--color-signal-blue) transition-colors">Klik untuk upload foto</span>
                          <span className="text-[9px] text-(--color-pale-steel)">PNG, JPG, WEBP — Maks. 5MB per foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 font-semibold shrink-0">
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
                  Daftarkan Barang (COD)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
