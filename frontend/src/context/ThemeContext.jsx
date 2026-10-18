import {createContext,useContext,useEffect,useMemo,useState} from 'react';
const ThemeContext=createContext(null);
export function ThemeProvider({children}){
 const [theme,setTheme]=useState(()=>localStorage.getItem('safari_theme')||'light');
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('safari_theme',theme);},[theme]);
 const toggleTheme=()=>setTheme(t=>t==='dark'?'light':'dark');
 const value=useMemo(()=>({theme,setTheme,toggleTheme}),[theme]);
 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme=()=>useContext(ThemeContext);
