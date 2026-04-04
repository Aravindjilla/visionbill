import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupDto, AddMemberDto } from './dto/groups.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  async create(@Req() req: any, @Body() body: CreateGroupDto) {
    return this.groupsService.create(req.user.userId, body);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.groupsService.findAll(req.user.userId);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.groupsService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.groupsService.delete(id, req.user.userId);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Req() req: any, @Body() member: any) {
    return this.groupsService.addMember(id, req.user.userId, member);
  }

  @Delete(':id/members/:index')
  async removeMember(@Param('id') id: string, @Param('index') index: number, @Req() req: any) {
    return this.groupsService.removeMember(id, req.user.userId, index);
  }
}
