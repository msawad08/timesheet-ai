import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { InviteUserDto, UpdateUserRoleDto } from '@libs/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.userService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.userService.findOne(id, tenantId);
  }

  @Post()
  async invite(@Body() dto: InviteUserDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.userService.invite(dto, tenantId);
  }

  @Put(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: any
  ) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.userService.updateRole(id, dto, tenantId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.userService.delete(id, tenantId);
  }
}
