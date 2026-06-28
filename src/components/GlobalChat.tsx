import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, User as DBUser, AdminCode } from "../types";
import { 
  Send, Smile, CornerDownRight, Pin, Trash2, Edit2, Search, 
  X, AlertCircle, VolumeX, ShieldCheck, Sticker, CheckCircle, MessageSquare,
  Bell, BellOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  messages: ChatMessage[];
  currentUser: DBUser | null;
  currentAdmin: AdminCode | null;
  onOpenAuth: () => void;
  onRefreshChat: () => void;
  chatCleanupMinutes?: number;
  customStickers?: string[];
}

const DEFAULT_STICKERS = [
  { id: "stk-leopard", label: "Leopard Sticker", img: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=150" },
  { id: "stk-dragon", label: "Dragon Power", img: "https://images.unsplash.com/photo-1527324688151-0e627063f2b1?q=80&w=150" },
  { id: "stk-kitsune", label: "Kitsune Fire", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=150" },
  { id: "stk-gg", label: "GG Bro", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=150" },
  { id: "stk-wow", label: "WOW OMG", img: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=150" }
];

export default function GlobalChat({ 
  messages, currentUser, currentAdmin, onOpenAuth, onRefreshChat, chatCleanupMinutes = 10, customStickers = []
}: Props) {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editingTarget, setEditingTarget] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const [chatNotification, setChatNotification] = useState<string | null>(null);
  const [notisState, setNotisState] = useState(() => {
    return localStorage.getItem("chat_notifications_enabled") === "true";
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const showLocalToast = (msg: string) => {
    setChatNotification(msg);
    setTimeout(() => {
      setChatNotification(null);
    }, 3500);
  };

  const playChatSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.06, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Audio Context block or error:", e);
    }
  };

  const handleToggleNotifications = async () => {
    if (notisState) {
      localStorage.setItem("chat_notifications_enabled", "false");
      setNotisState(false);
      showLocalToast("Notificaciones y sonidos desactivados 🔕");
    } else {
      const confirmEnable = window.confirm(
        "Aviso de Notificaciones:\n\nPara recibir alertas visuales en tu pantalla y un sonido agradable cada vez que llegue un mensaje nuevo al chat global, necesitamos el permiso de tu navegador.\n\n¿Deseas activar las notificaciones y reproducir un sonido de prueba?"
      );
      if (confirmEnable) {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            localStorage.setItem("chat_notifications_enabled", "true");
            setNotisState(true);
            playChatSound();
            showLocalToast("¡Notificaciones y sonido activados! 🔔");
          } else {
            alert("No se pudieron activar las notificaciones porque el permiso fue denegado en tu navegador. Por favor, actívalas manualmente en la configuración del sitio.");
          }
        } else {
          localStorage.setItem("chat_notifications_enabled", "true");
          setNotisState(true);
          playChatSound();
          showLocalToast("¡Sonido de chat activado! 🔊");
        }
      }
    }
  };

  const prevLastMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (prevLastMessageId.current === null) {
        prevLastMessageId.current = lastMsg.id;
        return;
      }

      if (lastMsg.id !== prevLastMessageId.current) {
        const isSelf = (currentUser && lastMsg.userId === currentUser.id) || (currentAdmin && lastMsg.userId === "admin-" + currentAdmin.id);
        if (!isSelf) {
          if (localStorage.getItem("chat_notifications_enabled") === "true") {
            playChatSound();
            if ("Notification" in window && Notification.permission === "granted") {
              const textContent = lastMsg.sticker ? "Envió un Sticker 🖼️" : lastMsg.text;
              try {
                new Notification(`MundoFarmeo - ${lastMsg.username}`, {
                  body: textContent,
                  icon: lastMsg.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${lastMsg.username}`
                });
              } catch (e) {
                console.error("System notification error", e);
              }
            }
          }
        }
        prevLastMessageId.current = lastMsg.id;
      }
    }
  }, [messages, currentUser, currentAdmin]);

  const userJustSentMessage = useRef(false);
  const isFirstLoad = useRef(true);
  const prevMessagesLength = useRef(0);

  // Poll chat every 1.5 seconds for persistent real-time chat feel
  useEffect(() => {
    const timer = setInterval(() => {
      onRefreshChat();
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;

    const scrollOffset = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isCloseToBottom = scrollOffset < 180;
    const countChanged = messages.length !== prevMessagesLength.current;

    // Always scroll on first load, or when user just sent a message, or when a new message arrives and user is close to bottom
    if (isFirstLoad.current || userJustSentMessage.current || (countChanged && isCloseToBottom)) {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
      container.scrollTop = container.scrollHeight;

      const t = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);

      userJustSentMessage.current = false;
      prevMessagesLength.current = messages.length;
      isFirstLoad.current = false;
      return () => clearTimeout(t);
    }

    // Always keep track of message length even if we didn't scroll
    prevMessagesLength.current = messages.length;
    isFirstLoad.current = false;
  }, [messages]);

  // Actions permissions
  const canModifyMessage = (msg: ChatMessage) => {
    if (currentAdmin && currentAdmin.permissions.manageChat) return true;
    if (currentUser && msg.userId === currentUser.id) return true;
    return false;
  };

  const handleSendMessage = async (e: React.FormEvent, stickerUrl?: string) => {
    e.preventDefault();
    if (!currentUser && !currentAdmin) {
      onOpenAuth();
      return;
    }

    if (!inputText.trim() && !stickerUrl) return;

    setErrorBanner("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || undefined,
          authCode: currentAdmin?.code || undefined,
          text: inputText,
          sticker: stickerUrl || undefined,
          replyTo: replyTarget?.id || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el mensaje.");
      }

      setInputText("");
      setReplyTarget(null);
      setIsStickerOpen(false);
      userJustSentMessage.current = true;
      onRefreshChat();
    } catch (err: any) {
      setErrorBanner(err.message || "Error al enviar mensaje.");
    }
  };

  const handleEditMessage = async (msg: ChatMessage) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch(`/api/chat/${msg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || undefined,
          authCode: currentAdmin?.code || undefined,
          text: editText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al editar.");

      setEditingTarget(null);
      setEditText("");
      onRefreshChat();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("¿Deseas eliminar este mensaje para todos?")) return;

    try {
      const res = await fetch(`/api/chat/${msgId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || undefined,
          authCode: currentAdmin?.code || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo borrar.");

      onRefreshChat();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTogglePin = async (msgId: string) => {
    if (!currentAdmin || !currentAdmin.permissions.manageChat) {
      alert("Solo los moderadores de chat pueden fijar mensajes.");
      return;
    }

    try {
      const res = await fetch(`/api/chat/${msgId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authCode: currentAdmin.code
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al fijar mensaje.");

      onRefreshChat();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter messages based on search and pins
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = 
      !searchQuery || 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      msg.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPin = !showPinnedOnly || msg.isPinned;

    return matchesSearch && matchesPin;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-4" id="global-chat-room">
      
      {/* Outer Discord Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col h-[400px] sm:h-[500px] shadow-2xl relative">
        
        {/* Chat Header */}
        <div className="bg-zinc-900/80 px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md z-10 relative">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span className="font-display font-semibold text-white tracking-tight">Chat Global</span>
            <span className="text-xs text-white/40 font-mono">canal-general</span>
            {chatCleanupMinutes > 0 && (
              <span className="text-[10px] font-sans bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5 ml-1.5" title="Los mensajes no fijados se eliminan automáticamente después de este tiempo.">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                <span>Auto-limpieza: {chatCleanupMinutes} min</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-8 pr-3 py-1 text-xs w-36 focus:w-48"
              />
            </div>

            {/* Show Pinned Only Button */}
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                showPinnedOnly 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                  : "bg-white/[0.02] text-white/55 border-white/5 hover:text-white"
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              {showPinnedOnly ? "Ver Todos" : "Fijados"}
            </button>

            {/* Bell Notification Toggle */}
            <button
              onClick={handleToggleNotifications}
              className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                notisState 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : "bg-white/[0.02] text-white/55 border-white/5 hover:text-white"
              }`}
              title={notisState ? "Desactivar Notificaciones y Sonidos" : "Activar Notificaciones y Sonidos"}
            >
              {notisState ? <Bell className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <BellOff className="w-3.5 h-3.5 text-white/40" />}
              <span>{notisState ? "Notis On" : "Notis Off"}</span>
            </button>
          </div>

          {/* Floating Toast inside container */}
          <AnimatePresence>
            {chatNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-4 mt-2 bg-zinc-900/95 border border-emerald-500/40 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-[11px] text-white z-50 backdrop-blur-md"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                <span className="font-medium">{chatNotification}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages Body */}
        <div id="chat-messages-container" className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {errorBanner && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 text-sm space-y-1">
              <p>No hay mensajes en este canal.</p>
              <p className="text-xs text-white/20">¡Sé el primero en saludar!</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isEdited = msg.text.endsWith("(editado)");
              const isEditing = editingTarget?.id === msg.id;

              return (
                <div 
                  key={msg.id} 
                  className={`group flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.01] transition-colors relative ${
                    msg.isPinned ? "bg-amber-500/[0.01] border-l-2 border-amber-500/20" : ""
                  }`}
                >
                  {/* Left Avatar */}
                  <img
                    src={msg.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.username}`}
                    alt={msg.username}
                    className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex-shrink-0 mt-0.5 object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Right bubble content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    
                    {/* Username row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="font-sans font-semibold text-sm transition-colors"
                        style={{ color: msg.roleColor || '#ffffff' }}
                      >
                        {msg.username}
                      </span>

                      {msg.country && (
                        <span className="text-[10px] bg-white/5 border border-white/10 text-white/70 px-1.5 py-0.5 rounded-md font-sans flex items-center gap-1">
                          {msg.country}
                        </span>
                      )}

                      {/* Role custom badges */}
                      {msg.roleBadge && (
                        <span 
                          style={{ color: msg.roleColor || '#3b82f6' }}
                          className="text-[9px] font-mono tracking-widest uppercase font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5"
                        >
                          {msg.roleBadge}
                        </span>
                      )}

                      <span className="text-[9px] font-mono text-white/30">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Replies indicator inline */}
                    {msg.replyTo && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-400/70 font-sans italic bg-blue-500/[0.02] py-0.5 px-2 rounded w-fit border border-blue-500/5">
                        <CornerDownRight className="w-3 h-3" />
                        <span>Respuesta a: <strong>{msg.replyText}</strong></span>
                      </div>
                    )}

                    {/* Content text or stickers */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 glass-input px-3 py-1.5 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditMessage(msg);
                          }}
                        />
                        <button
                          onClick={() => handleEditMessage(msg)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-sans font-medium cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingTarget(null)}
                          className="px-2 py-1 bg-zinc-800 text-white/50 hover:text-white rounded text-[10px] font-sans cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="text-white/80 font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {msg.text}
                        
                        {msg.sticker && (
                          <div className="mt-1.5 h-20 w-20 overflow-hidden rounded-lg border border-white/5 bg-zinc-950">
                            <img src={msg.sticker} alt="Sticker" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover Actions Tooltip Menu */}
                  <div className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 bg-zinc-900 border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-lg backdrop-blur-md transition-opacity duration-200">
                    <button
                      onClick={() => setReplyTarget(msg)}
                      className="p-1 hover:bg-white/5 text-white/60 hover:text-white rounded transition-colors cursor-pointer"
                      title="Responder mensaje"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                    </button>

                    {currentAdmin && currentAdmin.permissions.manageChat && (
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className={`p-1 hover:bg-white/5 rounded transition-colors cursor-pointer ${msg.isPinned ? "text-amber-400" : "text-white/60 hover:text-white"}`}
                        title={msg.isPinned ? "Desfijar" : "Fijar mensaje"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canModifyMessage(msg) && (
                      <>
                        <button
                          onClick={() => {
                            setEditingTarget(msg);
                            setEditText(msg.text.replace(" (editado)", ""));
                          }}
                          className="p-1 hover:bg-white/5 text-white/60 hover:text-white rounded transition-colors cursor-pointer"
                          title="Editar mensaje"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 hover:bg-white/5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Borrar mensaje"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box bottom bar */}
        <div className="bg-zinc-900/95 border-t border-white/5 p-4 space-y-2 backdrop-blur-md relative z-10">
          
          {/* Active Reply Banner */}
          {replyTarget && (
            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-400">
              <span className="flex items-center gap-1.5 font-sans">
                <CornerDownRight className="w-3.5 h-3.5" />
                Respondiendo a: <strong>{replyTarget.username}</strong>
              </span>
              <button onClick={() => setReplyTarget(null)} className="hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
            {/* Sticker Tray Toggle */}
            <button
              type="button"
              onClick={() => setIsStickerOpen(!isStickerOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isStickerOpen ? "bg-blue-600 text-white" : "bg-white/[0.03] text-white/50 hover:text-white border border-white/5"
              }`}
              title="Pegatinas / Stickers"
            >
              <Sticker className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder={
                currentUser || currentAdmin 
                  ? "Escribe un mensaje en el chat general..." 
                  : "Por favor regístrate o inicia sesión para chatear."
              }
              disabled={!currentUser && !currentAdmin}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 glass-input px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !isStickerOpen) || (!currentUser && !currentAdmin)}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Sticker drawer list */}
          <AnimatePresence>
            {isStickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 left-4 bg-zinc-900 border border-white/10 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-2xl z-20 max-h-48 overflow-y-auto"
              >
                {[
                  ...DEFAULT_STICKERS,
                  ...(customStickers || []).map((url, idx) => ({
                    id: `custom-stk-${idx}`,
                    label: `Sticker Staff ${idx + 1}`,
                    img: url
                  }))
                ].map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={(e) => handleSendMessage(e, stk.img)}
                    className="h-14 w-14 overflow-hidden rounded-lg hover:border-blue-500 border border-white/5 transition-all bg-black group cursor-pointer"
                    title={stk.label}
                  >
                    <img src={stk.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
