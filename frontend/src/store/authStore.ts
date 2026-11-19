import {create} from 'zustand'
import {createJSONStorage,persist} from 'zustand/middleware'
import type {User} from '../types'
interface AuthState{user:User|null;access:string|null;refresh:string|null;login:(user:User,access:string,refresh:string)=>void;setUser:(user:User)=>void;setTokens:(access:string,refresh:string)=>void;logout:()=>void}
export const useAuthStore=create<AuthState>()(persist((set)=>({user:null,access:null,refresh:null,login:(user,access,refresh)=>set({user,access,refresh}),setUser:(user)=>set({user}),setTokens:(access,refresh)=>set({access,refresh}),logout:()=>set({user:null,access:null,refresh:null})}),{name:'alumni-auth',storage:createJSONStorage(()=>localStorage)}))
