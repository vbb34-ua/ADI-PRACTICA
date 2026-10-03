import { describe, it, expect, beforeEach } from 'vitest';
import { setSupabaseClient } from '../src/lib/supabaseClient.js';
import { torneoService } from '../src/services/torneoService.js';
import { createMockSupabase } from './mocks/mockSupabase.js';

describe('Servicio del Recurso Principal: TORNEOS (torneoService)', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabase();
    setSupabaseClient(mockClient);
  });

  describe('Creación de Torneo (Validaciones y Reglas de Negocio)', () => {
    it('debe rechazar un título de menos de 4 caracteres', async () => {
      await expect(
        torneoService.crearTorneo({
          titulo: 'CS',
          videojuego: 'CS2',
          plazas_max: 8,
          fecha_inicio: new Date().toISOString()
        }, 'user-organizador-1')
      ).rejects.toThrow('El título del torneo es obligatorio y debe tener entre 4 y 100 caracteres.');
    });

    it('debe rechazar la creación sin especificar un videojuego', async () => {
      await expect(
        torneoService.crearTorneo({
          titulo: 'Copa Mayor de Invierno',
          videojuego: '',
          plazas_max: 8,
          fecha_inicio: new Date().toISOString()
        }, 'user-organizador-1')
      ).rejects.toThrow('Debe especificar un videojuego válido para el torneo.');
    });

    it('debe rechazar plazas máximas menores a 2', async () => {
      await expect(
        torneoService.crearTorneo({
          titulo: 'Torneo 1v1 Invalido',
          videojuego: 'CS2',
          plazas_max: 1,
          fecha_inicio: new Date().toISOString()
        }, 'user-organizador-1')
      ).rejects.toThrow('El número de plazas máximas debe ser un entero mayor o igual a 2.');
    });

    it('debe rechazar una fecha de inicio inválida', async () => {
      await expect(
        torneoService.crearTorneo({
          titulo: 'Copa Fecha Invalida',
          videojuego: 'Valorant',
          plazas_max: 8,
          fecha_inicio: 'fecha-no-valida'
        }, 'user-organizador-1')
      ).rejects.toThrow('La fecha de inicio no tiene un formato válido.');
    });

    it('debe crear un nuevo torneo exitosamente con datos válidos', async () => {
      const nuevo = await torneoService.crearTorneo({
        titulo: 'Major Alicante CS2 2026',
        videojuego: 'CS2',
        descripcion: 'Fase eliminatoria presencial y online',
        formato: 'eliminacion_directa',
        plazas_max: 16,
        fecha_inicio: new Date(Date.now() + 86400000 * 7).toISOString()
      }, 'user-organizador-1');

      expect(nuevo).toBeDefined();
      expect(nuevo.id).toBeDefined();
      expect(nuevo.titulo).toBe('Major Alicante CS2 2026');
      expect(nuevo.organizador_id).toBe('user-organizador-1');
      expect(nuevo.estado).toBe('inscripcion_abierta');
    });
  });

  describe('Listado, Búsqueda y Paginación', () => {
    it('debe devolver un listado paginado con metadatos de paginación', async () => {
      const resultado = await torneoService.listarTorneos({ page: 1, pageSize: 2 });

      expect(resultado).toBeDefined();
      expect(resultado.torneos).toBeInstanceOf(Array);
      expect(resultado.torneos.length).toBeLessThanOrEqual(2);
      expect(resultado.page).toBe(1);
      expect(resultado.pageSize).toBe(2);
      expect(resultado.total).toBeGreaterThanOrEqual(3);
      expect(resultado.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('debe filtrar torneos por videojuego', async () => {
      const resultado = await torneoService.listarTorneos({ videojuego: 'CS2' });

      expect(resultado.torneos).toBeDefined();
      expect(resultado.torneos.every(t => t.videojuego === 'CS2')).toBe(true);
    });

    it('debe filtrar torneos por estado', async () => {
      const resultado = await torneoService.listarTorneos({ estado: 'finalizado' });

      expect(resultado.torneos).toBeDefined();
      expect(resultado.torneos.every(t => t.estado === 'finalizado')).toBe(true);
    });
  });

  describe('Obtención por ID con Recurso Secundario Relacionado', () => {
    it('debe obtener un torneo por ID incluyendo sus inscripciones y partidas relacionadas', async () => {
      const torneo = await torneoService.obtenerTorneoPorId('torneo-1', {
        incluirInscripciones: true,
        incluirPartidas: true
      });

      expect(torneo).toBeDefined();
      expect(torneo.id).toBe('torneo-1');
      expect(torneo.titulo).toBe('Copa Apertura CS2');
      // Recurso secundario 1: inscripciones
      expect(torneo.inscripciones).toBeDefined();
      expect(torneo.inscripciones).toBeInstanceOf(Array);
      // Recurso secundario 2: partidas
      expect(torneo.partidas).toBeDefined();
      expect(torneo.partidas).toBeInstanceOf(Array);
      expect(torneo.partidas.length).toBeGreaterThanOrEqual(1);
    });

    it('debe lanzar error al consultar un ID inexistente', async () => {
      await expect(
        torneoService.obtenerTorneoPorId('id-inexistente')
      ).rejects.toThrow();
    });
  });

  describe('Modificación de Torneos y Restricciones de Acceso', () => {
    it('debe permitir la edición al organizador del torneo', async () => {
      const actualizado = await torneoService.actualizarTorneo(
        'torneo-1',
        { titulo: 'Copa Apertura CS2 - Edición Oro', plazas_max: 8 },
        'user-organizador-1'
      );

      expect(actualizado).toBeDefined();
      expect(actualizado.titulo).toBe('Copa Apertura CS2 - Edición Oro');
      expect(actualizado.plazas_max).toBe(8);
    });

    it('debe denegar la edición si el usuario no es el organizador', async () => {
      await expect(
        torneoService.actualizarTorneo(
          'torneo-1',
          { titulo: 'Hackeo de Torneo' },
          'user-ajeno-1'
        )
      ).rejects.toThrow('Acceso denegado: solo el organizador del torneo puede modificarlo.');
    });
  });

  describe('Eliminación de Torneos', () => {
    it('debe denegar la eliminación si el usuario no es el organizador', async () => {
      await expect(
        torneoService.eliminarTorneo('torneo-1', 'user-ajeno-1')
      ).rejects.toThrow('Acceso denegado: solo el organizador puede eliminar el torneo.');
    });

    it('debe permitir la eliminación al organizador', async () => {
      const resultado = await torneoService.eliminarTorneo('torneo-1', 'user-organizador-1');

      expect(resultado.exito).toBe(true);
      expect(resultado.id).toBe('torneo-1');
    });
  });
});
