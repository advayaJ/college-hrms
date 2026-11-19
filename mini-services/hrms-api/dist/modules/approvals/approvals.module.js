"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsModule = void 0;
const common_1 = require("@nestjs/common");
const approvals_controller_1 = require("./approvals.controller");
const approvals_service_1 = require("./approvals.service");
const leave_module_1 = require("../leave/leave.module");
const attendance_module_1 = require("../attendance/attendance.module");
const payroll_module_1 = require("../payroll/payroll.module");
const recruitment_module_1 = require("../recruitment/recruitment.module");
let ApprovalsModule = class ApprovalsModule {
};
exports.ApprovalsModule = ApprovalsModule;
exports.ApprovalsModule = ApprovalsModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => leave_module_1.LeaveModule), (0, common_1.forwardRef)(() => attendance_module_1.AttendanceModule), (0, common_1.forwardRef)(() => payroll_module_1.PayrollModule), (0, common_1.forwardRef)(() => recruitment_module_1.RecruitmentModule)],
        controllers: [approvals_controller_1.ApprovalsController],
        providers: [approvals_service_1.ApprovalsService],
    })
], ApprovalsModule);
//# sourceMappingURL=approvals.module.js.map