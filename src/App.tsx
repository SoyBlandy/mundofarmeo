import React, { useState, useEffect } from "react";
import { 
  SiteSettings, Service, CatalogItem, Trade, ChatMessage, User as DBUser, AdminCode, FAQ, News, AdConfiguration 
} from "./types";
import { 
  Compass, ShieldCheck, Gamepad2, Coins, User as UserIcon, LogOut, Code, AlertCircle, 
  ChevronRight, Heart, ExternalLink, Mail, MessageSquare, Newspaper, Lock, Sparkles, Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Import custom sub-components
import AdBanners from "./components/AdBanners";
import NewsAndFaqs from "./components/NewsAndFaqs";
import ServicesShop from "./components/ServicesShop";
import TradeSystem from "./components/TradeSystem";
import GlobalChat from "./components/GlobalChat";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Navigation tabs: "inicio" | "servicios" | "trade" | "chat" | "news_faqs"
  const [activeTab, setActiveTab] = useState<"inicio" | "servicios" | "trade" | "chat" | "news_faqs">("inicio");

  // Dynamic state loaded from Express Backend
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [ads, setAds] = useState<AdConfiguration | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // User Auth session state
  const [currentUser, setCurrentUser] = useState<DBUser | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminCode | null>(null);

  // Authentication Drawer/Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState("");

  // Creator/Admin Code input Modal
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false);
  const [enteredAdminCode, setEnteredAdminCode] = useState("");
  const [adminCodeError, setAdminCodeError] = useState("");

  // Floating Admin Panel Dock (visible if currentAdmin logged in)
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Load everything on mount
  const loadPlatformData = async () => {
    try {
      // 1. Fetch settings and ads
      const sRes = await fetch("/api/settings");
      const sData = await sRes.json();
      if (sRes.ok) {
        setSiteSettings(sData.siteSettings);
        setAds(sData.ads);
      }

      // 2. Fetch services
      const servRes = await fetch("/api/services");
      const servData = await servRes.json();
      if (servRes.ok) setServices(servData.services || []);

      // 3. Fetch catalog
      const catRes = await fetch("/api/catalog");
      const catData = await catRes.json();
      if (catRes.ok) setCatalog(catData.catalog || []);

      // 4. Fetch active trades
      const tRes = await fetch("/api/trades");
      const tData = await tRes.json();
      if (tRes.ok) setTrades(tData.trades || []);

      // 5. Fetch chat
      const chatRes = await fetch("/api/chat");
      const chatData = await chatRes.json();
      if (chatRes.ok) setChatMessages(chatData.messages || []);
    } catch (e) {
      console.error("Error fetching platform data:", e);
    }
  };

  useEffect(() => {
    loadPlatformData();

    // Recover sessions from LocalStorage if present
    const cachedUser = localStorage.getItem("mundofarmeo_user");
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem("mundofarmeo_user");
      }
    }

    const cachedAdmin = localStorage.getItem("mundofarmeo_admin");
    if (cachedAdmin) {
      try {
        const adminObj = JSON.parse(cachedAdmin);
        setCurrentAdmin(adminObj);
        setIsAdminPanelOpen(true); // Automatically slide out inspector
      } catch (e) {
        localStorage.removeItem("mundofarmeo_admin");
      }
    }
  }, []);

  // Sync fonts dynamically
  useEffect(() => {
    if (!siteSettings) return;
    const fontMapping: Record<string, string> = {
      "Inter": "'Inter', sans-serif",
      "Space Grotesk": "'Space Grotesk', sans-serif",
      "JetBrains Mono": "'JetBrains Mono', monospace"
    };
    const activeFontFamily = fontMapping[siteSettings.font] || "'Inter', sans-serif";
    document.body.style.fontFamily = activeFontFamily;
  }, [siteSettings]);

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim()) {
      setAuthError("Por favor escribe tu nombre de usuario.");
      return;
    }

    setAuthError("");
    const url = isRegisterMode ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error.");
      }

      // Save session
      setCurrentUser(data.user);
      localStorage.setItem("mundofarmeo_user", JSON.stringify(data.user));
      setShowAuthModal(false);
      setAuthUsername("");
      loadPlatformData();
    } catch (err: any) {
      setAuthError(err.message || "Error al autenticar.");
    }
  };

  // Creator / Admin Code verification
  const handleVerifyAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredAdminCode.trim()) {
      setAdminCodeError("Por favor introduce un código.");
      return;
    }

    setAdminCodeError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enteredAdminCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Código inválido.");
      }

      // Success
      setCurrentAdmin(data.admin);
      localStorage.setItem("mundofarmeo_admin", JSON.stringify(data.admin));
      setShowAdminCodeModal(false);
      setEnteredAdminCode("");
      setIsAdminPanelOpen(true); // Automatically slide out docked inspector panel on the right!
      loadPlatformData();
    } catch (err: any) {
      setAdminCodeError(err.message || "Código inválido o suspendido.");
    }
  };

  // Logouts
  const handleLogoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem("mundofarmeo_user");
    loadPlatformData();
  };

  const handleLogoutAdmin = () => {
    setCurrentAdmin(null);
    setIsAdminPanelOpen(false);
    localStorage.removeItem("mundofarmeo_admin");
    loadPlatformData();
  };

  if (!siteSettings || !ads) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center font-sans space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono tracking-widest text-white/40 uppercase">
          Iniciando MundoFarmeo...
        </p>
      </div>
    );
  }

  // Dynamic Theme configurations based on siteSettings
  const primaryColor = siteSettings.primaryColor;
  
  const bgStyles = {
    glass: "bg-[#050505] text-[#f4f4f5]",
    dark: "bg-[#020202] text-[#f4f4f5]",
    gradient: "bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505] text-[#f4f4f5]"
  };

  const buttonRoundness = {
    pill: "rounded-full",
    rounded: "rounded-xl",
    square: "rounded-none"
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-500 overflow-x-hidden ${bgStyles[siteSettings.backgroundType]}`} id="mundofarmeo-root">
      
      {/* Top Banner Advertisement (Global spacing) */}
      <AdBanners ad={ads.top} type="top" />

      {/* Primary Container (Main page structure + docked right Admin Panel if open) */}
      <div className="flex flex-1 w-full relative">
        
        {/* Main Website column */}
        <div className={`flex-1 flex flex-col justify-between transition-all duration-300 ${isAdminPanelOpen ? "mr-0 lg:mr-[380px] xl:mr-[420px]" : "mr-0"}`}>
          
          {/* Main Navigation Header */}
          <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-black/40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("inicio")}>
                <span className="text-2xl animate-bounce">{siteSettings.logo}</span>
                <div>
                  <h1 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-1.5">
                    {siteSettings.name}
                    <span className="text-[9px] font-mono tracking-wider font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase border border-blue-500/25">
                      Blox Fruits
                    </span>
                  </h1>
                  {siteSettings.domain && (
                    <span className="text-[10px] text-white/35 font-mono block">
                      {siteSettings.domain}
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation tabs */}
              <nav className="hidden md:flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("inicio")}
                  className={`px-4 py-2 text-xs font-sans font-medium transition-colors cursor-pointer ${
                    activeTab === "inicio" ? "text-blue-400 bg-white/[0.03] rounded-lg" : "text-white/60 hover:text-white"
                  }`}
                >
                  Inicio
                </button>
                <button
                  onClick={() => setActiveTab("servicios")}
                  className={`px-4 py-2 text-xs font-sans font-medium transition-colors cursor-pointer ${
                    activeTab === "servicios" ? "text-blue-400 bg-white/[0.03] rounded-lg" : "text-white/60 hover:text-white"
                  }`}
                >
                  Servicios de Farmeo
                </button>
                <button
                  onClick={() => setActiveTab("trade")}
                  className={`px-4 py-2 text-xs font-sans font-medium transition-colors cursor-pointer ${
                    activeTab === "trade" ? "text-blue-400 bg-white/[0.03] rounded-lg" : "text-white/60 hover:text-white"
                  }`}
                >
                  Bolsa de Trade
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 text-xs font-sans font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "chat" ? "text-blue-400 bg-white/[0.03] rounded-lg" : "text-white/60 hover:text-white"
                  }`}
                >
                  Chat Global
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </button>
                <button
                  onClick={() => setActiveTab("news_faqs")}
                  className={`px-4 py-2 text-xs font-sans font-medium transition-colors cursor-pointer ${
                    activeTab === "news_faqs" ? "text-blue-400 bg-white/[0.03] rounded-lg" : "text-white/60 hover:text-white"
                  }`}
                >
                  Noticias & FAQ
                </button>
              </nav>

              {/* Auth and Admin buttons */}
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.username}`}
                      alt={currentUser.username}
                      className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="hidden sm:block text-left">
                      <span className="text-xs font-sans font-medium text-white block">
                        {currentUser.username}
                      </span>
                      <span className="text-[9px] font-mono text-white/40 block">
                        Cliente Registrado
                      </span>
                    </div>
                    <button
                      onClick={handleLogoutUser}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsRegisterMode(false);
                      setAuthError("");
                      setShowAuthModal(true);
                    }}
                    style={{ borderColor: `${primaryColor}30` }}
                    className={`px-4 py-2 bg-blue-600/10 border text-blue-400 text-xs font-sans font-medium ${buttonRoundness[siteSettings.buttonStyle]} hover:bg-blue-600 hover:text-white transition-all cursor-pointer`}
                  >
                    Ingresar
                  </button>
                )}

                {/* Floating/inline code indicator */}
                {currentAdmin ? (
                  <button
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    className="p-2 bg-blue-600 text-white rounded-lg transition-all hover:bg-blue-500 cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Sliders className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAdminCodeError("");
                      setShowAdminCodeModal(true);
                    }}
                    className="p-2 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Ingresar Código de Creador / Admin"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </header>

          {/* Core Content Body (Switches depending on activeTab) */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: INICIO (HERO & INTRO) */}
              {activeTab === "inicio" && (
                <motion.div
                  key="inicio-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-12"
                >
                  {/* Hero Container */}
                  <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-16 md:py-24 text-center overflow-hidden">
                    {/* Glowing mesh background circle */}
                    <div 
                      style={{ background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 60%)` }}
                      className="absolute top-10 left-1/2 transform -translate-x-1/2 w-[600px] h-[400px] blur-3xl pointer-events-none -z-10" 
                    />

                    <div className="space-y-6 max-w-3xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-xs text-white/70 font-sans backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Servicios Exclusivos de Blox Fruits</span>
                        <ChevronRight className="w-3 h-3 text-white/30" />
                      </div>

                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
                        Eleva tu cuenta al nivel máximo en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">MundoFarmeo</span>
                      </h2>

                      <p className="text-sm sm:text-base text-white/60 leading-relaxed font-sans max-w-2xl mx-auto">
                        Sube de nivel, junta millones de Beli, completa Raids de despertar y realiza intercambios de frutas con el catálogo verificado de forma premium y discreta.
                      </p>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <button
                          onClick={() => setActiveTab("servicios")}
                          className={`px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-sans font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20 cursor-pointer ${buttonRoundness[siteSettings.buttonStyle]}`}
                        >
                          Comenzar Servicios
                        </button>
                        <button
                          onClick={() => setActiveTab("trade")}
                          className={`px-8 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-sans font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${buttonRoundness[siteSettings.buttonStyle]}`}
                        >
                          Ver Bolsa de Trade
                        </button>
                      </div>
                    </div>

                    {/* Massive Banner Image */}
                    {siteSettings.banner && (
                      <div className="mt-12 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group h-[280px] sm:h-[400px]">
                        <img
                          src={siteSettings.banner}
                          alt="Blox Fruits MundoFarmeo Showcase Banner"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
                      </div>
                    )}
                  </div>

                  {/* Dynamic High-Fidelity Stats Counter Ticker */}
                  <div className="max-w-7xl mx-auto px-4 py-8 border-y border-white/5 bg-white/[0.01]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div className="space-y-1">
                        <span className="text-3xl font-mono font-bold text-white block tracking-tight">
                          18,940+
                        </span>
                        <span className="text-[11px] font-sans text-white/40 uppercase tracking-wider block">
                          Trades Completados
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-3xl font-mono font-bold text-blue-400 block tracking-tight">
                          5,240+
                        </span>
                        <span className="text-[11px] font-sans text-white/40 uppercase tracking-wider block">
                          Clientes Satisfechos
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-3xl font-mono font-bold text-white block tracking-tight">
                          99.9%
                        </span>
                        <span className="text-[11px] font-sans text-white/40 uppercase tracking-wider block">
                          Tasa de Éxito & Seguridad
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-3xl font-mono font-bold text-emerald-400 block tracking-tight">
                          24/7
                        </span>
                        <span className="text-[11px] font-sans text-white/40 uppercase tracking-wider block">
                          Soporte en Discord
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Intermedio Ad Banner spacing */}
                  <AdBanners ad={ads.intermediate} type="intermediate" />

                  {/* Recent news snippets row for Inicio page */}
                  <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-blue-400" />
                        Noticias Recientes
                      </h3>
                      <button onClick={() => setActiveTab("news_faqs")} className="text-xs text-blue-400 hover:underline">Ver Todo →</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {siteSettings.news.slice(0, 2).map((item) => (
                        <div key={item.id} className="glass-panel p-6 rounded-xl border border-white/5 space-y-3">
                          <span className="text-[10px] text-white/30 font-mono block">{item.date}</span>
                          <h4 className="text-md font-display font-semibold text-white">{item.title}</h4>
                          <p className="text-xs text-white/60 font-sans leading-relaxed line-clamp-3">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: SERVICIOS SHOP */}
              {activeTab === "servicios" && (
                <motion.div
                  key="servicios-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ServicesShop 
                    services={services} 
                    currentUser={currentUser} 
                    onOpenAuth={() => {
                      setIsRegisterMode(false);
                      setShowAuthModal(true);
                    }} 
                  />
                </motion.div>
              )}

              {/* TAB 3: TRADES SECTION */}
              {activeTab === "trade" && (
                <motion.div
                  key="trade-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TradeSystem 
                    trades={trades} 
                    catalog={catalog} 
                    currentUser={currentUser} 
                    currentAdmin={currentAdmin} 
                    onOpenAuth={() => {
                      setIsRegisterMode(false);
                      setShowAuthModal(true);
                    }} 
                    onRefreshTrades={loadPlatformData} 
                  />
                </motion.div>
              )}

              {/* TAB 4: DISCORD-LIKE CHAT */}
              {activeTab === "chat" && (
                <motion.div
                  key="chat-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlobalChat 
                    messages={chatMessages} 
                    currentUser={currentUser} 
                    currentAdmin={currentAdmin} 
                    onOpenAuth={() => {
                      setIsRegisterMode(false);
                      setShowAuthModal(true);
                    }} 
                    onRefreshChat={loadPlatformData} 
                    chatCleanupMinutes={siteSettings.chatCleanupMinutes}
                  />
                </motion.div>
              )}

              {/* TAB 5: NEWS & FAQS GENERAL */}
              {activeTab === "news_faqs" && (
                <motion.div
                  key="news-faqs-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <NewsAndFaqs news={siteSettings.news} faqs={siteSettings.faqs} />
                </motion.div>
              )}

            </AnimatePresence>
          </main>

          {/* Bottom Ad Banner spacing */}
          <AdBanners ad={ads.bottom} type="bottom" />

          {/* Site Footer */}
          <footer className="border-t border-white/5 bg-black/60 py-10 mt-12 text-xs text-white/40">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="space-y-3">
                <span className="text-white font-display font-semibold text-sm block">
                  {siteSettings.logo} {siteSettings.name}
                </span>
                <p className="leading-relaxed font-sans">
                  {siteSettings.footerText}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-white font-sans font-semibold text-sm block">Enlaces de Contacto</span>
                <p className="flex items-center gap-1.5 font-sans">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Soporte: {siteSettings.contactEmail}
                </p>
                <p className="flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Discord Oficial: <a href={siteSettings.discordUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">Unirte <ExternalLink className="w-3 h-3" /></a>
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-white font-sans font-semibold text-sm block">Políticas del Sitio</span>
                <p className="leading-relaxed text-[11px] whitespace-pre-line font-sans">
                  {siteSettings.policies}
                </p>
              </div>

            </div>
          </footer>

        </div>

        {/* 9. SLIDE-OUT DOCKED ADMIN INSPECTOR (Docked completely to the right) */}
        <AnimatePresence>
          {isAdminPanelOpen && currentAdmin && (
            <motion.aside
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] xl:w-[420px] bg-zinc-950 border-l border-white/10 z-50 shadow-2xl flex flex-col justify-between"
              id="admin-slide-panel"
            >
              <div className="p-4 border-b border-white/10 bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="text-sm font-display font-bold text-white tracking-tight">MundoFarmeo Inspector</h3>
                    <span className="text-[10px] text-white/40 block font-mono">Rol: {currentAdmin.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogoutAdmin}
                    className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[10px] font-sans font-medium transition-colors cursor-pointer"
                    title="Cerrar Panel"
                  >
                    Salir Mod
                  </button>
                  <button
                    onClick={() => setIsAdminPanelOpen(false)}
                    className="text-white/40 hover:text-white transition-colors cursor-pointer text-lg p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Render stateful panel */}
              <div className="flex-1 overflow-hidden">
                <AdminPanel
                  siteSettings={siteSettings}
                  ads={ads}
                  services={services}
                  catalog={catalog}
                  trades={trades}
                  currentAdmin={currentAdmin}
                  onRefreshAll={loadPlatformData}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* Auth modal drawer */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 md:p-8 space-y-5 relative shadow-2xl"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">
                  {isRegisterMode ? "Únete" : "Bienvenido"}
                </span>
                <h3 className="text-xl font-display font-semibold text-white">
                  {isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión"}
                </h3>
                <p className="text-xs text-white/50">
                  {isRegisterMode ? "Crea una cuenta rápida para publicar trades." : "Ingresa para chatear y solicitar trades."}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-white/60 font-medium">Nombre de Usuario</label>
                  <input
                    type="text"
                    placeholder="Ej: blandyGamer"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    required
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-sans font-medium rounded-full hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  {isRegisterMode ? "Crear Cuenta" : "Entrar"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setIsRegisterMode(!isRegisterMode);
                    }}
                    className="text-xs text-blue-400 hover:underline cursor-pointer"
                  >
                    {isRegisterMode ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate gratis"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creator code login modal */}
      <AnimatePresence>
        {showAdminCodeModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 md:p-8 space-y-5 relative shadow-2xl"
            >
              <button
                onClick={() => setShowAdminCodeModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">
                  Acceso Especial
                </span>
                <h3 className="text-xl font-display font-semibold text-white">
                  Código de Creador / Admin
                </h3>
                <p className="text-xs text-white/50">
                  Introduce tu código de creador para habilitar el Inspector del sitio.
                </p>
              </div>

              <form onSubmit={handleVerifyAdminCode} className="space-y-4">
                {adminCodeError && (
                  <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{adminCodeError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-white/60 font-medium">Código Secreto</label>
                  <input
                    type="password"
                    placeholder="Escribe tu código..."
                    value={enteredAdminCode}
                    onChange={(e) => setEnteredAdminCode(e.target.value)}
                    required
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-sans font-medium rounded-full hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  Verificar Código
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Admin Dock Toggle Shortcut (rendered if admin is authenticated but panel closed) */}
      {currentAdmin && !isAdminPanelOpen && (
        <button
          onClick={() => setIsAdminPanelOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all z-40 animate-bounce cursor-pointer border border-white/10"
          title="Abrir Panel de Administración"
        >
          <Sliders className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}
