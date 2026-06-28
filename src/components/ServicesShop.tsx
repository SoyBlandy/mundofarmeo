import React, { useState } from "react";
import { Service, User as DBUser } from "../types";
import { Clock, ShieldCheck, CreditCard, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  services: Service[];
  currentUser: DBUser | null;
  onOpenAuth: () => void;
}

export default function ServicesShop({ services, currentUser, onOpenAuth }: Props) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [discordTag, setDiscordTag] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card" | "crypto" | "robux">("paypal");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cryptoTxId, setCryptoTxId] = useState("");
  const [robuxUser, setRobuxUser] = useState("");

  const handleOpenRequest = (service: Service) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSelectedService(service);
    setDiscordTag("");
    setDetails("");
    setSuccessMessage("");
    setErrorMessage("");
    setPaymentMethod("paypal");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardName("");
    setCryptoTxId("");
    setRobuxUser("");
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !currentUser) return;

    if (!discordTag.trim()) {
      setErrorMessage("Por favor ingresa tu Discord Tag para poder contactarte.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formattedDetails = `${details}\n\n[MÉTODO DE PAGO: ${paymentMethod.toUpperCase()}]${
        paymentMethod === "card" ? `\n• Tarjeta a nombre de: ${cardName}\n• Terminación: ${cardNumber.slice(-4) || "N/A"}` : ""
      }${paymentMethod === "crypto" ? `\n• ID de Transacción (TXID): ${cryptoTxId}` : ""}${
        paymentMethod === "robux" ? `\n• Usuario de Roblox para Fondos: ${robuxUser}` : ""
      }`;

      const response = await fetch("/api/services/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          serviceId: selectedService.id,
          discordTag: discordTag,
          details: formattedDetails
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al procesar el pedido.");
      }

      setSuccessMessage(`¡Pedido enviado con éxito! Un administrador se pondrá en contacto contigo en Discord (${discordTag}) en breve para coordinar el farmeo.`);
      setTimeout(() => {
        setSelectedService(null);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al enviar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" id="services-shop-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            Servicios de Farmeo Profesional
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Sube de nivel, recolecta dinero, consigue objetos míticos y completa Raids de forma rápida, segura y discreta.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40 font-mono bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Garantía Anti-Ban & Seguridad</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => {
          const hasDiscount = service.originalPrice && service.originalPrice > service.price;
          const statusColors = {
            available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            out_of_stock: "bg-rose-500/10 text-rose-400 border-rose-500/20"
          };
          const statusLabels = {
            available: "Disponible",
            maintenance: "En Mantenimiento",
            out_of_stock: "Agotado"
          };

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.4) }}
              className="glass-panel rounded-2xl overflow-hidden flex flex-col hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/[0.02] transition-all duration-300 relative group"
              id={`service-card-${service.id}`}
            >
              {/* Image Container with Hover Effect */}
              <div className="h-44 w-full relative overflow-hidden">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                
                {/* Rarity/Category Badge */}
                <span className="absolute top-3 left-3 bg-black/50 text-white/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-white/10">
                  {service.category}
                </span>

                {/* Status Badge */}
                <span className={`absolute top-3 right-3 border px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md ${statusColors[service.status]}`}>
                  {statusLabels[service.status]}
                </span>

                {/* Discount Badge */}
                {hasDiscount && (
                  <span className="absolute bottom-3 right-3 bg-blue-500 text-white px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold animate-pulse">
                    -{service.discountPercentage || Math.round((1 - service.price / service.originalPrice!) * 100)}%
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {service.name}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed font-sans line-clamp-3">
                    {service.description}
                  </p>
                </div>

                {/* Footer specs */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs text-white/50 border-y border-white/5 py-2">
                    <span className="flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Estimado: <strong className="text-white font-medium">{service.estimatedTime}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Cuenta Segura
                    </span>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className="text-xs text-white/40 line-through font-mono">
                          ${service.originalPrice} USD
                        </span>
                      )}
                      <span className="text-2xl font-mono font-bold text-white tracking-tight flex items-baseline gap-0.5">
                        <span className="text-xs font-sans text-blue-400 font-medium mr-0.5">$</span>
                        {service.price}
                        <span className="text-[10px] font-sans text-white/40 font-normal ml-1">USD</span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenRequest(service)}
                      disabled={service.status !== "available"}
                      className={`px-5 py-2.5 rounded-full font-sans font-medium text-sm transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                        service.status === "available"
                          ? "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95"
                          : "bg-zinc-800 text-white/30 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {service.status === "available" ? "Solicitar" : "No disponible"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Services requesting drawer/modal popup */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden p-6 md:p-8 space-y-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer text-xl"
              >
                ✕
              </button>

              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">
                  Formulario de Pedido
                </span>
                <h3 className="text-xl font-display font-semibold text-white">
                  Solicitud de Servicio
                </h3>
                <p className="text-sm text-white/50">
                  Estás solicitando: <strong className="text-white font-medium">{selectedService.name}</strong> por un costo de <strong className="text-white font-mono">${selectedService.price} USD</strong>.
                </p>
              </div>

              {successMessage ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-emerald-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-semibold">¡Pedido recibido!</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Discord Tag field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-white/60 font-medium">
                      Tu Discord Tag o Nombre de Usuario <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: blandy_99 o blandy#2007"
                      value={discordTag}
                      onChange={(e) => setDiscordTag(e.target.value)}
                      required
                      className="w-full glass-input px-4 py-2 text-xs"
                    />
                    <p className="text-[10px] text-white/40">
                      Un moderador te contactará por este medio para iniciar las coordinaciones de pago y acceso.
                    </p>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <label className="block text-xs font-sans text-white/60 font-medium">
                      Selecciona tu Método de Pago:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "paypal", label: "PayPal", desc: "📧 Rápido", color: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
                        { id: "card", label: "Tarjeta", desc: "💳 Visa/MC", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
                        { id: "crypto", label: "Crypto/USDT", desc: "🪙 Binance Pay", color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
                        { id: "robux", label: "Robux", desc: "🟥 Roblox", color: "border-rose-500/30 text-rose-400 bg-rose-500/5" },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            paymentMethod === method.id
                              ? "border-blue-500 bg-blue-600/10 text-white scale-102"
                              : "border-white/5 hover:border-white/10 text-white/60"
                          }`}
                        >
                          <span className="text-xs font-semibold">{method.label}</span>
                          <span className="text-[9px] opacity-70 font-mono mt-0.5">{method.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Payment sub-forms */}
                    <div className="mt-3 bg-zinc-950/50 rounded-xl p-3 border border-white/5 space-y-3">
                      {paymentMethod === "paypal" && (
                        <div className="space-y-1 text-xs">
                          <p className="text-white/80 font-medium">📬 Facturación por PayPal:</p>
                          <p className="text-white/50 text-[11px] leading-relaxed">
                            Te enviaremos una solicitud de cobro de PayPal por <span className="text-blue-400 font-mono">${selectedService.price} USD</span> directamente a tu correo tras verificar el pedido.
                          </p>
                        </div>
                      )}

                      {paymentMethod === "card" && (
                        <div className="space-y-2 text-left">
                          <p className="text-white/80 text-xs font-medium">💳 Tarjeta de Crédito/Débito:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 space-y-1">
                              <label className="text-[9px] text-white/50">Nombre del Titular</label>
                              <input
                                type="text"
                                placeholder="Juan Pérez"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                required={paymentMethod === "card"}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-white/50">Número de Tarjeta</label>
                              <input
                                type="text"
                                placeholder="4000 1234 5678 9010"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                required={paymentMethod === "card"}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <div className="space-y-1">
                                <label className="text-[9px] text-white/50">Vence</label>
                                <input
                                  type="text"
                                  placeholder="MM/AA"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center"
                                  required={paymentMethod === "card"}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-white/50">CVC</label>
                                <input
                                  type="password"
                                  placeholder="123"
                                  maxLength={4}
                                  value={cardCvc}
                                  onChange={(e) => setCardCvc(e.target.value)}
                                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center"
                                  required={paymentMethod === "card"}
                                />
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] text-emerald-400/80 block mt-1">🔒 Conexión segura encriptada SSL</span>
                        </div>
                      )}

                      {paymentMethod === "crypto" && (
                        <div className="space-y-2 text-left">
                          <p className="text-white/80 text-xs font-medium">🪙 Criptomonedas (USDT-TRC20):</p>
                          <p className="text-[10px] text-white/50 leading-relaxed">
                            Envía <span className="text-amber-400 font-mono">${selectedService.price} USDT</span> a la siguiente dirección de red TRON:
                            <br />
                            <span className="font-mono text-[9px] bg-black px-1.5 py-0.5 rounded text-amber-500 select-all block mt-1 break-all">
                              TY78gXhK99LmQP23sWvRTx8uNmA90pQrsT
                            </span>
                          </p>
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] text-white/50 block">ID de Transacción / TxID:</label>
                            <input
                              type="text"
                              placeholder="Ej: f4b1d6...c92a"
                              value={cryptoTxId}
                              onChange={(e) => setCryptoTxId(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white font-mono"
                              required={paymentMethod === "crypto"}
                            />
                          </div>
                        </div>
                      )}

                      {paymentMethod === "robux" && (
                        <div className="space-y-2 text-left text-xs">
                          <p className="text-white/80 font-medium">🟥 Pago mediante Robux:</p>
                          <p className="text-white/50 text-[10px] leading-relaxed">
                            Aceptamos Robux mediante transferencia de fondos del grupo o pases de juego (Gamepass). Equivalencia de cambio estándar gamer aplicada.
                          </p>
                          <div className="space-y-1">
                            <label className="text-[9px] text-white/50 block">Tu Usuario de Roblox:</label>
                            <input
                              type="text"
                              placeholder="Ej: RobloxGamer_2026"
                              value={robuxUser}
                              onChange={(e) => setRobuxUser(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                              required={paymentMethod === "robux"}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom description field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-white/60 font-medium">
                      Detalles del Pedido (Opcional)
                    </label>
                    <textarea
                      placeholder="Ej: Mi nivel actual es 1400. Tengo la fruta Buddha. Quiero subir en menos de 2 días."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={2}
                      className="w-full glass-input px-4 py-2.5 text-xs resize-none"
                    />
                  </div>

                  {/* Warning banner */}
                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5 text-[10px] text-white/40 flex gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Al hacer clic en Confirmar Pedido, autorizas registrar esta solicitud. El staff verificará tu pago y se comunicará contigo vía Discord.
                    </span>
                  </div>

                  {/* Submission actions */}
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="px-4 py-2 rounded-full font-sans text-xs font-medium text-white/60 hover:text-white transition-colors hover:bg-white/[0.03] cursor-pointer border border-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-medium hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting ? "Enviando..." : "Confirmar Pedido"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
