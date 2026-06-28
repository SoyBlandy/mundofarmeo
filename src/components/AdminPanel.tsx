import React, { useState, useEffect } from "react";
import { 
  SiteSettings, Service, ServiceRequest, Trade, CatalogItem, 
  User as DBUser, AdminCode, SecurityLog, AdConfiguration, News, FAQ 
} from "../types";
import { 
  Sliders, Users, ShieldAlert, BarChart3, Database, FileText, 
  Settings, Award, RefreshCw, Trash2, Plus, Edit2, Check, CheckCircle2,
  Lock, Eye, EyeOff, Layout, Globe, Image, Tag, HelpCircle, Key, CheckSquare, X,
  Terminal, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  siteSettings: SiteSettings;
  ads: AdConfiguration;
  services: Service[];
  catalog: CatalogItem[];
  trades: Trade[];
  currentAdmin: AdminCode | null;
  onRefreshAll: () => void;
}

export default function AdminPanel({ 
  siteSettings, ads, services, catalog, trades, currentAdmin, onRefreshAll 
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "services" | "trades" | "ads" | "chat" | "settings" | "logs" | "admins" | "console" | "admin_chat"
  >("dashboard");

  // Site general states
  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [adminCodes, setAdminCodes] = useState<AdminCode[]>([]);
  const [systemLogs, setSystemLogs] = useState<SecurityLog[]>([]);

  // Editing forms state
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingCatalog, setEditingCatalog] = useState<Partial<CatalogItem> | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<News> | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [newAdminCode, setNewAdminCode] = useState<Partial<AdminCode> | null>(null);

  // Moderation form helper
  const [moderationReason, setModerationReason] = useState("");
  const [muteDuration, setMuteDuration] = useState(60);

  // Custom Settings customizers
  const [settingsName, setSettingsName] = useState(siteSettings.name);
  const [settingsDomain, setSettingsDomain] = useState(siteSettings.domain);
  const [settingsLogo, setSettingsLogo] = useState(siteSettings.logo);
  const [settingsBanner, setSettingsBanner] = useState(siteSettings.banner);
  const [settingsPrimaryColor, setSettingsPrimaryColor] = useState(siteSettings.primaryColor);
  const [settingsBackground, setSettingsBackground] = useState(siteSettings.backgroundType);
  const [settingsButtonStyle, setSettingsButtonStyle] = useState(siteSettings.buttonStyle);
  const [settingsAnimSpeed, setSettingsAnimSpeed] = useState(siteSettings.animationSpeed);
  const [settingsFont, setSettingsFont] = useState(siteSettings.font);
  const [settingsFooter, setSettingsFooter] = useState(siteSettings.footerText);
  const [settingsDiscord, setSettingsDiscord] = useState(siteSettings.discordUrl);
  const [settingsYoutube, setSettingsYoutube] = useState(siteSettings.youtubeUrl);
  const [settingsTiktok, setSettingsTiktok] = useState(siteSettings.tiktokUrl);
  const [settingsPolicies, setSettingsPolicies] = useState(siteSettings.policies);
  const [settingsEmail, setSettingsEmail] = useState(siteSettings.contactEmail);
  const [settingsChatCleanup, setSettingsChatCleanup] = useState(siteSettings.chatCleanupMinutes !== undefined ? siteSettings.chatCleanupMinutes : 10);

  // New decorations
  const [settingsMusicEnabled, setSettingsMusicEnabled] = useState(!!siteSettings.musicEnabled);
  const [settingsMusicUrl, setSettingsMusicUrl] = useState(siteSettings.musicUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const [settingsNeonGlow, setSettingsNeonGlow] = useState(siteSettings.neonGlow !== undefined ? !!siteSettings.neonGlow : true);
  const [settingsCardStyle, setSettingsCardStyle] = useState(siteSettings.cardStyle || "glass");
  const [settingsParticleEffect, setSettingsParticleEffect] = useState(siteSettings.particleEffect || "stars");
  const [settingsHeaderStyle, setSettingsHeaderStyle] = useState(siteSettings.headerStyle || "gaming");

  // Advertisements state edits
  const [adTopImg, setAdTopImg] = useState(ads.top.image);
  const [adTopLink, setAdTopLink] = useState(ads.top.link);
  const [adTopEnabled, setAdTopEnabled] = useState(ads.top.enabled);
  const [adIntImg, setAdIntImg] = useState(ads.intermediate.image);
  const [adIntLink, setAdIntLink] = useState(ads.intermediate.link);
  const [adIntEnabled, setAdIntEnabled] = useState(ads.intermediate.enabled);
  const [adBotImg, setAdBotImg] = useState(ads.bottom.image);
  const [adBotLink, setAdBotLink] = useState(ads.bottom.link);
  const [adBotEnabled, setAdBotEnabled] = useState(ads.bottom.enabled);
  const [adSideImg, setAdSideImg] = useState(ads.sidebar.image);
  const [adSideLink, setAdSideLink] = useState(ads.sidebar.link);
  const [adSideEnabled, setAdSideEnabled] = useState(ads.sidebar.enabled);

  // DB Backup Import/Export helper
  const [importedJson, setImportedJson] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Console lock state
  const [consoleUnlocked, setConsoleUnlocked] = useState(false);
  const [consolePasswordInput, setConsolePasswordInput] = useState("");
  const [consolePasswordError, setConsolePasswordError] = useState("");

  // Console state
  const [consoleCommand, setConsoleCommand] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<{ type: "input" | "output" | "error"; text: string; timestamp: string }[]>([
    { type: "output", text: "⌨️ Terminal de Administración de MundoFarmeo iniciada.", timestamp: new Date().toLocaleTimeString() },
    { type: "output", text: "Escribe /ayuda o usa comandos como /mute, /ban, /clear_chat o /announce.", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [executingConsoleCmd, setExecutingConsoleCmd] = useState(false);

  // Admin private chat states
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState("");
  const [isSendingAdminMsg, setIsSendingAdminMsg] = useState(false);

  const authCode = currentAdmin?.code || "";

  // Console Execution Handler
  const handleExecuteConsoleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleCommand.trim()) return;
    const cmd = consoleCommand.trim();
    setConsoleCommand("");

    // Append user input locally
    setConsoleLogs(prev => [...prev, { type: "input", text: cmd, timestamp: new Date().toLocaleTimeString() }]);

    if (cmd.toLowerCase() === "/ayuda") {
      setConsoleLogs(prev => [
        ...prev,
        {
          type: "output",
          text: `Comandos de MundoFarmeo disponibles:
• /mute <usuario> [minutos] - Silencia temporalmente a un usuario.
• /unmute <usuario> - Remueve el silencio de un usuario.
• /ban <usuario> [motivo] - Banea permanentemente a un usuario de MundoFarmeo.
• /unban <usuario> - Remueve el baneo de un usuario.
• /clear_chat - Vacía por completo el chat global.
• /announce <mensaje> - Envía un anuncio fijado al chat global.
• /gift_rank <usuario> <rango> [colorHex] - Otorga rango con color personalizado.
• /give_all <mensaje> - Envía recompensa general al chat global.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    setExecutingConsoleCmd(true);
    try {
      const res = await fetch("/api/admin/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, command: cmd })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al ejecutar el comando.");
      }
      setConsoleLogs(prev => [...prev, { type: "output", text: data.feedback, timestamp: new Date().toLocaleTimeString() }]);
      onRefreshAll(); // Refresh main app state
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, { type: "error", text: `❌ Error: ${err.message}`, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setExecutingConsoleCmd(false);
    }
  };

  // Admin chat post Handler
  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || isSendingAdminMsg) return;
    const msgText = adminChatInput.trim();
    setAdminChatInput("");
    setIsSendingAdminMsg(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, text: msgText })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminChatMessages(data.messages || []);
      } else {
        triggerToast(data.error || "Error al enviar mensaje.", true);
      }
    } catch (err: any) {
      triggerToast(err.message || "Error de red.", true);
    } finally {
      setIsSendingAdminMsg(false);
    }
  };

  // Refresh lists helper
  const fetchAdminLists = async () => {
    if (!currentAdmin) return;
    try {
      // Fetch users
      if (currentAdmin.permissions.manageUsers) {
        const uRes = await fetch(`/api/users?code=${authCode}`);
        const uData = await uRes.json();
        if (uRes.ok) setDbUsers(uData.users || []);

        const cRes = await fetch(`/api/admin/codes?code=${authCode}`);
        const cData = await cRes.json();
        if (cRes.ok) setAdminCodes(cData.codes || []);
      }

      // Fetch service requests
      if (currentAdmin.permissions.editServices) {
        const rRes = await fetch(`/api/services/requests?code=${authCode}`);
        const rData = await rRes.json();
        if (rRes.ok) setServiceRequests(rData.serviceRequests || []);
      }

      // Fetch logs
      if (currentAdmin.permissions.viewLogs) {
        const lRes = await fetch(`/api/logs?code=${authCode}`);
        const lData = await lRes.json();
        if (lRes.ok) setSystemLogs(lData.logs || []);
      }

      // Fetch admin private chat messages
      if (activeTab === "admin_chat") {
        const chatRes = await fetch(`/api/admin/chat?authCode=${authCode}`);
        const chatData = await chatRes.json();
        if (chatRes.ok) {
          setAdminChatMessages(chatData.messages || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminLists();
  }, [currentAdmin, activeTab]);

  const triggerToast = (text: string, isError = false) => {
    if (isError) {
      setErrorMsg(text);
      setSuccessMsg("");
    } else {
      setSuccessMsg(text);
      setErrorMsg("");
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 4500);
  };

  // Tab Save handlers
  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: authCode,
          settings: {
            name: settingsName,
            domain: settingsDomain,
            logo: settingsLogo,
            banner: settingsBanner,
            primaryColor: settingsPrimaryColor,
            backgroundType: settingsBackground,
            buttonStyle: settingsButtonStyle,
            animationSpeed: settingsAnimSpeed,
            font: settingsFont,
            footerText: settingsFooter,
            discordUrl: settingsDiscord,
            youtubeUrl: settingsYoutube,
            tiktokUrl: settingsTiktok,
            policies: settingsPolicies,
            contactEmail: settingsEmail,
            chatCleanupMinutes: Number(settingsChatCleanup),
            musicEnabled: settingsMusicEnabled,
            musicUrl: settingsMusicUrl,
            neonGlow: settingsNeonGlow,
            cardStyle: settingsCardStyle,
            particleEffect: settingsParticleEffect,
            headerStyle: settingsHeaderStyle
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("¡Ajustes y diseño general del sitio guardados con éxito!");
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  const handleSaveAds = async () => {
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authCode,
          ads: {
            top: { image: adTopImg, link: adTopLink, enabled: adTopEnabled },
            intermediate: { image: adIntImg, link: adIntLink, enabled: adIntEnabled },
            bottom: { image: adBotImg, link: adBotLink, enabled: adBotEnabled },
            sidebar: { image: adSideImg, link: adSideLink, enabled: adSideEnabled }
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Anuncios y banners actualizados correctamente.");
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Moderate user action
  const handleModerateUser = async (
    targetUserId: string, 
    actionType: "ban" | "mute" | "warn" | "unban" | "unmute" | "set_rank" | "remove_rank",
    roleBadge?: string,
    roleColor?: string
  ) => {
    try {
      const res = await fetch("/api/users/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authCode,
          targetUserId,
          actionType,
          reason: moderationReason || "Sanción aplicada por administración",
          durationMinutes: muteDuration,
          roleBadge,
          roleColor
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast(`Acción de moderación (${actionType}) completada.`);
      setModerationReason("");
      fetchAdminLists();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Manage Service Item
  const handleSaveService = async () => {
    if (!editingService?.name || !editingService?.price) {
      triggerToast("Faltan campos obligatorios para el servicio.", true);
      return;
    }
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, service: editingService })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Servicio de farmeo registrado/actualizado.");
      setEditingService(null);
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("¿Deseas eliminar este servicio de farmeo?")) return;
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Servicio eliminado con éxito.");
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Manage Catalog Item
  const handleSaveCatalogItem = async () => {
    if (!editingCatalog?.name) {
      triggerToast("Nombre del objeto es obligatorio.", true);
      return;
    }
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, item: editingCatalog })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Objeto guardado en el catálogo oficial.");
      setEditingCatalog(null);
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  const handleDeleteCatalogItem = async (itemId: string) => {
    if (!confirm("¿Deseas eliminar este objeto del catálogo? Esto puede afectar a los trades que lo usen.")) return;
    try {
      const res = await fetch(`/api/catalog/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Objeto eliminado del catálogo.");
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Update Service Request (Order status)
  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const res = await fetch(`/api/services/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Estado del pedido de farmeo actualizado.");
      fetchAdminLists();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Manage News Items
  const handleSaveNewsItem = async () => {
    if (!editingNews?.title || !editingNews?.content) return;
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, newsItem: editingNews })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Noticia guardada.");
      setEditingNews(null);
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  const handleDeleteNewsItem = async (newsId: string) => {
    if (!confirm("¿Eliminar noticia?")) return;
    try {
      const res = await fetch(`/api/news/${newsId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Noticia eliminada.");
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Manage Creator/Admin Codes
  const handleSaveAdminCode = async () => {
    if (!newAdminCode?.code || !newAdminCode?.label) {
      triggerToast("Código y Etiqueta son obligatorios.", true);
      return;
    }
    try {
      const payloadCode = {
        ...newAdminCode,
        permissions: newAdminCode.permissions || {
          editTrades: true,
          deleteTrades: true,
          createTrades: true,
          editServices: true,
          deleteServices: true,
          createServices: true,
          editNews: true,
          manageUsers: false,
          manageChat: true,
          ban: false,
          mute: true,
          kick: true,
          viewLogs: false,
          manageAds: false,
          changeDesign: false,
          modifyDb: false
        }
      };

      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, codeData: payloadCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Código de Creador/Administrador registrado.");
      setNewAdminCode(null);
      fetchAdminLists();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  const handleDeleteAdminCode = async (id: string) => {
    if (!confirm("¿Deseas revocar y eliminar este código de administrador?")) return;
    try {
      const res = await fetch(`/api/admin/codes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("Administrador removido.");
      fetchAdminLists();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  // Critical Database Reset or Backup Import
  const handleResetDatabase = async () => {
    if (!confirm("⚠️ ATENCIÓN: Esta acción borrará todas las cuentas de usuario, solicitudes de servicio, trades activos y restaurará el diseño de fábrica de MundoFarmeo. ¿Estás absolutamente seguro?")) return;
    try {
      const res = await fetch("/api/db/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("¡Base de datos restaurada por completo de fábrica!");
      onRefreshAll();
    } catch (e: any) {
      triggerToast(e.message, true);
    }
  };

  const handleImportDatabase = async () => {
    if (!importedJson.trim()) return;
    try {
      const parsed = JSON.parse(importedJson);
      const res = await fetch("/api/db/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode, importedState: parsed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("¡Copia de seguridad importada con éxito!");
      setImportedJson("");
      onRefreshAll();
    } catch (e: any) {
      triggerToast("Error de análisis JSON o permisos: " + e.message, true);
    }
  };

  const handleDownloadBackup = () => {
    // Generate simple data download
    const fullState = {
      users: dbUsers,
      catalog: catalog,
      trades: trades,
      services: services,
      serviceRequests: serviceRequests,
      siteSettings: siteSettings,
      ads: ads,
      logs: systemLogs,
      adminCodes: adminCodes
    };
    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mundofarmeo_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    triggerToast("Copia de seguridad exportada y descargada.");
  };

  return (
    <div className="h-full flex flex-col justify-between" id="admin-management-view">
      
      {/* Toast feedback */}
      <AnimatePresence>
        {(successMsg || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 text-xs border rounded-lg m-4 flex items-center gap-2 ${
              errorMsg 
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg || errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin tabs header */}
      <div className="px-4 py-2 border-b border-white/5 flex gap-1 overflow-x-auto bg-zinc-950/80">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "dashboard" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          General
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "users" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Sanciones
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "services" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Servicios & Pedidos
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "trades" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Catálogo & Trades
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "ads" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          Anuncios
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "settings" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Personalización
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "admins" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Admins
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "logs" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Logs & BD
        </button>
        <button
          onClick={() => setActiveTab("console")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "console" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Consola
        </button>
        <button
          onClick={() => setActiveTab("admin_chat")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0 ${
            activeTab === "admin_chat" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat Staff
        </button>
      </div>

      {/* Admin content viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-zinc-900/60">

        {/* 1. DASHBOARD GENERAL */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Métricas Generales</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-white/40 block uppercase">Usuarios</span>
                <span className="text-xl font-mono font-bold text-white">{dbUsers.length}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-white/40 block uppercase">Pedidos</span>
                <span className="text-xl font-mono font-bold text-white">{serviceRequests.length}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-white/40 block uppercase">Trades Activos</span>
                <span className="text-xl font-mono font-bold text-white">{trades.length}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-white/40 block uppercase">Catálogo Ítems</span>
                <span className="text-xl font-mono font-bold text-white">{catalog.length}</span>
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-white block">Estado de Servidores</span>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Base de Datos: Operativa local JSON</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Hosting: Contenedor Cloud Run 24/7</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. USER MODERATION LIST */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Gestión de Usuarios & Sanciones</h4>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-white/50 uppercase">Razón de la Sanción / Advertencia</label>
                <input
                  type="text"
                  placeholder="Ej: Spam en chat, trade fraudulento..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                {dbUsers.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4">No hay usuarios registrados todavía.</p>
                ) : (
                  dbUsers.map((u) => (
                    <div key={u.id} className="bg-white/[0.02] p-3 rounded-lg border border-white/5 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{u.username}</span>
                          {u.roleBadge && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
                              style={{
                                backgroundColor: `${u.roleColor || "#10b981"}15`,
                                color: u.roleColor || "#10b981",
                                border: `1px solid ${u.roleColor || "#10b981"}30`
                              }}
                            >
                              {u.roleBadge}
                            </span>
                          )}
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          u.status === "banned" ? "bg-rose-500/15 text-rose-400" :
                          u.status === "muted" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                        }`}>{u.status}</span>
                      </div>
                      <p className="text-[10px] text-white/40">Advertencias: {u.warns} • IPs: {u.ipHistory.join(", ")}</p>

                      <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/5">
                        <button
                          onClick={() => handleModerateUser(u.id, "warn")}
                          className="px-1 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[9px] cursor-pointer"
                        >
                          Advertir
                        </button>
                        <button
                          onClick={() => handleModerateUser(u.id, "mute")}
                          className="px-1 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[9px] cursor-pointer"
                        >
                          Mute (1h)
                        </button>
                        <button
                          onClick={() => handleModerateUser(u.id, "ban")}
                          className="px-1 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[9px] cursor-pointer"
                        >
                          Ban
                        </button>
                        <button
                          onClick={() => handleModerateUser(u.id, "unban")}
                          className="px-1 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white/70 rounded text-[9px] cursor-pointer"
                        >
                          Unban
                        </button>
                        <button
                          onClick={() => handleModerateUser(u.id, "unmute")}
                          className="px-1 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white/70 rounded text-[9px] cursor-pointer"
                        >
                          Unmute
                        </button>
                      </div>

                      {/* Rank assignment tools */}
                      <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1.5 bg-zinc-950/40 p-2 rounded-lg">
                        <span className="text-[9px] text-white/40 font-mono uppercase">Rango Rápido (1-Clic):</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { name: "Socio", color: "#10b981", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" },
                            { name: "VIP", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" },
                            { name: "Ayudante", color: "#06b6d4", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20" },
                            { name: "Moderador", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" },
                            { name: "Creador", color: "#ef4444", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => {
                                handleModerateUser(u.id, "set_rank", preset.name, preset.color);
                              }}
                              className={`px-2 py-1 text-[9px] font-sans font-bold rounded border cursor-pointer transition-all ${preset.bg}`}
                            >
                              +{preset.name}
                            </button>
                          ))}
                          {u.roleBadge && (
                            <button
                              onClick={() => handleModerateUser(u.id, "remove_rank")}
                              className="px-2 py-1 text-[9px] font-sans font-bold rounded border border-rose-900/30 bg-rose-950/20 text-rose-300 cursor-pointer hover:bg-rose-950/40 transition-all"
                            >
                              Quitar Rango
                            </button>
                          )}
                        </div>

                        <div className="flex gap-1.5 items-center mt-1 pt-1 border-t border-white/[0.03]">
                          <span className="text-[8px] text-white/30 whitespace-nowrap">O Personalizado:</span>
                          <input
                            type="text"
                            placeholder="Nombre (ej: Pro)"
                            id={`rank-name-${u.id}`}
                            className="flex-1 glass-input px-2 py-0.5 text-[10px]"
                            defaultValue={u.roleBadge || ""}
                          />
                          <input
                            type="color"
                            id={`rank-color-${u.id}`}
                            className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
                            defaultValue={u.roleColor || "#10b981"}
                          />
                          <button
                            onClick={() => {
                              const badgeVal = (document.getElementById(`rank-name-${u.id}`) as HTMLInputElement)?.value;
                              const colorVal = (document.getElementById(`rank-color-${u.id}`) as HTMLInputElement)?.value;
                              if (!badgeVal) {
                                triggerToast("Ingresa un nombre para el rango.", true);
                                return;
                              }
                              handleModerateUser(u.id, "set_rank", badgeVal, colorVal);
                            }}
                            className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] font-medium cursor-pointer"
                          >
                            Asignar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. SERVICES & ORDERS */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Farmeo de Servicios & Pedidos</h4>
              <button
                onClick={() => setEditingService({})}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Añadir Nuevo
              </button>
            </div>

            {/* Editing Service Inline Block */}
            {editingService && (
              <div className="bg-white/[0.03] p-4 rounded-xl border border-blue-500/20 space-y-3 text-xs">
                <span className="font-semibold text-white block">{editingService.id ? "Editar Servicio" : "Nuevo Servicio"}</span>
                <input
                  type="text"
                  placeholder="Nombre del servicio (Ej: Subir de nivel)"
                  value={editingService.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full glass-input px-3 py-1.5"
                />
                <textarea
                  placeholder="Descripción"
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  rows={2}
                  className="w-full glass-input px-3 py-1.5 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Precio USD (Ej: 15)"
                    value={editingService.price || ""}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full glass-input px-3 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Tiempo estimado"
                    value={editingService.estimatedTime || ""}
                    onChange={(e) => setEditingService({ ...editingService, estimatedTime: e.target.value })}
                    className="w-full glass-input px-3 py-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editingService.status || "available"}
                    onChange={(e) => setEditingService({ ...editingService, status: e.target.value as any })}
                    className="w-full glass-input px-3 py-1.5 bg-zinc-950"
                  >
                    <option value="available">Disponible</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="out_of_stock">Agotado</option>
                  </select>
                  <input
                    type="text"
                    placeholder="URL Imagen (Unsplash, etc.)"
                    value={editingService.image || ""}
                    onChange={(e) => setEditingService({ ...editingService, image: e.target.value })}
                    className="w-full glass-input px-3 py-1.5"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingService(null)} className="px-3 py-1 bg-zinc-800 rounded">Cancelar</button>
                  <button onClick={handleSaveService} className="px-3 py-1 bg-blue-600 rounded text-white font-medium">Guardar</button>
                </div>
              </div>
            )}

            {/* Pending Requests Orders */}
            <div className="space-y-2">
              <span className="text-[10px] text-white/40 block font-mono uppercase">Historial de Pedidos de Farmeo:</span>
              {serviceRequests.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4 bg-white/[0.01] rounded">No hay pedidos registrados.</p>
              ) : (
                serviceRequests.map((req) => (
                  <div key={req.id} className="bg-zinc-950 p-3 rounded-lg border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-white block">{req.serviceName}</span>
                        <span className="text-[10px] text-white/40">Por: @{req.username} • Discord: {req.discordTag || "No dado"}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        req.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                        req.status === "processing" ? "bg-blue-500/10 text-blue-400" :
                        req.status === "cancelled" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                      }`}>{req.status}</span>
                    </div>
                    <p className="text-[10px] text-white/60 bg-white/[0.01] p-1.5 rounded">{req.details}</p>

                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleUpdateRequestStatus(req.id, "processing")} className="px-1.5 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[9px] cursor-pointer">En Proceso</button>
                      <button onClick={() => handleUpdateRequestStatus(req.id, "completed")} className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[9px] cursor-pointer">Completar</button>
                      <button onClick={() => handleUpdateRequestStatus(req.id, "cancelled")} className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[9px] cursor-pointer">Cancelar</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* List Active services to edit/delete */}
            <div className="space-y-2">
              <span className="text-[10px] text-white/40 block font-mono uppercase">Lista de Servicios de la Tienda:</span>
              {services.map((s) => (
                <div key={s.id} className="bg-white/[0.01] p-2 rounded border border-white/5 flex items-center justify-between text-xs">
                  <span>{s.name} (${s.price} USD)</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingService(s)} className="p-1 hover:bg-white/5 rounded text-white/70"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteService(s.id)} className="p-1 hover:bg-rose-500/10 rounded text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. TRADES & CATALOG CATALOG */}
        {activeTab === "trades" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Catálogo de Objetos del Sistema</h4>
              <button
                onClick={() => setEditingCatalog({})}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Añadir Objeto
              </button>
            </div>

            {/* Editing Catalog Form Inline */}
            {editingCatalog && (
              <div className="bg-white/[0.03] p-5 rounded-2xl border border-blue-500/20 space-y-4 text-xs" id="admin-catalog-editor-container">
                <span className="font-semibold text-white text-sm block">
                  {editingCatalog.id ? "Editar Objeto de Catálogo" : "Nuevo Objeto"}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Core properties */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-white/50 uppercase mb-1">Nombre</label>
                      <input
                        type="text"
                        placeholder="Nombre (Ej: Soul Cane, Dark Coat)"
                        value={editingCatalog.name || ""}
                        onChange={(e) => setEditingCatalog({ ...editingCatalog, name: e.target.value })}
                        className="w-full glass-input px-3 py-2 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Categoría</label>
                        <select
                          value={editingCatalog.category || "fruit"}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, category: e.target.value as any })}
                          className="w-full glass-input px-3 py-2 bg-zinc-950 text-xs"
                        >
                          <option value="fruit">Fruta</option>
                          <option value="sword">Espada</option>
                          <option value="accessory">Accesorio</option>
                          <option value="object">Objeto / Material</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Rareza</label>
                        <select
                          value={editingCatalog.rarity || "Common"}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, rarity: e.target.value as any })}
                          className="w-full glass-input px-3 py-2 bg-zinc-950 text-xs"
                        >
                          <option value="Common">Común</option>
                          <option value="Uncommon">Poco Común</option>
                          <option value="Rare">Rara</option>
                          <option value="Legendary">Legendaria</option>
                          <option value="Mythical">Mítica</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Valor</label>
                        <input
                          type="number"
                          placeholder="Valor (Ej: 4500)"
                          value={editingCatalog.value || ""}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, value: Number(e.target.value) })}
                          className="w-full glass-input px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Cantidad</label>
                        <input
                          type="number"
                          placeholder="Cantidad (Ej: 1)"
                          value={editingCatalog.quantity !== undefined ? editingCatalog.quantity : 1}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, quantity: Number(e.target.value) })}
                          className="w-full glass-input px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Estado</label>
                        <input
                          type="text"
                          placeholder="Disponible / Agotado"
                          value={editingCatalog.status || "Disponible"}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, status: e.target.value })}
                          className="w-full glass-input px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Etiquetas</label>
                        <input
                          type="text"
                          placeholder="Separadas por comas (Ej: PvP, Raro)"
                          value={editingCatalog.tags || ""}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, tags: e.target.value })}
                          className="w-full glass-input px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Image Upload & Description */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] text-white/50 uppercase mb-1">Imagen del Objeto</label>
                      
                      {editingCatalog.image ? (
                        <div className="relative border border-white/10 rounded-xl overflow-hidden bg-zinc-950 h-28 flex items-center justify-center group">
                          <img 
                            src={editingCatalog.image} 
                            alt="Preview" 
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingCatalog({ ...editingCatalog, image: "" })}
                            className="absolute top-2 right-2 bg-red-600/85 hover:bg-red-600 p-1.5 rounded-full text-white transition-all shadow cursor-pointer z-10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => document.getElementById("file-upload-input")?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setEditingCatalog({ ...editingCatalog, image: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.01] transition-all h-28 text-center"
                        >
                          <Image className="w-6 h-6 text-white/40 mb-1" />
                          <span className="text-[11px] text-white/60 font-medium">Drag & Drop o Clic para subir</span>
                          <span className="text-[9px] text-white/30">PNG, JPG, WEBP (Se convertirá a Base64)</span>
                          <input
                            id="file-upload-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setEditingCatalog({ ...editingCatalog, image: event.target.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}

                      <div className="mt-1.5">
                        <input
                          type="text"
                          placeholder="O pega URL directa de imagen (Ej: https://...)"
                          value={editingCatalog.image && !editingCatalog.image.startsWith("data:") ? editingCatalog.image : ""}
                          onChange={(e) => setEditingCatalog({ ...editingCatalog, image: e.target.value })}
                          className="w-full glass-input px-2.5 py-1 text-[10px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 uppercase mb-1">Descripción</label>
                      <textarea
                        placeholder="Descripción y detalles del objeto para la oferta de trade..."
                        value={editingCatalog.description || ""}
                        onChange={(e) => setEditingCatalog({ ...editingCatalog, description: e.target.value })}
                        rows={2}
                        className="w-full glass-input px-3 py-1.5 text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                  <button
                    onClick={() => setEditingCatalog(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full font-medium text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCatalogItem}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-medium text-white transition-colors cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* List Catalog Items to Edit/Delete */}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <span className="text-[10px] text-white/40 block font-mono uppercase">Lista de Objetos del Catálogo:</span>
              {catalog.map((cat) => (
                <div key={cat.id} className="bg-zinc-950 p-2 rounded border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img src={cat.image} className="w-6 h-6 object-cover rounded" alt="" referrerPolicy="no-referrer" />
                    <span>{cat.name} ({cat.rarity})</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingCatalog(cat)} className="p-1 hover:bg-white/5 rounded text-white/70"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteCatalogItem(cat.id)} className="p-1 hover:bg-rose-500/10 rounded text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ADVERTISEMENTS EDIT */}
        {activeTab === "ads" && (
          <div className="space-y-4">
            <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Gestión de Anuncios y Banners</h4>
            
            <div className="space-y-4 text-xs">
              {/* Top Banner */}
              <div className="p-3 bg-white/[0.01] rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Banner Superior (Cabecera)</span>
                  <input type="checkbox" checked={adTopEnabled} onChange={(e) => setAdTopEnabled(e.target.checked)} />
                </div>
                <input type="text" placeholder="URL Imagen" value={adTopImg} onChange={(e) => setAdTopImg(e.target.value)} className="w-full glass-input px-2.5 py-1 text-xs" />
                <input type="text" placeholder="Enlace de Redirección" value={adTopLink} onChange={(e) => setAdTopLink(e.target.value)} className="w-full glass-input px-2.5 py-1 text-xs" />
              </div>

              {/* Intermediate Banner */}
              <div className="p-3 bg-white/[0.01] rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Banner Intermedio (Página)</span>
                  <input type="checkbox" checked={adIntEnabled} onChange={(e) => setAdIntEnabled(e.target.checked)} />
                </div>
                <input type="text" placeholder="URL Imagen" value={adIntImg} onChange={(e) => setAdIntImg(e.target.value)} className="w-full glass-input px-2.5 py-1 text-xs" />
                <input type="text" placeholder="Enlace de Redirección" value={adIntLink} onChange={(e) => setAdIntLink(e.target.value)} className="w-full glass-input px-2.5 py-1 text-xs" />
              </div>

              {/* Sidebar Banner */}
              <div className="p-3 bg-white/[0.01] rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Banner Barra Lateral</span>
                  <input type="checkbox" checked={adSideEnabled} onChange={(e) => setAdSideEnabled(e.target.checked)} />
                </div>
                <input type="text" placeholder="URL Imagen" value={adSideImg} onChange={(e) => setAdSideImg(e.target.value)} className="w-full glass-input px-2.5 py-1 text-xs" />
                <input type="text" placeholder="Enlace de Redirección" value={adSideLink} onChange={(e) => setAdSideLink(e.target.value)} className="w-full glass-input px-2.5 py-1 text-xs" />
              </div>

              <button
                onClick={handleSaveAds}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-sans font-medium text-xs transition-colors cursor-pointer"
              >
                Guardar Anuncios
              </button>
            </div>
          </div>
        )}

        {/* 6. COMPLETE BRANDS AND TEXTS CUSTOMIZATION */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Personalización sin tocar código</h4>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] text-white/50 uppercase">Nombre de la Web</label>
                <input type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} className="w-full glass-input px-3 py-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Logo del Sitio (Texto/Emoji)</label>
                  <input type="text" value={settingsLogo} onChange={(e) => setSettingsLogo(e.target.value)} className="w-full glass-input px-3 py-1.5" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Dominio Visible</label>
                  <input type="text" value={settingsDomain} onChange={(e) => setSettingsDomain(e.target.value)} className="w-full glass-input px-3 py-1.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-white/50 uppercase">Color Primario de Acento (Hex)</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={settingsPrimaryColor} onChange={(e) => setSettingsPrimaryColor(e.target.value)} className="w-10 h-8 rounded border-none bg-transparent" />
                  <input type="text" value={settingsPrimaryColor} onChange={(e) => setSettingsPrimaryColor(e.target.value)} className="flex-1 glass-input px-3 py-1.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Estilo de Botón</label>
                  <select value={settingsButtonStyle} onChange={(e) => setSettingsButtonStyle(e.target.value as any)} className="w-full glass-input px-3 py-1.5 bg-zinc-950">
                    <option value="pill">Píldora (Redondeado)</option>
                    <option value="rounded">Suave (Bordes redondeados)</option>
                    <option value="square">Recto (Minimalista)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Fondo de Pantalla</label>
                  <select value={settingsBackground} onChange={(e) => setSettingsBackground(e.target.value as any)} className="w-full glass-input px-3 py-1.5 bg-zinc-950">
                    <option value="glass">Cristal / Glassmorphism</option>
                    <option value="dark">Negro Profundo (Vercel)</option>
                    <option value="gradient">Gradiente Tecnológico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Tipografía (Fuente)</label>
                  <select value={settingsFont} onChange={(e) => setSettingsFont(e.target.value)} className="w-full glass-input px-3 py-1.5 bg-zinc-950">
                    <option value="Inter">Inter (Estándar Apple)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Consola)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Redes (Discord URL)</label>
                  <input type="text" value={settingsDiscord} onChange={(e) => setSettingsDiscord(e.target.value)} className="w-full glass-input px-3 py-1.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-white/50 uppercase">Políticas del Sitio & Reembolsos</label>
                <textarea value={settingsPolicies} onChange={(e) => setSettingsPolicies(e.target.value)} rows={2} className="w-full glass-input px-3 py-1.5 resize-none" />
              </div>

               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                   <label className="block text-[10px] text-white/50 uppercase">Correo de Contacto</label>
                   <input type="email" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} className="w-full glass-input px-3 py-1.5" />
                 </div>
                 <div className="space-y-1">
                   <label className="block text-[10px] text-white/50 uppercase">Auto-Limpieza Chat (Minutos)</label>
                   <div className="flex items-center gap-1.5">
                     <input
                       type="number"
                       min="0"
                       value={settingsChatCleanup}
                       onChange={(e) => setSettingsChatCleanup(Math.max(0, Number(e.target.value)))}
                       className="w-full glass-input px-3 py-1.5"
                       placeholder="Ej: 10"
                     />
                     <span className="text-[9px] text-white/40 whitespace-nowrap" title="Establecer en 0 para desactivar la auto-limpieza">(0 = Off)</span>
                   </div>
                 </div>
               </div>

               {/* SECCIÓN AVANZADA DE DECORACIÓN GAMER */}
               <div className="border-t border-white/10 pt-3.5 mt-2 space-y-3">
                 <h5 className="text-[11px] font-mono tracking-wider text-emerald-400 font-bold uppercase">✨ Decoraciones & Efectos Gamer Avanzados</h5>
                 
                 <div className="grid grid-cols-2 gap-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                   <div className="space-y-1">
                     <label className="block text-[10px] text-white/50 uppercase">Efecto de Fondo Activo</label>
                     <select value={settingsParticleEffect} onChange={(e) => setSettingsParticleEffect(e.target.value as any)} className="w-full glass-input px-3 py-1 bg-zinc-950 text-xs">
                       <option value="none">Ninguno (Fondo estático)</option>
                       <option value="stars">✨ Estrellas Fugaces / Twinkling</option>
                       <option value="snow">❄️ Copos de Nieve (Gamer Chill)</option>
                       <option value="fireflies">🔥 Luciérnagas / Flamas flotantes</option>
                     </select>
                   </div>

                   <div className="space-y-1">
                     <label className="block text-[10px] text-white/50 uppercase">Estilo de Paneles</label>
                     <select value={settingsCardStyle} onChange={(e) => setSettingsCardStyle(e.target.value as any)} className="w-full glass-input px-3 py-1 bg-zinc-950 text-xs">
                       <option value="glass">Cristal Translúcido (Glassmorphism)</option>
                       <option value="solid">Modo Sólido (Full Negro)</option>
                       <option value="bordered">Bordes Ultra-Finos Blancos</option>
                       <option value="futuristic">Cyber Gamer (Detalles neón)</option>
                     </select>
                   </div>

                   <div className="space-y-1">
                     <label className="block text-[10px] text-white/50 uppercase">Estilo del Encabezado (Header)</label>
                     <select value={settingsHeaderStyle} onChange={(e) => setSettingsHeaderStyle(e.target.value as any)} className="w-full glass-input px-3 py-1 bg-zinc-950 text-xs">
                       <option value="minimal">Minimalista (Sencillo)</option>
                       <option value="cyber">Cyberpunk (Líneas tecnológicas)</option>
                       <option value="gaming">Modo Gaming (Efecto resplandor)</option>
                     </select>
                   </div>

                   <div className="space-y-2 flex flex-col justify-center">
                     <label className="flex items-center gap-2 cursor-pointer text-white/80">
                       <input 
                         type="checkbox" 
                         checked={settingsNeonGlow} 
                         onChange={(e) => setSettingsNeonGlow(e.target.checked)} 
                         className="rounded bg-zinc-900 border-white/10 text-emerald-500 focus:ring-0" 
                       />
                       <span className="text-[10px] uppercase font-mono tracking-wider">Activar Brillo Neón (Glow)</span>
                     </label>
                   </div>
                 </div>

                 {/* SECCIÓN MÚSICA GAMER */}
                 <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 space-y-2.5">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-mono tracking-wider text-blue-400 font-bold uppercase">🎵 Música de Fondo Gamer</span>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={settingsMusicEnabled} 
                         onChange={(e) => setSettingsMusicEnabled(e.target.checked)} 
                         className="sr-only peer"
                       />
                       <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                       <span className="ml-2 text-[10px] font-mono text-white/60">MÚSICA</span>
                     </label>
                   </div>

                   {settingsMusicEnabled && (
                     <div className="space-y-1">
                       <label className="block text-[9px] text-white/40 uppercase">Enlace MP3 / Stream de Música</label>
                       <input 
                         type="text" 
                         value={settingsMusicUrl} 
                         onChange={(e) => setSettingsMusicUrl(e.target.value)} 
                         placeholder="Ej: https://archivo-mp3-de-musica.mp3" 
                         className="w-full bg-zinc-900 border border-white/5 rounded px-2.5 py-1 text-[10px] text-white font-mono"
                       />
                       <p className="text-[8px] text-white/30">Puedes usar cualquier enlace MP3 directo para que suene de fondo.</p>
                     </div>
                   )}
                 </div>
               </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-sans font-semibold text-xs transition-colors hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
              >
                Guardar Ajustes & Diseño Completo
              </button>
            </div>
          </div>
        )}

        {/* 7. ADMIN CODES SYSTEM */}
        {activeTab === "admins" && (
          <div className="space-y-4">
            <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Administración de Códigos & Creadores</h4>
            
            {/* Create / Edit Admin Code Block */}
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white block">
                  {newAdminCode?.id ? "Editar Creador / Admin" : "Registrar nuevo Creador / Admin"}
                </span>
                {newAdminCode && (
                  <button
                    onClick={() => setNewAdminCode(null)}
                    className="text-rose-400 hover:text-rose-300 text-[10px] font-sans"
                  >
                    Limpiar Formulario / Cancelar
                  </button>
                )}
              </div>
               <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] text-white/50 uppercase">Código secreto único (Ej: blandyPro)</label>
                  {(!newAdminCode || newAdminCode.code !== "blandygerra2007") && (
                    <button
                      type="button"
                      onClick={() => {
                        const rand = "MF_" + Math.random().toString(36).substring(2, 8).toUpperCase();
                        setNewAdminCode({ ...(newAdminCode || {}), code: rand });
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono tracking-wide cursor-pointer"
                    >
                      ⚡ Generar Aleatorio
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Código secreto único"
                  value={newAdminCode?.code || ""}
                  onChange={(e) => setNewAdminCode({ ...newAdminCode, code: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 font-mono"
                  disabled={newAdminCode?.code === "blandygerra2007"}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-white/50 uppercase">Nombre / Etiqueta (Ej: Moderador Pedro)</label>
                <input
                  type="text"
                  placeholder="Nombre / Etiqueta"
                  value={newAdminCode?.label || ""}
                  onChange={(e) => setNewAdminCode({ ...newAdminCode, label: e.target.value })}
                  className="w-full glass-input px-3 py-1.5"
                />
              </div>

              {/* New fields: Rango and Color of the Admin/Creator */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Rango / Rol (Ej: Admin, Moderador, Socio)</label>
                  <input
                    type="text"
                    placeholder="Ej: Administrador"
                    value={newAdminCode?.roleBadge || ""}
                    onChange={(e) => setNewAdminCode({ ...newAdminCode, roleBadge: e.target.value })}
                    className="w-full glass-input px-3 py-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 uppercase">Color del Rango / Badge (Hex o Selector)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newAdminCode?.roleColor || "#3b82f6"}
                      onChange={(e) => setNewAdminCode({ ...newAdminCode, roleColor: e.target.value })}
                      className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="#3b82f6"
                      value={newAdminCode?.roleColor || ""}
                      onChange={(e) => setNewAdminCode({ ...newAdminCode, roleColor: e.target.value })}
                      className="w-full glass-input px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] text-blue-400 font-mono uppercase tracking-wider block font-bold">Permisos del Rango / Rol:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { key: "createTrades", label: "Crear Trades" },
                    { key: "editTrades", label: "Editar Trades" },
                    { key: "deleteTrades", label: "Eliminar Trades" },
                    { key: "createServices", label: "Crear Servicios" },
                    { key: "editServices", label: "Editar Servicios" },
                    { key: "deleteServices", label: "Eliminar Servicios" },
                    { key: "editNews", label: "Publicar Noticias" },
                    { key: "manageUsers", label: "Administrar Usuarios" },
                    { key: "manageChat", label: "Moderar Chat" },
                    { key: "ban", label: "Banear Usuarios" },
                    { key: "mute", label: "Mutear Usuarios" },
                    { key: "kick", label: "Kickear Usuarios" },
                    { key: "manageAds", label: "Administrar Anuncios" },
                    { key: "changeDesign", label: "Cambiar Diseño" },
                    { key: "modifyDb", label: "Acceso Base de Datos" },
                  ].map((perm) => {
                    const permissions = newAdminCode?.permissions || {
                      editTrades: true,
                      deleteTrades: true,
                      createTrades: true,
                      editServices: true,
                      deleteServices: true,
                      createServices: true,
                      editNews: true,
                      manageUsers: false,
                      manageChat: true,
                      ban: false,
                      mute: true,
                      kick: true,
                      viewLogs: false,
                      manageAds: false,
                      changeDesign: false,
                      modifyDb: false
                    };
                    const isChecked = !!(permissions as any)[perm.key];
                    return (
                      <label key={perm.key} className="flex items-center gap-1.5 cursor-pointer text-white/75 hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updatedPerms = { ...permissions, [perm.key]: e.target.checked };
                            setNewAdminCode({
                              ...(newAdminCode || {}),
                              permissions: updatedPerms
                            });
                          }}
                          className="rounded text-blue-600 bg-zinc-900 border-white/10 w-3 h-3 focus:ring-0"
                        />
                        {perm.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSaveAdminCode}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-sans font-medium transition-colors cursor-pointer"
              >
                {newAdminCode?.id ? "Actualizar Administrador" : "Crear Administrador"}
              </button>
            </div>

            {/* List Active codes */}
            <div className="space-y-2">
              <span className="text-[10px] text-white/40 block font-mono uppercase">Códigos Registrados:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {adminCodes.map((ac) => (
                  <div key={ac.id} className="bg-zinc-950 p-3 rounded-lg border border-white/5 text-xs space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-white">{ac.label}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setNewAdminCode(ac)}
                            className="text-blue-400 hover:text-blue-300 font-sans text-[10px] bg-blue-400/10 px-1.5 py-0.5 rounded"
                          >
                            Editar
                          </button>
                          {ac.code !== "blandygerra2007" && (
                            <button
                              onClick={() => handleDeleteAdminCode(ac.id)}
                              className="text-rose-400 hover:text-rose-300 font-sans text-[10px] bg-rose-400/10 px-1.5 py-0.5 rounded"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-white/50 font-mono">Código: {ac.code}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                      <span className="text-[9px] text-white/40 font-mono">Vista Chat:</span>
                      <span
                        className="text-[9px] font-sans font-semibold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: `${ac.roleColor || "#3b82f6"}15`,
                          color: ac.roleColor || "#3b82f6",
                          border: `1px solid ${ac.roleColor || "#3b82f6"}30`
                        }}
                      >
                        {ac.roleBadge || (ac.code === "blandygerra2007" ? "Super Admin" : "Administrador")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. AUDIT SECURITY LOGS & BACKUPS */}
        {activeTab === "logs" && (
          <div className="space-y-4 text-xs">
            <h4 className="text-sm font-mono tracking-wider text-blue-400 font-bold uppercase">Auditoría, Copias de Seguridad & BD</h4>

            {/* Backup actions */}
            <div className="space-y-2">
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg text-white font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4 text-emerald-400" /> Exportar / Descargar Base de Datos
              </button>

              <button
                onClick={handleResetDatabase}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> REINICIAR BASE DE DATOS (FÁBRICA)
              </button>
            </div>

            {/* Import Backup Block */}
            <div className="bg-white/[0.01] p-3 rounded-lg border border-white/5 space-y-2">
              <span className="font-semibold text-white block">Importar Copia de Seguridad</span>
              <textarea
                placeholder="Pega aquí el contenido JSON de tu respaldo..."
                value={importedJson}
                onChange={(e) => setImportedJson(e.target.value)}
                rows={3}
                className="w-full glass-input p-2 text-[10px] resize-none font-mono"
              />
              <button
                onClick={handleImportDatabase}
                disabled={!importedJson.trim()}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-sans disabled:opacity-50 cursor-pointer"
              >
                Aplicar Respaldo
              </button>
            </div>

            {/* Audit Logs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] text-white/40 font-mono uppercase">Registro de Acciones de Seguridad:</span>
                <button onClick={fetchAdminLists} className="p-1 hover:bg-white/5 rounded text-white/55"><RefreshCw className="w-3 h-3" /></button>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {systemLogs.slice(0, 50).map((log) => (
                  <div key={log.id} className="bg-zinc-950 p-2 rounded border border-white/[0.03] text-[10px] font-mono leading-relaxed space-y-0.5">
                    <div className="flex justify-between text-white/30 text-[9px]">
                      <span>{log.ip}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-white"><strong className="text-blue-400">@{log.username}</strong> - {log.action}</p>
                    <p className="text-white/50">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. COMMAND CONSOLE */}
        {activeTab === "console" && (
          <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex flex-col h-[520px] font-mono select-text">
            {!consoleUnlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-white text-xs font-bold font-mono tracking-widest uppercase">MF_FIREWALL_SYSTEM: ACCESO RESTRINGIDO</h5>
                  <p className="text-[10px] text-white/50 max-w-xs mx-auto">
                    La consola de comandos requiere confirmación de contraseña maestra de staff para repeler intrusiones o bots automatizados.
                  </p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (consolePasswordInput === "blandygerra2007") {
                      setConsoleUnlocked(true);
                      setConsolePasswordError("");
                    } else {
                      setConsolePasswordError("❌ CLAVE DE ACCESO INCORRECTA");
                    }
                  }}
                  className="w-full max-w-xs space-y-3"
                >
                  <input 
                    type="password"
                    placeholder="Contraseña de Admin..."
                    value={consolePasswordInput}
                    onChange={(e) => setConsolePasswordInput(e.target.value)}
                    className="w-full text-center bg-black border border-white/10 rounded px-3 py-1.5 text-xs text-rose-400 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  {consolePasswordError && (
                    <div className="text-[10px] text-rose-500 font-bold font-mono animate-bounce">{consolePasswordError}</div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs rounded transition-all cursor-pointer font-bold tracking-wider"
                  >
                    DESBLOQUEAR TERMINAL
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                    <span className="text-emerald-400 text-xs font-bold font-mono">MF_ADMIN_CONSOLE_v1.2.sh</span>
                  </div>
                  <button 
                    onClick={() => setConsoleLogs([{ type: "output", text: "⌨️ Terminal reiniciada.", timestamp: new Date().toLocaleTimeString() }])}
                    className="text-[10px] text-white/40 hover:text-white px-2 py-0.5 bg-white/5 rounded hover:bg-white/10 cursor-pointer"
                  >
                    Limpiar Pantalla
                  </button>
                </div>

                {/* Logs viewport */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 text-[11px] leading-relaxed">
                  {consoleLogs.map((log, index) => (
                    <div key={index} className="space-y-0.5">
                      <div className="text-[9px] text-white/30 text-right font-mono">[{log.timestamp}]</div>
                      {log.type === "input" ? (
                        <div className="text-blue-400 font-bold flex items-start gap-1">
                          <span>$</span>
                          <span>{log.text}</span>
                        </div>
                      ) : log.type === "error" ? (
                        <div className="text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/10 whitespace-pre-wrap">
                          {log.text}
                        </div>
                      ) : (
                        <div className="text-emerald-400 whitespace-pre-wrap text-left">
                          {log.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick command buttons for Swiss army-knife accessibility */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => setConsoleCommand("/ayuda")}
                    className="py-1 px-2 text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 rounded cursor-pointer text-left transition-all"
                  >
                    💡 /ayuda
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsoleCommand("/clear_chat")}
                    className="py-1 px-2 text-[10px] bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded cursor-pointer text-left transition-all"
                  >
                    🗑/clear_chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsoleCommand("/announce ¡Anuncio oficial de MundoFarmeo!")}
                    className="py-1 px-2 text-[10px] bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded cursor-pointer text-left transition-all"
                  >
                    📢 /announce
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConsoleUnlocked(false);
                      setConsolePasswordInput("");
                    }}
                    className="py-1 px-2 text-[10px] bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 rounded cursor-pointer text-left transition-all"
                  >
                    🔒 Bloquear Consola
                  </button>
                </div>

                {/* Command Input Form */}
                <form onSubmit={handleExecuteConsoleCommand} className="flex gap-2">
                  <span className="text-blue-500 font-bold text-sm self-center font-mono select-none">$</span>
                  <input
                    type="text"
                    placeholder="Escribe un comando de MundoFarmeo... (Ej: /mute blandyGamer 10)"
                    value={consoleCommand}
                    onChange={(e) => setConsoleCommand(e.target.value)}
                    disabled={executingConsoleCmd}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-400 placeholder-white/20 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={executingConsoleCmd || !consoleCommand.trim()}
                    className="px-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {executingConsoleCmd ? "Ejecutando..." : "Ejecutar"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* 10. ADMIN PRIVATE STAFF CHAT */}
        {activeTab === "admin_chat" && (
          <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Chat Privado del Staff</span>
              </div>
              <button 
                onClick={fetchAdminLists}
                className="p-1 hover:bg-white/5 rounded text-white/55 transition-colors"
                title="Actualizar chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
              {adminChatMessages.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-xs">
                  No hay mensajes en el chat de staff. ¡Sé el primero en iniciar la conversación!
                </div>
              ) : (
                adminChatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2.5 items-start bg-white/[0.01] p-2 rounded-xl border border-white/[0.02]">
                    <img
                      src={msg.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(msg.username)}
                      alt={msg.username}
                      className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-sans font-semibold text-white text-xs">
                          {msg.username}
                        </span>
                        <span className="text-[8px] font-mono uppercase tracking-widest px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">
                          {msg.roleBadge || "Staff"}
                        </span>
                        <span className="text-[8px] font-mono text-white/30 ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-white/80 text-xs whitespace-pre-wrap font-sans break-words text-left select-text">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendAdminChatMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje seguro de staff..."
                value={adminChatInput}
                onChange={(e) => setAdminChatInput(e.target.value)}
                disabled={isSendingAdminMsg}
                className="flex-1 glass-input px-3 py-2 text-xs"
              />
              <button
                type="submit"
                disabled={isSendingAdminMsg || !adminChatInput.trim()}
                className="px-4 bg-blue-600 hover:bg-blue-500 text-white font-sans font-medium text-xs rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isSendingAdminMsg ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
