import React from "react";
import { AdBanner } from "../types";

interface AdProps {
  ad?: AdBanner;
  type: "top" | "intermediate" | "bottom" | "sidebar";
}

export default function AdBanners({ ad, type }: AdProps) {
  if (!ad || !ad.enabled || !ad.image) return null;

  const styleClasses = {
    top: "w-full max-w-7xl mx-auto mb-6 rounded-xl overflow-hidden border border-white/5 h-20 sm:h-24 md:h-28 relative group transition-all duration-300 hover:border-blue-500/30",
    intermediate: "w-full max-w-7xl mx-auto my-10 rounded-xl overflow-hidden border border-white/5 h-24 sm:h-32 relative group transition-all duration-300 hover:border-blue-500/30",
    bottom: "w-full max-w-7xl mx-auto mt-10 mb-6 rounded-xl overflow-hidden border border-white/5 h-20 sm:h-24 relative group transition-all duration-300 hover:border-blue-500/30",
    sidebar: "w-full rounded-xl overflow-hidden border border-white/5 h-64 relative group transition-all duration-300 hover:border-blue-500/30"
  };

  return (
    <div className={styleClasses[type]} id={`ad-banner-${type}`}>
      <div className="block w-full h-full select-none">
        <img 
          src={ad.image} 
          alt={`Anuncio publicitario de MundoFarmeo - ${type}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-2 justify-between">
          <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
            Anuncio Patrocinado
          </span>
          <span className="text-[10px] font-medium text-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2 flex items-center gap-1">
            MundoFarmeo ✨
          </span>
        </div>
      </div>
    </div>
  );
}
