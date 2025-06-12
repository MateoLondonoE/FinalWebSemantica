const mongoose = require('mongoose');
require('dotenv').config();

/**
 * AgenteConexion - Agente conceptual responsable de gestionar la conexión a MongoDB
 * Implementa el patrón de agente para el manejo semántico de la base de datos
 */
class AgenteConexion {
  constructor() {
    this.estado = 'desconectado';
    this.reintentos = 0;
    this.maxReintentos = 5;
  }

  async conectar() {
    try {
      console.log('🤖 AgenteConexion: Iniciando conexión a MongoDB Atlas...');
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.estado = 'conectado';
      this.reintentos = 0;
      console.log('✅ AgenteConexion: Conectado exitosamente a MongoDB Atlas');
      
      return true;
    } catch (error) {
      this.estado = 'error';
      this.reintentos++;
      
      console.error(`❌ AgenteConexion: Error de conexión (intento ${this.reintentos}):`, error.message);
      
      if (this.reintentos < this.maxReintentos) {
        console.log(`🔄 AgenteConexion: Reintentando en 5 segundos...`);
        setTimeout(() => this.conectar(), 5000);
      } else {
        console.error('💥 AgenteConexion: Máximo de reintentos alcanzado');
        process.exit(1);
      }
      
      return false;
    }
  }

  obtenerEstado() {
    return {
      estado: this.estado,
      reintentos: this.reintentos,
      conexionActiva: mongoose.connection.readyState === 1
    };
  }

  async desconectar() {
    try {
      await mongoose.disconnect();
      this.estado = 'desconectado';
      console.log('🔌 AgenteConexion: Desconectado de MongoDB Atlas');
    } catch (error) {
      console.error('❌ AgenteConexion: Error al desconectar:', error.message);
    }
  }
}

// Eventos de conexión de Mongoose
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB: Conexión establecida');
});

mongoose.connection.on('error', (err) => {
  console.error('💥 MongoDB: Error de conexión:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB: Conexión perdida');
});

// Manejo graceful de cierre de aplicación
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando aplicación...');
  await mongoose.connection.close();
  console.log('✅ Conexión MongoDB cerrada correctamente');
  process.exit(0);
});

const agenteConexion = new AgenteConexion();

module.exports = agenteConexion;