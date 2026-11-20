"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const envelope_1 = require("../../core/http/envelope");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(user, limit = 30) {
        const [unread, rows] = await Promise.all([
            this.prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
            this.prisma.notification.findMany({
                where: { userId: user.userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
        ]);
        return {
            unread,
            items: rows.map((n) => ({
                id: n.id, kind: n.kind, title: n.title, body: n.body,
                link: n.link, severity: n.severity, isRead: n.isRead, createdAt: n.createdAt,
            })),
        };
    }
    async markRead(id, user) {
        const n = await this.prisma.notification.findUnique({ where: { id } });
        if (!n || n.userId !== user.userId)
            throw new envelope_1.NotFoundError('Notification not found');
        await this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
        return { ok: true };
    }
    async markAllRead(user) {
        await this.prisma.notification.updateMany({
            where: { userId: user.userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { ok: true };
    }
    async activity(user, limit = 12) {
        const canAudit = user.permissions.includes('settings:audit_read');
        const rows = await this.prisma.auditLog.findMany({
            where: canAudit ? {} : { userId: user.userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: { select: { employee: { select: { photoSeed: true } } } } },
        });
        return rows.map((r) => ({
            id: r.id,
            action: r.action,
            module: r.module,
            summary: r.summary,
            actorEmail: r.actorEmail === 'system' ? 'System' : r.actorEmail,
            createdAt: r.createdAt,
            photoSeed: r.user?.employee?.photoSeed ?? 0,
        }));
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map