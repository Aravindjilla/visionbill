import { Controller, Get, Post, Patch, Delete, UseGuards, Request, Query, Param, Body } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pantry')
@UseGuards(JwtAuthGuard)
export class PantryController {
  constructor(private pantryService: PantryService) {}

  @Get()
  async getPantry(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const userId = req.user.userId;
    return this.pantryService.getPantryItems(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      page ? parseInt(page, 10) : undefined,
    );
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user.userId;
    return this.pantryService.getStats(userId);
  }

  @Get('weekly-trend')
  async getWeeklyTrend(@Request() req: any) {
    const userId = req.user.userId;
    return this.pantryService.getWeeklyTrend(userId);
  }

  @Post('recipes')
  async suggestRecipes(@Request() req: any) {
    const userId = req.user.userId;
    return this.pantryService.suggestRecipes(userId);
  }

  @Patch(':id')
  async updateItem(@Request() req: any, @Param('id') id: string, @Body() update: any) {
    const userId = req.user.userId;
    return this.pantryService.updateItem(userId, id, update);
  }

  @Delete(':id')
  async deleteItem(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.pantryService.deleteItem(userId, id);
  }
}
