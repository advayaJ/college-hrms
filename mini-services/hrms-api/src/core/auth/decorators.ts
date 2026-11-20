import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
export const PERMISSIONS_KEY = 'requiredPermissions'

/** Route is accessible without a session (e.g. login, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

/**
 * Access is granted if the session's active role holds ANY of the listed
 * permission keys (OR semantics). Scope narrowing (institution vs department
 * vs self) is applied inside services.
 */
export const RequirePermissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms)
