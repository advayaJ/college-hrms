"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_module_1 = require("./core/core.module");
const auth_module_1 = require("./modules/auth/auth.module");
const employees_module_1 = require("./modules/employees/employees.module");
const departments_module_1 = require("./modules/departments/departments.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const leave_module_1 = require("./modules/leave/leave.module");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const recruitment_module_1 = require("./modules/recruitment/recruitment.module");
const workload_module_1 = require("./modules/workload/workload.module");
const appraisal_module_1 = require("./modules/appraisal/appraisal.module");
const documents_module_1 = require("./modules/documents/documents.module");
const reports_module_1 = require("./modules/reports/reports.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const settings_module_1 = require("./modules/settings/settings.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const health_controller_1 = require("./modules/health/health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            core_module_1.CoreModule,
            auth_module_1.AuthModule,
            employees_module_1.EmployeesModule,
            departments_module_1.DepartmentsModule,
            attendance_module_1.AttendanceModule,
            leave_module_1.LeaveModule,
            payroll_module_1.PayrollModule,
            recruitment_module_1.RecruitmentModule,
            workload_module_1.WorkloadModule,
            appraisal_module_1.AppraisalModule,
            documents_module_1.DocumentsModule,
            reports_module_1.ReportsModule,
            notifications_module_1.NotificationsModule,
            settings_module_1.SettingsModule,
            dashboard_module_1.DashboardModule,
            approvals_module_1.ApprovalsModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map