import path from 'node:path'

const AUTH_DIR = path.join(__dirname, '.auth')

export const LANDLORD_STORAGE_STATE = path.join(AUTH_DIR, 'landlord.json')
export const TENANT_STORAGE_STATE = path.join(AUTH_DIR, 'tenant.json')
export const EMPTY_LANDLORD_STORAGE_STATE = path.join(AUTH_DIR, 'empty-landlord.json')
export const UNASSIGNED_TENANT_STORAGE_STATE = path.join(AUTH_DIR, 'unassigned-tenant.json')
