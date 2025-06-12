const mongoose = require('mongoose');

/**
 * Esquema ontológico para la entidad biz:Servicio
 * Implementa el concepto semántico de servicio empresarial
 * Gestionado por el AgenteServicio
 */
const servicioSchema = new mongoose.Schema({
  // Propiedades ontológicas básicas
  titulo: {
    type: String,
    required: [true, 'El título del servicio es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres'],
    minlength: [3, 'El título debe tener al menos 3 caracteres']
  },
  
  descripcion: {
    type: String,
    required: [true, 'La descripción del servicio es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    minlength: [10, 'La descripción debe tener al menos 10 caracteres']
  },
  
  descripcionCorta: {
    type: String,
    required: [true, 'La descripción corta es obligatoria'],
    trim: true,
    maxlength: [200, 'La descripción corta no puede exceder 200 caracteres']
  },
  
  costo: {
    type: Number,
    required: [true, 'El costo del servicio es obligatorio'],
    min: [0, 'El costo no puede ser negativo'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'El costo debe ser un número positivo'
    }
  },
  
  // Propiedades semánticas adicionales
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: ['desarrollo', 'consultoría', 'soporte', 'diseño', 'marketing'],
    lowercase: true
  },
  
  duracionEstimada: {
    type: String,
    required: [true, 'La duración estimada es obligatoria'],
    trim: true
  },
  
  activo: {
    type: Boolean,
    default: true
  },
  
  // Metadatos semánticos
  agente: {
    type: String,
    default: 'AgenteServicio',
    immutable: true
  },
  
  // Propiedades de auditoría
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  fechaModificacion: {
    type: Date,
    default: Date.now
  },
  
  // Propiedades para SEO y web semántica
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  collection: 'servicios'
});

// Middleware pre-save para generar slug automáticamente
servicioSchema.pre('save', function(next) {
  if (this.isModified('titulo') || this.isNew) {
    this.slug = this.titulo
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = Date.now();
  }
  
  next();
});

// Métodos de instancia (comportamiento del agente)
servicioSchema.methods.obtenerResumen = function() {
  return {
    id: this._id,
    titulo: this.titulo,
    descripcionCorta: this.descripcionCorta,
    costo: this.costo,
    categoria: this.categoria,
    slug: this.slug
  };
};

servicioSchema.methods.esActivo = function() {
  return this.activo === true;
};

servicioSchema.methods.calcularCostoConDescuento = function(porcentajeDescuento = 0) {
  if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
    throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
  }
  return this.costo * (1 - porcentajeDescuento / 100);
};

// Métodos estáticos (comportamiento del AgenteServicio)
servicioSchema.statics.obtenerPorCategoria = function(categoria) {
  return this.find({ categoria: categoria.toLowerCase(), activo: true })
    .sort({ fechaCreacion: -1 });
};

servicioSchema.statics.buscarPorTexto = function(texto) {
  const regex = new RegExp(texto, 'i');
  return this.find({
    $or: [
      { titulo: regex },
      { descripcion: regex },
      { keywords: { $in: [regex] } }
    ],
    activo: true
  });
};

servicioSchema.statics.obtenerEstadisticas = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$categoria',
        total: { $sum: 1 },
        costoPromedio: { $avg: '$costo' },
        costoMinimo: { $min: '$costo' },
        costoMaximo: { $max: '$costo' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
  
  return stats;
};

// Índices para optimización de consultas
servicioSchema.index({ titulo: 1 });
servicioSchema.index({ categoria: 1, activo: 1 });
servicioSchema.index({ slug: 1 });
servicioSchema.index({ keywords: 1 });
servicioSchema.index({ fechaCreacion: -1 });

const Servicio = mongoose.model('Servicio', servicioSchema);

module.exports = Servicio;