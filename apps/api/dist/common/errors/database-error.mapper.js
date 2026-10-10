import { BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
export function mapDatabaseError(error) {
    if (!error) {
        return new InternalServerErrorException('An unexpected database error occurred');
    }
    const code = error.code;
    const message = error.message || '';
    if (code) {
        switch (code) {
            case 'P0001':
                return new NotFoundException('Draft not found, expired, already confirmed, or locked');
            case 'P0002':
                return new BadRequestException('Referenced category does not exist');
            case 'P0003':
                return new ForbiddenException('Category belongs to another user');
            case 'P0004':
                return new BadRequestException('Category type does not match transaction type');
            case 'P0008':
                return new BadRequestException('Transaction type must be income or expense');
            case 'P0009':
                return new BadRequestException('Amount must be a positive finite number not exceeding maximum permitted value');
            case 'P0010':
                return new BadRequestException('Invalid transaction date');
            case 'P0011':
                return new BadRequestException('Currency is not supported or format is invalid');
            case 'P0012':
                return new BadRequestException('User ID is required');
            case 'P0013':
                return new BadRequestException('Amount must have at most 2 decimal places');
            case 'P0014':
                return new BadRequestException('Description must be at most 500 characters');
            case 'P0015':
                return new BadRequestException('Loan has already been fully settled');
            case 'P0016':
                return new BadRequestException('Repayment amount exceeds outstanding loan balance');
            case '23503':
                return new BadRequestException('Referenced record does not exist');
            case '23505':
                return new ConflictException('A record with these details already exists');
            case '23514':
                return new BadRequestException('Database constraint check failed');
            case '42501':
                return new ForbiddenException('Access denied by security policy');
            case 'PGRST116':
                return new NotFoundException('Requested resource was not found');
            default:
                break;
        }
    }
    if (message.includes('draft_not_available')) {
        return new NotFoundException('Draft not found, expired, already confirmed, or locked');
    }
    if (message.includes('category_not_found')) {
        return new BadRequestException('Referenced category does not exist');
    }
    if (message.includes('category_not_owned')) {
        return new ForbiddenException('Category belongs to another user');
    }
    if (message.includes('category_type_mismatch')) {
        return new BadRequestException('Category type does not match transaction type');
    }
    if (message.includes('chk_amount_valid')) {
        return new BadRequestException('Amount must be a positive number with at most 2 decimal places');
    }
    return new InternalServerErrorException('Database operation failed');
}
//# sourceMappingURL=database-error.mapper.js.map