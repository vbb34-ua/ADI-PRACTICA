export { authService } from './authService.js';
export { torneoService } from './torneoService.js';
export { equipoService } from './equipoService.js';
export { inscripcionService } from './inscripcionService.js';

import { authService } from './authService.js';
import { torneoService } from './torneoService.js';
import { equipoService } from './equipoService.js';
import { inscripcionService } from './inscripcionService.js';

export default {
  auth: authService,
  torneo: torneoService,
  equipo: equipoService,
  inscripcion: inscripcionService
};
