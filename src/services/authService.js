import { getSupabaseClient } from '../lib/supabaseClient.js';

/**
 * Servicio de Autenticación y Gestión de Perfiles
 * Aísla al cliente del SDK directo de Supabase Auth y maneja tokens JWT.
 */
export const authService = {
  /**
   * Registra un nuevo usuario con email y contraseña, asignando metadatos para el perfil.
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} params.username
   * @param {string} [params.nombreCompleto]
   * @returns {Promise<{ user: Object, session: Object|null }>}
   */
  async registro({ email, password, username, nombreCompleto = '' }) {
    if (!email || !email.includes('@')) {
      throw new Error('El formato del email no es válido.');
    }
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    if (!username || username.trim().length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          nombre_completo: nombreCompleto.trim()
        }
      }
    });

    if (error) {
      throw new Error(`Error en el registro: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session
    };
  },

  /**
   * Inicia sesión con email y contraseña, obteniendo el token JWT de acceso.
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: Object, session: Object, token: string }>}
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email y contraseña son obligatorios.');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
      token: data.session ? data.session.access_token : null
    };
  },

  /**
   * Cierra la sesión activa del usuario.
   * @returns {Promise<boolean>}
   */
  async cerrarSesion() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
    return true;
  },

  /**
   * Obtiene el usuario autenticado actualmente en la sesión.
   * @returns {Promise<Object|null>}
   */
  async obtenerUsuarioActual() {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  },

  /**
   * Obtiene el perfil público de un usuario dado su ID.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async obtenerPerfil(userId) {
    if (!userId) {
      throw new Error('El ID de usuario es obligatorio.');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, username, nombre_completo, avatar_url, rol, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }
    if (!data) {
      throw new Error('Perfil no encontrado.');
    }

    return data;
  },

  /**
   * Actualiza el perfil de un usuario.
   * La política RLS en PostgreSQL garantiza que solo el propio usuario puede modificarlo.
   * @param {string} userId
   * @param {Object} datos
   * @param {string} [datos.username]
   * @param {string} [datos.nombre_completo]
   * @param {string} [datos.avatar_url]
   * @returns {Promise<Object>}
   */
  async actualizarPerfil(userId, datos) {
    if (!userId) {
      throw new Error('El ID de usuario es obligatorio.');
    }

    const camposPermitidos = ['username', 'nombre_completo', 'avatar_url'];
    const cargaUtil = {};

    for (const campo of Object.keys(datos)) {
      if (camposPermitidos.includes(campo)) {
        cargaUtil[campo] = datos[campo];
      }
    }

    if (cargaUtil.username && cargaUtil.username.trim().length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }

    cargaUtil.updated_at = new Date().toISOString();

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('perfiles')
      .update(cargaUtil)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    return data;
  }
};

export default authService;
