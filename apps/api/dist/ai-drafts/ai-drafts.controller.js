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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards, } from '@nestjs/common';
import { AiDraftsService } from './ai-drafts.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { createAiDraftSchema, aiDraftParamSchema, } from './dto/ai-draft.schema.js';
let AiDraftsController = class AiDraftsController {
    aiDraftsService;
    constructor(aiDraftsService) {
        this.aiDraftsService = aiDraftsService;
    }
    create(user, dto) {
        return this.aiDraftsService.createDraft(user.id, dto);
    }
    list(token, user) {
        return this.aiDraftsService.listDrafts(token, user.id);
    }
    get(token, user, params) {
        return this.aiDraftsService.getDraft(token, user.id, params.id);
    }
    delete(token, user, params) {
        return this.aiDraftsService.deleteDraft(token, user.id, params.id);
    }
    confirm(token, params) {
        return this.aiDraftsService.confirmDraft(token, params.id);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, CurrentUser()),
    __param(1, Body(new ZodValidationPipe(createAiDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiDraftsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AiDraftsController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(aiDraftParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AiDraftsController.prototype, "get", null);
__decorate([
    Delete(':id'),
    __param(0, AuthToken()),
    __param(1, CurrentUser()),
    __param(2, Param(new ZodValidationPipe(aiDraftParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AiDraftsController.prototype, "delete", null);
__decorate([
    Post(':id/confirm'),
    HttpCode(HttpStatus.OK),
    __param(0, AuthToken()),
    __param(1, Param(new ZodValidationPipe(aiDraftParamSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AiDraftsController.prototype, "confirm", null);
AiDraftsController = __decorate([
    Controller('ai-drafts'),
    UseGuards(SupabaseAuthGuard),
    __metadata("design:paramtypes", [AiDraftsService])
], AiDraftsController);
export { AiDraftsController };
//# sourceMappingURL=ai-drafts.controller.js.map