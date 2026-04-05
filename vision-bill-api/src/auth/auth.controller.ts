import { Controller, Get, Req, UseGuards, Res, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RefreshDto } from './dto/refresh.dto';
import { IsString, IsNotEmpty } from 'class-validator';

class GoogleMobileDto {
  @IsString() @IsNotEmpty() idToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateUser(req.user);
    res.json(result);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async refresh(@Req() req: any, @Body() body: RefreshDto) {
    if (req.user.sub !== body.userId) {
      throw new BadRequestException('Unauthorized refresh attempt');
    }
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  @Post('google-mobile')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async googleMobile(@Body() body: GoogleMobileDto) {
    return this.authService.validateGoogleIdToken(body.idToken);
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async status(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.sub);
    if (!user) throw new BadRequestException('User not found');
    return {
      id: user._id,
      tier: user.tier || 'free',
      monthlyScanCount: user.monthlyScanCount || 0,
    };
  }
}
