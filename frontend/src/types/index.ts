export type Role='ADMIN'|'MANAGEMENT'|'ALUMNI'
export interface User{id:string;email:string;name:string;role:Role;phone?:string|null;profile_photo?:string|null;is_verified:boolean}
export interface Batch{id:string;number:string;year:number|null;description?:string|null;is_active:boolean;created_at:string}
export interface ContactInfo{personal_email?:string;mobile_phone?:string;current_city?:string;current_country?:string}
export interface Employment{ id:string;company_name:string;job_title:string;industry:string;employment_status:string;work_city?:string;work_country?:string;linkedin_url?:string;start_date?:string|null;end_date?:string|null;is_current:boolean }
export interface EngagementPreference{interested_in_mentoring:boolean;interested_in_guest_speaking:boolean;interested_in_donating:boolean;interested_in_volunteering:boolean;preferred_communication_channel:string;communication_frequency:string}
export interface ConsentRecord{gdpr_consent:boolean;consent_date?:string|null;data_retention_until?:string|null}
export interface AlumniProfile{id:string;user:string;student_id:string;full_name:string;preferred_name?:string|null;gender:'MALE'|'FEMALE'|'OTHER';date_of_birth?:string|null;nationality?:string|null;profile_photo?:string|null;graduation_year?:number|null;major:'Computer Science';batch:Batch|null;batch_id?:string|null;bio?:string|null;contact?:ContactInfo|null;employments?:Employment[];engagement_preference?:EngagementPreference|null;consent?:ConsentRecord|null}
export interface Event{id:string;title:string;event_type:string;event_date:string;venue:string;description:string;is_published:boolean;registration_count:number;is_registered?:boolean}
export interface Donation{id:string;alumni:string;amount:string;donation_date:string;purpose:string;payment_method:string;transaction_id?:string|null;alumni_name?:string;status:'PENDING'|'RECEIVED'|'REJECTED'}
export interface Page<T>{count:number;next:string|null;previous:string|null;results:T[]}
