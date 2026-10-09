import { BadRequestException } from '@nestjs/common';
export class ZodValidationPipe {
    schema;
    constructor(schema) {
        this.schema = schema;
    }
    transform(value, _metadata) {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            const error = result.error;
            const formattedErrors = error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            throw new BadRequestException({
                message: formattedErrors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)),
                errors: formattedErrors,
                error: 'Bad Request',
            });
        }
        return result.data;
    }
}
//# sourceMappingURL=zod-validation.pipe.js.map