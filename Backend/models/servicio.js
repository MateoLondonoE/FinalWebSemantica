const mongoose = require('mongoose');

// ===== ESQUEMA DE SERVICIOS =====
const servicioSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  costo: {
    type: Number,
    required: true,
    min: 0
  },
  tecnologias: [{
    type: String,
    trim: true
  }],
  // Campos adicionales útiles para el negocio
  categoria: {
    type: String,
    enum: ['desarrollo', 'consultoria', 'integracion', 'diseno', 'otro'],
    default: 'desarrollo'
  },
  duracionEstimada: {
    type: String, // Ej: "2-4 semanas"
    default: 'A consultar'
  },
  tipoServicio: {
    type: String,
    enum: ['proyecto', 'consultoria', 'mantenimiento', 'soporte'],
    default: 'proyecto'
  },
  disponible: {
    type: Boolean,
    default: true
  },
  prioridad: {
    type: Number,
    default: 1, // Para ordenar servicios en la visualización
    min: 1,
    max: 10
  },
  imagenUrl: {
    type: String,
    default: null // URL de imagen del servicio si la hay
  },
  caracteristicas: [{
    nombre: String,
    descripcion: String
  }],
  // Metadatos
  agente: {
    type: String,
    default: 'AgenteServicio'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  creadoPor: {
    type: String,
    default: 'sistema'
  }
}, {
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

// Índices para mejorar consultas
servicioSchema.index({ titulo: 'text', descripcion: 'text' }); // Búsqueda de texto
servicioSchema.index({ categoria: 1, disponible: 1 });
servicioSchema.index({ costo: 1 });
servicioSchema.index({ prioridad: -1 });


const Servicio = mongoose.model('Servicio', servicioSchema);

module.exports = Servicio;