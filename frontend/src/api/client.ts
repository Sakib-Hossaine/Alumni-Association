import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
const baseURL=import.meta.env.VITE_API_URL||'/api/v1'
export const api=axios.create({baseURL})
let refreshing:Promise<string>|null=null
const isAuthEndpoint=(url?:string)=>/\/auth\/(login|token\/refresh)\/?(?:\?|$)/.test(url||'')
api.interceptors.request.use((config:InternalAxiosRequestConfig)=>{
 const token=useAuthStore.getState().access
 if(token&&!isAuthEndpoint(config.url))config.headers.Authorization=`Bearer ${token}`
 if(config.data instanceof FormData){
  config.headers.delete('Content-Type')
 }else if(config.method && config.method !== 'get'){
  config.headers['Content-Type']='application/json'
 }
 return config
})
api.interceptors.response.use(r=>r,async(error:AxiosError)=>{const original=error.config as (InternalAxiosRequestConfig&{_retry?:boolean})|undefined
 if(error.response?.status===401&&original&&!isAuthEndpoint(original.url)&&!original._retry&&useAuthStore.getState().refresh){original._retry=true
  try{refreshing??=axios.post(`${baseURL}/auth/token/refresh/`,{refresh:useAuthStore.getState().refresh}).then(r=>r.data.access as string).finally(()=>{refreshing=null});const access=await refreshing;useAuthStore.getState().setTokens(access,useAuthStore.getState().refresh!);original.headers.Authorization=`Bearer ${access}`;return api(original)}catch{useAuthStore.getState().logout()}}
 return Promise.reject(error)})
