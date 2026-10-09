import { HttpException } from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';
export declare function mapDatabaseError(error: PostgrestError | Error | null | undefined): HttpException;
