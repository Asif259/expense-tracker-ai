import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service.js';
import { SupabaseAdminService } from './supabase-admin.service.js';

@Global()
@Module({
  providers: [SupabaseService, SupabaseAdminService],
  exports: [SupabaseService, SupabaseAdminService],
})
export class SupabaseModule {}
