import { getSupabaseClient } from '../lib/supabaseClient.js';

/**
 * Servicio para la gestión de EQUIPOS (escuadras competitivas)
 */
export const equipoService = {
  /**
   * Crea un nuevo equipo capitaneado por el usuario indicado.
   * @param {Object} datos
   * @param {string} datos.nombre
   * @param {string} datos.tag
   * @param {string} [datos.logo_url]
   * @param {string} [capitanId]
   * @returns {Promise<Object>}
   */
  async crearEquipo(datos, capitanId = null) {
    const supabase = getSupabaseClient();

    let idCapitan = capitanId;
    if (!idCapitan) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Debe estar autenticado para crear un equipo.');
      }
      idCapitan = user.id;
    }

    if (!datos.nombre || datos.nombre.trim().length < 3 || datos.nombre.trim().length > 50) {
      throw new Error('El nombre del equipo debe tener entre 3 y 50 caracteres.');
    }
    if (!datos.tag || datos.tag.trim().length < 2 || datos.tag.trim().length > 6) {
      throw new Error('El tag o siglas del equipo debe tener entre 2 y 6 caracteres.');
    }

    const nuevoEquipo = {
      nombre: datos.nombre.trim(),
      tag: datos.tag.trim().toUpperCase(),
      logo_url: datos.logo_url || null,
      capitan_id: idCapitan,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('equipos')
      .insert(nuevoEquipo)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear equipo: ${error.message}`);
    }

    return data;
  },

  /**
   * Obtiene un equipo por su ID.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async obtenerEquipoPorId(id) {
    if (!id) {
      throw new Error('El ID de equipo es obligatorio.');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('equipos')
      .select('*, capitan:perfiles!equipos_capitan_id_fkey(id, username)')
      .eq('id', id)
      .single();

    if (error) {
      const fallback = await supabase.from('equipos').select('*').eq('id', id).single();
      if (fallback.error) throw new Error(`Equipo no encontrado: ${fallback.error.message}`);
      return fallback.data;
    }

    return data;
  },

  /**
   * Lista todos los equipos capitaneados por un usuario.
   * @param {string} capitanId
   * @returns {Promise<Array>}
   */
  async listarEquiposPorCapitan(capitanId) {
    if (!capitanId) {
      throw new Error('El ID del capitán es obligatorio.');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('capitan_id', capitanId);

    if (error) {
      throw new Error(`Error al listar equipos: ${error.message}`);
    }

    return data || [];
  }
};

export default equipoService;
