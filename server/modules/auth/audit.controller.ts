import { Controller, Get, Query } from '@nestjs/common';

import { Can } from '@server/common/auth/auth.decorators';
import { AuditService } from './audit.service';

@Controller('api/admin/audit')
@Can('manage', 'Permission')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.audit.list(Number(limit) || 100);
  }
}
