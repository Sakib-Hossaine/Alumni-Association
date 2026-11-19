import {useEffect, useState} from 'react'
import type {User} from '../../types'
import {mediaUrl} from '../../lib/utils'

export function UserAvatar({user,className=''}:{user:User;className?:string}){
 const[src,setSrc]=useState(mediaUrl(user.profile_photo))
 useEffect(()=>setSrc(mediaUrl(user.profile_photo)),[user.profile_photo])
 const initials=user.name?.trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase()
 return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400 font-bold text-[#111326] ${className}`}>{src?<img src={src} alt="" className="h-full w-full object-cover" onError={()=>setSrc('')}/>:initials}</span>
}
