const express = require('express');
const router = express.Router();
const Contacto = require('../models/contacto');

/**
 * Controlador que actúa como AgenteContacto
 * Implementa la lógica de negocio para la gestión de mensajes de contacto
 * Siguiendo principios de web semántica y ontología conceptual
 */

// ✅ POST /api/contactos - Crear nuevo mensaje de contacto
router.post('/', async (req, res) => {
  try {
    console.log('🤖 AgenteContacto: Procesando nuevo mensaje de contacto');
    
    // Extraer información adicional del request
    const datosContacto = {
      ...req.body,
      ipOrigen: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Desconocido'
    };
    
    // Validar datos requeridos
    const camposRequeridos = ['nombre', 'email', 'asunto', 'mensaje'];
    const camposFaltantes = camposRequeridos.filter(campo => !datosContacto[campo]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan campos requeridos',
        camposFaltantes: camposFaltantes,
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar si ya existe un mensaje similar reciente (anti-spam básico)
    const mensajeReciente = await Contacto.findOne({
      email: datosContacto.email.toLowerCase(),
      fechaCreacion: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutos
    });
    
    if (mensajeReciente) {
      return res.status(429).json({
        exito: false,
        mensaje: 'Debe esperar 5 minutos antes de enviar otro mensaje',
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    // Crear nuevo contacto
    const nuevoContacto = new Contacto(datosContacto);
    await nuevoContacto.save();
    
    const respuesta = {
      exito: true,
      mensaje: 'Mensaje de contacto recibido exitosamente',
      datos: {
        id: nuevoContacto._id,
        estado: nuevoContacto.estado,
        fechaCreacion: nuevoContacto.fechaCreacion,
        numeroReferencia: `CT-${nuevoContacto._id.toString().slice(-8).toUpperCase()}`
      },
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteContacto: Mensaje creado - ${nuevoContacto.nombre} (${nuevoContacto.email})`);
    res.status(201).json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteContacto: Error al crear mensaje:', error);
    
    // Error de validación
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => ({
        campo: err.path,
        mensaje: err.message
      }));
      
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación en los datos del contacto',
        errores: errores,
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al procesar el mensaje',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/contactos - Obtener mensajes de contacto (para administración)
router.get('/', async (req, res) => {
  try {
    console.log('🤖 AgenteContacto: Obteniendo lista de mensajes');
    
    const { estado, tipo, pagina = 1, limite = 20, incluirSpam = false } = req.query;
    let query = {};
    
    // Filtros
    if (estado) {
      query.estado = estado;
    }
    
    if (tipo) {
      query.tipoConsulta = tipo;
    }
    
    if (!incluirSpam || incluirSpam === 'false') {
      query.esSpam = false;
    }
    
    // Paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    
    const contactos = await Contacto.find(query)
      .populate('servicioInteres', 'titulo slug')
      .sort({ fechaCreacion: -1 })
      .limit(parseInt(limite))
      .skip(skip);
    
    const total = await Contacto.countDocuments(query);
    
    const respuesta = {
      exito: true,
      mensaje: 'Mensajes obtenidos exitosamente',
      datos: {
        contactos: contactos.map(contacto => contacto.obtenerResumen()),
        paginacion: {
          paginaActual: parseInt(pagina),
          limite: parseInt(limite),
          total: total,
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      },
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteContacto: ${contactos.length} mensajes encontrados`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteContacto: Error al obtener mensajes:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al obtener mensajes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/contactos/:id - Obtener mensaje específico
router.get('/:id', async (req, res) => {
  try {
    console.log(`🤖 AgenteContacto: Buscando mensaje con ID: ${req.params.id}`);
    
    const contacto = await Contacto.findById(req.params.id)
      .populate('servicioInteres', 'titulo slug descripcionCorta');
    
    if (!contacto) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mensaje de contacto no encontrado',
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    const respuesta = {
      exito: true,
      mensaje: 'Mensaje encontrado exitosamente',
      datos: {
        contacto: contacto.toObject(),
        tiempoRespuesta: contacto.calcularTiempoRespuesta()
      },
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteContacto: Mensaje encontrado - ${contacto.nombre}`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteContacto: Error al obtener mensaje:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de mensaje inválido',
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ PUT /api/contactos/:id/estado - Actualizar estado del mensaje
router.put('/:id/estado', async (req, res) => {
  try {
    console.log(`🤖 AgenteContacto: Actualizando estado del mensaje ${req.params.id}`);
    
    const { estado } = req.body;
    const estadosValidos = ['nuevo', 'revisado', 'respondido', 'cerrado'];
    
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Estado inválido',
        estadosValidos: estadosValidos,
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    const contacto = await Contacto.findById(req.params.id);
    
    if (!contacto) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mensaje de contacto no encontrado',
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    // Actualizar estado usando los métodos del modelo
    if (estado === 'revisado') {
      await contacto.marcarComoRevisado();
    } else if (estado === 'respondido') {
      await contacto.marcarComoRespondido();
    } else {
      contacto.estado = estado;
      contacto.fechaUltimaActualizacion = Date.now();
      await contacto.save();
    }
    
    const respuesta = {
      exito: true,
      mensaje: `Estado actualizado a '${estado}' exitosamente`,
      datos: {
        contacto: contacto.obtenerResumen()
      },
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AgenteContacto: Estado actualizado - ${contacto.nombre} -> ${estado}`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteContacto: Error al actualizar estado:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de mensaje inválido',
        agente: 'AgenteContacto',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/contactos/estadisticas/resumen - Obtener estadísticas de contactos
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    console.log('🤖 AgenteContacto: Generando estadísticas de contactos');
    
    const estadisticas = await Contacto.obtenerEstadisticas();
    const totalContactos = await Contacto.countDocuments({ esSpam: false });
    const contactosPendientes = await Contacto.countDocuments({ 
      estado: { $in: ['nuevo', 'revisado'] }, 
      esSpam: false 
    });
    const contactosSpam = await Contacto.countDocuments({ esSpam: true });
    
    const respuesta = {
      exito: true,
      mensaje: 'Estadísticas generadas exitosamente',
      datos: {
        resumen: {
          totalContactos: totalContactos,
          contactosPendientes: contactosPendientes,
          contactosSpam: contactosSpam,
          porcentajePendientes: totalContactos > 0 ? Math.round((contactosPendientes / totalContactos) * 100) : 0
        },
        estadisticasDetalladas: estadisticas
      },
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ AgenteContacto: Estadísticas generadas exitosamente');
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ AgenteContacto: Error al generar estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al generar estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      agente: 'AgenteContacto',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;