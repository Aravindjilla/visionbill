import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pantry')
export class PantryController {
  constructor(private pantryService: PantryService) {}

  @Get()
  async getPantry(@Request() req: any) {
    const userId = req.user?.userId || 'demo-user-id'; // Fallback for local dev
    return this.pantryService.getPantryItems(userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user?.userId || 'demo-user-id';
    return this.pantryService.getStats(userId);
  }
}
