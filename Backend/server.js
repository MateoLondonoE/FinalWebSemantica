const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuración de base de datos y rutas
const agenteConexion = require('./config/database.js');
const serviciosRoutes = require('./routes/servicios.js');
const contactosRoutes = require('./routes/contactos.js');

/**
 * Servidor Principal - Web Semántica para Empresa de Servicios
 * Arquitectura Cliente-Servidor con Agentes Conceptuales
 * Integrado con MongoDB Atlas y principios de ontología
 */

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CONFIGURACIÓN DE MIDDLEWARE
// ========================================

// Seguridad básica con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

// CORS - Configuración para desarrollo y producción
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// Rate limiting - Protección contra ataques DDoS
const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    exito: false,
    mensaje: 'Demasiadas solicitudes desde esta IP, intente nuevamente en 15 minutos',
    tipo: 'rate_limit_exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting específico para contactos (más restrictivo)
const limiteContactos = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 3, // máximo 3 mensajes de contacto por IP
  message: {
    exito: false,
    mensaje: 'Demasiados mensajes de contacto, intente nuevamente en 10 minutos',
    tipo: 'contact_rate_limit_exceeded'
  }
});

app.use(limiteGeneral);

// Parsing de JSON y URL encoded
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Trust proxy para obtener IP real (importante para rate limiting)
app.set('trust proxy', 1);

// ========================================
// MIDDLEWARE DE LOGGING Y MONITOREO
// ========================================

// Logger personalizado para requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`📡 ${timestamp} - ${req.method} ${req.originalUrl} - IP: ${ip}`);
  next();
});

// Middleware para agregar headers de respuesta personalizados
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Powered-By-Agent', 'WebSemantica-AgentSystem');
  next();
});

// ========================================
// RUTAS PRINCIPALES
// ========================================

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  const estadoConexion = agenteConexion.obtenerEstado();
  
  res.json({
    exito: true,
    mensaje: 'Servidor funcionando correctamente',
    datos: {
      servidor: 'Web Semántica - Empresa de Servicios',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      baseDatos: estadoConexion,
      agentesActivos: ['AgenteServicio', 'AgenteContacto', 'AgenteConexion']
    },
    agente: 'SistemaMonitoreo'
  });
});

// Información de la API
app.get('/api', (req, res) => {
  res.json({
    exito: true,
    mensaje: 'API Web Semántica - Empresa de Servicios',
    datos: {
      version: '1.0.0',
      descripcion: 'API RESTful con arquitectura de agentes semánticos',
      endpoints: {
        servicios: '/api/servicios',
        contactos: '/api/contactos'
      },
      agentes: {
        'AgenteServicio': 'Gestiona servicios empresariales',
        'AgenteContacto': 'Procesa mensajes de contacto',
        'AgenteConexion': 'Maneja conexiones de base de datos'
      },
      documentacion: '/api/docs'
    },
    agente: 'SistemaInformacion',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// CONFIGURACIÓN DE RUTAS API
// ========================================

// Aplicar rate limiting específico a contactos
app.use('/api/contactos', limiteContactos);

// Rutas principales de la API
app.use('/api/servicios', serviciosRoutes);
app.use('/api/contactos', contactosRoutes);

// ========================================
// SERVIR ARCHIVOS ESTÁTICOS (FRONTEND)
// ========================================

// Servir frontend desde carpeta public en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
  
  // Ruta catch-all para SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// ========================================
// MANEJO DE ERRORES
// ========================================

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada',
    ruta: req.originalUrl,
    metodo: req.method,
    sugerencia: 'Verifique la documentación de la API en /api',
    timestamp: new Date().toISOString()
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('💥 Error no manejado:', error);
  
  const respuestaError = {
    exito: false,
    mensaje: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };
  
  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    respuestaError.debug = {
      error: error.message,
      stack: error.stack
    };
  }
  
  res.status(500).json(respuestaError);
});

// ========================================
// INICIALIZACIÓN DEL SERVIDOR
// ========================================

async function iniciarServidor() {
  try {
    console.log('🚀 Iniciando servidor Web Semántica...');
    
    // Conectar a MongoDB Atlas
    console.log('📊 Conectando a MongoDB Atlas...');
    await agenteConexion.conectar();
    
    // Inicializar datos de ejemplo si es necesario
    if (process.env.NODE_ENV === 'development') {
      await inicializarDatosEjemplo();
    }
    
    // Iniciar servidor HTTP
    const servidor = app.listen(PORT, () => {
      console.log(`✅ Servidor iniciado exitosamente`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🔍 Health: http://localhost:${PORT}/health`);
      console.log(`🤖 Agentes activos: AgenteServicio, AgenteContacto, AgenteConexion`);
      console.log(`📋 Modo: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Manejo graceful de cierre del servidor
    process.on('SIGTERM', () => {
      console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
      servidor.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        await agenteConexion.desconectar();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Recebida señal SIGINT, cerrando servidor...');
      servidor.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        await agenteConexion.desconectar();
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('💥 Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// ========================================
// FUNCIÓN PARA DATOS DE EJEMPLO
// ========================================

async function inicializarDatosEjemplo() {
  try {
    const Servicio = require('./models/servicio');
    
    // Verificar si ya existen servicios
    const serviciosExistentes = await Servicio.countDocuments();
    
    if (serviciosExistentes === 0) {
      console.log('📝 Creando servicios de ejemplo...');
      
      const serviciosEjemplo = [
        {
          titulo: 'Desarrollo Web Personalizado',
          descripcion: 'Creamos sitios web únicos y funcionales adaptados a las necesidades específicas de tu negocio. Utilizamos las últimas tecnologías y mejores prácticas de desarrollo para garantizar un resultado profesional y efectivo.',
          descripcionCorta: 'Sitios web únicos adaptados a tu negocio con las últimas tecnologías.',
          costo: 1500000,
          categoria: 'desarrollo',
          duracionEstimada: '4-6 semanas',
          keywords: ['desarrollo', 'web', 'personalizado', 'responsive', 'moderno']
        },
          {
            titulo: 'Consultoría en Transformación Digital',
            descripcion: 'Te ayudamos a digitalizar tu empresa mediante estrategias personalizadas. Analizamos tus procesos actuales y diseñamos un plan de transformación digital que optimice tu operación y mejore tu competitividad.',
            descripcionCorta: 'Estrategias personalizadas para digitalizar tu empresa.',
            costo: 800000,
            categoria: 'consultoría',
            duracionEstimada: '2-3 semanas',
            keywords: ['consultoría', 'digital', 'transformación', 'estrategia', 'optimización']
          }
      ];
      
      await Servicio.insertMany(serviciosEjemplo);
      console.log('✅ Servicios de ejemplo creados');
    }
    
  } catch (error) {
    console.error('❌ Error al crear datos de ejemplo:', error);
  }
}

// Iniciar el servidor
iniciarServidor();