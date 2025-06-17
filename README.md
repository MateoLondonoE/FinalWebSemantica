# Proyecto Backend con Node.js y MongoDB

Este proyecto utiliza una base de datos MongoDB alojada en la nube (MongoDB Atlas) y un entorno de desarrollo local con Node.js.

## 📦 Requisitos Previos

- Node.js instalado en tu sistema.
- Una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
- MongoDB Compass (opcional, para explorar la base de datos visualmente).

## 🔐 Archivo `.env`

Crea un archivo llamado `.env` en la raíz del proyecto y añade la siguiente configuración:

env
# Configuración de Base de Datos MongoDB
MONGODB_URI=mongodb+srv://(tu usuario):(tucontraseña)@(tu CLUSTER)/

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# URL del Frontend (para CORS en producción)
FRONTEND_URL=http://localhost:5500


> 🔒 **Nota**: No compartas este archivo ni lo subas a repositorios públicos.

## ☁️ Creación de Cuenta y Conexión a MongoDB Atlas

1. Regístrate en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Crea un nuevo **Cluster gratuito (M0)**.
3. Crea un usuario con nombre de usuario y contraseña (ej. `tu usuario` y `tucontraseña`).
4. Agrega tu IP a la lista de acceso (puedes permitir acceso desde cualquier IP temporalmente con `0.0.0.0/0`).
5. Copia la cadena de conexión, reemplaza `tu usuario` y `tucontraseña` por tus datos y pégala en el `.env`.

## 🔗 Conexión con MongoDB Compass

1. Abre MongoDB Compass.
2. Usa la misma cadena `MONGODB_URI` de tu `.env` para conectar al clúster.
3. Puedes explorar bases de datos, colecciones y documentos desde la interfaz visual.

## 🧰 Instalación de Dependencias

Dentro del directorio raíz del proyecto, ejecuta:

```bash
npm install


## 🚀 Inicio del Proyecto

#Para iniciar el servidor en entorno de desarrollo:

npm run dev


#o en producción:

npm start
```
## ✅ Notas Finales

* Asegúrate de tener tu archivo `.env` configurado antes de iniciar el servidor.
* Si necesitas probar CORS, cambia `FRONTEND_URL` al dominio real de tu frontend cuando pases a producción.

