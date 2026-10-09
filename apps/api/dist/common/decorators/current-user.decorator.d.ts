import type { User } from '@supabase/supabase-js';
export declare const CurrentUser: (...dataOrPipes: (keyof User | import("@nestjs/common").ParameterDecoratorOptions | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
