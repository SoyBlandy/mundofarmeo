import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  DBState, User, AdminCode, CatalogItem, Trade, 
  Service, ServiceRequest, ChatMessage, AdConfiguration, 
  SiteSettings, SecurityLog, FAQ, News 
} from "./src/types";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

// Helper: Escape text to prevent XSS
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// In-memory security and rate limit tracking
const failedLoginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const lastMessageTimestamps = new Map<string, number>();

// Default DB state for bootstrap
const defaultSettings: SiteSettings = {
  name: "MundoFarmeo",
  domain: "mundofarmeo.com",
  logo: "⛵",
  banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
  backgroundType: "glass",
  primaryColor: "#3b82f6",
  buttonStyle: "pill",
  animationSpeed: "normal",
  font: "Inter",
  footerText: "© 2026 MundoFarmeo. Todos los derechos reservados. No estamos afiliados con Roblox Corporation.",
  discordUrl: "https://discord.gg/mundofarmeo",
  youtubeUrl: "https://youtube.com",
  tiktokUrl: "https://tiktok.com",
  policies: "Políticas de MundoFarmeo: Todos los servicios comprados inician en un plazo de 24 horas. Los reembolsos sólo son aplicables si el servicio no ha sido iniciado.",
  contactEmail: "soporte@mundofarmeo.com",
  chatCleanupMinutes: 10,
  faqs: [
    { id: "faq-1", question: "¿Qué es MundoFarmeo?", answer: "Somos una plataforma líder en ofrecer servicios de farmeo profesionales y seguros, así como un espacio para publicar trades aprobados para Blox Fruits y otros juegos." },
    { id: "faq-2", question: "¿Es seguro comprar en la plataforma?", answer: "Absolutamente. Contamos con un equipo calificado y sistemas seguros para proteger tus cuentas. No compartimos tu información." },
    { id: "faq-3", question: "¿Cómo se concretan los trades?", answer: "Explora la sección de Trades. Si ves un trade de tu agrado, dale clic a 'Solicitar' para contactar al ofertante o coordinar mediante nuestro chat global." }
  ],
  news: [
    {
      id: "news-1",
      title: "Gran Inauguración de MundoFarmeo",
      content: "Bienvenidos a MundoFarmeo, tu rincón predilecto para Blox Fruits. Hemos desarrollado un sistema de trade avanzado, chat global optimizado y una tienda de servicios profesionales. ¡Regístrate hoy mismo!",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000",
      date: "2026-06-27",
      author: "MundoFarmeo Staff"
    }
  ]
};

const defaultAds: AdConfiguration = {
  top: {
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200",
    link: "https://discord.gg/mundofarmeo",
    enabled: true
  },
  intermediate: {
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200",
    link: "https://youtube.com",
    enabled: true
  },
  bottom: {
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200",
    link: "https://tiktok.com",
    enabled: true
  },
  sidebar: {
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=400",
    link: "https://discord.gg/mundofarmeo",
    enabled: true
  }
};

