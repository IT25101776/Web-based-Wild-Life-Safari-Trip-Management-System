import {createContext,useContext,useEffect,useState} from 'react';
import api from '../utils/api';
import {useLanguage} from './LanguageContext';
const C=createContext(null);
export function AuthProvider({children}){
 const {setLanguage}=useLanguage();
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('safari_user'));}catch{return null}});const [loading,setLoading]=useState(true);
 const syncLanguage=u=>{if(u?.preferredLanguage)setLanguage(u.preferredLanguage)};
 useEffect(()=>{const t=localStorage.getItem('safari_token'); if(!t){setLoading(false);return;} api.get('/auth/me').then(r=>{setUser(r.data);localStorage.setItem('safari_user',JSON.stringify(r.data));syncLanguage(r.data);}).catch(()=>{localStorage.removeItem('safari_token');localStorage.removeItem('safari_user');setUser(null);}).finally(()=>setLoading(false));},[]);
 const save=(data)=>{localStorage.setItem('safari_token',data.token);localStorage.setItem('safari_user',JSON.stringify(data.user));setUser(data.user);syncLanguage(data.user)};
 const login=async(email,password)=>{const r=await api.post('/auth/login',{email,password});save(r.data);return r.data.user};
 const register=async(payload)=>{const r=await api.post('/auth/register',payload);save(r.data);return r.data.user};
 const logout=()=>{localStorage.removeItem('safari_token');localStorage.removeItem('safari_user');setUser(null);setLanguage('ENGLISH')};
 return <C.Provider value={{user,loading,login,register,logout,setUser}}>{children}</C.Provider>
}
export const useAuth=()=>useContext(C);
