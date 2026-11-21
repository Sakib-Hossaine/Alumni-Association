export const initials=(name='User')=>name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()
export const money=(value:number|string)=>new Intl.NumberFormat('en-BD',{style:'currency',currency:'BDT',maximumFractionDigits:0}).format(Number(value||0))
export const dateLabel=(value:string)=>new Date(value).toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})
export const mediaUrl=(value?:string|null)=>{
 if(!value)return ''
 if(value.startsWith('blob:')||value.startsWith('data:')||/^https?:\/\//i.test(value))return value
 try{
  const apiBase=import.meta.env.VITE_API_URL||'/api/v1'
  const base=apiBase.startsWith('http')?apiBase:window.location.origin
  return new URL(value.startsWith('/')?value:`/${value}`,base).toString()
 }catch{
  return value
 }
}
