import React, { useState, useEffect, useRef } from 'react';
import { CampusEvent, EventCategory, User } from '../../../types';
import { Calendar, MapPin, Share2, Plus, Clock, Bookmark, Search, CheckCircle, ArrowLeft, Filter, CalendarPlus, X, ImagePlus, Trash2 } from 'lucide-react';

interface EventPageProps {
  currentUser: User;
  onGoBack: () => void;
}

export default function EventPage({
  currentUser,
  onGoBack
}: EventPageProps) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/event`);
      const result = await response.json();
      if (response.ok && result.success) {
        const mappedEvents: CampusEvent[] = result.data.map((e: any) => ({
          id: e.id,
          userId: e.user_id,
          title: e.judul,
          description: e.deskripsi?.replace(/\[Diselenggarakan oleh: .*?\]\n\[Waktu: .*?\]\n\n/, '') || e.deskripsi,
          date: e.tanggal_mulai ? new Date(e.tanggal_mulai).toLocaleDateString() : '-',
          time: e.deskripsi?.match(/\[Waktu: (.*?)\]/)?.[1] || '-',
          location: e.lokasi,
          category: e.kategori,
          organizer: e.deskripsi?.match(/\[Diselenggarakan oleh: (.*?)\]/)?.[1] || e.users?.nama || 'HIMTIF',
          posterUrl: e.poster_url,
          savedByUsers: [],
          shares: 0
        }));
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('seminar');
  const [formPoster, setFormPoster] = useState<File | null>(null);
  const [formPosterPreview, setFormPosterPreview] = useState<string | null>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Ukuran file poster maksimal 5MB!');
      return;
    }
    setFormPoster(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormPosterPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'Semua Event' },
    { value: 'seminar', label: 'Webinar & Seminar' },
    { value: 'lomba', label: 'Lomba & Hackathon' },
    { value: 'sosial', label: 'Sosial & PMI' },
    { value: 'akademik', label: 'Akademik' },
    { value: 'organisasi', label: 'Organisasi Kampus' }
  ];

  const filteredEvents = events.filter((e) => {
    const matchesCat = activeCategory === 'all' || e.category === activeCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.verificationLevel < 3) {
      triggerToast('Gagal: Pembuatan Event memerlukan Autentikasi Pengguna Tingkat 3!');
      return;
    }

    if (!formTitle || !formDesc || !formOrganizer || !formDate || !formTime || !formLocation) {
      triggerToast('Mohon isi semua field!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('judul', formTitle);
      formData.append('deskripsi', `[Diselenggarakan oleh: ${formOrganizer}]\n[Waktu: ${formTime}]\n\n${formDesc}`);
      formData.append('lokasi', formLocation);
      formData.append('tanggal_mulai', formDate);
      formData.append('kategori', formCategory);
      if (formPoster) {
        formData.append('poster', formPoster);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        fetchEvents();
        setFormTitle('');
        setFormDesc('');
        setFormOrganizer('');
        setFormDate('');
        setFormTime('');
        setFormLocation('');
        setFormPosterPreview(null);
        setFormPoster(null);
        setShowAddModal(false);
        triggerToast('Sukses mempublikasikan event kampus baru!');
      } else {
        triggerToast(result.message || 'Gagal mempublikasikan event.');
      }
    } catch (err) {
      console.error('Create event error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleSaveEvent = (eventId: string) => {
    if (!currentUser) return;
    setEvents(prev => prev.map((evt) => {
      if (evt.id === eventId) {
        const isSaved = evt.savedByUsers.includes(currentUser.id);
        const nextSaved = isSaved
          ? evt.savedByUsers.filter((uid) => uid !== currentUser.id)
          : [...evt.savedByUsers, currentUser.id];
        return { ...evt, savedByUsers: nextSaved };
      }
      return evt;
    }));
  };

  const handleShare = (id: string, title: string) => {
    navigator.clipboard?.writeText?.(`${window.location.origin}/event/${id}`);
    triggerToast(`Tautan event "${title.substring(0, 20)}..." disalin ke clipboard!`);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus event ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/event/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setEvents(prev => prev.filter(e => e.id !== id));
        triggerToast('Event berhasil dihapus!');
      } else {
        triggerToast(result.message || 'Gagal menghapus event.');
      }
    } catch (err) {
      console.error('Delete event error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

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

      {/* Header section with back link */}
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
            Event & Kegiatan Kampus
          </h1>
          <p className="text-sm text-(--color-slate-channel) mt-1">
            Temukan seminar, kompetisi, dan program pemberdayaan mahasiswa Universitas Pamulang.
          </p>
        </div>

        {/* Action triggers */}
        <button
          onClick={() => {
            if (currentUser.verificationLevel < 3) {
              triggerToast('Pembuatan Event memerlukan Autentikasi Organisasi Resmi!');
            } else {
              setShowAddModal(true);
            }
          }}
          className="flex items-center justify-center gap-1.5 rounded-full bg-(--color-signal-blue) text-white px-5 py-3 font-bold text-sm cursor-pointer shadow-md hover:scale-103 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Publikasikan Kegiatan
        </button>
      </div>

      {/* Filters / Search Bar Row */}
      <div className="bg-(--color-ice-tint) rounded-2xl p-4 mb-8 border border-(--color-sea-fog) flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-slate-channel)" />
          <input
            type="text"
            placeholder="Cari seminar, workshop, penyelenggara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 text-sm rounded-full border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
          />
        </div>

        {/* Categorized filter scrolls */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full cursor-pointer border transition-all ${activeCategory === cat.value
                ? 'bg-(--color-signal-blue) border-(--color-signal-blue) text-white shadow-sm'
                : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Listings Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-(--color-sea-fog) px-4">
          <p className="text-slate-400 font-bold text-lg mb-1">Event tidak ditemukan</p>
          <p className="text-sm text-slate-400">Silakan ubah filter kategori atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
          {filteredEvents.map((evt) => {
            const isSaved = evt.savedByUsers.includes(currentUser.id);
            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl flex flex-col justify-between border border-(--color-sea-fog) hover:border-(--color-signal-blue) shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Poster Image */}
                {evt.posterUrl && (
                  <div className="aspect-video bg-slate-100 overflow-hidden rounded-t-2xl">
                    <img src={evt.posterUrl} alt={evt.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Upper Details */}
                <div className="p-6">
                  {/* Category Pill and Share */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-(--color-ice-tint) text-(--color-signal-blue) px-2.5 py-1 rounded-full">
                      {evt.category === 'seminar' && 'Webinar / Seminar'}
                      {evt.category === 'lomba' && 'Kompetisi / Lomba'}
                      {evt.category === 'sosial' && 'Sosial & Philanthropy'}
                      {evt.category === 'akademik' && 'Akademik Kampus'}
                      {evt.category === 'organisasi' && 'Akreditasi Organisasi'}
                    </span>
                    <button
                      onClick={() => handleShare(evt.id, evt.title)}
                      className="p-1 px-2.5 hover:bg-(--color-ice-tint) rounded-full text-(--color-slate-channel) hover:text-(--color-signal-blue) cursor-pointer flex items-center gap-1 text-[11px] font-bold focus:outline-none"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Bagikan
                    </button>
                  </div>

                  {/* Title & Organizer Info */}
                  <h3 className="text-xl font-bold text-(--color-midnight-harbor) tracking-tight mb-2 hover:text-(--color-signal-blue) transition-colors">
                    {evt.title}
                  </h3>
                  <p className="text-xs font-semibold text-(--color-pale-steel) uppercase tracking-wide mb-4">
                    Diselenggarakan oleh: <span className="text-(--color-midnight-harbor)">{evt.organizer}</span>
                  </p>

                  <p className="text-sm text-(--color-slate-channel) leading-relaxed mb-6">
                    {evt.description}
                  </p>

                  {/* Date, Time, Venue parameters */}
                  <div className="space-y-2.5 border-t border-slate-50 pt-4 text-xs font-semibold text-(--color-slate-channel)">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-(--color-signal-blue)" />
                      <span>{evt.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-(--color-signal-blue)" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-(--color-signal-blue)" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>
                </div>

                {/* Footer bookmark action */}
                <div className="bg-(--color-ice-tint) border-t border-(--color-sea-fog) px-6 py-4 rounded-b-2xl flex items-center justify-between">
                  <span className="text-[11px] font-bold text-(--color-slate-channel) font-mono">
                    {evt.savedByUsers.length} Mahasiswa Menyimpan
                  </span>

                  <div className="flex items-center gap-2">
                    {evt.userId === currentUser.id && (
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-all cursor-pointer focus:outline-none"
                        title="Hapus event ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleSaveEvent(evt.id);
                        const isSaved = evt.savedByUsers.includes(currentUser.id);
                        triggerToast(isSaved ? 'Berhasil menghapus event dari kalender Anda' : 'Sukses menyimpan event ke kalender Anda!');
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${isSaved
                        ? 'bg-(--color-midnight-harbor) border-(--color-midnight-harbor) text-white'
                        : 'bg-white border-(--color-sea-fog) text-(--color-midnight-harbor) hover:bg-slate-50'
                        }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? 'Tersimpan' : 'Gabung Event'}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-(--color-sea-fog) w-full max-w-3xl shadow-2xl overflow-hidden animate-[zoomIn_0.15s_ease-out] flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-(--color-midnight-harbor) text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <CalendarPlus className="w-5 h-5 text-(--color-signal-blue)" />
                Form Publikasi Event Kampus
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="flex flex-col flex-grow overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Nama Event / Judul Kegiatan
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Seminar Hackathon Web 2026"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Penyelenggara / Unit Organisasi
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: HIMA TI UNPAM"
                        value={formOrganizer}
                        onChange={(e) => setFormOrganizer(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Kategori Kegiatan
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      >
                        <option value="seminar">Seminar / Webinar</option>
                        <option value="lomba">Kompetisi / Lomba</option>
                        <option value="sosial">Bakti Sosial / PMI</option>
                        <option value="akademik">Akademik Kampus</option>
                        <option value="organisasi">Kegiatan Organisasi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Deskripsi Lengkap Event
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Deskripsikan agenda kegiatan, manfaat, narasumber, dan ketentuan SKPI lainnya..."
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
                          Tanggal Kegiatan
                        </label>
                        <input
                          type="date"
                          required
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                          Waktu Kegiatan
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: 08:00 - 12:00 WIB"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Lokasi / Ruangan Kampus
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Aula Lantai 8 Gedung B (Darsono) UNPAM"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full bg-white px-3.5 py-2.5 text-sm rounded-lg border border-(--color-sea-fog) focus:border-(--color-signal-blue) focus:outline-none text-(--color-midnight-harbor)"
                      />
                    </div>

                    {/* Upload Poster */}
                    <div>
                      <label className="block text-xs font-bold text-(--color-midnight-harbor) uppercase tracking-wide mb-1">
                        Upload Poster Kegiatan
                      </label>
                      <input
                        type="file"
                        ref={posterInputRef}
                        accept="image/*"
                        onChange={handlePosterSelect}
                        className="hidden"
                      />
                      {formPosterPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-(--color-sea-fog) bg-slate-50">
                          <img src={formPosterPreview} alt="Preview poster" className="w-full max-h-40 object-contain" />
                          <button
                            type="button"
                            onClick={() => { setFormPoster(null); setFormPosterPreview(null); if (posterInputRef.current) posterInputRef.current.value = ''; }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => posterInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-(--color-sea-fog) hover:border-(--color-signal-blue) bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all group"
                        >
                          <ImagePlus className="w-6 h-6 text-(--color-slate-channel) group-hover:text-(--color-signal-blue) transition-colors" />
                          <span className="text-[11px] font-bold text-(--color-slate-channel) group-hover:text-(--color-signal-blue) transition-colors">Klik untuk upload poster event</span>
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
                  Terbitkan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
