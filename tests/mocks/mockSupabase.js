import { vi } from 'vitest';

/**
 * Generador de un cliente Supabase simulado en memoria para pruebas automatizadas offline.
 * Permite validar toda la lógica de negocio, control de acceso y capas de servicio.
 */
export function createMockSupabase() {
  const state = {
    users: [
      { id: 'user-organizador-1', email: 'organizador@torneos.com', raw_user_meta_data: { username: 'OrganizadorCS2' } },
      { id: 'user-capitan-1', email: 'capitan@equipo.com', raw_user_meta_data: { username: 'CapitanAlpha' } },
      { id: 'user-ajeno-1', email: 'otro@usuario.com', raw_user_meta_data: { username: 'UsuarioRandom' } }
    ],
    perfiles: [
      { id: 'user-organizador-1', username: 'OrganizadorCS2', nombre_completo: 'Organizador Principal', rol: 'organizador' },
      { id: 'user-capitan-1', username: 'CapitanAlpha', nombre_completo: 'Carlos Capitán', rol: 'jugador' },
      { id: 'user-ajeno-1', username: 'UsuarioRandom', nombre_completo: 'Juan Ajeno', rol: 'jugador' }
    ],
    torneos: [
      {
        id: 'torneo-1',
        titulo: 'Copa Apertura CS2',
        videojuego: 'CS2',
        descripcion: 'Torneo 5v5 oficial de apertura',
        formato: 'eliminacion_directa',
        plazas_max: 4,
        estado: 'inscripcion_abierta',
        fecha_inicio: new Date(Date.now() + 86400000 * 5).toISOString(),
        organizador_id: 'user-organizador-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'torneo-lleno',
        titulo: 'Torneo Relampago Valorant',
        videojuego: 'Valorant',
        descripcion: 'Torneo con aforo completo',
        formato: 'eliminacion_directa',
        plazas_max: 2,
        estado: 'inscripcion_abierta',
        fecha_inicio: new Date(Date.now() + 86400000 * 2).toISOString(),
        organizador_id: 'user-organizador-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'torneo-cerrado',
        titulo: 'Liga Finalizada Rocket League',
        videojuego: 'Rocket League',
        descripcion: 'Torneo ya disputado',
        formato: 'liga',
        plazas_max: 8,
        estado: 'finalizado',
        fecha_inicio: new Date(Date.now() - 86400000 * 10).toISOString(),
        organizador_id: 'user-organizador-1',
        created_at: new Date().toISOString()
      }
    ],
    equipos: [
      {
        id: 'equipo-1',
        nombre: 'Alpha Wolves',
        tag: 'AW',
        logo_url: 'https://example.com/logo1.png',
        capitan_id: 'user-capitan-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'equipo-2',
        nombre: 'Beta Titans',
        tag: 'BT',
        logo_url: 'https://example.com/logo2.png',
        capitan_id: 'user-organizador-1',
        created_at: new Date().toISOString()
      }
    ],
    inscripciones: [
      {
        id: 'inscripcion-existente-1',
        torneo_id: 'torneo-lleno',
        equipo_id: 'equipo-1',
        estado: 'confirmada',
        fecha_inscripcion: new Date().toISOString()
      },
      {
        id: 'inscripcion-existente-2',
        torneo_id: 'torneo-lleno',
        equipo_id: 'equipo-2',
        estado: 'confirmada',
        fecha_inscripcion: new Date().toISOString()
      }
    ],
    partidas: [
      {
        id: 'partida-1',
        torneo_id: 'torneo-1',
        equipo_local_id: 'equipo-1',
        equipo_visitante_id: 'equipo-2',
        ronda: 1,
        resultado_local: 2,
        resultado_visitante: 1,
        estado: 'finalizada'
      }
    ],
    currentUser: { id: 'user-organizador-1', email: 'organizador@torneos.com' }
  };

  const client = {
    state,
    auth: {
      async signUp({ email, password, options }) {
        const id = `user-${Date.now()}`;
        const newUser = { id, email, raw_user_meta_data: options?.data || {} };
        state.users.push(newUser);
        state.perfiles.push({
          id,
          username: options?.data?.username || email.split('@')[0],
          nombre_completo: options?.data?.nombre_completo || '',
          rol: 'jugador'
        });
        return {
          data: {
            user: newUser,
            session: {
              access_token: `mock-jwt-token-${id}`,
              refresh_token: `mock-refresh-token-${id}`,
              user: newUser
            }
          },
          error: null
        };
      },
      async signInWithPassword({ email, password }) {
        const user = state.users.find(u => u.email === email);
        if (!user || password !== 'password123') {
          return { data: { user: null, session: null }, error: { message: 'Credenciales inválidas.' } };
        }
        state.currentUser = user;
        return {
          data: {
            user,
            session: {
              access_token: `mock-jwt-token-${user.id}`,
              token_type: 'bearer',
              expires_in: 3600,
              user
            }
          },
          error: null
        };
      },
      async signOut() {
        state.currentUser = null;
        return { error: null };
      },
      async getUser() {
        return { data: { user: state.currentUser }, error: state.currentUser ? null : { message: 'No hay usuario autenticado' } };
      }
    },

    from(table) {
      let selectedFields = '*';
      let filters = [];
      let orderBy = null;
      let rangeLimit = null;
      let singleMode = false;
      let countExact = false;
      let isHead = false;
      let pendingInsert = null;
      let pendingUpdate = null;
      let pendingDelete = false;

      const builder = {
        select(fields = '*', options = {}) {
          selectedFields = fields;
          if (options.count === 'exact') countExact = true;
          if (options.head) isHead = true;
          return builder;
        },
        eq(col, val) {
          filters.push(item => item[col] === val);
          return builder;
        },
        ilike(col, val) {
          const pattern = val.replace(/%/g, '').toLowerCase();
          filters.push(item => (item[col] || '').toLowerCase().includes(pattern));
          return builder;
        },
        or(conditionStr) {
          return builder;
        },
        order(col, { ascending = true } = {}) {
          orderBy = { col, ascending };
          return builder;
        },
        range(from, to) {
          rangeLimit = { from, to };
          return builder;
        },
        limit(num) {
          rangeLimit = { from: 0, to: num - 1 };
          return builder;
        },
        single() {
          singleMode = true;
          return builder;
        },
        insert(records) {
          pendingInsert = Array.isArray(records) ? records : [records];
          return builder;
        },
        update(updates) {
          pendingUpdate = updates;
          return builder;
        },
        delete() {
          pendingDelete = true;
          return builder;
        },

        then(resolve, reject) {
          try {
            // Manejo de INSERT
            if (pendingInsert) {
              const inserted = [];
              for (const rec of pendingInsert) {
                const row = { id: rec.id || `${table}-${Date.now()}-${Math.floor(Math.random()*1000)}`, ...rec };
                if (!state[table]) state[table] = [];
                state[table].push(row);
                inserted.push(row);
              }
              const result = singleMode ? inserted[0] : inserted;
              return resolve({ data: result, error: null });
            }

            // Manejo de DELETE
            if (pendingDelete) {
              let rows = state[table] || [];
              const toDelete = rows.filter(item => filters.every(f => f(item)));
              state[table] = rows.filter(item => !toDelete.includes(item));
              return resolve({ data: toDelete, error: null });
            }

            // Filtrado de filas
            let rows = [...(state[table] || [])];
            for (const f of filters) {
              rows = rows.filter(f);
            }

            // Manejo de UPDATE
            if (pendingUpdate) {
              rows.forEach(item => Object.assign(item, pendingUpdate));
              const result = singleMode ? (rows[0] || null) : rows;
              return resolve({ data: result, error: rows.length ? null : { message: 'Registro no encontrado' } });
            }

            // JOINs simulados para inscripciones y perfiles
            rows = rows.map(item => {
              const copy = { ...item };
              if (table === 'inscripciones') {
                copy.equipo = (state.equipos || []).find(e => e.id === item.equipo_id) || null;
                copy.torneo = (state.torneos || []).find(t => t.id === item.torneo_id) || null;
              }
              if (table === 'torneos') {
                copy.organizador = (state.perfiles || []).find(p => p.id === item.organizador_id) || null;
              }
              if (table === 'equipos') {
                copy.capitan = (state.perfiles || []).find(p => p.id === item.capitan_id) || null;
              }
              return copy;
            });

            const totalCount = rows.length;

            if (orderBy) {
              rows.sort((a, b) => {
                if (a[orderBy.col] < b[orderBy.col]) return orderBy.ascending ? -1 : 1;
                if (a[orderBy.col] > b[orderBy.col]) return orderBy.ascending ? 1 : -1;
                return 0;
              });
            }

            if (rangeLimit) {
              rows = rows.slice(rangeLimit.from, rangeLimit.to + 1);
            }

            if (singleMode) {
              const row = rows[0] || null;
              return resolve({
                data: row,
                error: row ? null : { message: 'No rows found' }
              });
            }

            return resolve({
              data: isHead ? null : rows,
              count: countExact ? totalCount : null,
              error: null
            });
          } catch (err) {
            reject(err);
          }
        }
      };

      return builder;
    }
  };

  return client;
}
