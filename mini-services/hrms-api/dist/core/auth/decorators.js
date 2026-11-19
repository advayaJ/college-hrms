"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermissions = exports.Public = exports.PERMISSIONS_KEY = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
exports.PERMISSIONS_KEY = 'requiredPermissions';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
const RequirePermissions = (...perms) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, perms);
exports.RequirePermissions = RequirePermissions;
//# sourceMappingURL=decorators.js.map