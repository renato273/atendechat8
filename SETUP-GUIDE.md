# 🚀 Guía de Configuración y Solución de Problemas

Esta guía documenta los pasos realizados para configurar correctamente el proyecto AtendeChatBot y las soluciones aplicadas a los problemas encontrados.

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
3. [Configuración de Idiomas](#configuración-de-idiomas)
4. [Optimizaciones Aplicadas](#optimizaciones-aplicadas)
5. [Comandos Útiles](#comandos-útiles)

---

## 🔧 Configuración Inicial

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run build
npm run db:migrate
npm run db:seed
npm start
```

### Frontend

```bash
cd frontend
npm install
cp .env.exemple .env
# Configurar REACT_APP_BACKEND_URL en .env
npm start
```

---

## ⚠️ Problemas Encontrados y Soluciones

### 1. **Deprecaciones en npm install**

#### **Problema:**
```
npm WARN deprecated inflight@1.0.6: This module is not supported
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm WARN deprecated rimraf@3.0.2: Rimraf versions prior to v4 are deprecated
npm WARN deprecated @humanwhocodes/config-array@0.11.14: Use @eslint/config-array instead
npm WARN deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
```

#### **Solución Aplicada:**
- ✅ **Documentado** para futuras actualizaciones
- ✅ **No crítico** - el proyecto funciona correctamente
- ✅ **Recomendación**: Actualizar dependencias en futuras versiones

#### **Para solucionar completamente:**
```bash
# Actualizar dependencias principales
npm update
# O para una actualización más agresiva
npm audit fix --force
```

### 2. **Configuración de Base de Datos**

#### **Problema:**
Variables de base de datos no configuradas correctamente.

#### **Solución:**
```env
# En backend/.env
DB_HOST=localhost
DB_DIALECT=mysql
DB_DATABASE=atendechat
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_LOGGING=false
```

### 3. **Configuración de JWT y Encriptación**

#### **Problema:**
Tokens de seguridad no configurados.

#### **Solución:**
```env
# En backend/.env
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_muy_seguro
```

### 4. **Configuración de Redis (Opcional)**

#### **Para mejor rendimiento:**
```env
# En backend/.env
IO_REDIS_SERVER=localhost
IO_REDIS_PASSWORD=
IO_REDIS_DB_SESSION=2
```

---

## 🌍 Configuración de Idiomas

### **Problema Encontrado:**
- El sistema estaba configurado en portugués por defecto
- Traducciones al español incompletas (95%)
- Faltaba sección `contactListItems` y `languages`

### **Soluciones Aplicadas:**

#### 1. **Cambio de Idioma por Defecto**
```javascript
// En frontend/src/translate/index.js
const language = localStorage.getItem("i18nextLng") || "es"; // Cambiado de "pt" a "es"
```

#### 2. **Traducciones Completadas**
- ✅ **Agregada sección `contactListItems`** completa
- ✅ **Agregada sección `languages`** para selector de idiomas
- ✅ **Completitud**: 100% (de 95% anterior)

#### 3. **Archivos Modificados:**
- `frontend/src/translate/languages/es.js` - Traducciones completadas
- `frontend/src/translate/index.js` - Idioma por defecto cambiado

---

## 🔧 Optimizaciones Aplicadas

### 1. **Archivo .gitignore Mejorado**

#### **Problema:**
Carpeta `build/` del frontend siendo trackeada por Git.

#### **Solución:**
```gitignore
# Build outputs
build/
dist/
frontend/build/
frontend/dist/

# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs y archivos temporales
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.tmp
*.temp

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
Thumbs.db
```

### 2. **Variables de Pago Comentadas**

#### **Problema:**
Variables de Gerencianet (sistema brasileño) confusas para otros países.

#### **Solución:**
```env
# GERENCIANET/EFÍ BANK (Sistema de pagos brasileño - Solo para Brasil)
# Descomenta y configura solo si usas Gerencianet/PIX en Brasil
# GERENCIANET_SANDBOX=false
# GERENCIANET_CLIENT_ID=Client_Id_Gerencianet
# GERENCIANET_CLIENT_SECRET=Client_Secret_Gerencianet
# GERENCIANET_PIX_CERT=certificado-Gerencianet
# GERENCIANET_PIX_KEY=chave pix gerencianet

# SISTEMAS DE PAGO ALTERNATIVOS (Para otros países)
# Stripe (Internacional): STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
# PayPal (Internacional): PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
# Redsys (España): REDSYS_MERCHANT_CODE, REDSYS_TERMINAL, REDSYS_SECRET_KEY
# Mercado Pago (Latinoamérica): MP_ACCESS_TOKEN, MP_PUBLIC_KEY
```

---

## 📝 Comandos Útiles

### **Desarrollo**
```bash
# Backend
cd backend
npm run dev          # Modo desarrollo con nodemon
npm run build        # Compilar TypeScript
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Ejecutar seeds

# Frontend
cd frontend
npm start            # Servidor de desarrollo
npm run build        # Build para producción
npm run builddev     # Build para desarrollo
```

### **Base de Datos**
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE atendechat;

# Ejecutar migraciones
cd backend
npm run db:migrate

# Ejecutar seeds (datos iniciales)
npm run db:seed
```

### **Solución de Problemas**
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar puertos en uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
```

---

## 🔐 Credenciales por Defecto

Después de ejecutar `npm run db:seed`:

```
Usuario: admin
Email: admin@admin.com
Contraseña: 123456
```

---

## 🌐 URLs por Defecto

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **API Docs**: http://localhost:8080/api-docs (si está configurado)

---

## 📊 Estado del Proyecto

### ✅ **Completado:**
- Configuración de base de datos
- Traducciones al español (100%)
- Optimización de .gitignore
- Documentación de variables de entorno
- Solución de deprecaciones documentada

### 🔄 **Pendiente (Opcional):**
- Actualización de dependencias deprecadas
- Configuración de sistema de pagos alternativo
- Configuración de SSL/HTTPS
- Configuración de Docker (si se requiere)

---

## 🆘 Solución de Problemas Comunes

### **Error: Cannot connect to database**
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql
# O en Windows
net start mysql
```

### **Error: Port 3000 already in use**
```bash
# Encontrar proceso usando el puerto
lsof -ti:3000
# Terminar proceso
kill -9 <PID>
```

### **Error: Module not found**
```bash
# Reinstalar dependencias
cd frontend && npm install
cd backend && npm install
```

### **Error: JWT malformed**
```bash
# Limpiar localStorage del navegador
localStorage.clear()
# O usar modo incógnito
```

---

## 📞 Soporte

Si encuentras problemas adicionales:

1. Verifica que todas las variables de entorno estén configuradas
2. Asegúrate de que MySQL esté ejecutándose
3. Verifica que los puertos 3000 y 8080 estén disponibles
4. Revisa los logs en la consola del navegador y terminal

---

**Última actualización:** $(date)
**Versión del proyecto:** 1.0.0
**Node.js requerido:** >= 14.x
**MySQL requerido:** >= 5.7