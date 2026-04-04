import { Controller, Get, Req, UseGuards, Res, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  @Post('google-mobile')
  async googleMobile(@Body() body: GoogleMobileDto) {
    return this.authService.validateGoogleIdToken(body.idToken);
  }

  @Get('status')
  async status(@Req() req: any) {
    return { status: 'OK' };
  }
}
