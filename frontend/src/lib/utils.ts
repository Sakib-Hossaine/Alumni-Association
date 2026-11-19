export const initials=(name='User')=>name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()
export const money=(value:number|string)=>new Intl.NumberFormat('en-BD',{style:'currency',currency:'BDT',maximumFractionDigits:0}).format(Number(value||0))
export const dateLabel=(value:string)=>new Date(value).toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})
export const mediaUrl=(value?:string|null)=>{if(!value)return '';try{return new URL(value, window.location.origin).toString()}catch{return value}}
