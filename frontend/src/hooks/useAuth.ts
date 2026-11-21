import {useAuthStore} from '../store/authStore'
export const useAuth=()=>useAuthStore(s=>({user:s.user,authenticated:!!s.access,login:s.login,logout:s.logout}))
