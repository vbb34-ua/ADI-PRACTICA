import { getSupabaseClient } from '../lib/supabaseClient.js';

/**
 * Servicio para la gestión del recurso secundario: INSCRIPCIONES
 * Maneja el registro de escuadras a torneos, comprobación de cupos y cancelaciones.
 */
export const inscripcionService = {
  /**
   * Inscribe a un equipo en un torneo con validación de plazas, estado y capitanía.
   * @param {Object} params
   * @param {string} params.torneoId
   * @param {string} params.equipoId
   * @param {string} [params.capitanId]
   * @returns {Promise<Object>}
   */
  async inscribirEquipo({ torneoId, equipoId, capitanId = null }) {
    if (!torneoId) {
      throw new Error('El ID del torneo es obligatorio.');
    }
    if (!equipoId) {
      throw new Error('El ID del equipo es obligatorio.');
    }

    const supabase = getSupabaseClient();

    // 1. Obtener usuario autenticado si no se proporciona
    let idCapitan = capitanId;
    if (!idCapitan) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Debe iniciar sesión para inscribir un equipo.');
      }
      idCapitan = user.id;
    }

    // 2. Validar que el solicitante sea realmente el capitán del equipo
    const { data: equipo, error: errEquipo } = await supabase
      .from('equipos')
      .select('id, nombre, capitan_id')
      .eq('id', equipoId)
      .single();

    if (errEquipo || !equipo) {
      throw new Error('El equipo especificado no existe.');
    }
    if (equipo.capitan_id !== idCapitan) {
      throw new Error('Acceso denegado: solo el capitán del equipo puede realizar la inscripción.');
    }

    // 3. Validar estado y plazas del torneo
    const { data: torneo, error: errTorneo } = await supabase
      .from('torneos')
      .select('id, estado, plazas_max')
      .eq('id', torneoId)
      .single();

    if (errTorneo || !torneo) {
      throw new Error('El torneo especificado no existe.');
    }
    if (torneo.estado !== 'inscripcion_abierta') {
      throw new Error(`El torneo no admite inscripciones en estado actual: ${torneo.estado}.`);
    }

    // 4. Comprobar cupo actual de inscritos
    const { count: totalInscritos, error: errCount } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('torneo_id', torneoId)
      .eq('estado', 'confirmada');

    if (!errCount && totalInscritos >= torneo.plazas_max) {
      throw new Error(`El torneo ha alcanzado su cupo máximo de plazas (${torneo.plazas_max}).`);
    }

    // 5. Insertar inscripción
    const nuevaInscripcion = {
      torneo_id: torneoId,
      equipo_id: equipoId,
      estado: 'confirmada',
      fecha_inscripcion: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inscripciones')
      .insert(nuevaInscripcion)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new Error('El equipo ya está inscrito en este torneo.');
      }
      throw new Error(`Error al registrar la inscripción: ${error.message}`);
    }

    return data;
  },

  /**
   * Obtiene la lista de inscripciones confirmadas para un torneo.
   * @param {string} torneoId
   * @returns {Promise<Array>}
   */
  async listarInscripcionesTorneo(torneoId) {
    if (!torneoId) {
      throw new Error('El ID del torneo es obligatorio.');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('inscripciones')
      .select(`
        id,
        estado,
        fecha_inscripcion,
        equipo:equipos (
          id,
          nombre,
          tag,
          logo_url,
          capitan_id
        )
      `)
      .eq('torneo_id', torneoId)
      .order('fecha_inscripcion', { ascending: true });

    if (error) {
      throw new Error(`Error al listar inscripciones: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Cancela/elimina una inscripción de un torneo.
   * Solo el capitán del equipo inscrito o el organizador del torneo pueden cancelarla.
   * @param {string} inscripcionId
   * @param {string} [usuarioId]
   * @returns {Promise<{ exito: boolean, id: string }>}
   */
  async cancelarInscripcion(inscripcionId, usuarioId = null) {
    if (!inscripcionId) {
      throw new Error('El ID de inscripción es obligatorio.');
    }

    const supabase = getSupabaseClient();

    // Comprobación de permisos si se especifica usuarioId
    if (usuarioId) {
      const { data: inscripcion, error: errBusq } = await supabase
        .from('inscripciones')
        .select(`
          id,
          equipo:equipos(capitan_id),
          torneo:torneos(organizador_id)
        `)
        .eq('id', inscripcionId)
        .single();

      if (errBusq || !inscripcion) {
        throw new Error('La inscripción a cancelar no existe.');
      }

      const esCapitan = inscripcion.equipo && inscripcion.equipo.capitan_id === usuarioId;
      const esOrganizador = inscripcion.torneo && inscripcion.torneo.organizador_id === usuarioId;

      if (!esCapitan && !esOrganizador) {
        throw new Error('Acceso denegado: solo el capitán del equipo o el organizador del torneo pueden cancelar la inscripción.');
      }
    }

    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('id', inscripcionId);

    if (error) {
      throw new Error(`Error al cancelar inscripción: ${error.message}`);
    }

    return { exito: true, id: inscripcionId };
  }
};

export default inscripcionService;
