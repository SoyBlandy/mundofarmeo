import React, { useState } from "react";
import { Trade, CatalogItem, User as DBUser, AdminCode } from "../types";
import { 
  Search, Plus, ArrowRightLeft, Tag, ShieldAlert, CheckCircle2, 
  Clock, Pin, Trash2, Edit3, EyeOff, Star, AlertCircle, ShoppingCart 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  trades: Trade[];
  catalog: CatalogItem[];
  currentUser: DBUser | null;
  currentAdmin: AdminCode | null;
  onOpenAuth: () => void;
  onRefreshTrades: () => void;
}

export default function TradeSystem({ 
  trades, catalog, currentUser, currentAdmin, onOpenAuth, onRefreshTrades 
}: Props) {
  // Navigation & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("Available");

  // Create/Edit trade form states
  const [isCreating, setIsCreating] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOffered, setFormOffered] = useState<string[]>([]); // Catalog IDs
  const [formWanted, setFormWanted] = useState<string[]>([]); // Catalog IDs
  const [formQuantity, setFormQuantity] = useState(1);
  const [formTags, setFormTags] = useState("");
  const [formIsSpecial, setFormIsSpecial] = useState(false);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsHidden, setFormIsHidden] = useState(false);
  const [formOrder, setFormOrder] = useState(0);

  // Selector modal states
  const [selectorTarget, setSelectorTarget] = useState<"offered" | "wanted" | null>(null);
  const [selectorSearch, setSelectorSearch] = useState("");

  // Detailed view & action modal
  const [requestedTrade, setRequestedTrade] = useState<Trade | null>(null);
  const [requestDiscord, setRequestDiscord] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  // Detail catalog item preview modal state
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);

  // General error/success states
  const [errorMessage, setErrorMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Permissions helpers
  const canCreate = !!currentUser || (currentAdmin && currentAdmin.permissions.createTrades);
  const canEdit = (trade: Trade) => {
    if (currentAdmin && currentAdmin.permissions.editTrades) return true;
    if (currentUser && trade.creatorId === currentUser.id) return true;
    return false;
  };
  const canDelete = (trade: Trade) => {
    if (currentAdmin && currentAdmin.permissions.deleteTrades) return true;
    if (currentUser && trade.creatorId === currentUser.id) return true;
    return false;
  };

  // Open creation form
  const handleOpenCreate = () => {
    if (!currentUser && !currentAdmin) {
      onOpenAuth();
      return;
    }
    setFormTitle("");
    setFormDescription("");
    setFormOffered([]);
    setFormWanted([]);
    setFormQuantity(1);
    setFormTags("");
    setFormIsSpecial(false);
    setFormIsPinned(false);
    setFormIsHidden(false);
    setFormOrder(trades.length);
    setEditingTrade(null);
    setFormError("");
    setIsCreating(true);
  };

  // Open edit form
  const handleOpenEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setFormTitle(trade.title);
    setFormDescription(trade.description || "");
    setFormOffered(trade.itemsOffered);
    setFormWanted(trade.itemsWanted);
    setFormQuantity(trade.quantity);
    setFormTags(trade.tags.join(", "));
    setFormIsSpecial(trade.isSpecial);
    setFormIsPinned(trade.isPinned);
    setFormIsHidden(trade.isHidden);
    setFormOrder(trade.order);
    setFormError("");
    setIsCreating(true);
  };

  // Select catalog item helper
  const handleSelectItem = (itemId: string) => {
    if (!selectorTarget) return;
    if (selectorTarget === "offered") {
      setFormOffered([...formOffered, itemId]);
    } else {
      setFormWanted([...formWanted, itemId]);
    }
    setSelectorTarget(null);
  };

  const handleRemoveItem = (idx: number, type: "offered" | "wanted") => {
    if (type === "offered") {
      setFormOffered(formOffered.filter((_, i) => i !== idx));
    } else {
      setFormWanted(formWanted.filter((_, i) => i !== idx));
    }
  };

  // Save (Create/Update) Trade Form submit
  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formOffered.length === 0) {
      setFormError("Debes ofrecer al menos un objeto de tu inventario.");
      return;
    }
    if (formWanted.length === 0) {
      setFormError("Debes especificar al menos un objeto que buscas a cambio.");
      return;
    }

    const payload = {
      authCode: currentAdmin?.code || undefined,
      userId: currentUser?.id || undefined,
      trade: {
        title: formTitle || `Intercambio de ${catalog.find(c => c.id === formOffered[0])?.name || "Items"}`,
        description: formDescription,
        itemsOffered: formOffered,
        itemsWanted: formWanted,
        quantity: formQuantity,
        tags: formTags.split(",").map(s => s.trim()).filter(s => s.length > 0),
        status: editingTrade ? editingTrade.status : "Available",
        isSpecial: formIsSpecial,
        isPinned: formIsPinned,
        isHidden: formIsHidden,
        order: formOrder
      }
    };

    try {
      const url = editingTrade ? `/api/trades/${editingTrade.id}` : "/api/trades";
      const method = editingTrade ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTrade ? { ...payload, updatedTrade: payload.trade } : payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el trade.");
      }

      setIsCreating(false);
      onRefreshTrades();
    } catch (err: any) {
      setFormError(err.message || "Error al procesar el trade.");
    }
  };

  // Delete Trade
  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente este trade?")) return;

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authCode: currentAdmin?.code || undefined,
          userId: currentUser?.id || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el trade.");
      }

      onRefreshTrades();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Trade Status (Admin/Owner toggle shortcut)
  const handleToggleStatus = async (trade: Trade, status: 'Available' | 'Reserved' | 'Completed') => {
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authCode: currentAdmin?.code || undefined,
          userId: currentUser?.id || undefined,
          updatedTrade: { ...trade, status }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar estado.");
      }

      onRefreshTrades();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Request Trade Flow
  const handleOpenRequest = (trade: Trade) => {
    if (!currentUser && !currentAdmin) {
      onOpenAuth();
      return;
    }
    setRequestedTrade(trade);
    setRequestDiscord("");
    setRequestMessage("");
    setRequestSuccess("");
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDiscord.trim()) {
      alert("Por favor introduce tu Discord Tag.");
      return;
    }

    setRequestSuccess(`¡Solicitud enviada! Tu tag de Discord (${requestDiscord}) ha sido enviado a ${requestedTrade?.creatorName}. Se te recomienda chatear también en el Chat Global para coordinar rápido.`);
    setTimeout(() => {
      setRequestedTrade(null);
    }, 5000);
  };

  // Filter and search computation
  const filteredTrades = trades.filter((trade) => {
    // Hidden filter
    if (trade.isHidden && !currentAdmin?.permissions.editTrades) return false;

    // Search term
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      trade.title.toLowerCase().includes(term) ||
      (trade.description && trade.description.toLowerCase().includes(term)) ||
      trade.creatorName.toLowerCase().includes(term) ||
      trade.tags.some(t => t.toLowerCase().includes(term));

    // Status filter
    const matchesStatus = selectedStatus === "All" || trade.status === selectedStatus;

    // Rarity filter
    const offeredItems = trade.itemsOffered.map(id => catalog.find(c => c.id === id)).filter(Boolean);
    const matchesRarity = selectedRarity === "All" || offeredItems.some(i => i?.rarity === selectedRarity);

    // Category filter
    const matchesCategory = selectedCategory === "All" || trade.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesRarity && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" id="trades-subsystem">
      
      {/* Intro and Action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-500 animate-pulse" />
            Bolsa de Intercambio & Trades
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Propón intercambios de frutas, espadas o accesorios de forma coordinada basándote en los objetos oficiales habilitados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-sans font-medium text-sm transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Publicar Oferta
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="glass-panel p-5 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-center border border-white/5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar trades o etiquetas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-2 text-sm"
          />
        </div>

        {/* Filter Rarity */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">Rareza:</span>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="flex-1 glass-input px-3 py-2 text-sm text-white/80 bg-zinc-900 border-white/5"
          >
            <option value="All">Cualquiera</option>
            <option value="Mythical">Mítica</option>
            <option value="Legendary">Legendaria</option>
            <option value="Rare">Rara</option>
            <option value="Uncommon">Poco Común</option>
            <option value="Common">Común</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">Estado:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 glass-input px-3 py-2 text-sm text-white/80 bg-zinc-900 border-white/5"
          >
            <option value="All">Todos</option>
            <option value="Available">Disponible</option>
            <option value="Reserved">Reservado</option>
            <option value="Completed">Completado</option>
          </select>
        </div>

        {/* Category select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">Categoría:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 glass-input px-3 py-2 text-sm text-white/80 bg-zinc-900 border-white/5"
          >
            <option value="All">Todos los Juegos</option>
            <option value="Blox Fruits">Blox Fruits</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 text-white/40 space-y-3">
          <AlertCircle className="w-8 h-8 text-white/20 mx-auto" />
          <p className="text-base font-sans">No se encontraron ofertas de trade con los filtros actuales.</p>
          <button onClick={() => { setSearchQuery(""); setSelectedRarity("All"); setSelectedStatus("All"); }} className="text-xs text-blue-400 hover:underline">Limpiar Filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTrades.map((trade) => {
            const isSpecial = trade.isSpecial;
            const offeredItems = trade.itemsOffered.map(id => catalog.find(c => c.id === id)).filter(Boolean) as CatalogItem[];
            const wantedItems = trade.itemsWanted.map(id => catalog.find(c => c.id === id)).filter(Boolean) as CatalogItem[];

            const statusStyles = {
              Available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              Reserved: "bg-amber-500/10 text-amber-400 border-amber-500/20",
              Completed: "bg-zinc-800 text-white/40 border-white/5"
            };

            const statusLabels = {
              Available: "Disponible",
              Reserved: "Reservado",
              Completed: "Completado"
            };

            return (
              <motion.div
                key={trade.id}
                layoutId={`trade-motion-${trade.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6 relative border transition-all duration-300 ${
                  isSpecial 
                    ? "border-blue-500/40 shadow-md shadow-blue-500/[0.04] bg-gradient-to-br from-blue-500/[0.02] to-transparent" 
                    : "border-white/5"
                } ${trade.isPinned ? "border-amber-500/30" : ""}`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={trade.creatorAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${trade.creatorName}`}
                      alt={trade.creatorName}
                      className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-medium text-white text-sm">
                          {trade.creatorName}
                        </span>
                        {trade.isPinned && (
                          <span className="p-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                            <Pin className="w-3 h-3" />
                          </span>
                        )}
                        {isSpecial && (
                          <span className="text-[9px] font-mono font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-blue-400/20" />
                            Especial
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 font-mono block">
                        Publicado hace poco • {trade.category}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[trade.status]}`}>
                    {statusLabels[trade.status]}
                  </span>
                </div>

                {/* Items Exchange Visualizer */}
                <div className="grid grid-cols-2 gap-4 bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                  {/* Offered Column */}
                  <div className="space-y-2 border-r border-white/5 pr-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-medium">Ofrece:</span>
                    <div className="flex flex-wrap gap-2">
                      {offeredItems.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedCatalogItem(item)}
                          className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.08] active:scale-98 p-1 rounded-lg border border-white/5 w-full cursor-pointer transition-all group"
                          title="Haz clic para ver detalles del objeto"
                        >
                          <img src={item.image} className="w-7 h-7 object-cover rounded-md group-hover:scale-105 transition-transform" alt={item.name} referrerPolicy="no-referrer" />
                          <div className="overflow-hidden">
                            <span className="text-xs text-white block truncate font-sans font-medium group-hover:text-blue-400 transition-colors">{item.name}</span>
                            <span className={`text-[8px] font-mono ${
                              item.rarity === "Mythical" ? "text-rose-400 font-bold" :
                              item.rarity === "Legendary" ? "text-amber-400 font-bold" : "text-white/40"
                            }`}>{item.rarity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wanted Column */}
                  <div className="space-y-2 pl-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-medium">Busca:</span>
                    <div className="flex flex-wrap gap-2">
                      {wantedItems.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedCatalogItem(item)}
                          className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.08] active:scale-98 p-1 rounded-lg border border-white/5 w-full cursor-pointer transition-all group"
                          title="Haz clic para ver detalles del objeto"
                        >
                          <img src={item.image} className="w-7 h-7 object-cover rounded-md group-hover:scale-105 transition-transform" alt={item.name} referrerPolicy="no-referrer" />
                          <div className="overflow-hidden">
                            <span className="text-xs text-white block truncate font-sans font-medium group-hover:text-blue-400 transition-colors">{item.name}</span>
                            <span className={`text-[8px] font-mono ${
                              item.rarity === "Mythical" ? "text-rose-400 font-bold" :
                              item.rarity === "Legendary" ? "text-amber-400 font-bold" : "text-white/40"
                            }`}>{item.rarity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info and Description */}
                <div className="space-y-2">
                  <h4 className="text-md font-sans font-semibold text-white tracking-tight">
                    {trade.title}
                  </h4>
                  {trade.description && (
                    <p className="text-xs text-white/60 font-sans leading-relaxed line-clamp-2">
                      {trade.description}
                    </p>
                  )}
                  {trade.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trade.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-white/[0.03] text-white/50 border border-white/5 px-1.5 py-0.5 rounded font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer and Management */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Owner shortcuts */}
                    {canEdit(trade) && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(trade)}
                          className="p-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white rounded transition-colors"
                          title="Editar Trade"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Toggle Status available/reserved/completed */}
                        <select
                          value={trade.status}
                          onChange={(e) => handleToggleStatus(trade, e.target.value as any)}
                          className="text-[10px] bg-zinc-900 border border-white/10 rounded px-1 text-white/80"
                        >
                          <option value="Available">Habilitado</option>
                          <option value="Reserved">Reservar</option>
                          <option value="Completed">Completar</option>
                        </select>
                      </>
                    )}

                    {canDelete(trade) && (
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors"
                        title="Eliminar Trade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenRequest(trade)}
                    disabled={trade.status === "Completed"}
                    className={`px-4 py-2 rounded-full font-sans font-medium text-xs transition-all ${
                      trade.status === "Completed"
                        ? "bg-zinc-800 text-white/30 cursor-not-allowed border border-white/5"
                        : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer hover:scale-105"
                    }`}
                  >
                    Solicitar Intercambio
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Trade Create & Edit Modal Form */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-2xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsCreating(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer text-xl"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">
                  Bolsa de Intercambio
                </span>
                <h3 className="text-2xl font-display font-semibold text-white">
                  {editingTrade ? "Editar Oferta de Trade" : "Publicar Nueva Oferta de Trade"}
                </h3>
                <p className="text-sm text-white/50">
                  Crea tu propuesta escogiendo objetos aprobados del catálogo oficial.
                </p>
              </div>

              <form onSubmit={handleSaveTrade} className="space-y-6">
                {formError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-white/60 font-medium">Título del Trade <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Ej: Cambio Leopard por Dragon"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      className="w-full glass-input px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-white/60 font-medium">Etiquetas (Separadas por coma)</label>
                    <input
                      type="text"
                      placeholder="Ej: Dragon, Kitsune, Buddha, CDK"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full glass-input px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-white/60 font-medium">Descripción / Mensaje Adicional</label>
                  <textarea
                    placeholder="Ej: Solo gente seria. Puedo coordinar en el chat hoy por la noche."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full glass-input px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                {/* Catalog Selectors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  
                  {/* Offered selectors */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">Tus Objetos (Ofreces):</span>
                      <button
                        type="button"
                        onClick={() => setSelectorTarget("offered")}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Añadir de Catálogo
                      </button>
                    </div>

                    <div className="space-y-2 min-h-24 max-h-40 overflow-y-auto">
                      {formOffered.length === 0 ? (
                        <p className="text-[11px] text-white/30 font-sans py-4 text-center">No has seleccionado ningún objeto.</p>
                      ) : (
                        formOffered.map((id, idx) => {
                          const item = catalog.find(c => c.id === id);
                          if (!item) return null;
                          return (
                            <div key={idx} className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5 text-xs">
                              <div className="flex items-center gap-2">
                                <img src={item.image} className="w-6 h-6 object-cover rounded" alt="" referrerPolicy="no-referrer" />
                                <span className="text-white font-medium">{item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx, "offered")}
                                className="text-rose-400 hover:text-rose-300 font-mono text-[10px] px-1 cursor-pointer"
                              >
                                Quitar
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Wanted selectors */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">Objetos Buscados:</span>
                      <button
                        type="button"
                        onClick={() => setSelectorTarget("wanted")}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Añadir de Catálogo
                      </button>
                    </div>

                    <div className="space-y-2 min-h-24 max-h-40 overflow-y-auto">
                      {formWanted.length === 0 ? (
                        <p className="text-[11px] text-white/30 font-sans py-4 text-center">No has seleccionado ningún objeto.</p>
                      ) : (
                        formWanted.map((id, idx) => {
                          const item = catalog.find(c => c.id === id);
                          if (!item) return null;
                          return (
                            <div key={idx} className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5 text-xs">
                              <div className="flex items-center gap-2">
                                <img src={item.image} className="w-6 h-6 object-cover rounded" alt="" referrerPolicy="no-referrer" />
                                <span className="text-white font-medium">{item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx, "wanted")}
                                className="text-rose-400 hover:text-rose-300 font-mono text-[10px] px-1 cursor-pointer"
                              >
                                Quitar
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin configuration block */}
                {currentAdmin && (
                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 space-y-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-blue-400 tracking-wider">Configuración Especial de Administrador:</span>
                    <div className="grid grid-cols-3 gap-4">
                      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsSpecial}
                          onChange={(e) => setFormIsSpecial(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-900 border-white/10"
                        />
                        Trade Especial
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsPinned}
                          onChange={(e) => setFormIsPinned(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-900 border-white/10"
                        />
                        Fijar Trade
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsHidden}
                          onChange={(e) => setFormIsHidden(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-900 border-white/10"
                        />
                        Ocultar Trade
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit block */}
                <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-full font-sans text-xs font-medium text-white/60 hover:text-white transition-colors hover:bg-white/[0.03] cursor-pointer border border-white/5"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-medium hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {editingTrade ? "Guardar Cambios" : "Publicar Oferta"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selector modal popup (Select item from catalog) */}
      <AnimatePresence>
        {selectorTarget && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-xl p-5 space-y-4 max-h-[80vh] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-md font-display font-semibold text-white">
                  Seleccionar de Catálogo de Objetos ({selectorTarget === "offered" ? "Ofreces" : "Buscas"})
                </h4>
                <button
                  onClick={() => setSelectorTarget(null)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Selector search */}
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={selectorSearch}
                  onChange={(e) => setSelectorSearch(e.target.value)}
                  className="w-full glass-input pl-9 pr-3 py-1.5 text-xs"
                />
              </div>

              {/* Grid content */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 py-1">
                {catalog
                  .filter(item => item.name.toLowerCase().includes(selectorSearch.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item.id)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 text-left transition-colors group cursor-pointer"
                    >
                      <img src={item.image} className="w-8 h-8 object-cover rounded" alt="" referrerPolicy="no-referrer" />
                      <div className="overflow-hidden">
                        <span className="text-xs text-white block truncate font-medium group-hover:text-blue-400 transition-colors">{item.name}</span>
                        <span className="text-[8px] font-mono text-white/40">{item.rarity}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Trade Modal */}
      <AnimatePresence>
        {requestedTrade && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setRequestedTrade(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">Solicitud de Intercambio</span>
                <h3 className="text-xl font-display font-semibold text-white">Contactar con {requestedTrade.creatorName}</h3>
                <p className="text-sm text-white/50">Envía tus datos para realizar el trade propuesto.</p>
              </div>

              {requestSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Solicitud enviada correctamente!</span>
                  </div>
                  <p className="text-white/70 font-sans leading-relaxed">{requestSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-white/60 font-medium">Tu Discord Tag o Roblox User <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Ej: blandy_99"
                      value={requestDiscord}
                      onChange={(e) => setRequestDiscord(e.target.value)}
                      required
                      className="w-full glass-input px-4 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-white/60 font-medium">Mensaje Opcional</label>
                    <textarea
                      placeholder="Ej: Tengo los objetos disponibles ahora. ¿A qué hora nos encontramos en el juego?"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      rows={2}
                      className="w-full glass-input px-4 py-2 text-sm resize-none"
                    />
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5 text-[11px] text-white/40 flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Recomendación: Una vez enviado, puedes mandar un mensaje en el Chat Global mencionando que solicitaste el trade para una atención inmediata.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRequestedTrade(null)}
                      className="px-4 py-2 rounded-full font-sans text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer border border-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-medium rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Catalog Item Detail Modal */}
      <AnimatePresence>
        {selectedCatalogItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="catalog-item-detail-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10 space-y-5"
            >
              <button
                onClick={() => setSelectedCatalogItem(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer text-base bg-white/5 hover:bg-white/10 w-7 h-7 flex items-center justify-center rounded-full"
              >
                ✕
              </button>

              {/* Item Info Header */}
              <div className="flex gap-4 items-start pt-2">
                <div className="w-20 h-20 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                  <img
                    src={selectedCatalogItem.image}
                    alt={selectedCatalogItem.name}
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    selectedCatalogItem.rarity === "Mythical" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    selectedCatalogItem.rarity === "Legendary" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    selectedCatalogItem.rarity === "Rare" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    selectedCatalogItem.rarity === "Uncommon" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}>
                    {selectedCatalogItem.rarity}
                  </span>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight pt-1">
                    {selectedCatalogItem.name}
                  </h3>
                  <span className="text-[11px] text-white/50 font-sans block capitalize">
                    Categoría: {
                      selectedCatalogItem.category === "fruit" ? "Fruta" :
                      selectedCatalogItem.category === "sword" ? "Espada" :
                      selectedCatalogItem.category === "accessory" ? "Accesorio" :
                      selectedCatalogItem.category === "object" ? "Objeto / Material" : "Otro"
                    }
                  </span>
                </div>
              </div>

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Valor Estimado</span>
                  <span className="text-base font-mono font-bold text-blue-400 block">
                    {selectedCatalogItem.value.toLocaleString()} 🪙
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Disponibilidad / Stock</span>
                  <span className={`text-sm font-sans font-medium block ${
                    selectedCatalogItem.status === "Disponible" || !selectedCatalogItem.status ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {selectedCatalogItem.status || "Disponible"}
                  </span>
                </div>
                <div className="space-y-0.5 pt-2 border-t border-white/5 col-span-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Cantidad Disponible</span>
                  <span className="text-sm font-sans font-medium text-white block">
                    {selectedCatalogItem.quantity !== undefined ? selectedCatalogItem.quantity : 1} unidades
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Detalles & Descripción</span>
                <p className="text-xs text-white/70 font-sans leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                  {selectedCatalogItem.description || "Este objeto no cuenta con una descripción detallada por el momento."}
                </p>
              </div>

              {/* Tags */}
              {selectedCatalogItem.tags && selectedCatalogItem.tags.trim() && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Etiquetas del Objeto</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCatalogItem.tags.split(",").map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono bg-white/[0.04] text-white/60 border border-white/5 px-2 py-0.5 rounded-md">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCatalogItem(null)}
                  className="w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full font-sans text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
