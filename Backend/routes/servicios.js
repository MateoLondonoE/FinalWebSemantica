const express = require('express');
const router = express.Router();
const Servicio = require('../models/servicio');

/**
 * Controlador que actúa como AgenteServicio
 * Implementa la lógica de negocio para la gestión de servicios
 * Siguiendo principios de web semántica y ontología conceptual
 */

// ✅ GET /api/servicios - Obtener todos los servicios activos
router.get('/', async (req, res) => {
  try {
    console.log('🤖 AgenteServicio: Procesando solicitud de lista de servicios');
    
    const { categoria, buscar, limite = 50, pagina = 1 } = req.query;
    let query = { activo: true };
    
    // Filtro por categoría si se especifica
    if (categoria) {
      query.categoria = categoria.toLowerCase();
    }
    
    // Búsqueda por texto si se especifica
    let servicios;
    if (buscar) {
      servicios = await Servicio.buscarPorTexto(buscar);
    } else {
      const skip = (parseInt(pagina) - 1) * parseInt(limite);
      servicios = await Servicio.find(query)
        .sort({ fechaCreacion: -1 })
        .limit(parseInt(limite))
        .skip(skip);
    }
    
    // Obtener total para paginación
    const total = await Servicio.countDocuments(query);
    
    const respuesta = {
      exito: true,
      mensaje: 'Estadísticas generadas exitosamente',
      datos: {
        resumen: {
          totalServicios: totalServicios,
          totalCategorias: totalCategorias.length,
          categorias: totalCategorias
        },
        estadisticasPorCategoria: estadisticas
      },
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ AgenteServicio: Estadísticas generadas exitosamente');
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteServicio: Error al generar estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al generar estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ POST /api/servicios - Crear nuevo servicio (para administración)
router.post('/', async (req, res) => {
  try {
    console.log('🤖 AgenteServicio: Procesando creación de nuevo servicio');
    
    const nuevoServicio = new Servicio(req.body);
    await nuevoServicio.save();
    
    const respuesta = {
      exito: true,
      mensaje: 'Servicio creado exitosamente',
      datos: {
        servicio: nuevoServicio.toObject()
      },
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteServicio: Servicio creado - ${nuevoServicio.titulo}`);
    res.status(201).json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteServicio: Error al crear servicio:', error);
    
    // Error de validación
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => ({
        campo: err.path,
        mensaje: err.message
      }));
      
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación en los datos del servicio',
        errores: errores,
        agente: 'AgenteServicio',
        timestamp: new Date().toISOString()
      });
    }
    
    // Error de duplicado (slug único)
    if (error.code === 11000) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe un servicio con ese título',
        agente: 'AgenteServicio',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al crear servicio',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
      mensaje: 'Servicios obtenidos exitosamente',
      datos: {
        servicios: servicios.map(servicio => servicio.obtenerResumen()),
        paginacion: {
          paginaActual: parseInt(pagina),
          limite: parseInt(limite),
          total: total,
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      },
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteServicio: ${servicios.length} servicios encontrados`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteServicio: Error al obtener servicios:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al obtener servicios',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/servicios/:id - Obtener servicio específico por ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`🤖 AgenteServicio: Buscando servicio con ID: ${req.params.id}`);
    
    const servicio = await Servicio.findById(req.params.id);
    
    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado',
        agente: 'AgenteServicio',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!servicio.esActivo()) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no disponible',
        agente: 'AgenteServicio',
        timestamp: new Date().toISOString()
      });
    }
    
    const respuesta = {
      exito: true,
      mensaje: 'Servicio encontrado exitosamente',
      datos: {
        servicio: servicio.toObject()
      },
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteServicio: Servicio encontrado - ${servicio.titulo}`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteServicio: Error al obtener servicio:', error);
    
    // Error de formato de ID de MongoDB
    if (error.name === 'CastError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de servicio inválido',
        agente: 'AgenteServicio',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al obtener servicio',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/servicios/slug/:slug - Obtener servicio por slug (SEO friendly)
router.get('/slug/:slug', async (req, res) => {
  try {
    console.log(`🤖 AgenteServicio: Buscando servicio con slug: ${req.params.slug}`);
    
    const servicio = await Servicio.findOne({ 
      slug: req.params.slug, 
      activo: true 
    });
    
    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado',
        agente: 'AgenteServicio',
        timestamp: new Date().toISOString()
      });
    }
    
    const respuesta = {
      exito: true,
      mensaje: 'Servicio encontrado exitosamente',
      datos: {
        servicio: servicio.toObject()
      },
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteServicio: Servicio encontrado por slug - ${servicio.titulo}`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteServicio: Error al obtener servicio por slug:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/servicios/categoria/:categoria - Obtener servicios por categoría
router.get('/categoria/:categoria', async (req, res) => {
  try {
    console.log(`🤖 AgenteServicio: Buscando servicios de categoría: ${req.params.categoria}`);
    
    const servicios = await Servicio.obtenerPorCategoria(req.params.categoria);
    
    const respuesta = {
      exito: true,
      mensaje: `Servicios de categoría '${req.params.categoria}' obtenidos exitosamente`,
      datos: {
        servicios: servicios.map(servicio => servicio.obtenerResumen()),
        categoria: req.params.categoria,
        total: servicios.length
      },
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteServicio: ${servicios.length} servicios encontrados en categoría '${req.params.categoria}'`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteServicio: Error al obtener servicios por categoría:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteServicio',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/servicios/estadisticas/resumen - Obtener estadísticas de servicios
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    console.log('🤖 AgenteServicio: Generando estadísticas de servicios');
    
    const estadisticas = await Servicio.obtenerEstadisticas();
    const totalServicios = await Servicio.countDocuments({ activo: true });
    const totalCategorias = await Servicio.distinct('categoria', { activo: true });
    
    const respuesta = {
      exito: true,