import React, { useState } from "react";
import { SiteSettings, AdminCode } from "../types";
import { ExternalLink, Plus, Trash2, Edit3, Image, Link, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  siteSettings: SiteSettings;
  currentAdmin: AdminCode | null;
  onRefreshSettings: () => void;
}

export default function LinkPage({ siteSettings, currentAdmin, onRefreshSettings }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");

  const items = siteSettings.linkItems || [];

  // Image carousels states per item ID
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle("");
    setUrl("");
    setImages([]);
    setNewImageInput("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setTitle(item.title);
    setUrl(item.link);
    setImages(item.images || []);
    setNewImageInput("");
    setError("");
    setIsModalOpen(true);
  };

  // Convert uploaded image to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImages([...images, reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImages([...images, reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!newImageInput.trim()) return;
    setImages([...images, newImageInput.trim()]);
    setNewImageInput("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError("El título y el enlace son campos obligatorios.");
      return;
    }

    if (images.length === 0) {
      // Use a beautiful placeholder if no image is added
      images.push("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600");
    }

    const newItem = {
      id: editingItem ? editingItem.id : "link-" + Date.now(),
      title: title.trim(),
      link: url.trim(),
      images
    };

    let updatedList = [];
    if (editingItem) {
      updatedList = items.map(it => it.id === editingItem.id ? newItem : it);
    } else {
      updatedList = [newItem, ...items];
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentAdmin?.code,
          settings: {
            linkItems: updatedList
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la información.");

      setIsModalOpen(false);
      onRefreshSettings();
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este enlace?")) return;

    const updatedList = items.filter(it => it.id !== itemId);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentAdmin?.code,
          settings: {
            linkItems: updatedList
          }
        })
      });

      if (!res.ok) throw new Error("No se pudo eliminar.");
      onRefreshSettings();
    } catch (err: any) {
      alert(err.message || "Error al eliminar enlace.");
    }
  };

  // Carousel handlers
  const handlePrevCarousel = (itemId: string, max: number) => {
    setCarouselIndexes(prev => {
      const curr = prev[itemId] || 0;
      return { ...prev, [itemId]: curr === 0 ? max - 1 : curr - 1 };
    });
  };

  const handleNextCarousel = (itemId: string, max: number) => {
    setCarouselIndexes(prev => {
      const curr = prev[itemId] || 0;
      return { ...prev, [itemId]: curr === max - 1 ? 0 : curr + 1 };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-yellow-400 animate-pulse" />
            Sección LINK & Recomendados
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Explora enlaces de interés, redes de creadores de contenido, canales oficiales y más.
          </p>
        </div>

        {currentAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4" />
            Añadir Nuevo LINK
          </button>
        )}
      </div>

      {/* Main Grid */}
      {items.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-white/50 flex flex-col items-center justify-center space-y-4">
          <Link className="w-12 h-12 text-white/30" />
          <div>
            <p className="text-lg font-medium text-white/80">No hay enlaces recomendados todavía.</p>
            {currentAdmin ? (
              <p className="text-xs text-white/40 mt-1">Haz clic en "Añadir Nuevo LINK" para crear la primera recomendación.</p>
            ) : (
              <p className="text-xs text-white/40 mt-1">Los administradores publicarán enlaces interesantes pronto.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const carouselIdx = carouselIndexes[item.id] || 0;
            const itemImages = item.images && item.images.length > 0 ? item.images : ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"];
            const currentImg = itemImages[carouselIdx];

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl flex flex-col group relative hover:border-white/10 transition-all duration-300"
              >
                {/* Admin Controls Overlay */}
                {currentAdmin && (
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                      title="Editar enlace"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                      title="Eliminar enlace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Card Top Image Carousel */}
                <div className="h-52 w-full relative overflow-hidden bg-zinc-950 flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-300">
                  <img
                    src={currentImg}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                  {/* Carousel Indicators / Controls */}
                  {itemImages.length > 1 && (
                    <>
                      <button
                        onClick={() => handlePrevCarousel(item.id, itemImages.length)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNextCarousel(item.id, itemImages.length)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Dot indicators */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {itemImages.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              idx === carouselIdx ? "bg-blue-400" : "bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-white/40 truncate" title={item.link}>
                      {item.link}
                    </p>
                  </div>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 text-white hover:text-blue-400 py-3 rounded-xl font-medium text-xs transition-all tracking-wider uppercase"
                  >
                    Visitar Enlace Oficial
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Link className="w-5 h-5 text-blue-400" />
                  {editingItem ? "Editar LINK Recomendado" : "Crear Recomendación de LINK"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                {error && (
                  <div className="bg-rose-500/15 border border-rose-500/35 rounded-xl p-3 text-rose-400 text-xs flex items-center gap-2">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Título del Enlace</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Canal Oficial de Twitch, Servidor Asociado, etc."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-input w-full py-2.5 px-3 text-sm text-white"
                  />
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Enlace Destino (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://twitch.tv/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="glass-input w-full py-2.5 px-3 text-sm text-white"
                  />
                </div>

                {/* Images Section */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Imágenes Promocionales (Puedes añadir una o más)</label>

                  {/* Drag-and-drop / File Selector */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDragOver
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                    }`}
                  >
                    <Image className="w-8 h-8 text-white/30" />
                    <div>
                      <p className="text-xs font-medium text-white/70">Arrastra tu imagen aquí, o haz clic para subir</p>
                      <p className="text-[10px] text-white/40 mt-1">Formatos recomendados: PNG, JPG, GIF. Máx 3MB</p>
                    </div>
                    <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all mt-1 shadow-lg shadow-blue-500/15">
                      Buscar Archivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Add Image URL alternative */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="O pega el link de una imagen externa..."
                      value={newImageInput}
                      onChange={(e) => setNewImageInput(e.target.value)}
                      className="glass-input flex-1 py-2 px-3 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-white/10 hover:bg-white/15 text-white border border-white/5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Añadir Link
                    </button>
                  </div>

                  {/* Images list display */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5 pt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="h-16 rounded-lg relative overflow-hidden bg-black border border-white/10 group">
                          <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border border-white/10"
                  >
                    {editingItem ? "Actualizar Recomendación" : "Crear Enlace"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
