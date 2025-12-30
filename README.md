# MediControl - Control de Medicamentos

Aplicación web para el control y seguimiento de medicamentos con React, TypeScript, Tailwind CSS, Express y MongoDB.

## Características

- 🔐 **Autenticación**: Registro e inicio de sesión con email y contraseña
- 💊 **Gestión de Medicamentos**: Agregar, ver y eliminar medicamentos
- 🖼️ **Imágenes**: Subir imágenes de medicamentos (guardadas como blob en MongoDB)
- ⏰ **Recordatorios**: Cálculo automático de próximas dosis
- 📅 **Calendario**: Vista de calendario para control de tomas
- 📱 **Responsive**: Diseño adaptable a móviles y escritorio

## Requisitos

- Node.js 18+
- MongoDB (local o Atlas)

## Instalación

### 1. Configurar MongoDB

Asegúrate de tener MongoDB corriendo localmente o usa MongoDB Atlas.

### 2. Backend

```bash
cd backend

# Crear archivo .env
cp .env.example .env

# Editar .env con tus configuraciones
# MONGODB_URI=mongodb://localhost:27017/medicine_control
# JWT_SECRET=tu_secreto_seguro
# PORT=5000

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Uso

1. Abre http://localhost:3000 en tu navegador
2. Regístrate con tu email y contraseña
3. Agrega tus medicamentos con nombre, frecuencia, hora de inicio e imagen
4. Visualiza tus medicamentos en el dashboard
5. Marca las dosis como tomadas
6. Usa el calendario para ver el historial

## Estructura del Proyecto

```
medicine_control/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Punto de entrada
│   │   ├── models/           # Modelos de MongoDB
│   │   ├── routes/           # Rutas de la API
│   │   └── middleware/       # Middleware de autenticación
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # Punto de entrada
│   │   ├── App.tsx           # Componente principal
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── context/          # Context de autenticación
│   │   └── services/         # Servicios de API
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Medicamentos

- `GET /api/medicines` - Listar medicamentos
- `POST /api/medicines` - Crear medicamento
- `GET /api/medicines/:id` - Obtener medicamento
- `PUT /api/medicines/:id` - Actualizar medicamento
- `DELETE /api/medicines/:id` - Eliminar medicamento
- `POST /api/medicines/:id/take` - Marcar dosis como tomada
- `GET /api/medicines/calendar/data` - Datos del calendario

## Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, React Router, Axios, Lucide Icons
- **Backend**: Express, TypeScript, MongoDB, Mongoose, JWT, bcryptjs
