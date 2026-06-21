import React, { useState, useEffect } from 'react';
import { LostFoundReport, User } from '../../../types';
import { ShieldAlert, Search, Plus, CheckCircle, ArrowLeft, PlusCircle, Check, MessageSquare, AlertCircle, Trash2, X, ImagePlus } from 'lucide-react';


interface LostFoundPageProps {
  currentUser: User;
  onGoBack: () => void;
}

export default function LostFoundPage({ currentUser, onGoBack }: LostFoundPageProps) {
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [activeTab, setActiveTab] = useState<'hilang' | 'temuan'>('hilang');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active chat detail dialog
  const [activeChatReport, setActiveChatReport] = useState<LostFoundReport | null>(null);
  const [chatInputText, setChatInputText] = useState('');

  // Add state form
  const [formType, setFormType] = useState<'hilang' | 'temuan'>('hilang');
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null);
  const formPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const [chatPhoto, setChatPhoto] = useState<File | null>(null);
  const [chatPhotoPreview, setChatPhotoPreview] = useState<string | null>(null);
  const chatPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const handleFormPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Ukuran file maksimal 5MB!');
      return;
    }
    setFormPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChatPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      triggerToast('Ukuran file maksimal 3MB!');
      return;
    }
    setChatPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setChatPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };


  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/temuan`);
      const result = await response.json();
      if (response.ok && result.success) {
        const mappedReports: LostFoundReport[] = result.data.map((r: any) => ({
          id: r.id,
          type: r.type as 'hilang' | 'temuan',
          title: r.title,
          description: r.description,
          location: r.location,
          date: r.created_at ? r.created_at.split('T')[0] : '',
          photoIndex: Math.floor(Math.random() * 4) + 1,
          photoUrl: r.foto_url,
          reporterName: r.users?.nama || 'Anonymous',
          contact: r.contact,
          status: r.status as 'aktif' | 'klaim_diajukan' | 'selesai',
          createdAt: r.created_at,
          chatMessages: []
        }));
        setReports(mappedReports);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLocation || !formDate || !formDesc || !formContact) {
      triggerToast('Mohon lengkapi data barang hilang/temuan!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('type', formType);
      formData.append('title', formTitle);
      formData.append('description', formDesc);
      formData.append('location', formLocation);
      formData.append('contact', formContact);
      if (formPhoto) {
        formData.append('foto', formPhoto);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/temuan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        fetchReports();
        setShowAddModal(false);
        setFormTitle('');
        setFormLocation('');
        setFormDate('');
        setFormDesc('');
        setFormContact('');
        setFormPhoto(null);
        setFormPhotoPreview(null);
        if (formPhotoInputRef.current) formPhotoInputRef.current.value = '';
        triggerToast(`Sukses mendaftarkan laporan barang ${formType === 'hilang' ? 'hilang' : 'ditemukan'}!`);
      } else {
        triggerToast(result.message || 'Gagal menambahkan laporan.');
      }
    } catch (err) {
      console.error('Create report error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus laporan barang ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/temuan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setReports(reports.filter(r => r.id !== id));
        triggerToast('Laporan berhasil dihapus!');
      } else {
        triggerToast(result.message || 'Gagal menghapus laporan.');
      }
    } catch (err) {
      console.error('Delete report error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInputText.trim() && !chatPhotoPreview) || !activeChatReport) return;

    const newMessage: any = {
      id: 'msg_' + Date.now(),
      senderName: currentUser.name,
      text: chatInputText,
      createdAt: new Date().toISOString().substring(11, 16) + ' WIB'
    };
    if (chatPhotoPreview) {
      newMessage.imageUrl = chatPhotoPreview;
    }

    const updatedReports = reports.map(r => {
      if (r.id === activeChatReport.id) {
        const nextMsgs = [...r.chatMessages, newMessage];
        return { ...r, chatMessages: nextMsgs };
      }
      return r;
    });

    setReports(updatedReports);
    // Update local modal state
    setActiveChatReport({
      ...activeChatReport,
      chatMessages: [...activeChatReport.chatMessages, newMessage]
    });
    setChatInputText('');
    setChatPhoto(null);
    setChatPhotoPreview(null);
    if (chatPhotoInputRef.current) chatPhotoInputRef.current.value = '';

    // Trigger mock auto replies
    setTimeout(() => {
      const autoReply = {
        id: 'msg_r_' + Date.now(),
        senderName: activeChatReport.reporterName,
        text: 'Baik bro, makasih responnya. Boleh kita ketemuan di lobby lobi timur Gedung B pas jam makan siang ini? Saya tunggu di kursi deket Lawson ya.',
        createdAt: new Date().toISOString().substring(11, 16) + ' WIB'
      };

      setReports(prev => prev.map(r => {
        if (r.id === activeChatReport.id) {
          return { ...r, chatMessages: [...r.chatMessages, autoReply] };
        }
        return r;
      }));

      setActiveChatReport(prev => prev ? {
        ...prev,
        chatMessages: [...prev.chatMessages, autoReply]
      } : null);

    }, 1500);
  };

  const handleResolveReport = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'selesai' } : r));
    triggerToast('Laporan ditutup. Terima kasih telah membantu sesama mahasiswa!');
    if (activeChatReport?.id === id) {
      setActiveChatReport(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesTab = r.type === activeTab;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Premium Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[9999] bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 rounded-2xl min-w-[320px] max-w-[400px] flex items-start gap-4 animate-toast transition-all">
          <div className="flex-shrink-0 bg-gradient-to-tr from-(--color-signal-blue) to-indigo-400 rounded-full p-2.5 shadow-lg shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="flex-1 pt-0.5">
            <h4 className="text-[13px] font-extrabold text-(--color-midnight-harbor) tracking-wide mb-1">Pemberitahuan Sistem</h4>
            <p className="text-xs font-semibold text-(--color-slate-channel) leading-relaxed">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      {/* Header sections */}
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
            Barang Hilang & Temuan
          </h1>
          <p className="text-sm text-(--color-slate-channel) mt-1">
            Layanan bulletin digital terverifikasi untuk melaporkan kehilangan barang berharga di lingkungan kampus UNPAM.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 rounded-full bg-(--color-signal-blue) text-white px-5 py-3 font-bold text-sm cursor-pointer shadow-md hover:scale-103 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Kirim Laporan Baru
        </button>
      </div>

      {/* Auto-matching Notification Warning strip */}
      <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl mb-8 flex items-start gap-3 text-xs leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
        <div>
          <span className="font-extrabold block text-amber-900 mb-0.5">Sistem Pencocokan Otomatis Aktif (Auto-Match)</span>
          Algoritma cerdas kami memindai semua item laporan secara real-time. Jika Anda menginput laporan kehilangan kunci motor, kami otomatis mereferensikan seluruh laporan temuan sejenis dalam rentang tanggal terkait.
        </div>
      </div>

      {/* Toggles and Search filter row */}
      <div className="bg-(--color-ice-tint) rounded-2xl p-4 mb-8 border border-(--color-sea-fog) flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('hilang')}
            className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
              activeTab === 'hilang'
                ? 'bg-(--color-midnight-harbor) border-(--color-midnight-harbor) text-white'
                : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
            }`}
          >
            📋 Sedang Dicari (Barang Hilang)
          </button>
          <button
            onClick={() => setActiveTab('temuan')}
            className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
              activeTab === 'temuan'
                ? 'bg-(--color-midnight-harbor) border-(--color-midnight-harbor) text-white'
                : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
            }`}
          >
            🔍 Ditemukan Mahasiswa (Temuan)
          </button>
        </div>

        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-slate-channel)" />
          <input
            type="text"
            placeholder="Cari kunci motor, tumbler, ktm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 text-xs rounded-xl border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
          />
        </div>
      </div>

      {/* Reports Render Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-(--color-sea-fog) px-4">
          <p className="text-slate-400 font-bold text-base mb-1">Tidak ada laporan aktif untuk kategori ini</p>
          <p className="text-xs text-slate-400">Silakan daftarkan temuan atau kehilangan barang baru melalui tombol kanan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((item) => {
            const isMine = item.reporterName === currentUser.name;
            const isClosed = item.status === 'selesai';
            
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                  isClosed ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-(--color-sea-fog) hover:border-(--color-signal-blue)'
                }`}
              >
                <div>
                  {item.photoUrl && (
                    <div className="aspect-video bg-slate-100 overflow-hidden rounded-xl mb-3 border border-slate-100">
                      <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-(--color-slate-channel)">
                    <span>📅 Terjadi: {item.date}</span>
                    <span className={`px-2 py-0.5 rounded uppercase font-mono ${
                      isClosed ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-(--color-midnight-harbor) mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-2.5">
                    📍 Area: {item.location}
                  </p>

                  <p className="text-xs text-(--color-slate-channel) leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-(--color-slate-channel)">
                    Pelapor: {item.reporterName}
                  </span>

                  <div className="flex gap-1">
                    {isMine && !isClosed && (
                      <button
                        onClick={() => handleResolveReport(item.id)}
                        className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                      >
                        Tandai Selesai
                      </button>
                    )}

                    {!isClosed && (
                      <button
                        onClick={() => setActiveChatReport(item)}
                        className="py-1.5 px-3 bg-(--color-signal-blue) hover:opacity-95 text-white rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Ruang Chat ({item.chatMessages.length})
                      </button>
                    )}

                    {isMine && (
                      <button
                        onClick={() => handleDeleteReport(item.id)}
                        className="p-1 px-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Chat stream modal */}
      {activeChatReport && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-md shadow-2xl flex flex-col h-[520px] overflow-hidden animate-[zoomIn_0.15s_ease-out]">
            <div className="px-5 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-extrabold text-sm truncate max-w-[250px]">{activeChatReport.title}</h4>
                <p className="text-[10px] text-slate-300">Penemu/Reporter: {activeChatReport.reporterName}</p>
              </div>
              <button
                onClick={() => setActiveChatReport(null)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] leading-relaxed text-amber-900">
                ⚠️ PERINGATAN: Demi keamanan barang Anda, saat COD mintalah pelaku penemu menunjukkan foto KTM atau mintalah menanyakan ciri khas barang spesifik yang tidak dituliskan di dalam deskripsi.
              </div>

              {activeChatReport.chatMessages.length === 0 ? (
                <p className="text-center text-[10px] text-slate-400 py-10">Belum ada obrolan. Kirim chat pertama Anda untuk memulai koordinasi pengembalian barang.</p>
              ) : (
                activeChatReport.chatMessages.map((msg, idx) => {
                  const isMe = msg.senderName === currentUser.name;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-2.5 rounded-xl text-xs max-w-[80%] leading-relaxed ${
                        isMe 
                          ? 'bg-(--color-signal-blue) text-white' 
                          : 'bg-white border border-(--color-sea-fog) text-(--color-midnight-harbor)'
                      }`}>
                        <span className="block font-bold text-[9px] mb-0.5 opacity-75">
                          {msg.senderName}
                        </span>
                        {msg.imageUrl && (
                          <div className="mb-1.5 rounded-lg overflow-hidden border border-slate-100 max-w-full">
                            <img src={msg.imageUrl} alt="Chat attachment" className="max-h-40 object-cover w-full" />
                          </div>
                        )}
                        {msg.text && <span>{msg.text}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-(--color-sea-fog) bg-white shrink-0">
              {chatPhotoPreview && (
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden">
                    <img src={chatPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setChatPhoto(null); setChatPhotoPreview(null); if (chatPhotoInputRef.current) chatPhotoInputRef.current.value = ''; }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Foto terpilih untuk dikirim</span>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => chatPhotoInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-(--color-signal-blue) hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  title="Pilih Gambar"
                >
                  <ImagePlus className="w-4.5 h-4.5" />
                </button>
                <input
                  type="file"
                  ref={chatPhotoInputRef}
                  accept="image/*"
                  onChange={handleChatPhotoSelect}
                  className="hidden"
                />
                <input
                  type="text"
                  placeholder="Diskusikan titik temu COD disini..."
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-(--color-sea-fog) focus:outline-none focus:border-(--color-signal-blue) text-(--color-midnight-harbor)"
                />
                <button type="submit" className="bg-(--color-signal-blue) text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer hover:bg-(--color-signal-blue)/90 transition-colors">
                  Kirim
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Report Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-3xl shadow-2xl overflow-hidden animate-[zoomIn_0.15s_ease-out] flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-(--color-signal-blue)" />
                Form Laporan Kehilangan / Temuan Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="flex flex-col flex-grow overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Jenis Pelaporan
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormType('hilang')}
                          className={`flex-1 py-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            formType === 'hilang'
                              ? 'bg-(--color-midnight-harbor) text-white border-(--color-midnight-harbor)'
                              : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor)'
                          }`}
                        >
                          Saya Kehilangan Barang (Mencari)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormType('temuan')}
                          className={`flex-1 py-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            formType === 'temuan'
                              ? 'bg-(--color-midnight-harbor) text-white border-(--color-midnight-harbor)'
                              : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor)'
                          }`}
                        >
                          Saya Menemukan Barang (Finder)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Nama Barang / Judul Pelaporan
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Kunci Motor Honda Vario Merah"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Deskripsi Barang (Ciri Ciri/Kelengkapan)
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Sebutkan ciri-ciri umum barang (warna casing, gantungan, logo stiker), tetapi SISAKAN beberapa detail spesifik rahasia yang hanya diketahui pemilik untuk proses verifikasi nanti!"
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
                          Estimasi Area Kampus / Lokasi
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Parkiran Gedung B"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Tanggal Kejadian
                        </label>
                        <input
                          type="date"
                          required
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Nomer Kontak Anda (WA / Telepon)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: 0812998877"
                        value={formContact}
                        onChange={(e) => setFormContact(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    {/* Foto Barang */}
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Foto Barang (Opsional)
                      </label>
                      <input
                        type="file"
                        ref={formPhotoInputRef}
                        accept="image/*"
                        onChange={handleFormPhotoSelect}
                        className="hidden"
                      />
                      {formPhotoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-(--color-sea-fog) bg-slate-50">
                          <img src={formPhotoPreview} alt="Preview barang" className="w-full max-h-40 object-contain" />
                          <button
                            type="button"
                            onClick={() => { setFormPhoto(null); setFormPhotoPreview(null); if (formPhotoInputRef.current) formPhotoInputRef.current.value = ''; }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => formPhotoInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-(--color-sea-fog) hover:border-(--color-signal-blue) bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all group"
                        >
                          <ImagePlus className="w-6 h-6 text-(--color-slate-channel) group-hover:text-(--color-signal-blue) transition-colors" />
                          <span className="text-[11px] font-bold text-(--color-slate-channel) group-hover:text-(--color-signal-blue) transition-colors">Klik untuk upload foto barang</span>
                          <span className="text-[9px] text-(--color-pale-steel)">PNG, JPG, WEBP — Maks. 5MB</span>
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
                  Terbitkan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
