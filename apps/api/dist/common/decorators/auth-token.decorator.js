import { createParamDecorator } from '@nestjs/common';
export const AuthToken = createParamDecorator((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.accessToken;
});
//# sourceMappingURL=auth-token.decorator.js.map