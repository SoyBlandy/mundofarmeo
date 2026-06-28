import React, { useState } from "react";
import { News, FAQ } from "../types";
import { ChevronDown, Calendar, User, Newspaper, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  news: News[];
  faqs: FAQ[];
}

export default function NewsAndFaqs({ news, faqs }: Props) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto px-4 py-8" id="news-faqs-section">
      {/* Noticias Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Últimas Noticias & Actualizaciones
          </h2>
        </div>

        {news.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-white/50 font-sans">
            No hay noticias publicadas en este momento.
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden group hover:border-white/15 transition-all duration-300"
              >
                {item.image && (
                  <div className="h-44 w-full overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {item.author}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-sm font-sans text-white/70 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        {faqs.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-white/50 font-sans">
            No hay preguntas frecuentes registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="glass-panel rounded-xl overflow-hidden transition-all duration-300 border border-white/5"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-sans font-medium text-white text-base md:text-md">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-white/40 transition-transform duration-300 ${
                        isOpen ? "transform rotate-180 text-blue-400" : ""
                      }`}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-sm font-sans text-white/60 leading-relaxed border-t border-white/5 bg-white/[0.01]">
                      {faq.answer}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
