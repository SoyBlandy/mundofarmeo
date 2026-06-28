import React, { useState } from "react";
import { Trade, CatalogItem, Service, User as DBUser, AdminCode, SiteSettings } from "../types";
import { Gamepad2, ArrowRightLeft, Sparkles, Coins, Plus, Edit } from "lucide-react";
import { motion } from "motion/react";
import TradeSystem from "./TradeSystem";
import ServicesShop from "./ServicesShop";

interface Props {
  trades: Trade[];
  catalog: CatalogItem[];
  services: Service[];
  currentUser: DBUser | null;
  currentAdmin: AdminCode | null;
  siteSettings: SiteSettings;
  onOpenAuth: () => void;
  onRefreshTrades: () => void;
  onRefreshServices: () => void;
  onRefreshSettings: () => void;
}

export default function OtrosJuegos({
  trades,
  catalog,
  services,
  currentUser,
  currentAdmin,
  siteSettings,
  onOpenAuth,
  onRefreshTrades,
  onRefreshServices,
  onRefreshSettings
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"trades" | "services">("trades");

  // Filter out Blox Fruits to display only OTHER games
  const otherTrades = trades.filter((t) => t.category !== "Blox Fruits");
  const otherServices = services.filter((s) => s.category !== "Blox Fruits");
  const otherCatalog = catalog.filter((c) => c.category !== "fruit" && c.category !== "sword" && c.category !== "accessory");

  // Available games / custom categories configured by admin
  const gameCategories = siteSettings.catalogCategories || ["Bedwars", "King Legacy", "Pet Simulator X", "Grand Piece Online", "Otros"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Page Header banner */}
      <div className="relative rounded-3xl overflow-hidden mb-10 p-8 md:p-12 bg-gradient-to-r from-emerald-950 via-zinc-950 to-blue-950 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gamepad2 className="w-48 h-48 text-emerald-400" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            Soporte Multi-Juego Expandido
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white tracking-tight">
            Mercado de Otros Juegos
          </h1>
          <p className="text-sm md:text-base text-white/75 leading-relaxed">
            ¿Juegas a otros títulos además de Blox Fruits? Intercambia objetos de tus inventarios y adquiere servicios de farmeo profesional para tus juegos favoritos como King Legacy, Bedwars, Pet Simulator X, Grand Piece Online y muchos más.
          </p>
        </div>

        {/* Sub-tab toggles */}
        <div className="flex gap-2.5 mt-8 border-t border-white/5 pt-6">
          <button
            onClick={() => setActiveSubTab("trades")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs transition-all tracking-wider uppercase cursor-pointer ${
              activeSubTab === "trades"
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10"
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Trades de Otros Juegos
          </button>
          <button
            onClick={() => setActiveSubTab("services")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs transition-all tracking-wider uppercase cursor-pointer ${
              activeSubTab === "services"
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10"
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Servicios de Farmeo
          </button>
        </div>
      </div>

      {/* Dynamic Render Section */}
      <div className="space-y-6">
        {activeSubTab === "trades" ? (
          <div>
            <div className="glass-panel p-4 rounded-2xl mb-6 border border-white/5 bg-zinc-950/40">
              <p className="text-xs text-white/50">
                ⭐ <strong className="text-white/80">Tip de Trade:</strong> Al crear un nuevo trade, puedes seleccionar un juego existente o ingresar el nombre de cualquier juego nuevo en la opción <strong className="text-emerald-400">"Otros"</strong>. Se añadirá y actualizará automáticamente para todos los usuarios.
              </p>
            </div>
            <TradeSystem
              trades={otherTrades}
              catalog={catalog} // Let other games select any item or create/search items
              currentUser={currentUser}
              currentAdmin={currentAdmin}
              onOpenAuth={onOpenAuth}
              onRefreshTrades={onRefreshTrades}
              gameCategories={gameCategories}
            />
          </div>
        ) : (
          <div>
            <div className="glass-panel p-4 rounded-2xl mb-6 border border-white/5 bg-zinc-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-xs text-white/50">
                💎 <strong className="text-white/80">Servicios Activos:</strong> Adquiere boosts, subidas de nivel de maestría, misiones completadas y más para otros juegos de Roblox y otras plataformas.
              </p>
              {currentAdmin && (
                <p className="text-xs text-yellow-400">
                  Para editar o añadir servicios para estos juegos, usa la pestaña de "Servicios" en tu Panel de Administración.
                </p>
              )}
            </div>
            <ServicesShop
              services={otherServices}
              currentUser={currentUser}
              onOpenAuth={onOpenAuth}
            />
          </div>
        )}
      </div>
    </div>
  );
}
