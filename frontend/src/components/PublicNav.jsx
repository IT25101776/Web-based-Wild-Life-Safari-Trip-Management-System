import {Link,NavLink} from 'react-router-dom';
import {LayoutDashboard,LogIn,Moon,Sun} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';

export default function PublicNav(){
 const {user}=useAuth();
 const {theme,toggleTheme}=useTheme();
 const {t}=useLanguage();
 return <header className="public-nav">
  <Link className="brand site-logo-link" to="/" aria-label="Safari Lanka home"><img src="/images/brand/safari-lanka-logo.png" alt="Safari Lanka - Yala National Park" className="site-logo public-site-logo"/></Link>
  <nav>
   <NavLink to="/packages">{t('Safari Packages')}</NavLink>
   <NavLink to="/experience">{t('Experience')}</NavLink>
   <NavLink to="/about-yala">{t('About Yala')}</NavLink>
   <NavLink to="/contact">{t('Contact Us')}</NavLink>
   {user?<Link className="btn btn-gold btn-sm nav-dashboard-btn" to="/dashboard"><LayoutDashboard size={17}/>{t('Dashboard')}</Link>:<Link className="btn btn-outline-light btn-sm nav-dashboard-btn" to="/login"><LogIn size={17}/>{t('Sign in')}</Link>}
   <button type="button" className="theme-toggle public-theme-toggle" onClick={toggleTheme} title={theme==='dark'?t('Light mode'):t('Dark mode')} aria-label={theme==='dark'?t('Light mode'):t('Dark mode')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
  </nav>
 </header>;
}
