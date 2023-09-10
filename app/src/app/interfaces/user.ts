export interface User {
    id: string,
    email: string,
    first_name?: string,
    is_active: boolean,
    is_superuser: boolean,
    is_verified: boolean,
    last_name?: string,
    role: string,
}