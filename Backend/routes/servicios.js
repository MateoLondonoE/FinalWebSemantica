const express = require('express');
const router = express.Router();
const Servicio = require('../models/servicio');

// ✅ GET /api/servicios - Obtener todos los servicios activos
router.get('/', async (req, res) => {
  try {
    console.log('🤖 AgenteServicio: Procesando solicitud de lista de servicios');
    
    const { categoria, buscar, limite = 50, pagina = 1 } = req.query;
    let query = { disponible: true }; // <-- Campo correcto
    
    // Filtro por categoría si se especifica
    if (categoria) {
      query.categoria = categoria.toLowerCase();
    }
    
    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    let servicios;

    // Búsqueda por texto si se especifica
    if (buscar) {
      servicios = await Servicio.find({
        ...query,
        $text: { $search: buscar }
      })
      .sort({ score: { $meta: "textScore" } })
      .limit(parseInt(limite))
      .skip(skip);
    } else {
      servicios = await Servicio.find(query)
        .sort({ fechaCreacion: -1 })
        .limit(parseInt(limite))
        .skip(skip);
    }
    
    const total = await Servicio.countDocuments(query);

    const respuesta = {
      exito: true,
      mensaje: 'Servicios obtenidos exitosamente',
      datos: {
        servicios: servicios.map(servicio => servicio.toObject()), // usar .toObject()
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

    if (!servicio.disponible) {
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

// ✅ POST /api/servicios - Crear nuevo servicio
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
