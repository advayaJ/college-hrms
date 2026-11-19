"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: ['log', 'warn', 'error'] });
    app.setGlobalPrefix('api/v1');
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
    app.enableShutdownHooks();
    const port = Number(process.env.PORT || 3001);
    await app.listen(port, '0.0.0.0');
    common_1.Logger.log(`HRMS API listening on http://0.0.0.0:${port}/api/v1`, 'Bootstrap');
}
void bootstrap();
//# sourceMappingURL=main.js.map