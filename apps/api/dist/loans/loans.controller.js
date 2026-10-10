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
import { LoansService } from './loans.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { createLoanSchema, updateLoanSchema, recordRepaymentSchema, loanQuerySchema, loanParamSchema, repaymentParamSchema, } from '@ledgerly/shared-types';
let LoansController = class LoansController {
    loansService;
    constructor(loansService) {
        this.loansService = loansService;
    }
    create(token, user, dto) {
        return this.loansService.create(token, user.id, dto);
    }
    findAll(token, user, query) {
        return this.loansService.findAll(token, user.id, query);
    }
    getSummary(token, user) {
        return this.loansService.getSummary(token, user.id);
    }
    findOne(token, user, params) {
        return this.loansService.findOne(token, user.id, params.id);
    }
    update(token, user, params, dto) {
        return this.loansService.update(token, user.id, params.id, dto);
    }
    remove(token, user, params) {
        return this.loansService.remove(token, user.id, params.id);
    }
    recordRepayment(token, params, dto) {
        return this.loansService.recordRepayment(token, params.id, dto);
    }
    removeRepayment(token, user, params) {
        return this.loansService.removeRepayment(token, user.id, params.id, params.repaymentId);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Body(new ZodValidationPipe(createLoanSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Query(new ZodValidationPipe(loanQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findAll", null);
__decorate([
    Get('summary'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getSummary", null);
__decorate([
    Get(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(loanParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(loanParamSchema))),
    __param(3, Body(new ZodValidationPipe(updateLoanSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(loanParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "remove", null);
__decorate([
    Post(':id/repayments'),
    HttpCode(HttpStatus.CREATED),
    __param(0, AuthToken()),
    __param(1, Param(new ZodValidationPipe(loanParamSchema))),
    __param(2, Body(new ZodValidationPipe(recordRepaymentSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "recordRepayment", null);
__decorate([
    Delete(':id/repayments/:repaymentId'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(repaymentParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "removeRepayment", null);
LoansController = __decorate([
    Controller('loans'),
    UseGuards(SupabaseAuthGuard),
    __metadata("design:paramtypes", [LoansService])
], LoansController);
export { LoansController };
//# sourceMappingURL=loans.controller.js.map