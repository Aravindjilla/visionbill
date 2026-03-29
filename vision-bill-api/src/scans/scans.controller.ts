import { Controller, Post, Patch, UseInterceptors, UploadedFiles, Req, Get, Param, UseGuards, Body, UploadedFile, Delete, Query } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ScansService } from './scans.service';


@Controller('scans')
export class ScansController {
  constructor(private scansService: ScansService) {}

  @Post('demo-seed')
  async demoSeed(@Req() req: any) {
    const userId = req.user?.sub || 'demo-user-id';
    return this.scansService.demoSeed(userId);
  }

  @Post('session/init')
  async initSession(@Req() req: any) {
    const userId = req.user?.sub || 'demo-user-id';
    return this.scansService.createSession(userId);
  }

  @Post('session/:id/segment')
  @UseInterceptors(FileInterceptor('image'))
  async uploadSegment(@Param('id') sessionId: string, @UploadedFile() file: any) {
    return this.scansService.addSegmentToSession(sessionId, file.path);
  }

  @Post('session/:id/finalize')
  async finalizeSession(@Param('id') sessionId: string) {
    return this.scansService.finalizeSession(sessionId);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadScan(@UploadedFiles() files: any[], @Req() req: any) {
    const userId = req.user?.sub;
    if (!userId && process.env.NODE_ENV === 'production') {
      throw new Error('Unauthorized');
    }
    const finalUserId = userId || 'demo-user-id'; // Fallback for dev only
    return this.scansService.createScan(finalUserId, files);
  }


  @Get()
  async findAll(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const userId = req.user?.sub || 'demo-user-id';
    return this.scansService.findAll(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scansService.findById(id);
  }

  @Patch(':id/items')
  async updateItems(@Param('id') id: string, @Body() body: { items: any[] }) {
    return this.scansService.updateItems(id, body.items);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.scansService.remove(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.scansService.restore(id);
  }
}
