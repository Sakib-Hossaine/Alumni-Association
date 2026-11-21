import {useAuthStore} from '../store/authStore'
import type {Role} from '../types'
export function useRole(){const role=useAuthStore(s=>s.user?.role);return{role,isAdmin:role==='ADMIN',isManagement:role==='MANAGEMENT',isAlumni:role==='ALUMNI',hasRole:(roles:Role[])=>!!role&&roles.includes(role)}}
