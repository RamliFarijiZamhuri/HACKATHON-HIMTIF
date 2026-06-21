import React, { useState, useEffect } from 'react';
import { ForumCategory, ForumPost, User, ForumComment } from '../../../types';
import { MessageSquare, Heart, Plus, Search, Tag, ArrowLeft, Send, Sparkles, Hash, Users, ThumbsUp, HelpCircle, CheckCircle, Trash2 } from 'lucide-react';
import { MascotAvatar } from '../../layout/MascotAvatar';

interface CommunityPageProps {
  currentUser: User;
  onGoBack: () => void;
}

export default function CommunityPage({ currentUser, onGoBack }: CommunityPageProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<ForumCategory>('cari-teman');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Post Form States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  // Selected thread view state
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(posts[0]);
  const [commentInput, setCommentInput] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const channelCategories: { value: ForumCategory; label: string; desc: string }[] = [
    { value: 'cari-teman', label: 'Cari Teman', desc: 'Obrolan santai, cari teman makan siang atau teman sekre.' },
    { value: 'mabar', label: 'Mabar & Gaming', desc: 'Push rank Mobile Legends, Valorant, atau tanding mabar sore.' },
    { value: 'pkm', label: 'Teman PKM', desc: 'Kolaborasi menyusun proposal Program Kreativitas Mahasiswa.' },
    { value: 'project', label: 'Pencarian Tim Projek', desc: 'Cari partner coding tugas akhir, tugas semester, atau hackathon.' },
    { value: 'bahas-matkul', label: 'Bahas Mata Kuliah', desc: 'Diskusi seputar soal kalkulus, basis data, atau aljabar linier.' },
    { value: 'cyber-security', label: 'Cyber Security', desc: 'Ngobrolin pentest, ctf, write-up kerentanan, bursa bug hounter.' },
    { value: 'cisco-network', label: 'Cisco & IT Infra', desc: 'Routing OSPF, subnetting, subnet mask, configuring router ciscos.' }
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSelectPost = async (post: ForumPost) => {
    setSelectedPost(post);
    setShowCreateForm(false);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${post.id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        // Map backend comments to frontend ForumComment type
        const mappedComments: ForumComment[] = result.data.comments.map((c: any) => ({
          id: c.id,
          postId: post.id,
          authorId: c.user_id,
          authorName: c.users?.nama || 'Anonymous',
          isAuthorPlus: false,
          content: c.konten,
          createdAt: c.created_at
        }));
        
        // Update the post with real comments
        const updatedPost = { ...post, comments: mappedComments };
        setSelectedPost(updatedPost);
        setPosts(posts => posts.map(p => p.id === post.id ? updatedPost : p));
      }
    } catch (err) {
      console.error('Failed to fetch thread details:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum`);
      const result = await response.json();
      if (response.ok && result.success) {
        const likedPostIds = JSON.parse(localStorage.getItem(`liked_posts_${currentUser.id}`) || '[]');

        // Map backend schema to frontend ForumPost type
        const mappedPosts: ForumPost[] = result.data.map((p: any) => ({
          id: p.id,
          title: p.judul,
          content: p.konten,
          category: p.kategori,
          tags: p.tags || [],
          authorId: p.user_id,
          authorName: p.users?.nama || 'Anonymous',
          isAuthorPlus: false, // Update if backend adds this
          authorGender: 'pria',
          upvotes: p.upvotes || 0,
          upvotedByUsers: likedPostIds.includes(p.id) ? [currentUser.id] : [],
          createdAt: p.created_at,
          comments: [] // Would need to fetch comments separately or update backend to include them
        }));
        setPosts(mappedPosts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) {
      triggerToast('Mohon lengkapi judul dan konten tulisan Anda!');
      return;
    }

    const processedTags = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          judul: formTitle,
          konten: formContent,
          kategori: activeCategory,
          tags: processedTags.length > 0 ? processedTags : ['#unpam', '#diskusi']
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        triggerToast('Utas forum baru berhasil dipublikasikan!');
        fetchPosts(); // Refresh posts
        
        setShowCreateForm(false);
        setFormTitle('');
        setFormContent('');
        setFormTags('');
      } else {
        triggerToast(result.message || 'Gagal mempublikasikan post.');
      }
    } catch (err) {
      console.error('Create post error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Yakin ingin menghapus thread forum ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setPosts(posts.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
        triggerToast('Thread berhasil dihapus!');
      } else {
        triggerToast(result.message || 'Gagal menghapus thread.');
      }
    } catch (err) {
      console.error('Delete post error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleUpvote = async (postId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost && targetPost.upvotedByUsers.includes(currentUser.id)) {
      triggerToast('Anda sudah menyukai post ini.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const likedPostIds = JSON.parse(localStorage.getItem(`liked_posts_${currentUser.id}`) || '[]');
        if (!likedPostIds.includes(postId)) {
          likedPostIds.push(postId);
          localStorage.setItem(`liked_posts_${currentUser.id}`, JSON.stringify(likedPostIds));
        }

        setPosts(posts.map(p => {
          if (p.id === postId) {
            const nextUpvoters = [...p.upvotedByUsers, currentUser.id];
            const updatedPost = { 
              ...p, 
              upvotedByUsers: nextUpvoters,
              upvotes: result.data.upvotes
            };

            if (selectedPost?.id === postId) {
              setSelectedPost(updatedPost);
            }
            return updatedPost;
          }
          return p;
        }));
      } else {
        triggerToast(result.message || 'Gagal menyukai post.');
      }
    } catch (err) {
      console.error('Like post error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedPost) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${selectedPost.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ konten: commentInput })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Map the new comment
        const newComment: ForumComment = {
          id: result.data.id,
          postId: selectedPost.id,
          authorId: result.data.user_id,
          authorName: result.data.users?.nama || 'Anonymous',
          isAuthorPlus: false,
          content: result.data.konten,
          createdAt: result.data.created_at
        };

        setPosts(posts.map(p => {
          if (p.id === selectedPost.id) {
            const nextComments = [...(p.comments || []), newComment];
            const updatedPost = { ...p, comments: nextComments };
            setSelectedPost(updatedPost);
            return updatedPost;
          }
          return p;
        }));

        setCommentInput('');
      } else {
        triggerToast(result.message || 'Gagal mengirim komentar.');
      }
    } catch (err) {
      console.error('Comment post error:', err);
      triggerToast('Gagal terhubung ke server.');
    }
  };

  // Sort: premium subscriber posts will be prioritized at top
  const activeTabPosts = posts
    .filter(p => searchQuery.trim() === '' || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isAuthorPlus && !b.isAuthorPlus) return -1;
      if (!a.isAuthorPlus && b.isAuthorPlus) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });


  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      
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

      {/* Head */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-(--color-slate-channel) hover:text-(--color-midnight-harbor) cursor-pointer transition-colors mb-2 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Menu
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-(--color-midnight-harbor) flex items-center gap-2">
            Forum Komunitas
            <span className="text-xs bg-blue-100 text-(--color-signal-blue) font-bold px-2 py-0.5 rounded-full uppercase">Live Community</span>
          </h1>
          <p className="text-sm text-(--color-slate-channel) mt-1">
            Tanyakan, diskusikan, cari teman mabar, info tugas, atau bagikan informasi seputar kampus UNPAM.
          </p>
        </div>
      </div>

      {/* Main Forum Layout Grid - No Left Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-(--color-sea-fog) rounded-2xl overflow-hidden min-h-[600px] shadow-sm">
        
        {/* Left Area: Threads List (5 cols) */}
        <div className="lg:col-span-5 bg-white border-r border-(--color-sea-fog) flex flex-col text-(--color-midnight-harbor)">
          {/* Header area representing bright community feed header */}
          <div className="p-4 bg-slate-50 border-b border-(--color-sea-fog) flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">👋</span>
              <span className="font-extrabold text-sm text-(--color-midnight-harbor) font-sans tracking-wide">
                Semua Kiriman Komunitas
              </span>
            </div>
            {/* Right-aligned clean action icons matching general bright layout */}
            <div className="flex items-center gap-3 text-slate-450">
              <span title="Anggota Komunitas">
                <Users className="w-4 h-4 text-slate-400" />
              </span>
            </div>
          </div>

          {/* Search bar & New Post button */}
          <div className="p-4 bg-white shrink-0 border-b border-slate-100 space-y-3">
            <div className="flex gap-2.5 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari atau buat postingan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-55 pl-9.5 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-(--color-signal-blue) focus:bg-white text-(--color-midnight-harbor) placeholder-slate-400 font-medium transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setSelectedPost(null);
                }}
                className="bg-(--color-signal-blue) hover:opacity-90 text-white flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all select-none focus:outline-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Post</span>
              </button>
            </div>
          </div>

          {/* Post stream scroll area - light styling */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40 max-h-[450px] lg:max-h-[550px]">
            {activeTabPosts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-450 text-xs font-semibold">Belum ada obrolan</p>
                <p className="text-[10px] text-slate-400 mt-1">Jadilah yang pertama menulis di komunitas ini!</p>
              </div>
            ) : (
              activeTabPosts.map((post) => {
                const isSelected = selectedPost?.id === post.id;
                const isUpvoted = post.upvotedByUsers.includes(currentUser.id);
                
                // Realistic relative time based on date
                let displayTime = '12j lalu';
                try {
                  const diffMs = Date.now() - new Date(post.createdAt).getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  if (diffMins < 1) displayTime = 'Baru saja';
                  else if (diffMins < 60) displayTime = `${diffMins}m lalu`;
                  else if (diffMins < 1440) displayTime = `${Math.floor(diffMins / 60)}j lalu`;
                  else displayTime = `${Math.floor(diffMins / 1440)}d lalu`;
                } catch(e) {
                  displayTime = '12j lalu';
                }

                return (
                  <button
                    key={post.id}
                    onClick={() => {
                      handleSelectPost(post);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-xs focus:outline-none ${
                      isSelected 
                        ? 'bg-(--color-ice-tint) border-(--color-signal-blue)' 
                        : 'bg-white border-slate-200/60 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      {/* Top Header: Pin/Mascot representation */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                          <MascotAvatar size={20} gender={post.authorGender} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 tracking-wide font-mono uppercase">
                          {post.authorName.replace(' (Premium)', '')} • POST
                        </span>
                      </div>

                      {/* Title & Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-xs text-(--color-midnight-harbor) leading-snug line-clamp-1">
                          {post.title}
                        </h3>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 font-mono select-none">
                          NEW
                        </span>
                      </div>

                      {/* Content preview */}
                      <div className="mt-2 text-(--color-slate-channel) text-xs font-normal leading-relaxed line-clamp-2">
                        <span>{post.content}</span>
                      </div>
                    </div>

                    {/* Reactions Bar at the bottom of the card */}
                    <div className="mt-4 pt-3 border-t border-slate-105 text-[10px] font-bold text-slate-500 flex items-center justify-between font-mono">
                      <div className="flex items-center gap-3">
                        {/* Reaction Upvote Heart with animation click */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(post.id);
                          }}
                          disabled={isUpvoted}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all focus:outline-none ${
                            isUpvoted 
                              ? 'bg-rose-50 text-rose-600 border border-rose-200 cursor-not-allowed' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isUpvoted ? 'fill-current text-rose-500' : 'text-slate-500'}`} />
                          <span>{post.upvotes}</span>
                        </button>

                        {/* Comments button */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span>{post.comments.length}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[10px] font-normal font-sans">
                          {displayTime}
                        </span>
                        {post.authorId === currentUser.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-all focus:outline-none"
                            title="Hapus thread ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Post Thread Detail OR Create Post Form (7 cols) */}
        <div className="lg:col-span-7 bg-white flex flex-col justify-between">
          
          {/* Case 1: Form creation */}
          {showCreateForm ? (
            <form 
              onSubmit={handleCreatePost} 
              className="p-5 flex flex-col justify-between h-full bg-white text-(--color-midnight-harbor) min-h-[500px]"
            >
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none">✍️</span>
                    <span className="font-extrabold text-sm text-(--color-midnight-harbor) font-sans tracking-wide">
                      Mulai Postingan Baru
                    </span>
                  </div>
                </div>

                {/* Form inputs with close X button mimicking Image 2 */}
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Close button X */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        // Fallback to active post
                        setSelectedPost(posts.length > 0 ? posts[0] : null);
                      }}
                      className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none shrink-0"
                      title="Batal"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        placeholder="Title"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-transparent text-xl font-extrabold text-(--color-midnight-harbor) placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-slate-100 py-1"
                      />
                    </div>
                  </div>

                  {/* Message input */}
                  <div className="flex-1 flex flex-col pt-2">
                    <textarea
                      required
                      rows={8}
                      placeholder="Enter a message..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full flex-1 bg-transparent text-sm text-(--color-slate-channel) placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Optional tags block */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                      # Tags / Kategori Tambahan
                    </label>
                    <input
                      type="text"
                      placeholder="Pisahkan dengan koma, misal: mabar, tugas, partner"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full bg-transparent text-xs text-(--color-midnight-harbor) placeholder-slate-450 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Footer row mimicking Image 2 */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center shrink-0">
                {/* Smiley/emoji button */}
                <button
                  type="button"
                  onClick={() => {
                    const gamingEmojis = ["🎮", "🔥", "🚀", "📢", "💬", "💪"];
                    const randomEmoji = gamingEmojis[Math.floor(Math.random() * gamingEmojis.length)];
                    setFormContent(prev => prev + " " + randomEmoji);
                    triggerToast(`Menambahkan emoji ${randomEmoji}!`);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                  title="Add random emoji"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Post Submit Button with message icon */}
                <button
                  type="submit"
                  className="bg-(--color-signal-blue) hover:opacity-90 text-white flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold transition-all focus:outline-none select-none hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          ) : selectedPost ? (
            /* Case 2: Deep detail viewing */
            <div className="flex flex-col justify-between h-full min-h-[500px] bg-white text-(--color-midnight-harbor)">
              
              {/* Detailed Post Segment */}
              <div className="p-5 border-b border-slate-100 flex-1 overflow-y-auto space-y-4">
                
                {/* Visual highlight inside light container */}
                <div className={`p-4 rounded-xl border ${
                  selectedPost.isAuthorPlus 
                    ? 'bg-amber-50/40 border-amber-200' 
                    : 'bg-slate-50 border-transparent'
                }`}>
                  {/* Subject Header lines */}
                  <div className="flex justify-between items-center text-[10px] font-mono mb-2">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider">
                      Utas Diskusi
                    </span>
                    {selectedPost.isAuthorPlus && (
                      <span className="text-amber-700 font-extrabold flex items-center gap-1 text-[9px] uppercase tracking-wide">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-current" />
                        Space+ Member
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-(--color-midnight-harbor) leading-snug tracking-tight mb-2">
                    {selectedPost.title}
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {selectedPost.content}
                  </p>

                  {/* Render Tags */}
                  <div className="flex flex-wrap gap-1 mt-4">
                    {selectedPost.tags.map((tg, i) => (
                      <span key={i} className="text-[10px] font-bold text-(--color-signal-blue) bg-blue-50 px-2.5 py-0.5 rounded">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Upvotes actions */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <button
                    onClick={() => handleUpvote(selectedPost.id)}
                    disabled={selectedPost.upvotedByUsers.includes(currentUser.id)}
                    className={`flex items-center gap-1.5 border text-xs font-semibold px-3 py-1.5 rounded-full focus:outline-none transition-all ${
                      selectedPost.upvotedByUsers.includes(currentUser.id)
                        ? 'bg-rose-50 border-rose-200 text-rose-600 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 border-transparent text-slate-600 cursor-pointer'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${selectedPost.upvotedByUsers.includes(currentUser.id) ? 'text-rose-500 fill-current' : 'text-slate-500'}`} />
                    <span>Upvote ({selectedPost.upvotes})</span>
                  </button>

                  <span className="text-[10px] font-bold text-slate-400 font-mono select-none">
                    {selectedPost.comments.length} Komentar Balasan
                  </span>
                </div>

                {/* Comments Stream */}
                <div className="space-y-3 max-h-[180px] lg:max-h-[220px] overflow-y-auto">
                  {selectedPost.comments.length === 0 ? (
                    <p className="text-center py-6 text-[10px] text-slate-400 font-semibold font-mono">Belum ada diskusi balasan.</p>
                  ) : (
                    selectedPost.comments.map((com) => (
                      <div key={com.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/70 text-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono mb-1">
                          <span className="text-slate-600">{com.authorName}</span>
                          {com.isAuthorPlus && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-700 font-extrabold px-1 rounded uppercase font-sans">Plus</span>
                          )}
                        </div>
                        <p className="leading-relaxed text-slate-700">
                          {com.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Comments Editor Input bar at bottom */}
              <form onSubmit={handleAddComment} className="p-3 border-t border-slate-150 bg-slate-50 flex gap-2 shrink-0">
                <input
                  type="text"
                  required
                  placeholder={`Ketik komentar balasan ke ${selectedPost.authorName.replace(' (Premium)', '')}...`}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-white px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-(--color-signal-blue) focus:bg-white text-(--color-midnight-harbor) placeholder-slate-400"
                />
                
                <button
                  type="submit"
                  className="bg-(--color-signal-blue) hover:opacity-95 text-white font-bold p-2.5 rounded-lg cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          ) : (
            <div className="p-10 text-center flex flex-col justify-center items-center h-full text-slate-400 bg-white">
              <Users className="w-12 h-12 text-slate-200 mb-2" />
              <p className="text-sm font-bold text-slate-500 mb-1">Pilih Utas Obrolan</p>
              <p className="text-xs text-slate-400">Silakan pilih salah satu dari panel kiri/tengah atau klik tombol tambah untuk membuat posting baru.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
