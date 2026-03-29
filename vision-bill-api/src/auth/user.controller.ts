import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post('profile/:id')
  async updateProfile(
    @Param('id') id: string,
    @Body('mobile') mobile?: string,
    @Body('upiId') upiId?: string,
  ) {
    return this.userService.updateProfile(id, { mobile, upiId });
  }

  @Post('push-token/:id')
  async registerPushToken(@Param('id') id: string, @Body('token') token: string) {
    return this.userService.registerPushToken(id, token);
  }
}
