export interface AdminPermissions {
  editTrades: boolean;
  deleteTrades: boolean;
  createTrades: boolean;
  editServices: boolean;
  deleteServices: boolean;
  createServices: boolean;
  editNews: boolean;
  manageUsers: boolean;
  manageChat: boolean;
  ban: boolean;
  mute: boolean;
  kick: boolean;
  viewLogs: boolean;
  manageAds: boolean;
  changeDesign: boolean;
  modifyDb: boolean;
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  status: 'active' | 'muted' | 'banned';
  banReason?: string;
  muteUntil?: string;
  warns: number;
  ipHistory: string[];
  createdAt: string;
  roleBadge?: string;
  roleColor?: string;
  country?: string; // Flag/country of origin (e.g., "🇪🇸 España")
}

export interface AdminCode {
  id: string;
  code: string;
  label: string;
  permissions: AdminPermissions;
  suspended: boolean;
  createdBy?: string;
  roleBadge?: string;
  roleColor?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: 'fruit' | 'sword' | 'accessory' | 'object' | 'other';
  image: string; // URL or Base64 data
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Mythical';
  value: number; // Value in internal trade points or fruit tier
  description?: string;
  quantity?: number;
  status?: string;
  tags?: string;
}

export interface Trade {
  id: string;
  title: string;
  description: string;
  itemsOffered: string[]; // CatalogItem IDs
  itemsWanted: string[]; // CatalogItem IDs
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  rarity: string;
  value: number;
  quantity: number;
  status: 'Available' | 'Reserved' | 'Completed';
  tags: string[];
  category: string; // Game category (e.g. "Blox Fruits")
  isSpecial: boolean;
  isPinned: boolean;
  isHidden: boolean;
  order: number;
  createdAt: string;
}

export interface Service {
  id: string;
  key: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  status: 'available' | 'maintenance' | 'out_of_stock';
  estimatedTime: string;
  category: string; // E.g., "Blox Fruits"
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  username: string;
  discordTag?: string;
  details: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  price: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  userId: string;
  text: string;
  sticker?: string;
  timestamp: string;
  replyTo?: string; // ChatMessage ID
  replyText?: string; // Text snippet of message being replied to
  isPinned: boolean;
  roleBadge?: string; // "Admin" | "Mod" | "Super Admin" | null
  roleColor?: string;
  isStickerOnly?: boolean;
  avatar?: string;
  country?: string;
}

export interface AdBanner {
  image: string;
  link: string;
  enabled: boolean;
}

export interface AdConfiguration {
  top: AdBanner;
  intermediate: AdBanner;
  bottom: AdBanner;
  sidebar: AdBanner;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  author: string;
}

export interface SiteSettings {
  name: string;
  domain: string;
  logo: string;
  banner: string;
  backgroundType: 'dark' | 'gradient' | 'glass';
  primaryColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  animationSpeed: 'slow' | 'normal' | 'fast';
  font: string;
  footerText: string;
  discordUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  policies: string;
  contactEmail: string;
  faqs: FAQ[];
  news: News[];
  chatCleanupMinutes?: number;
  
  // Custom decorations
  musicEnabled?: boolean;
  musicUrl?: string;
  neonGlow?: boolean;
  cardStyle?: 'glass' | 'solid' | 'bordered' | 'futuristic';
  particleEffect?: 'none' | 'stars' | 'snow' | 'fireflies';
  headerStyle?: 'minimal' | 'cyber' | 'gaming';
  catalogCategories?: string[];
  catalogRarities?: string[];
  chatStickers?: string[];
  adminJoinMessage?: string;
  linkItems?: { id: string; title: string; link: string; images: string[] }[];
}

export interface SecurityLog {
  id: string;
  username: string;
  ip: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DBState {
  users: User[];
  adminCodes: AdminCode[];
  catalog: CatalogItem[];
  trades: Trade[];
  services: Service[];
  serviceRequests: ServiceRequest[];
  chatMessages: ChatMessage[];
  adminChatMessages?: ChatMessage[];
  ads: AdConfiguration;
  siteSettings: SiteSettings;
  logs: SecurityLog[];
}
