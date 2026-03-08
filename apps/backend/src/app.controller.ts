import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Botão do Pânico API',
      health: '/health',
      docs: '/docs',
    };
  }
}
