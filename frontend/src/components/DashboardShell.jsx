import {Link,NavLink,useLocation,useNavigate} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {
  Home,LogOut,Package,CalendarDays,WalletCards,ShieldCheck,Settings,
  MapPinned,UserRound,Users,AlertTriangle,MessageSquareText,UserPlus,ScrollText,Moon,Sun,Bell,CalendarOff
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import api from '../utils/api';

const roleLabel={TOURIST:'Tourist / Visitor',SAFARI_OPERATOR:'Safari Operations Manager',SAFARI_GUIDE:'Safari Guide / Naturalist',JEEP_DRIVER:'Jeep Driver',PARK_OFFICER:'Authorized Park / Gate Officer',FINANCE_MANAGER:'Finance & Administration Manager',SYSTEM_ADMIN:'System Administrator'};

const adminRoleLinks=[
  ['TOURIST',Users,'Tourist Users'],
  ['SAFARI_OPERATOR',Users,'Safari Operators'],
  ['SAFARI_GUIDE',Users,'Safari Guides'],
  ['JEEP_DRIVER',Users,'Jeep Drivers'],
  ['PARK_OFFICER',Users,'Park / Gate Officers'],
  ['FINANCE_MANAGER',Users,'Finance Managers'],
  ['SYSTEM_ADMIN',Users,'System Administrators']
];
const adminOperationLinks=[
  ['LIVE_MAP',MapPinned,'Live Safari Map'],
  ['BOOKINGS',CalendarDays,'Manage Safari Bookings'],
  ['LEAVE_REQUESTS',CalendarOff,'Leave Requests'],
  ['INCIDENTS',AlertTriangle,'Incident Reports'],
  ['CONTACTS',MessageSquareText,'Contact Requests']
];
const adminToolLinks=[
  ['ADD_ROLE',UserPlus,'Add Role Login'],
  ['ACCOUNT_REQUESTS',MessageSquareText,'Account Change Requests'],
  ['SETTINGS',Settings,'System Settings'],
  ['AUDIT',ScrollText,'Audit Activity']
];

export default function DashboardShell({children,title,subtitle}){
 const {user,logout}=useAuth();
 const {theme,toggleTheme}=useTheme();
 const {t}=useLanguage();
 const nav=useNavigate();
 const location=useLocation();
 const role=user?.role;
 const [unread,setUnread]=useState(0);
 useEffect(()=>{let live=true;const load=()=>api.get('/notifications/unread-count').then(r=>{if(live)setUnread(Number(r.data?.count||0));}).catch(()=>{});load();const timer=setInterval(load,10000);const changed=()=>load();window.addEventListener('safari-notifications-changed',changed);return()=>{live=false;clearInterval(timer);window.removeEventListener('safari-notifications-changed',changed);};},[user?.id]);
 useEffect(()=>{if(!location.hash)return;const id=decodeURIComponent(location.hash.slice(1));const timer=setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),140);return()=>clearTimeout(timer);},[location.pathname,location.search,location.hash]);
 const links=[['/dashboard',Home,'Dashboard']];
 if(role==='TOURIST')links.push(['/packages',Package,'Safari Packages']);
 if(role==='SAFARI_OPERATOR')links.push(['/packages',Package,'Public Packages']);
 if(['SAFARI_GUIDE','JEEP_DRIVER'].includes(role))links.push(['/dashboard',CalendarDays,'My Trips']);
 if(role==='PARK_OFFICER')links.push(['/dashboard',ShieldCheck,'Permits']);
 if(role==='FINANCE_MANAGER')links.push(['/dashboard',WalletCards,'Finance']);

 const adminKey=new URLSearchParams(location.search).get('admin')||'OVERVIEW';
 const adminLink=(key,I,label)=><Link key={key} className={adminKey===key?'active':''} to={`/dashboard?admin=${key}`}><I size={17}/>{label}</Link>;

 return <div className={`dash-shell${role==='SYSTEM_ADMIN'?' admin-shell':''}`}>
  <aside className="sidebar">
   <Link className="side-brand site-side-logo-link" to="/" title="Go to Safari Lanka home"><img src="/images/brand/safari-lanka-logo.png" alt="Safari Lanka - Yala National Park" className="side-site-logo"/></Link>
   <div className="user-card"><div className={`avatar ${user?.profileImageUrl?'has-photo':''}`}>{user?.profileImageUrl?<img src={user.profileImageUrl} alt={`${user.fullName} profile`}/>:<UserRound size={22}/>}</div><div><strong>{user?.fullName}</strong><small>{roleLabel[role]||role}</small></div></div>

   {role==='SYSTEM_ADMIN' ? <nav className="admin-sidebar-nav">
    <Link className={adminKey==='OVERVIEW'?'active':''} to="/dashboard"><Home size={18}/>{t('Dashboard')}</Link>
    <div className="side-nav-section">
     <span className="side-nav-label">{t('Login roles')}</span>
     {adminRoleLinks.map(([key,I,label])=>adminLink(key,I,label))}
    </div>
    <div className="side-nav-section">
     <span className="side-nav-label">{t('Operations control')}</span>
     {adminOperationLinks.map(([key,I,label])=>adminLink(key,I,label))}
    </div>
    <div className="side-nav-section">
     <span className="side-nav-label">{t('Administration tools')}</span>
     {adminToolLinks.map(([key,I,label])=>adminLink(key,I,label))}
    </div>
    <Link className={location.pathname==='/notifications'?'active':''} to="/notifications"><Bell size={18}/>{t('Notifications')}{unread>0&&<span className="side-notification-badge">{unread>99?'99+':unread}</span>}</Link>
    <Link className={location.pathname==='/account'?'active':''} to="/account"><UserRound size={18}/>{t('My Account')}</Link>
   </nav> : <nav>
    {links.map(([to,I,l],i)=><NavLink key={i} to={to} end={to==='/dashboard'} className={({isActive})=>isActive&&!(role==='TOURIST'&&to==='/dashboard'&&new URLSearchParams(location.search).get('view')==='trip-status')?'active':''}><I size={18}/>{l}</NavLink>)}
    {role==='TOURIST'&&<Link className={location.pathname==='/dashboard'&&new URLSearchParams(location.search).get('view')==='trip-status'?'active':''} to="/dashboard?view=trip-status"><MapPinned size={18}/>Trip Status</Link>}
    <NavLink to="/notifications"><Bell size={18}/>{t('Notifications')}{unread>0&&<span className="side-notification-badge">{unread>99?'99+':unread}</span>}</NavLink>
    <NavLink to="/account"><UserRound size={18}/>{t('My Account')}</NavLink>
   </nav>}

   <div className="side-spacer"/>
   <NavLink className="park-link" to="/"><MapPinned size={18}/>{t('Yala public site')}</NavLink>
   <button className="logout-btn" onClick={()=>{logout();nav('/')}}><LogOut size={18}/>{t('Sign out')}</button>
  </aside>
  <main className="dash-main"><div className="dash-top"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="dash-top-actions"><Link className="notification-bell-button" to="/notifications" title="Notifications"><Bell size={19}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</Link><button type="button" className="theme-toggle" onClick={toggleTheme} title={theme==='dark'?t('Light mode'):t('Dark mode')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><span className="role-pill">{roleLabel[role]}</span></div></div>{children}</main>
 </div>;
}
