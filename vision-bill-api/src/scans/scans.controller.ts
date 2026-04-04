import { Controller, Post, Patch, UseInterceptors, UploadedFiles, Req, Get, Param, UseGuards, Body, UploadedFile, Delete, Query, BadRequestException } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ScansService } from './scans.service';
import { BillItemDto, UpdateItemsDto } from '../common-types';
import type { AuthenticatedRequest, ScanResponseDto, ScansListResponseDto } from '../common-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { ScanDocument } from './schemas/scan.schema';
import type { ScanSessionDocument } from './schemas/scan-session.schema';
import type { Express } from 'express';


const MULTER_UPLOAD_LIMITS = { fileSize: 10 * 1024 * 1024 }; // 10MB
const IMAGE_FILE_FILTER = (req: any, file: any, callback: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
    return callback(new BadRequestException('Only image files (JPG, PNG) are allowed!'), false);
  }
  callback(null, true);
};

const PDF_FILE_FILTER = (req: any, file: any, callback: any) => {
  if (file.mimetype !== 'application/pdf') {
    return callback(new BadRequestException('Only PDF files are allowed!'), false);
  }
  callback(null, true);
};

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScansController {
  constructor(private scansService: ScansService) {}

  @Post('demo-seed')
  async demoSeed(@Req() req: AuthenticatedRequest) {
    return this.scansService.demoSeed(req.user.userId);
  }

  @Post('session/init')
  async initSession(@Req() req: AuthenticatedRequest) {
    return this.scansService.createSession(req.user.userId);
  }

  @Post('session/:id/segment')
  @UseInterceptors(FileInterceptor('image', {
    limits: MULTER_UPLOAD_LIMITS,
    fileFilter: IMAGE_FILE_FILTER,
  }))
  async uploadSegment(@Param('id') sessionId: string, @UploadedFile() file: Express.Multer.File, @Req() req: AuthenticatedRequest) {
    return this.scansService.addSegmentToSession(sessionId, file.path, req.user.userId);
  }

  @Post('session/:id/finalize')
  async finalizeSession(@Param('id') sessionId: string, @Req() req: AuthenticatedRequest) {
    return this.scansService.finalizeSession(sessionId, req.user.userId);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 10, {
    limits: MULTER_UPLOAD_LIMITS,
    fileFilter: IMAGE_FILE_FILTER,
  }))
  async uploadScan(@UploadedFiles() files: Express.Multer.File[], @Req() req: AuthenticatedRequest) {
    return this.scansService.createScan(req.user.userId, files);
  }

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('pdf', {
    limits: MULTER_UPLOAD_LIMITS,
    fileFilter: PDF_FILE_FILTER,
  }))
  async uploadPdf(@UploadedFile() file: Express.Multer.File, @Req() req: AuthenticatedRequest) {
    return this.scansService.processPdfScan(req.user.userId, file);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.scansService.findAll(
      req.user.userId,
      limit ? parseInt(limit, 10) : undefined,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.scansService.findById(id, req.user.userId);
  }

  @Patch(':id/items')
  async updateItems(@Param('id') id: string, @Body() body: UpdateItemsDto, @Req() req: AuthenticatedRequest) {
    return this.scansService.updateItems(id, body.items, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.scansService.remove(id, req.user.userId);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.scansService.restore(id, req.user.userId);
  }
}
