import { describe, it, expect } from 'vitest';
import servicesDefault, { authService, torneoService, equipoService, inscripcionService } from '../src/services/index.js';

describe('Barrel export de Servicios (services/index.js)', () => {
  it('debe exportar individualmente todos los servicios de la capa de negocio', () => {
    expect(authService).toBeDefined();
    expect(torneoService).toBeDefined();
    expect(equipoService).toBeDefined();
    expect(inscripcionService).toBeDefined();
  });

  it('debe exportar un objeto por defecto con todas las instancias de los servicios', () => {
    expect(servicesDefault).toBeDefined();
    expect(servicesDefault.auth).toBe(authService);
    expect(servicesDefault.torneo).toBe(torneoService);
    expect(servicesDefault.equipo).toBe(equipoService);
    expect(servicesDefault.inscripcion).toBe(inscripcionService);
  });
});
