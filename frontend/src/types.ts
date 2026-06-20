export interface User {
  id: string;
  name: string;
  nim: string;
  email: string;
  jurusan: string;
  semester: number;
  gender: 'pria' | 'wanita';
  isVerified: boolean;
  verificationLevel: 0 | 1 | 2 | 3; // 0: Guest, 1: Basic (NIM), 2: Medium (KTM/KTP), 3: Full (Verification + KTM)
  isPlusSubscriber: boolean;
  plusExpiresAt: string | null;
  avatarIndex: number; // For rendering specific avatar illustration
}

export type EventCategory = 'akademik' | 'organisasi' | 'lomba' | 'sosial' | 'seminar';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  organizer: string;
  posterUrl?: string;
  savedByUsers: string[]; // User IDs who saved this
  shares: number;
}

export type MarketCategory = 'elektronik' | 'buku' | 'peralatan' | 'fashion' | 'lainnya';

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'baru' | 'bekas';
  category: MarketCategory;
  photoIndex: number; // Placeholder image index
  photoUrl?: string; // Optional custom file upload
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerVerLevel: number;
  createdAt: string;
  isBoosted: boolean;
  boostExpiresAt: string | null;
  views: number;
}

export type KosGender = 'putra' | 'putri' | 'campur';

export interface KosProperty {
  id: string;
  title: string;
  address: string;
  priceMonthly: number;
  gender: KosGender;
  facilities: string[]; // AC, WiFi, Dapur, Kasur, Kamar Mandi Dalam
  distanceFromCampus: number; // in kilometers
  photoIndex: number; // Placeholder image index
  photoUrl?: string;
  contactPhone: string;
  reporterName: string;
  reporterVerLevel: number;
  isVerified: boolean;
  isBoosted: boolean;
  views: number;
}

export type LostFoundType = 'hilang' | 'temuan';

export interface LostFoundReport {
  id: string;
  type: LostFoundType;
  title: string;
  description: string;
  location: string;
  date: string;
  photoIndex: number;
  photoUrl?: string;
  reporterName: string;
  contact: string;
  status: 'aktif' | 'klaim_diajukan' | 'selesai';
  createdAt: string;
  claimedBy?: string; // User ID
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export type ForumCategory = 
  | 'cari-teman' 
  | 'mabar' 
  | 'pkm' 
  | 'project' 
  | 'bahas-matkul' 
  | 'cyber-security' 
  | 'cisco-network';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: ForumCategory;
  tags: string[];
  authorId: string;
  authorName: string;
  isAuthorPlus: boolean;
  authorGender: 'pria' | 'wanita';
  upvotes: number;
  upvotedByUsers: string[];
  createdAt: string;
  comments: ForumComment[];
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  isAuthorPlus: boolean;
  content: string;
  createdAt: string;
}

export interface MapRoom {
  id: string;
  name: string;
  floor: number;
  gedung: 'A' | 'B';
  type: 'kelas' | 'laboratorium' | 'toilet' | 'kantin' | 'administrasi' | 'lainnya';
  description: string;
}