const defaultCatalog: CatalogItem[] = [
  { id: "cat-1", name: "Dragon Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1527324688151-0e627063f2b1?q=80&w=300", rarity: "Mythical", value: 6000, description: "La fruta más codiciada con un poder devastador." },
  { id: "cat-2", name: "Kitsune Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300", rarity: "Mythical", value: 5500, description: "Velocidad extrema y habilidades espirituales de zorro." },
  { id: "cat-3", name: "Leopard Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=300", rarity: "Mythical", value: 4500, description: "Poderosa transformación en leopardo híbrido." },
  { id: "cat-4", name: "Dough Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300", rarity: "Mythical", value: 3500, description: "Despertar espectacular con ataques adhesivos de masa." },
  { id: "cat-5", name: "T-Rex Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1559969143-b2defc64119e?q=80&w=300", rarity: "Mythical", value: 3000, description: "Poder de dinosaurio prehistórico con rugidos sónicos." },
  { id: "cat-6", name: "Buddha Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300", rarity: "Legendary", value: 2200, description: "La mejor fruta para farmeo y defensa física." },
  { id: "cat-7", name: "Portal Fruit", category: "fruit", image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300", rarity: "Legendary", value: 1800, description: "Teletransportación y portales dimensionales de combate." },
  { id: "cat-8", name: "Dark Blade (Yoru)", category: "sword", image: "https://images.unsplash.com/photo-1589703900743-4b7449261b5b?q=80&w=300", rarity: "Mythical", value: 5000, description: "Espada legendaria negra que corta dimensiones." },
  { id: "cat-9", name: "Cursed Dual Katana", category: "sword", image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=300", rarity: "Mythical", value: 4500, description: "La unión de la espada Enma y la Tushita." }
];

const defaultServices: Service[] = [
  { id: "serv-1", key: "level", name: "Farmeo de Niveles (1 - 2550 Max)", description: "Subimos tu cuenta al nivel máximo de forma ultra rápida y segura. Garantía de discreción.", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=300", price: 15, originalPrice: 25, discountPercentage: 40, status: "available", estimatedTime: "24 a 48 horas", category: "Blox Fruits" },
  { id: "serv-2", key: "money", name: "Farmeo de Beli (Dinero)", description: "Conseguimos millones de Beli para que compres cualquier fruta, espada o habilidad sin esfuerzo.", image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=300", price: 8, originalPrice: 12, discountPercentage: 33, status: "available", estimatedTime: "12 horas", category: "Blox Fruits" },
  { id: "serv-3", key: "fragments", name: "Farmeo de Fragmentos", description: "Farmeamos la cantidad de fragmentos que necesites para tus despertares o cambios de raza.", image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=300", price: 10, status: "available", estimatedTime: "12 horas", category: "Blox Fruits" },
  { id: "serv-4", key: "raids", name: "Raids Completas / Despertar", description: "Te ayudamos a completar cualquier Raid que desees o despertamos por completo tu fruta favorita.", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=300", price: 5, status: "available", estimatedTime: "1 a 3 horas", category: "Blox Fruits" },
  { id: "serv-5", key: "leviathan", name: "Cacería de Leviathan", description: "Cazamos al imponente Leviathan para conseguir su corazón y desbloquear el estilo de pelea Sanguine Art.", image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?q=80&w=300", price: 25, originalPrice: 35, discountPercentage: 28, status: "available", estimatedTime: "24 horas", category: "Blox Fruits" },
  { id: "serv-6", key: "race_v4", name: "Desbloquear Raza V4 (Trials)", description: "Completamos los Trials necesarios para subir tu raza (Ghoul, Cyborg, Mink, Rabbit, etc.) al grado V4.", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300", price: 30, status: "available", estimatedTime: "24 a 48 horas", category: "Blox Fruits" },
  { id: "serv-7", key: "god_human", name: "Estilo God Human", description: "Farmear los estilos de pelea necesarios y conseguir todos los materiales para desbloquear God Human.", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300", price: 20, status: "available", estimatedTime: "24 horas", category: "Blox Fruits" },
  { id: "serv-8", key: "cdk", name: "Espada CDK (Cursed Dual Katana)", description: "Hacemos todo el proceso de las misiones de Enma y Tushita para conseguir esta espada mítica.", image: "https://images.unsplash.com/photo-1589703900743-4b7449261b5b?q=80&w=300", price: 25, status: "available", estimatedTime: "24 a 48 horas", category: "Blox Fruits" },
  { id: "serv-9", key: "instinct_v2", name: "Desbloqueo de Instinct V2", description: "Realizamos la misión del Citizen, recolectamos manzanas, plátanos y piñas, y desbloqueamos Instinct V2.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300", price: 15, status: "available", estimatedTime: "12 horas", category: "Blox Fruits" },
  { id: "serv-10", key: "materials", name: "Farmeo de Materiales", description: "Recolectamos materiales raros como Huesos, Ectoplasma, Colmillos de Vampiro, Mineral de Oro, etc.", image: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=300", price: 5, status: "available", estimatedTime: "6 a 12 horas", category: "Blox Fruits" },
  { id: "serv-11", key: "bosses", name: "Cacería de Bosses", description: "Eliminamos a jefes como Rip_Indra, Dough King o Cake Queen para conseguir sus drops exclusivos.", image: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?q=80&w=300", price: 8, status: "available", estimatedTime: "6 horas", category: "Blox Fruits" },
  { id: "serv-12", key: "events", name: "Eventos Especiales (Navidad, etc.)", description: "Farmear los drops y monedas de los eventos activos del juego para que no te pierdas nada.", image: "https://images.unsplash.com/photo-1543589077-47d8160677a0?q=80&w=300", price: 12, status: "available", estimatedTime: "12 a 24 horas", category: "Blox Fruits" },
  { id: "serv-13", key: "custom", name: "Servicio de Farmeo Personalizado", description: "Pide exactamente lo que necesitas. Nuestro equipo estimará un precio adaptado a tus metas.", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300", price: 5, status: "available", estimatedTime: "Variable", category: "Blox Fruits" }
];

const defaultTrades: Trade[] = [
  {
    id: "trade-1",
    title: "¡Oferta Especial Dragon!",
    description: "Tengo Dragon de sobra. Busco Cursed Dual Katana y una fruta Buddha para nivelar.",
    itemsOffered: ["cat-1"],
    itemsWanted: ["cat-9", "cat-6"],
    creatorId: "user-system",
    creatorName: "SuperAdmin blandy",
    creatorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
    rarity: "Mythical",
    value: 6000,
    quantity: 1,
    status: "Available",
    tags: ["Dragon", "CDK", "Buddha"],
    category: "Blox Fruits",
    isSpecial: true,
    isPinned: true,
    isHidden: false,
    order: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: "trade-2",
    title: "Cambio Kitsune por Dragon + Add",
    description: "Busco principalmente Dragon y Leopard. Escucho ofertas razonables.",
    itemsOffered: ["cat-2"],
    itemsWanted: ["cat-1", "cat-3"],
    creatorId: "user-system",
    creatorName: "TradeMaster_BF",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
    rarity: "Mythical",
    value: 5500,
    quantity: 1,
    status: "Available",
    tags: ["Kitsune", "Dragon", "Leopard"],
    category: "Blox Fruits",
    isSpecial: false,
    isPinned: false,
    isHidden: false,
    order: 1,
    createdAt: new Date().toISOString()
  }
];

const defaultChat: ChatMessage[] = [
  {
    id: "chat-1",
    username: "AdminBlandy",
    userId: "user-system",
    text: "¡Hola a todos! Bienvenidos al Chat Global de MundoFarmeo. Aquí pueden acordar trades, chatear sanamente o hacer consultas.",
    timestamp: new Date().toISOString(),
    isPinned: true,
    roleBadge: "Super Admin",
    roleColor: "#3b82f6"
  },
  {
    id: "chat-2",
    username: "GamerPro_99",
    userId: "user-gamer-1",
    text: "Excelente servicio de farmeo. Subieron mi cuenta a nivel máximo en sólo un día, ¡gracias!",
    timestamp: new Date().toISOString(),
    isPinned: false
  }
];

const defaultCodes: AdminCode[] = [
  {
    id: "code-super",
    code: "blandygerra2007",
    label: "Super Admin Principal",
    suspended: false,
    permissions: {
      editTrades: true,
      deleteTrades: true,
      createTrades: true,
      editServices: true,
      deleteServices: true,
      createServices: true,
      editNews: true,
      manageUsers: true,
      manageChat: true,
      ban: true,
      mute: true,
      kick: true,
      viewLogs: true,
      manageAds: true,
      changeDesign: true,
      modifyDb: true
    }
  }
];

// Load or Initialize database state
let db: DBState = {
  users: [],
  adminCodes: defaultCodes,
  catalog: defaultCatalog,
  trades: defaultTrades,
  services: defaultServices,
  serviceRequests: [],
  chatMessages: defaultChat,
  ads: defaultAds,
  siteSettings: defaultSettings,
  logs: []
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(fileData);
      
      // Ensure all arrays are present
      db = {
        users: parsed.users || [],
        adminCodes: parsed.adminCodes || defaultCodes,
        catalog: parsed.catalog || defaultCatalog,
        trades: parsed.trades || defaultTrades,
        services: parsed.services || defaultServices,
        serviceRequests: parsed.serviceRequests || [],
        chatMessages: parsed.chatMessages || defaultChat,
        ads: parsed.ads || defaultAds,
        siteSettings: parsed.siteSettings || defaultSettings,
        logs: parsed.logs || []
      };
      
      // Ensure the master code always exists and remains suspended=false
      if (!db.adminCodes.some(c => c.code === "blandygerra2007")) {
        db.adminCodes.push(defaultCodes[0]);
      } else {
        const idx = db.adminCodes.findIndex(c => c.code === "blandygerra2007");
        db.adminCodes[idx] = { ...defaultCodes[0], ...db.adminCodes[idx], suspended: false };
      }
      console.log("Database loaded successfully from " + DB_FILE);
    } else {
      saveDatabase();
      console.log("Database file created with default presets.");
    }
  } catch (error) {
    console.error("Error reading database file, loading defaults...", error);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Write system action security log
function logAction(username: string, ip: string, action: string, details: string) {
  const newLog: SecurityLog = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    username,
    ip,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(newLog);
  // Keep logs at a reasonable limit (e.g., 500 max)
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  saveDatabase();
}

async function run() {
  loadDatabase();

  const app = express();
  app.set("trust proxy", true);
  
  // Custom parsing with large payloads to support custom base64 image uploads smoothly
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Anti-spam & rate limit helpers
  function checkAntiSpam(username: string): boolean {
    const now = Date.now();
    const lastTime = lastMessageTimestamps.get(username);
    if (lastTime && now - lastTime < 1800) { // 1.8 seconds threshold
      return false;
    }
    lastMessageTimestamps.set(username, now);
    return true;
  }

  // ----------------- API ENDPOINTS -----------------

  // 1. SETTINGS & CONFIGURATION
  app.get("/api/settings", (req, res) => {
    res.json({
      siteSettings: db.siteSettings,
      ads: db.ads
    });
  });

  app.post("/api/settings", (req, res) => {
    const { code, settings } = req.body;
    const admin = db.adminCodes.find(c => c.code === code && !c.suspended);
    if (!admin || !admin.permissions.changeDesign) {
      return res.status(403).json({ error: "No tienes permiso para cambiar el diseño del sitio." });
    }

    db.siteSettings = { ...db.siteSettings, ...settings };
    logAction(admin.label, req.ip, "CAMBIAR_DISENO", "Se modificó la configuración y personalización general del sitio.");
    saveDatabase();
    res.json({ success: true, siteSettings: db.siteSettings });
  });

  // 2. AUTHENTICATION & USERS
  app.post("/api/auth/register", (req, res) => {
    const { username, avatar } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: "El nombre de usuario debe tener al menos 2 caracteres." });
    }

    const cleanUsername = escapeHTML(username.trim());
    const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "El nombre de usuario ya está registrado." });
    }

    const newUser: User = {
      id: "usr-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      username: cleanUsername,
      avatar: avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cleanUsername}`,
      status: "active",
      warns: 0,
      ipHistory: [req.ip],
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    logAction(newUser.username, req.ip, "REGISTRO_USUARIO", `Nuevo usuario registrado con ID: ${newUser.id}`);
    saveDatabase();

    res.json({ success: true, user: newUser });
  });

  app.post("/api/auth/login", (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Falta el nombre de usuario." });
    }

    const cleanUsername = escapeHTML(username.trim());
    
    // Check login lockouts
    const attemptKey = `${req.ip}-${cleanUsername}`;
    const block = failedLoginAttempts.get(attemptKey);
    if (block && block.blockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((block.blockedUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Demasiados intentos. Bloqueado temporalmente por ${minutesLeft} minutos.` });
    }

    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (!user) {
      // Record failed attempt
      const attempts = (block ? block.count : 0) + 1;
      if (attempts >= 5) {
        failedLoginAttempts.set(attemptKey, { count: attempts, blockedUntil: Date.now() + 5 * 60 * 1000 }); // 5 minutes lockout
        logAction("ANONYMOUS", req.ip, "BLOQUEO_INTENTOS", `IP bloqueada temporalmente por exceso de intentos con usuario: ${cleanUsername}`);
      } else {
        failedLoginAttempts.set(attemptKey, { count: attempts, blockedUntil: 0 });
      }
      return res.status(404).json({ error: "Usuario no encontrado. Regístrate para comenzar." });
    }

    if (user.status === "banned") {
      return res.status(403).json({ error: `Esta cuenta está permanentemente baneada. Motivo: ${user.banReason || "Infracción de reglas"}` });
    }

    if (user.status === "muted" && user.muteUntil && new Date(user.muteUntil).getTime() > Date.now()) {
      // Allow login but they are muted in chat
    } else if (user.status === "muted") {
      // Mute expired
      user.status = "active";
    }

    // Add IP to history
    if (!user.ipHistory.includes(req.ip)) {
      user.ipHistory.push(req.ip);
    }

    // Reset failed login attempts
    failedLoginAttempts.delete(attemptKey);

    logAction(user.username, req.ip, "INICIO_SESION", "Inicio de sesión correcto.");
    saveDatabase();

    res.json({ success: true, user });
  });

  // Admin and Creator Code login validation
  app.post("/api/auth/admin-login", (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Por favor proporciona un código de creador o administrador." });
    }

    const admin = db.adminCodes.find(c => c.code === code);
    if (!admin) {
      return res.status(401).json({ error: "Código de Administrador inválido." });
    }

    if (admin.suspended) {
      return res.status(403).json({ error: "Este código de creador o administrador ha sido suspendido por el administrador principal." });
    }

    logAction(admin.label, req.ip, "LOGIN_ADMINISTRADOR", `Acceso concedido al panel de administración.`);
    res.json({ success: true, admin });
  });

  // 3. ADMIN CODES MANAGEMENT
  app.get("/api/admin/codes", (req, res) => {
    const { code } = req.query;
    const admin = db.adminCodes.find(c => c.code === code && !c.suspended);
    if (!admin || !admin.permissions.manageUsers) {
      return res.status(403).json({ error: "No autorizado." });
    }
    res.json({ codes: db.adminCodes });
  });

  app.post("/api/admin/codes", (req, res) => {
    const { authCode, codeData } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    
    // Check permissions
    if (!admin || !admin.permissions.manageUsers) {
      return res.status(403).json({ error: "No autorizado para administrar códigos." });
    }

    // Create or update code
    if (codeData.id) {
      // Cannot edit master code unless they are using the master code itself
      if (codeData.code === "blandygerra2007" && authCode !== "blandygerra2007") {
        return res.status(403).json({ error: "No puedes editar el código del Super Admin principal." });
      }

      const idx = db.adminCodes.findIndex(c => c.id === codeData.id);
      if (idx !== -1) {
        db.adminCodes[idx] = { 
          ...db.adminCodes[idx], 
          ...codeData,
          // Prevent master code suspend
          suspended: codeData.code === "blandygerra2007" ? false : codeData.suspended
        };
        logAction(admin.label, req.ip, "ACTUALIZAR_CODIGO_ADMIN", `Código '${codeData.code}' actualizado.`);
      }
    } else {
      // Create new
      if (db.adminCodes.some(c => c.code === codeData.code)) {
        return res.status(400).json({ error: "Este código de administrador ya está registrado." });
      }
      const newCode: AdminCode = {
        id: "code-" + Date.now(),
        code: codeData.code,
        label: codeData.label,
        permissions: codeData.permissions,
        suspended: false,
        createdBy: admin.label
      };
      db.adminCodes.push(newCode);
      logAction(admin.label, req.ip, "CREAR_CODIGO_ADMIN", `Se creó el código de administrador '${codeData.code}'.`);
    }

    saveDatabase();
    res.json({ success: true, codes: db.adminCodes });
  });

  app.delete("/api/admin/codes/:id", (req, res) => {
    const { authCode } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.manageUsers) {
      return res.status(403).json({ error: "No autorizado." });
    }

    const target = db.adminCodes.find(c => c.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: "Código no encontrado." });
    }

    if (target.code === "blandygerra2007") {
      return res.status(403).json({ error: "El código de Super Admin principal es permanente y no puede ser eliminado." });
    }

    db.adminCodes = db.adminCodes.filter(c => c.id !== req.params.id);
    logAction(admin.label, req.ip, "ELIMINAR_CODIGO_ADMIN", `Se eliminó el código '${target.code}'.`);
    saveDatabase();

    res.json({ success: true, codes: db.adminCodes });
  });

  // 4. USERS MANAGEMENT
  app.get("/api/users", (req, res) => {
    const { code } = req.query;
    const admin = db.adminCodes.find(c => c.code === code && !c.suspended);
    if (!admin || !admin.permissions.manageUsers) {
      return res.status(403).json({ error: "No autorizado." });
    }
    res.json({ users: db.users });
  });

  app.post("/api/users/update-profile", (req, res) => {
    const { userId, username, avatar } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (user.status === "banned") {
      return res.status(403).json({ error: "Tu cuenta está baneada." });
    }

    if (username && username.trim() !== user.username) {
      const cleanUsername = escapeHTML(username.trim());
      const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== userId);
      if (existing) {
        return res.status(400).json({ error: "Este nombre de usuario ya está tomado." });
      }
      logAction(user.username, req.ip, "EDITAR_PERFIL", `Nombre cambiado de '${user.username}' a '${cleanUsername}'`);
      user.username = cleanUsername;
    }

    if (avatar) {
      user.avatar = avatar;
    }

    saveDatabase();
    res.json({ success: true, user });
  });

  app.post("/api/users/moderate", (req, res) => {
    const { authCode, targetUserId, actionType, reason, durationMinutes } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin) {
      return res.status(403).json({ error: "No autorizado." });
    }

    const user = db.users.find(u => u.id === targetUserId);
    if (!user) {
      return res.status(404).json({ error: "Usuario a moderar no encontrado." });
    }

    if (actionType === "ban") {
      if (!admin.permissions.ban) return res.status(403).json({ error: "No tienes permisos de baneo." });
      user.status = "banned";
      user.banReason = reason || "Infracción de reglas de MundoFarmeo";
      logAction(admin.label, req.ip, "BANEOS", `Usuario '${user.username}' baneado permanentemente. Motivo: ${user.banReason}`);
    } else if (actionType === "mute") {
      if (!admin.permissions.mute) return res.status(403).json({ error: "No tienes permisos para mutear." });
      user.status = "muted";
      const duration = durationMinutes || 60;
      user.muteUntil = new Date(Date.now() + duration * 60 * 1000).toISOString();
      logAction(admin.label, req.ip, "SILENCIAR", `Usuario '${user.username}' silenciado por ${duration} minutos. Motivo: ${reason || "No especificado"}`);
    } else if (actionType === "warn") {
      user.warns += 1;
      logAction(admin.label, req.ip, "ADVERTENCIA", `Usuario '${user.username}' advertido. Total advertencias: ${user.warns}. Motivo: ${reason || "No especificado"}`);
    } else if (actionType === "unban" || actionType === "unmute") {
      user.status = "active";
      user.muteUntil = undefined;
      user.banReason = undefined;
      logAction(admin.label, req.ip, "LEVANTAR_SANCON", `Sanciones removidas para el usuario '${user.username}'`);
    }

    saveDatabase();
    res.json({ success: true, user });
  });

  // 5. CATALOG MANAGEMENT
  app.get("/api/catalog", (req, res) => {
    res.json({ catalog: db.catalog });
  });

  app.post("/api/catalog", (req, res) => {
    const { authCode, item } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || (!admin.permissions.createTrades && !admin.permissions.editTrades)) {
      return res.status(403).json({ error: "No tienes permisos para modificar el catálogo." });
    }

    if (item.id) {
      // Update
      const idx = db.catalog.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        db.catalog[idx] = { ...db.catalog[idx], ...item };
        logAction(admin.label, req.ip, "EDITAR_CATALOGO", `Objeto de catálogo '${item.name}' modificado.`);
      }
    } else {
      // Create
      const newItem: CatalogItem = {
        id: "cat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        name: item.name,
        category: item.category || "other",
        image: item.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300",
        rarity: item.rarity || "Common",
        value: item.value || 0,
        description: item.description || "",
        quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
        status: item.status || "Disponible",
        tags: item.tags || ""
      };
      db.catalog.push(newItem);
      logAction(admin.label, req.ip, "CREAR_CATALOGO", `Nuevo objeto añadido al catálogo: '${newItem.name}'`);
    }

    saveDatabase();
    res.json({ success: true, catalog: db.catalog });
  });

  app.delete("/api/catalog/:id", (req, res) => {
    const { authCode } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.deleteTrades) {
      return res.status(403).json({ error: "No tienes permiso para eliminar del catálogo." });
    }

    const item = db.catalog.find(i => i.id === req.params.id);
    db.catalog = db.catalog.filter(i => i.id !== req.params.id);
    logAction(admin.label, req.ip, "ELIMINAR_CATALOGO", `Objeto eliminado del catálogo: '${item?.name || req.params.id}'`);
    saveDatabase();

    res.json({ success: true, catalog: db.catalog });
  });

  // 6. TRADES MANAGEMENT
  app.get("/api/trades", (req, res) => {
    // Sort logic: pinned first, then by custom sorting/order, then date
    const sortedTrades = [...db.trades].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.order !== b.order) return a.order - b.order;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ trades: sortedTrades });
  });

  app.post("/api/trades", (req, res) => {
    const { authCode, userId, trade } = req.body;
    
    // Can be created by either an authenticated user or an admin
    let creatorName = "Invitado";
    let creatorAvatar = "";
    let isSpecial = false;
    let isPinned = false;
    let isHidden = false;

    if (authCode) {
      const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
      if (!admin || !admin.permissions.createTrades) {
        return res.status(403).json({ error: "No autorizado para publicar trades oficiales." });
      }
      creatorName = admin.label + " ⭐";
      creatorAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150";
      isSpecial = trade.isSpecial || false;
      isPinned = trade.isPinned || false;
      isHidden = trade.isHidden || false;
    } else {
      const user = db.users.find(u => u.id === userId);
      if (!user) {
        return res.status(401).json({ error: "Inicia sesión para poder publicar una oferta de trade." });
      }
      if (user.status === "banned") {
        return res.status(403).json({ error: "Tu cuenta ha sido suspendida." });
      }
      creatorName = user.username;
      creatorAvatar = user.avatar || "";
    }

    const orderNumber = trade.order !== undefined ? trade.order : db.trades.length;

    const newTrade: Trade = {
      id: "trade-" + Date.now(),
      title: escapeHTML(trade.title),
      description: escapeHTML(trade.description || ""),
      itemsOffered: trade.itemsOffered || [],
      itemsWanted: trade.itemsWanted || [],
      creatorId: userId || "admin",
      creatorName,
      creatorAvatar,
      rarity: trade.rarity || "Common",
      value: trade.value || 0,
      quantity: trade.quantity || 1,
      status: trade.status || "Available",
      tags: trade.tags || [],
      category: trade.category || "Blox Fruits",
      isSpecial,
      isPinned,
      isHidden,
      order: orderNumber,
      createdAt: new Date().toISOString()
    };

    db.trades.push(newTrade);
    logAction(creatorName, req.ip, "CREAR_TRADE", `Oferta de trade creada: '${newTrade.title}'`);
    saveDatabase();

    res.json({ success: true, trade: newTrade, trades: db.trades });
  });

  app.put("/api/trades/:id", (req, res) => {
    const { authCode, userId, updatedTrade } = req.body;
    const trade = db.trades.find(t => t.id === req.params.id);
    if (!trade) {
      return res.status(404).json({ error: "Trade no encontrado." });
    }

    // Auth check: either trade creator or admin with edit permission
    let authorized = false;
    let modifierName = "Sistema";

    if (authCode) {
      const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
      if (admin && admin.permissions.editTrades) {
        authorized = true;
        modifierName = admin.label + " (Admin)";
      }
    } else if (userId && trade.creatorId === userId) {
      authorized = true;
      modifierName = trade.creatorName;
    }

    if (!authorized) {
      return res.status(403).json({ error: "No tienes permisos para editar este trade." });
    }

    // Merge updates
    trade.title = escapeHTML(updatedTrade.title || trade.title);
    trade.description = escapeHTML(updatedTrade.description || trade.description);
    trade.itemsOffered = updatedTrade.itemsOffered || trade.itemsOffered;
    trade.itemsWanted = updatedTrade.itemsWanted || trade.itemsWanted;
    trade.status = updatedTrade.status || trade.status;
    trade.rarity = updatedTrade.rarity || trade.rarity;
    trade.value = updatedTrade.value !== undefined ? updatedTrade.value : trade.value;
    trade.quantity = updatedTrade.quantity !== undefined ? updatedTrade.quantity : trade.quantity;
    trade.tags = updatedTrade.tags || trade.tags;
    trade.category = updatedTrade.category || trade.category;
    
    if (authCode) {
      // Admin exclusive settings
      trade.isSpecial = updatedTrade.isSpecial !== undefined ? updatedTrade.isSpecial : trade.isSpecial;
      trade.isPinned = updatedTrade.isPinned !== undefined ? updatedTrade.isPinned : trade.isPinned;
      trade.isHidden = updatedTrade.isHidden !== undefined ? updatedTrade.isHidden : trade.isHidden;
      trade.order = updatedTrade.order !== undefined ? updatedTrade.order : trade.order;
    }

    logAction(modifierName, req.ip, "EDITAR_TRADE", `Trade ID: ${trade.id} editado.`);
    saveDatabase();

    res.json({ success: true, trade, trades: db.trades });
  });

  app.delete("/api/trades/:id", (req, res) => {
    const { authCode, userId } = req.body;
    const trade = db.trades.find(t => t.id === req.params.id);
    if (!trade) {
      return res.status(404).json({ error: "Trade no encontrado." });
    }

    let authorized = false;
    let modifierName = "Sistema";

    if (authCode) {
      const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
      if (admin && admin.permissions.deleteTrades) {
        authorized = true;
        modifierName = admin.label + " (Admin)";
      }
    } else if (userId && trade.creatorId === userId) {
      authorized = true;
      modifierName = trade.creatorName;
    }

    if (!authorized) {
      return res.status(403).json({ error: "No tienes permisos para eliminar este trade." });
    }

    db.trades = db.trades.filter(t => t.id !== req.params.id);
    logAction(modifierName, req.ip, "ELIMINAR_TRADE", `Se eliminó el trade: '${trade.title}'`);
    saveDatabase();

    res.json({ success: true, trades: db.trades });
  });

  // 7. SERVICES SHOP
  app.get("/api/services", (req, res) => {
    res.json({ services: db.services });
  });

  app.post("/api/services", (req, res) => {
    const { authCode, service } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || (!admin.permissions.createServices && !admin.permissions.editServices)) {
      return res.status(403).json({ error: "No autorizado." });
    }

    if (service.id) {
      // Edit
      const idx = db.services.findIndex(s => s.id === service.id);
      if (idx !== -1) {
        db.services[idx] = { ...db.services[idx], ...service };
        logAction(admin.label, req.ip, "EDITAR_SERVICIO", `Servicio '${service.name}' actualizado.`);
      }
    } else {
      // Create
      const newService: Service = {
        id: "serv-" + Date.now(),
        key: service.key || "custom_" + Date.now(),
        name: service.name,
        description: service.description,
        image: service.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300",
        price: service.price || 0,
        originalPrice: service.originalPrice || undefined,
        discountPercentage: service.discountPercentage || undefined,
        status: service.status || "available",
        estimatedTime: service.estimatedTime || "24 horas",
        category: service.category || "Blox Fruits"
      };
      db.services.push(newService);
      logAction(admin.label, req.ip, "CREAR_SERVICIO", `Nuevo servicio de farmeo añadido: '${newService.name}'`);
    }

    saveDatabase();
    res.json({ success: true, services: db.services });
  });

  app.delete("/api/services/:id", (req, res) => {
    const { authCode } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.deleteServices) {
      return res.status(403).json({ error: "No autorizado." });
    }

    const service = db.services.find(s => s.id === req.params.id);
    db.services = db.services.filter(s => s.id !== req.params.id);
    logAction(admin.label, req.ip, "ELIMINAR_SERVICIO", `Servicio eliminado: '${service?.name || req.params.id}'`);
    saveDatabase();

    res.json({ success: true, services: db.services });
  });

  // Services Requests (Purchases / Orders)
  app.get("/api/services/requests", (req, res) => {
    const { code } = req.query;
    const admin = db.adminCodes.find(c => c.code === code && !c.suspended);
    if (!admin || !admin.permissions.editServices) {
      return res.status(403).json({ error: "No autorizado." });
    }
    res.json({ serviceRequests: db.serviceRequests });
  });

  app.post("/api/services/request", (req, res) => {
    const { userId, serviceId, discordTag, details } = req.body;
    
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: "Inicia sesión para realizar un pedido." });
    }

    if (user.status === "banned") {
      return res.status(403).json({ error: "Tu cuenta ha sido bloqueada." });
    }

    const service = db.services.find(s => s.id === serviceId);
    if (!service) {
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    const request: ServiceRequest = {
      id: "req-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      serviceId,
      serviceName: service.name,
      username: user.username,
      discordTag: discordTag ? escapeHTML(discordTag) : undefined,
      details: escapeHTML(details || "Sin detalles adicionales."),
      status: "pending",
      price: service.price,
      createdAt: new Date().toISOString()
    };

    db.serviceRequests.unshift(request);
    logAction(user.username, req.ip, "PEDIDO_SERVICIO", `Nuevo pedido para: '${service.name}' ($${service.price})`);
    saveDatabase();

    res.json({ success: true, request });
  });

  app.put("/api/services/requests/:id", (req, res) => {
    const { authCode, status } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.editServices) {
      return res.status(403).json({ error: "No autorizado." });
    }

    const request = db.serviceRequests.find(r => r.id === req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    request.status = status;
    logAction(admin.label, req.ip, "PEDIDO_ESTADO", `Pedido ID: ${request.id} cambiado a estado '${status}'`);
    saveDatabase();

    res.json({ success: true, request, serviceRequests: db.serviceRequests });
  });

  // 8. CHAT SYSTEM
  function cleanupExpiredMessages() {
    const minutes = db.siteSettings.chatCleanupMinutes;
    if (minutes !== undefined && minutes > 0) {
      const cutoffTime = Date.now() - minutes * 60 * 1000;
      const initialCount = db.chatMessages.length;
      db.chatMessages = db.chatMessages.filter(msg => {
        if (msg.isPinned) return true;
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= cutoffTime;
      });
      if (db.chatMessages.length !== initialCount) {
        saveDatabase();
      }
    }
  }

  // Run cleanup every 15 seconds
  setInterval(cleanupExpiredMessages, 15000);

  app.get("/api/chat", (req, res) => {
    cleanupExpiredMessages();
    res.json({ messages: db.chatMessages.slice(-100) });
  });

  app.post("/api/chat", (req, res) => {
    cleanupExpiredMessages();
    const { userId, authCode, text, sticker, replyTo } = req.body;

    let senderName = "";
    let senderId = "anonymous";
    let roleBadge = undefined;
    let roleColor = undefined;

    if (authCode) {
      const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
      if (!admin) {
        return res.status(403).json({ error: "Acceso denegado." });
      }
      senderName = admin.label;
      senderId = "admin-" + admin.id;
      roleBadge = admin.code === "blandygerra2007" ? "Super Admin" : "Administrador";
      roleColor = "#3b82f6"; // Primary blue
    } else {
      const user = db.users.find(u => u.id === userId);
      if (!user) {
        return res.status(401).json({ error: "Regístrate o inicia sesión para participar en el chat global." });
      }

      if (user.status === "banned") {
        return res.status(403).json({ error: "Tu cuenta está suspendida." });
      }

      if (user.status === "muted" && user.muteUntil && new Date(user.muteUntil).getTime() > Date.now()) {
        const secondsLeft = Math.ceil((new Date(user.muteUntil).getTime() - Date.now()) / 1000);
        return res.status(403).json({ error: `Estás silenciado. Podrás volver a hablar en ${secondsLeft} segundos.` });
      }

      // Check anti-spam
      if (!checkAntiSpam(user.username)) {
        return res.status(429).json({ error: "Por favor no envíes mensajes tan rápido (Sistema anti-spam)." });
      }

      senderName = user.username;
      senderId = user.id;
    }

    if ((!text || text.trim() === "") && !sticker) {
      return res.status(400).json({ error: "El mensaje no puede estar vacío." });
    }

    let replyText = undefined;
    if (replyTo) {
      const original = db.chatMessages.find(m => m.id === replyTo);
      if (original) {
        replyText = original.text.length > 40 ? original.text.substring(0, 40) + "..." : original.text;
      }
    }

    const cleanText = text ? escapeHTML(text.substring(0, 500)) : "";

    const newMessage: ChatMessage = {
      id: "chat-msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      username: senderName,
      userId: senderId,
      text: cleanText,
      sticker: sticker || undefined,
      timestamp: new Date().toISOString(),
      replyTo: replyTo || undefined,
      replyText,
      isPinned: false,
      roleBadge,
      roleColor,
      isStickerOnly: !!(!cleanText && sticker)
    };

    db.chatMessages.push(newMessage);
    // Hard limit total messages in database file
    if (db.chatMessages.length > 400) {
      db.chatMessages = db.chatMessages.slice(-400);
    }

    saveDatabase();
    res.json({ success: true, message: newMessage, messages: db.chatMessages.slice(-100) });
  });

  app.put("/api/chat/:id", (req, res) => {
    const { userId, authCode, text } = req.body;
    const msg = db.chatMessages.find(m => m.id === req.params.id);
    if (!msg) {
      return res.status(404).json({ error: "Mensaje no encontrado." });
    }

    let authorized = false;
    if (authCode) {
      const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
      if (admin && admin.permissions.manageChat) {
        authorized = true;
      }
    } else if (userId && msg.userId === userId) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ error: "No tienes permiso para editar este mensaje." });
    }

    msg.text = escapeHTML(text.substring(0, 500)) + " (editado)";
    saveDatabase();
    res.json({ success: true, messages: db.chatMessages.slice(-100) });
  });

  app.delete("/api/chat/:id", (req, res) => {
    const { userId, authCode } = req.body;
    const msg = db.chatMessages.find(m => m.id === req.params.id);
    if (!msg) {
      return res.status(404).json({ error: "Mensaje no encontrado." });
    }

    let authorized = false;
    let operator = "Sistema";
    if (authCode) {
      const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
      if (admin && admin.permissions.manageChat) {
        authorized = true;
        operator = admin.label + " (Admin)";
      }
    } else if (userId && msg.userId === userId) {
      authorized = true;
      operator = msg.username;
    }

    if (!authorized) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este mensaje." });
    }

    db.chatMessages = db.chatMessages.filter(m => m.id !== req.params.id);
    logAction(operator, req.ip, "BORRAR_MENSAJE", `Mensaje de '${msg.username}' eliminado.`);
    saveDatabase();
    res.json({ success: true, messages: db.chatMessages.slice(-100) });
  });

  app.post("/api/chat/:id/pin", (req, res) => {
    const { authCode } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.manageChat) {
      return res.status(403).json({ error: "No tienes permisos de moderador de chat." });
    }

    const msg = db.chatMessages.find(m => m.id === req.params.id);
    if (!msg) {
      return res.status(404).json({ error: "Mensaje no encontrado." });
    }

    msg.isPinned = !msg.isPinned;
    logAction(admin.label, req.ip, "FIJAR_MENSAJE", `Mensaje ID: ${msg.id} de '${msg.username}' ${msg.isPinned ? 'fijado' : 'desfijado'}.`);
    saveDatabase();
    res.json({ success: true, messages: db.chatMessages.slice(-100) });
  });

  // 9. LOGS
  app.get("/api/logs", (req, res) => {
    const { code } = req.query;
    const admin = db.adminCodes.find(c => c.code === code && !c.suspended);
    if (!admin || !admin.permissions.viewLogs) {
      return res.status(403).json({ error: "No tienes permisos para ver logs del sistema." });
    }
    res.json({ logs: db.logs });
  });

  // 10. ADVERTISEMENTS
  app.post("/api/ads", (req, res) => {
    const { authCode, ads } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.manageAds) {
      return res.status(403).json({ error: "No tienes permiso para administrar anuncios." });
    }

    db.ads = { ...db.ads, ...ads };
    logAction(admin.label, req.ip, "ADMINISTRAR_ANUNCIOS", "Actualización general de los espacios publicitarios.");
    saveDatabase();
    res.json({ success: true, ads: db.ads });
  });

  // 11. FAQS AND NEWS (ADMINISTRABLE)
  app.post("/api/news", (req, res) => {
    const { authCode, newsItem } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.editNews) {
      return res.status(403).json({ error: "No tienes permisos para administrar noticias." });
    }

    if (newsItem.id) {
      const idx = db.siteSettings.news.findIndex(n => n.id === newsItem.id);
      if (idx !== -1) {
        db.siteSettings.news[idx] = { ...db.siteSettings.news[idx], ...newsItem };
        logAction(admin.label, req.ip, "EDITAR_NOTICIA", `Noticia '${newsItem.title}' modificada.`);
      }
    } else {
      const newNews: News = {
        id: "news-" + Date.now(),
        title: escapeHTML(newsItem.title),
        content: escapeHTML(newsItem.content),
        image: newsItem.image || undefined,
        date: new Date().toISOString().split("T")[0],
        author: admin.label
      };
      db.siteSettings.news.unshift(newNews);
      logAction(admin.label, req.ip, "CREAR_NOTICIA", `Nueva noticia creada: '${newNews.title}'`);
    }

    saveDatabase();
    res.json({ success: true, news: db.siteSettings.news });
  });

  app.delete("/api/news/:id", (req, res) => {
    const { authCode } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.editNews) {
      return res.status(403).json({ error: "No autorizado." });
    }

    db.siteSettings.news = db.siteSettings.news.filter(n => n.id !== req.params.id);
    logAction(admin.label, req.ip, "ELIMINAR_NOTICIA", `Se eliminó la noticia ID: ${req.params.id}`);
    saveDatabase();
    res.json({ success: true, news: db.siteSettings.news });
  });

  // 12. FULL BACKUP / RESET / RESTORE DATABASE (modifyDb PERMISSION)
  app.post("/api/db/reset", (req, res) => {
    const { authCode } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.modifyDb) {
      return res.status(403).json({ error: "No tienes permisos críticos de base de datos para realizar esta acción." });
    }

    db = {
      users: [],
      adminCodes: defaultCodes,
      catalog: defaultCatalog,
      trades: defaultTrades,
      services: defaultServices,
      serviceRequests: [],
      chatMessages: defaultChat,
      ads: defaultAds,
      siteSettings: defaultSettings,
      logs: []
    };
    logAction(admin.label, req.ip, "RESETEAR_BD", "Base de datos restaurada por completo a valores de fábrica por el administrador.");
    saveDatabase();
    res.json({ success: true, db });
  });

  app.post("/api/db/import", (req, res) => {
    const { authCode, importedState } = req.body;
    const admin = db.adminCodes.find(c => c.code === authCode && !c.suspended);
    if (!admin || !admin.permissions.modifyDb) {
      return res.status(403).json({ error: "No autorizado." });
    }

    try {
      db = {
        users: importedState.users || db.users,
        adminCodes: importedState.adminCodes || db.adminCodes,
        catalog: importedState.catalog || db.catalog,
        trades: importedState.trades || db.trades,
        services: importedState.services || db.services,
        serviceRequests: importedState.serviceRequests || db.serviceRequests,
        chatMessages: importedState.chatMessages || db.chatMessages,
        ads: importedState.ads || db.ads,
        siteSettings: importedState.siteSettings || db.siteSettings,
        logs: importedState.logs || db.logs
      };

      // Ensure blandygerra2007 is preserved
      if (!db.adminCodes.some(c => c.code === "blandygerra2007")) {
        db.adminCodes.push(defaultCodes[0]);
      }

      logAction(admin.label, req.ip, "IMPORTAR_BD", "Se importó una nueva estructura de base de datos de respaldo.");
      saveDatabase();
      res.json({ success: true, db });
    } catch (e: any) {
      res.status(400).json({ error: "Archivo de respaldo corrupto o incompatible: " + e.message });
    }
  });

  // ----------------- VITE MIDDLEWARE SETUP -----------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MundoFarmeo backend running on http://localhost:${PORT}`);
  });
}

run().catch((err) => {
  console.error("Critical server bootstrap error:", err);
});
