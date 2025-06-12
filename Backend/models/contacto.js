const mongoose = require('mongoose');

/**
 * Esquema ontológico para la entidad biz:MensajeContacto
 * Implementa el concepto semántico de mensaje de contacto
 * Gestionado por el AgenteContacto
 */
const contactoSchema = new mongoose.Schema({
  // Propiedades ontológicas básicas
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      },
      message: 'El formato del email no es válido'
    }
  },
  
  telefono: {
    type: String,
    trim: true,
    validate: {
      validator: function(telefono) {
        if (!telefono) return true; // Campo opcional
        const regex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
        return regex.test(telefono);
      },
      message: 'El formato del teléfono no es válido'
    }
  },
  
  asunto: {
    type: String,
    required: [true, 'El asunto es obligatorio'],
    trim: true,
    maxlength: [200, 'El asunto no puede exceder 200 caracteres'],
    minlength: [3, 'El asunto debe tener al menos 3 caracteres']
  },
  
  mensaje: {
    type: String,
    required: [true, 'El mensaje es obligatorio'],
    trim: true,
    maxlength: [2000, 'El mensaje no puede exceder 2000 caracteres'],
    minlength: [10, 'El mensaje debe tener al menos 10 caracteres']
  },
  
  // Propiedades semánticas adicionales
  tipoConsulta: {
    type: String,
    required: [true, 'El tipo de consulta es obligatorio'],
    enum: ['informacion', 'cotizacion', 'soporte', 'colaboracion', 'otro'],
    default: 'informacion'
  },
  
  servicioInteres: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    default: null
  },
  
  // Estado de procesamiento
  estado: {
    type: String,
    enum: ['nuevo', 'revisado', 'respondido', 'cerrado'],
    default: 'nuevo'
  },
  
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  
  // Metadatos semánticos
  agente: {
    type: String,
    default: 'AgenteContacto',
    immutable: true
  },
  
  // Propiedades de auditoría y seguimiento
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  fechaUltimaActualizacion: {
    type: Date,
    default: Date.now
  },
  
  fechaRespuesta: {
    type: Date,
    default: null
  },
  
  // Información técnica
  ipOrigen: {
    type: String,
    trim: true
  },
  
  userAgent: {
    type: String,
    trim: true
  },
  
  // Control de spam y seguridad
  esSpam: {
    type: Boolean,
    default: false
  },
  
  intentosContacto: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Notas internas
  notasInternas: [{
    fecha: {
      type: Date,
      default: Date.now
    },
    usuario: {
      type: String,
      required: true
    },
    nota: {
      type: String,
      required: true,
      maxlength: 500
    }
  }]
}, {
  timestamps: true,
  collection: 'contactos'
});

// Middleware pre-save
contactoSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.fechaUltimaActualizacion = Date.now();
  }
  
  // Auto-detectar posible spam (muy básico)
  if (this.isNew) {
    const mensajeLower = this.mensaje.toLowerCase();
    const spamWords = ['viagra', 'casino', 'lottery', 'winner', 'click here', 'free money'];
    this.esSpam = spamWords.some(word => mensajeLower.includes(word));
  }
  
  next();
});

// Métodos de instancia (comportamiento del agente)
contactoSchema.methods.marcarComoRevisado = function() {
  this.estado = 'revisado';
  this.fechaUltimaActualizacion = Date.now();
  return this.save();
};

contactoSchema.methods.marcarComoRespondido = function() {
  this.estado = 'respondido';
  this.fechaRespuesta = Date.now();
  this.fechaUltimaActualizacion = Date.now();
  return this.save();
};

contactoSchema.methods.agregarNota = function(usuario, nota) {
  this.notasInternas.push({
    usuario: usuario,
    nota: nota,
    fecha: Date.now()
  });
  this.fechaUltimaActualizacion = Date.now();
  return this.save();
};

contactoSchema.methods.calcularTiempoRespuesta = function() {
  if (!this.fechaRespuesta) return null;
  
  const tiempoMs = this.fechaRespuesta - this.fechaCreacion;
  const horas = Math.floor(tiempoMs / (1000 * 60 * 60));
  const minutos = Math.floor((tiempoMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { horas, minutos, totalMs: tiempoMs };
};

contactoSchema.methods.obtenerResumen = function() {
  return {
    id: this._id,
    nombre: this.nombre,
    email: this.email,
    asunto: this.asunto,
    tipoConsulta: this.tipoConsulta,
    estado: this.estado,
    prioridad: this.prioridad,
    fechaCreacion: this.fechaCreacion,
    esSpam: this.esSpam
  };
};

// Métodos estáticos (comportamiento del AgenteContacto)
contactoSchema.statics.obtenerPorEstado = function(estado) {
  return this.find({ estado: estado, esSpam: false })
    .sort({ fechaCreacion: -1 });
};

contactoSchema.statics.obtenerPendientes = function() {
  return this.find({ 
    estado: { $in: ['nuevo', 'revisado'] }, 
    esSpam: false 
  }).sort({ prioridad: -1, fechaCreacion: -1 });
};

contactoSchema.statics.obtenerEstadisticas = async function() {
  const stats = await this.aggregate([
    {
      $match: { esSpam: false }
    },
    {
      $group: {
        _id: {
          estado: '$estado',
          tipoConsulta: '$tipoConsulta'
        },
        total: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.estado',
        totalPorEstado: { $sum: '$total' },
        tiposConsulta: {
          $push: {
            tipo: '$_id.tipoConsulta',
            cantidad: '$total'
          }
        }
      }
    }
  ]);
  
  return stats;
};

contactoSchema.statics.limpiarSpam = function() {
  return this.deleteMany({ esSpam: true });
};

contactoSchema.statics.buscarPorEmail = function(email) {
  return this.find({ email: email.toLowerCase(), esSpam: false })
    .sort({ fechaCreacion: -1 });
};

// Índices para optimización
contactoSchema.index({ email: 1 });
contactoSchema.index({ estado: 1, esSpam: 1 });
contactoSchema.index({ fechaCreacion: -1 });
contactoSchema.index({ tipoConsulta: 1 });
contactoSchema.index({ prioridad: -1 });

const Contacto = mongoose.model('Contacto', contactoSchema);

module.exports = Contacto;