import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Polyfill para Node 20 donde WebSocket nativo no está activo por defecto
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

/**
 * Cliente Supabase por defecto inicializado con las credenciales públicas/anónimas.
 * Maneja la sesión del usuario autenticado de forma transparente en memoria/storage.
 */
export let supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

/**
 * Permite inyectar un cliente personalizado o mockeado (muy útil para pruebas unitarias).
 * @param {object} customClient 
 */
export function setSupabaseClient(customClient) {
  supabase = customClient;
}

/**
 * Obtiene el cliente Supabase actualmente configurado.
 */
export function getSupabaseClient() {
  return supabase;
}

export default supabase;
