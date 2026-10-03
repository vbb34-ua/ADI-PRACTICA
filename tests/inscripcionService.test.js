import { describe, it, expect, beforeEach } from 'vitest';
import { setSupabaseClient } from '../src/lib/supabaseClient.js';
import { inscripcionService } from '../src/services/inscripcionService.js';
import { equipoService } from '../src/services/equipoService.js';
import { createMockSupabase } from './mocks/mockSupabase.js';

describe('Servicio de Recursos Secundarios: INSCRIPCIONES (inscripcionService)', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabase();
    setSupabaseClient(mockClient);
  });

  describe('Inscripciones de Equipos a Torneos (inscripcionService)', () => {
    it('debe denegar la inscripción si el solicitante no es el capitán del equipo', async () => {
      await expect(
        inscripcionService.inscribirEquipo({
          torneoId: 'torneo-1',
          equipoId: 'equipo-1',
          capitanId: 'user-ajeno-1'
        })
      ).rejects.toThrow('Acceso denegado: solo el capitán del equipo puede realizar la inscripción.');
    });

    it('debe denegar la inscripción si el torneo no admite inscripciones (ej. finalizado o cerrado)', async () => {
      await expect(
        inscripcionService.inscribirEquipo({
          torneoId: 'torneo-cerrado',
          equipoId: 'equipo-1',
          capitanId: 'user-capitan-1'
        })
      ).rejects.toThrow(/El torneo no admite inscripciones en estado actual/);
    });

    it('debe denegar la inscripción si el torneo ya ha alcanzado el aforo máximo de plazas', async () => {
      // Crear un nuevo equipo cuyo capitán sea user-capitan-1
      const equipoExtra = await equipoService.crearEquipo({
        nombre: 'Delta Force',
        tag: 'DF'
      }, 'user-capitan-1');

      await expect(
        inscripcionService.inscribirEquipo({
          torneoId: 'torneo-lleno',
          equipoId: equipoExtra.id,
          capitanId: 'user-capitan-1'
        })
      ).rejects.toThrow(/El torneo ha alcanzado su cupo máximo de plazas/);
    });

    it('debe inscribir con éxito a un equipo cuando se cumplen todas las condiciones', async () => {
      const inscripcion = await inscripcionService.inscribirEquipo({
        torneoId: 'torneo-1',
        equipoId: 'equipo-1',
        capitanId: 'user-capitan-1'
      });

      expect(inscripcion).toBeDefined();
      expect(inscripcion.id).toBeDefined();
      expect(inscripcion.torneo_id).toBe('torneo-1');
      expect(inscripcion.equipo_id).toBe('equipo-1');
      expect(inscripcion.estado).toBe('confirmada');
    });

    it('debe listar las inscripciones de un torneo con datos de los equipos', async () => {
      const inscripciones = await inscripcionService.listarInscripcionesTorneo('torneo-lleno');

      expect(inscripciones).toBeInstanceOf(Array);
      expect(inscripciones.length).toBe(2);
      expect(inscripciones[0].torneo_id).toBe('torneo-lleno');
    });

    it('debe permitir al capitán o al organizador cancelar la inscripción', async () => {
      const resultado = await inscripcionService.cancelarInscripcion(
        'inscripcion-existente-1',
        'user-capitan-1'
      );

      expect(resultado.exito).toBe(true);
      expect(resultado.id).toBe('inscripcion-existente-1');
    });

    it('debe denegar la cancelación a un usuario ajeno', async () => {
      await expect(
        inscripcionService.cancelarInscripcion('inscripcion-existente-2', 'user-ajeno-1')
      ).rejects.toThrow('Acceso denegado: solo el capitán del equipo o el organizador del torneo pueden cancelar la inscripción.');
    });
  });
});
