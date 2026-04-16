/**
 * MELANT IA - Backend Server
 * API para gestión de usuarios, fotos de carbono y sincronización
 * 
 * Tecnologías: Express.js + Supabase + Cloudinary
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cloudinary from 'cloudinary';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Cargar variables de entorno
dotenv.config();

// ==========================================
// CONFIGURACIÓN
// ==========================================

const app = express();
const PORT = process.env.PORT || 8000;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// CONEXIÓN A SUPABASE
// ==========================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Pool de conexiones a PostgreSQL (para consultas directas)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ==========================================
// CONFIGURACIÓN DE CLOUDINARY
// ==========================================

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, finca, geoLock, geoLat, geoLon } = req.body;
    
    // Validar campos requeridos
    if (!name || !email || !password || !finca) {
      return res.status(400).json({ error: 'Campos requeridos incompletos' });
    }
    
    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar código de referido
    const refCode = `ML-${name.substring(0, 3).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    
    // Insertar usuario en Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        name,
        finca,
        geo_lock: geoLock || false,
        geo_lat: geoLat || null,
        geo_lon: geoLon || null,
        ref_code: refCode
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Crear finca
    const { error: fincaError } = await supabase
      .from('fincas')
      .insert([{
        user_id: newUser.id,
        nombre: finca
      }]);
    
    if (fincaError) throw fincaError;
    
    // Generar token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.SECRET_KEY,
      { expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 10080}m` }
    );
    
    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        finca: newUser.finca,
        refCode: newUser.ref_code
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    // Buscar usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar geo-lock si está activo
    if (user.geo_lock) {
      // Aquí iría la lógica de verificación de ubicación
      // Por ahora, permitimos el login
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 10080}m` }
    );
    
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        finca: user.finca,
        refCode: user.ref_code
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ==========================================
// RUTAS DE FOTOS DE CARBONO
// ==========================================

// Subir foto de carbono
app.post('/api/carbon/fotos', authenticateToken, async (req, res) => {
  try {
    const { imagenBase64, lat, lon, accuracy, fecha } = req.body;
    const userId = req.user.id;
    
    if (!imagenBase64 || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    // Subir imagen a Cloudinary
    const timestamp = Date.now();
    const publicId = `carbon_${userId}_${timestamp}`;
    
    const uploadResult = await cloudinary.v2.uploader.upload(
      `data:image/jpeg;base64,${imagenBase64}`,
      {
        public_id: publicId,
        folder: 'melant-ia/carbon-fotos',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      }
    );
    
    // Guardar metadatos en Supabase
    const { data: newFoto, error } = await supabase
      .from('carbon_fotos')
      .insert([{
        user_id: userId,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        lat,
        lon,
        accuracy,
        fecha: fecha || new Date().toISOString(),
        synced: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      id: newFoto.id,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: 'Foto guardada exitosamente'
    });
    
  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(500).json({ error: 'Error al subir foto' });
  }
});

// Obtener fotos del usuario
app.get('/api/carbon/fotos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: fotos, error } = await supabase
      .from('carbon_fotos')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    
    res.json(fotos || []);
    
  } catch (error) {
    console.error('Error obteniendo fotos:', error);
    res.status(500).json({ error: 'Error al obtener fotos' });
  }
});

// Eliminar foto
app.delete('/api/carbon/fotos/:id', authenticateToken, async (req, res) => {
  try {
    const fotoId = req.params.id;
    const userId = req.user.id;
    
    // Buscar foto para obtener public_id
    const { data: foto, error: fetchError } = await supabase
      .from('carbon_fotos')
      .select('public_id')
      .eq('id', fotoId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !foto) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }
    
    // Eliminar de Cloudinary
    await cloudinary.v2.uploader.destroy(foto.public_id);
    
    // Eliminar de Supabase
    const { error } = await supabase
      .from('carbon_fotos')
      .delete()
      .eq('id', fotoId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({ message: 'Foto eliminada exitosamente' });
    
  } catch (error) {
    console.error('Error eliminando foto:', error);
    res.status(500).json({ error: 'Error al eliminar foto' });
  }
});

// ==========================================
// RUTAS DE ESTADÍSTICAS
// ==========================================

// Obtener estadísticas del usuario
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Contar fotos totales
    const { count: totalFotos } = await supabase
      .from('carbon_fotos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Contar fotos sincronizadas
    const { count: syncedFotos } = await supabase
      .from('carbon_fotos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('synced', true);
    
    res.json({
      totalFotos: totalFotos || 0,
      syncedFotos: syncedFotos || 0,
      pendingFotos: (totalFotos || 0) - (syncedFotos || 0)
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 MELANT IA Backend corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});