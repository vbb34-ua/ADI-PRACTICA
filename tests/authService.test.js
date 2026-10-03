import { describe, it, expect, beforeEach } from 'vitest';
import { setSupabaseClient } from '../src/lib/supabaseClient.js';
import { authService } from '../src/services/authService.js';
import { createMockSupabase } from './mocks/mockSupabase.js';

describe('Servicio de Autenticación y Perfiles (authService)', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabase();
    setSupabaseClient(mockClient);
  });

  describe('Registro de usuarios', () => {
    it('debe rechazar un email con formato inválido', async () => {
      await expect(
        authService.registro({
          email: 'correo-invalido',
          password: 'password123',
          username: 'jugador1'
        })
      ).rejects.toThrow('El formato del email no es válido.');
    });

    it('debe rechazar una contraseña con menos de 6 caracteres', async () => {
      await expect(
        authService.registro({
          email: 'jugador@example.com',
          password: '123',
          username: 'jugador1'
        })
      ).rejects.toThrow('La contraseña debe tener al menos 6 caracteres.');
    });

    it('debe rechazar un nombre de usuario con menos de 3 caracteres', async () => {
      await expect(
        authService.registro({
          email: 'jugador@example.com',
          password: 'password123',
          username: 'ab'
        })
      ).rejects.toThrow('El nombre de usuario debe tener al menos 3 caracteres.');
    });

    it('debe registrar un usuario correctamente y devolver sesión con JWT', async () => {
      const resultado = await authService.registro({
        email: 'nuevo@torneos.com',
        password: 'password123',
        username: 'ProGamer99',
        nombreCompleto: 'Jugador Profesional'
      });

      expect(resultado).toBeDefined();
      expect(resultado.user).toBeDefined();
      expect(resultado.user.email).toBe('nuevo@torneos.com');
      expect(resultado.session).toBeDefined();
      expect(resultado.session.access_token).toBeDefined();
    });
  });

  describe('Inicio de sesión y JWT', () => {
    it('debe rechazar el login con credenciales incorrectas', async () => {
      await expect(
        authService.login({
          email: 'organizador@torneos.com',
          password: 'password_incorrecta'
        })
      ).rejects.toThrow('Error al iniciar sesión: Credenciales inválidas.');
    });

    it('debe iniciar sesión y devolver el token JWT con credenciales correctas', async () => {
      const resultado = await authService.login({
        email: 'organizador@torneos.com',
        password: 'password123'
      });

      expect(resultado.user).toBeDefined();
      expect(resultado.user.email).toBe('organizador@torneos.com');
      expect(resultado.token).toBeDefined();
      expect(resultado.token).toContain('mock-jwt-token');
      expect(resultado.session.access_token).toBe(resultado.token);
    });
  });

  describe('Gestión de Perfiles', () => {
    it('debe obtener el perfil existente de un usuario', async () => {
      const perfil = await authService.obtenerPerfil('user-capitan-1');

      expect(perfil).toBeDefined();
      expect(perfil.id).toBe('user-capitan-1');
      expect(perfil.username).toBe('CapitanAlpha');
      expect(perfil.rol).toBe('jugador');
    });

    it('debe actualizar el nombre de usuario y nombre completo del perfil', async () => {
      const perfilActualizado = await authService.actualizarPerfil('user-capitan-1', {
        username: 'CapitanUltra',
        nombre_completo: 'Carlos Capitán Ultra'
      });

      expect(perfilActualizado).toBeDefined();
      expect(perfilActualizado.username).toBe('CapitanUltra');
      expect(perfilActualizado.nombre_completo).toBe('Carlos Capitán Ultra');
    });

    it('debe rechazar una actualización con un username menor de 3 caracteres', async () => {
      await expect(
        authService.actualizarPerfil('user-capitan-1', { username: 'yo' })
      ).rejects.toThrow('El nombre de usuario debe tener al menos 3 caracteres.');
    });
  });

  describe('Cierre de sesión', () => {
    it('debe cerrar la sesión activa correctamente', async () => {
      const exito = await authService.cerrarSesion();
      expect(exito).toBe(true);

      const usuarioActual = await authService.obtenerUsuarioActual();
      expect(usuarioActual).toBeNull();
    });
  });
});
