var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema, transactionParamSchema, } from './dto/transaction.schema.js';
let TransactionsController = class TransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    create(token, user, dto) {
        return this.transactionsService.create(token, user.id, dto);
    }
    findAll(token, user, query) {
        return this.transactionsService.findAll(token, user.id, query);
    }
    findOne(token, user, params) {
        return this.transactionsService.findOne(token, user.id, params.id);
    }
    update(token, user, params, dto) {
        return this.transactionsService.update(token, user.id, params.id, dto);
    }
    remove(token, user, params) {
        return this.transactionsService.remove(token, user.id, params.id);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Body(new ZodValidationPipe(createTransactionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Query(new ZodValidationPipe(transactionQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(transactionParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(transactionParamSchema))),
    __param(3, Body(new ZodValidationPipe(updateTransactionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(transactionParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "remove", null);
TransactionsController = __decorate([
    Controller('transactions'),
    UseGuards(SupabaseAuthGuard),
    __metadata("design:paramtypes", [TransactionsService])
], TransactionsController);
export { TransactionsController };
//# sourceMappingURL=transactions.controller.js.map