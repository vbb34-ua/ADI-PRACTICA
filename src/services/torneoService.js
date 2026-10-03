import { getSupabaseClient } from '../lib/supabaseClient.js';

/**
 * Servicio para la gestión del recurso principal: TORNEOS
 * Implementa CRUD, búsqueda, filtros, paginación y obtención con recursos secundarios.
 */
export const torneoService = {
  /**
   * Crea un nuevo torneo tras validar las reglas de negocio.
   * @param {Object} datos
   * @param {string} datos.titulo
   * @param {string} datos.videojuego
   * @param {number} datos.plazas_max
   * @param {string} [datos.descripcion]
   * @param {string} [datos.formato]
   * @param {string|Date} datos.fecha_inicio
   * @param {string} [organizadorId] ID del usuario organizador (si no se pasa, se toma de la sesión actual)
   * @returns {Promise<Object>}
   */
  async crearTorneo(datos, organizadorId = null) {
    const supabase = getSupabaseClient();

    // Obtener organizador si no viene especificado
    let idCreador = organizadorId;
    if (!idCreador) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Debe estar autenticado para crear un torneo.');
      }
      idCreador = user.id;
    }

    // Validaciones de negocio
    if (!datos.titulo || datos.titulo.trim().length < 4 || datos.titulo.trim().length > 100) {
      throw new Error('El título del torneo es obligatorio y debe tener entre 4 y 100 caracteres.');
    }
    if (!datos.videojuego || datos.videojuego.trim().length < 2) {
      throw new Error('Debe especificar un videojuego válido para el torneo.');
    }
    const plazas = parseInt(datos.plazas_max, 10);
    if (isNaN(plazas) || plazas < 2) {
      throw new Error('El número de plazas máximas debe ser un entero mayor o igual a 2.');
    }
    if (!datos.fecha_inicio) {
      throw new Error('Debe indicar la fecha de inicio del torneo.');
    }
    const fechaInicio = new Date(datos.fecha_inicio);
    if (isNaN(fechaInicio.getTime())) {
      throw new Error('La fecha de inicio no tiene un formato válido.');
    }

    const nuevoTorneo = {
      titulo: datos.titulo.trim(),
      videojuego: datos.videojuego.trim(),
      descripcion: datos.descripcion ? datos.descripcion.trim() : '',
      formato: datos.formato || 'eliminacion_directa',
      plazas_max: plazas,
      estado: datos.estado || 'inscripcion_abierta',
      fecha_inicio: fechaInicio.toISOString(),
      organizador_id: idCreador,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('torneos')
      .insert(nuevoTorneo)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear torneo: ${error.message}`);
    }

    return data;
  },

  /**
   * Obtiene un listado paginado de torneos con soporte de filtros.
   * @param {Object} [opciones]
   * @param {number} [opciones.page=1]
   * @param {number} [opciones.pageSize=10]
   * @param {string} [opciones.videojuego] Filtro por juego
   * @param {string} [opciones.estado] Filtro por estado
   * @param {string} [opciones.orden='desc']
   * @returns {Promise<{ torneos: Array, total: number, page: number, pageSize: number, totalPages: number }>}
   */
  async listarTorneos({ page = 1, pageSize = 10, videojuego = null, estado = null, orden = 'desc' } = {}) {
    const supabase = getSupabaseClient();
    const paginaActual = Math.max(1, parseInt(page, 10) || 1);
    const tamano = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10));
    const desde = (paginaActual - 1) * tamano;
    const hasta = desde + tamano - 1;

    let query = supabase
      .from('torneos')
      .select('*, organizador:perfiles!torneos_organizador_id_fkey(id, username)', { count: 'exact' });

    if (videojuego) {
      query = query.ilike('videojuego', `%${videojuego}%`);
    }
    if (estado) {
      query = query.eq('estado', estado);
    }

    query = query
      .order('fecha_inicio', { ascending: orden === 'asc' })
      .range(desde, hasta);

    const { data, count, error } = await query;

    if (error) {
      // Fallback si la relación de foreign key se llama de forma genérica
      const fallbackQuery = supabase
        .from('torneos')
        .select('*', { count: 'exact' });
      if (videojuego) fallbackQuery.ilike('videojuego', `%${videojuego}%`);
      if (estado) fallbackQuery.eq('estado', estado);
      const res = await fallbackQuery.order('fecha_inicio', { ascending: orden === 'asc' }).range(desde, hasta);
      if (res.error) throw new Error(`Error al listar torneos: ${res.error.message}`);
      return {
        torneos: res.data || [],
        total: res.count || 0,
        page: paginaActual,
        pageSize: tamano,
        totalPages: Math.ceil((res.count || 0) / tamano)
      };
    }

    return {
      torneos: data || [],
      total: count || 0,
      page: paginaActual,
      pageSize: tamano,
      totalPages: Math.ceil((count || 0) / tamano)
    };
  },

  /**
   * Busca torneos por término de búsqueda en título o descripción.
   * @param {string} termino
   * @param {Object} [paginacion]
   * @returns {Promise<Array>}
   */
  async buscarTorneos(termino, { page = 1, pageSize = 10 } = {}) {
    if (!termino || termino.trim().length === 0) {
      const res = await this.listarTorneos({ page, pageSize });
      return res.torneos;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('torneos')
      .select('*')
      .or(`titulo.ilike.%${termino.trim()}%,descripcion.ilike.%${termino.trim()}%,videojuego.ilike.%${termino.trim()}%`)
      .limit(pageSize);

    if (error) {
      throw new Error(`Error al buscar torneos: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Obtiene los datos de un torneo junto con sus recursos secundarios relacionados (inscripciones y/o partidas).
   * @param {string} id
   * @param {Object} [opciones]
   * @param {boolean} [opciones.incluirInscripciones=true]
   * @param {boolean} [opciones.incluirPartidas=false]
   * @returns {Promise<Object>}
   */
  async obtenerTorneoPorId(id, { incluirInscripciones = true, incluirPartidas = false } = {}) {
    if (!id) {
      throw new Error('El ID del torneo es obligatorio.');
    }

    const supabase = getSupabaseClient();

    // Consulta básica del torneo
    const { data: torneo, error } = await supabase
      .from('torneos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !torneo) {
      throw new Error(`Torneo no encontrado: ${error ? error.message : 'ID inexistente'}`);
    }

    // Carga de recurso secundario 1: inscripciones de equipos
    if (incluirInscripciones) {
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select(`
          id,
          estado,
          fecha_inscripcion,
          equipo:equipos(id, nombre, tag, logo_url, capitan_id)
        `)
        .eq('torneo_id', id);

      torneo.inscripciones = inscripciones || [];
    }

    // Carga de recurso secundario 2: partidas
    if (incluirPartidas) {
      const { data: partidas } = await supabase
        .from('partidas')
        .select('*')
        .eq('torneo_id', id)
        .order('ronda', { ascending: true });

      torneo.partidas = partidas || [];
    }

    return torneo;
  },

  /**
   * Modifica los datos de un torneo existente verificando autoría.
   * @param {string} id
   * @param {Object} nuevosDatos
   * @param {string} [usuarioId] ID del usuario que solicita la edición (debe ser el organizador)
   * @returns {Promise<Object>}
   */
  async actualizarTorneo(id, nuevosDatos, usuarioId = null) {
    if (!id) {
      throw new Error('El ID del torneo es obligatorio.');
    }

    const supabase = getSupabaseClient();

    // Verificar existencia y organizador
    const { data: actual, error: errBusqueda } = await supabase
      .from('torneos')
      .select('organizador_id, estado')
      .eq('id', id)
      .single();

    if (errBusqueda || !actual) {
      throw new Error('El torneo a modificar no existe.');
    }

    if (usuarioId && actual.organizador_id !== usuarioId) {
      throw new Error('Acceso denegado: solo el organizador del torneo puede modificarlo.');
    }

    // Validar campos a actualizar
    const camposPermitidos = ['titulo', 'descripcion', 'videojuego', 'formato', 'plazas_max', 'estado', 'fecha_inicio'];
    const carga = {};

    for (const key of Object.keys(nuevosDatos)) {
      if (camposPermitidos.includes(key)) {
        carga[key] = nuevosDatos[key];
      }
    }

    if (carga.titulo && (carga.titulo.trim().length < 4 || carga.titulo.trim().length > 100)) {
      throw new Error('El título debe tener entre 4 y 100 caracteres.');
    }
    if (carga.plazas_max) {
      const plazas = parseInt(carga.plazas_max, 10);
      if (isNaN(plazas) || plazas < 2) {
        throw new Error('Las plazas máximas deben ser al menos 2.');
      }
      carga.plazas_max = plazas;
    }
    if (carga.fecha_inicio) {
      const fecha = new Date(carga.fecha_inicio);
      if (isNaN(fecha.getTime())) {
        throw new Error('La fecha de inicio no es válida.');
      }
      carga.fecha_inicio = fecha.toISOString();
    }

    carga.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('torneos')
      .update(carga)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar torneo: ${error.message}`);
    }

    return data;
  },

  /**
   * Elimina un torneo si el usuario es el organizador.
   * @param {string} id
   * @param {string} [usuarioId]
   * @returns {Promise<{ exito: boolean, id: string }>}
   */
  async eliminarTorneo(id, usuarioId = null) {
    if (!id) {
      throw new Error('El ID del torneo es obligatorio.');
    }

    const supabase = getSupabaseClient();

    // Comprobación de seguridad
    if (usuarioId) {
      const { data: actual } = await supabase
        .from('torneos')
        .select('organizador_id')
        .eq('id', id)
        .single();

      if (actual && actual.organizador_id !== usuarioId) {
        throw new Error('Acceso denegado: solo el organizador puede eliminar el torneo.');
      }
    }

    const { error } = await supabase
      .from('torneos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar torneo: ${error.message}`);
    }

    return { exito: true, id };
  }
};

export default torneoService;
