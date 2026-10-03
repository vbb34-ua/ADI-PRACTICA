import { describe, it, expect, beforeEach } from 'vitest';
import { setSupabaseClient } from '../src/lib/supabaseClient.js';
import { equipoService } from '../src/services/equipoService.js';
import { createMockSupabase } from './mocks/mockSupabase.js';

describe('Servicio de Gestión de Equipos (equipoService)', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabase();
    setSupabaseClient(mockClient);
  });

  describe('Creación de Equipos (crearEquipo)', () => {
    it('debe rechazar la creación si no se pasa capitanId y no hay usuario autenticado', async () => {
      mockClient.state.currentUser = null;

      await expect(
        equipoService.crearEquipo({
          nombre: 'Equipo Sin Auth',
          tag: 'ESA'
        })
      ).rejects.toThrow('Debe estar autenticado para crear un equipo.');
    });

    it('debe asignar automáticamente el ID del usuario en sesión si no se especifica capitanId', async () => {
      mockClient.state.currentUser = { id: 'user-capitan-1', email: 'capitan@equipo.com' };

      const nuevo = await equipoService.crearEquipo({
        nombre: 'Autenticado FC',
        tag: 'AFC'
      });

      expect(nuevo).toBeDefined();
      expect(nuevo.capitan_id).toBe('user-capitan-1');
      expect(nuevo.nombre).toBe('Autenticado FC');
      expect(nuevo.tag).toBe('AFC');
    });

    it('debe rechazar un nombre de equipo con menos de 3 caracteres o mayor de 50', async () => {
      await expect(
        equipoService.crearEquipo({
          nombre: 'AB',
          tag: 'ABC'
        }, 'user-capitan-1')
      ).rejects.toThrow('El nombre del equipo debe tener entre 3 y 50 caracteres.');

      await expect(
        equipoService.crearEquipo({
          nombre: 'A'.repeat(51),
          tag: 'ABC'
        }, 'user-capitan-1')
      ).rejects.toThrow('El nombre del equipo debe tener entre 3 y 50 caracteres.');

      await expect(
        equipoService.crearEquipo({
          nombre: '   ',
          tag: 'ABC'
        }, 'user-capitan-1')
      ).rejects.toThrow('El nombre del equipo debe tener entre 3 y 50 caracteres.');
    });

    it('debe rechazar un tag con menos de 2 caracteres o mayor de 6', async () => {
      await expect(
        equipoService.crearEquipo({
          nombre: 'Team Secret',
          tag: 'X'
        }, 'user-capitan-1')
      ).rejects.toThrow('El tag o siglas del equipo debe tener entre 2 y 6 caracteres.');

      await expect(
        equipoService.crearEquipo({
          nombre: 'Team Secret',
          tag: 'TOOLONG'
        }, 'user-capitan-1')
      ).rejects.toThrow('El tag o siglas del equipo debe tener entre 2 y 6 caracteres.');
    });

    it('debe crear un equipo correctamente formateando el tag a mayúsculas y eliminando espacios', async () => {
      const nuevo = await equipoService.crearEquipo({
        nombre: '  Ninjas in Pyjamas  ',
        tag: '  nip  ',
        logo_url: 'https://example.com/nip.png'
      }, 'user-capitan-1');

      expect(nuevo).toBeDefined();
      expect(nuevo.id).toBeDefined();
      expect(nuevo.nombre).toBe('Ninjas in Pyjamas');
      expect(nuevo.tag).toBe('NIP');
      expect(nuevo.logo_url).toBe('https://example.com/nip.png');
      expect(nuevo.capitan_id).toBe('user-capitan-1');
      expect(nuevo.created_at).toBeDefined();
    });

    it('debe permitir crear un equipo sin logo_url (dejándolo en null)', async () => {
      const nuevo = await equipoService.crearEquipo({
        nombre: 'Team Solo',
        tag: 'TSM'
      }, 'user-capitan-1');

      expect(nuevo).toBeDefined();
      expect(nuevo.logo_url).toBeNull();
    });
  });

  describe('Consulta de Equipos por ID (obtenerEquipoPorId)', () => {
    it('debe rechazar si no se especifica el ID del equipo', async () => {
      await expect(
        equipoService.obtenerEquipoPorId('')
      ).rejects.toThrow('El ID de equipo es obligatorio.');
    });

    it('debe devolver un equipo existente con la relación del capitán', async () => {
      const equipo = await equipoService.obtenerEquipoPorId('equipo-1');

      expect(equipo).toBeDefined();
      expect(equipo.id).toBe('equipo-1');
      expect(equipo.nombre).toBe('Alpha Wolves');
      expect(equipo.tag).toBe('AW');
      expect(equipo.capitan).toBeDefined();
      expect(equipo.capitan.id).toBe('user-capitan-1');
    });

    it('debe lanzar error cuando el equipo no existe', async () => {
      await expect(
        equipoService.obtenerEquipoPorId('equipo-inexistente-999')
      ).rejects.toThrow(/Equipo no encontrado/);
    });
  });

  describe('Listar Equipos por Capitán (listarEquiposPorCapitan)', () => {
    it('debe rechazar si no se proporciona el ID del capitán', async () => {
      await expect(
        equipoService.listarEquiposPorCapitan(null)
      ).rejects.toThrow('El ID del capitán es obligatorio.');
    });

    it('debe devolver la lista de equipos capitaneados por el usuario especificado', async () => {
      const equipos = await equipoService.listarEquiposPorCapitan('user-capitan-1');

      expect(equipos).toBeInstanceOf(Array);
      expect(equipos.length).toBeGreaterThanOrEqual(1);
      expect(equipos[0].capitan_id).toBe('user-capitan-1');
    });

    it('debe devolver un array vacío si el capitán no tiene equipos', async () => {
      const equipos = await equipoService.listarEquiposPorCapitan('user-ajeno-1');

      expect(equipos).toBeInstanceOf(Array);
      expect(equipos.length).toBe(0);
    });
  });
});
