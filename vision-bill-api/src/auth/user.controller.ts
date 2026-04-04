import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  private validateOwnership(req: any, id: string) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only manage your own profile');
    }
  }

  @Get('profile/:id')
  async getProfile(@Req() req: any, @Param('id') id: string) {
    this.validateOwnership(req, id);
    return this.userService.findById(id);
  }

  @Post('profile/:id')
  async updateProfile(
    @Req() req: any,
    @Param('id') id: string,
    @Body('mobile') mobile?: string,
    @Body('upiId') upiId?: string,
    @Body('savingsGoal') savingsGoal?: number,
  ) {
    this.validateOwnership(req, id);
    return this.userService.updateProfile(id, { mobile, upiId, savingsGoal });
  }

  @Delete(':id')
  async deleteAccount(@Req() req: any, @Param('id') id: string) {
    this.validateOwnership(req, id);
    return this.userService.deleteAccount(id);
  }

  @Post('push-token/:id')
  async registerPushToken(@Req() req: any, @Param('id') id: string, @Body('token') token: string) {
    this.validateOwnership(req, id);
    return this.userService.registerPushToken(id, token);
  }
}
