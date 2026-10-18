import {useEffect,useMemo,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight,Bell,BellRing,CheckCheck,MessageSquareText,Send,X} from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import api,{messageOf} from '../utils/api';
import {useAuth} from '../context/AuthContext';

const roles=[
 ['TOURIST','Tourists'],['SAFARI_OPERATOR','Safari Operators'],['SAFARI_GUIDE','Safari Guides'],['JEEP_DRIVER','Jeep Drivers'],['PARK_OFFICER','Park / Gate Officers'],['FINANCE_MANAGER','Finance Managers'],['SYSTEM_ADMIN','System Administrators']
];
const fmt=v=>v?String(v).replace('T',' ').slice(0,16):'—';

function relatedDestination(notification,role){
 const category=String(notification?.category||'SYSTEM').toUpperCase();
 if(role==='SYSTEM_ADMIN'){
  if(category==='NEW_BOOKING'||category==='BOOKING_UPDATE'||category.startsWith('PAYMENT'))return {path:'/dashboard?admin=BOOKINGS',label:'Open booking management'};
  if(category==='LEAVE_REQUEST'||category==='LEAVE_DECISION')return {path:'/dashboard?admin=LEAVE_REQUESTS',label:'Open leave requests'};
  if(category==='CONTACT')return {path:'/dashboard?admin=CONTACTS',label:'Open contact requests'};
  if(category==='INCIDENT')return {path:'/dashboard?admin=INCIDENTS',label:'Open incident reports'};
  if(category==='REFUND')return {path:'/dashboard?admin=BOOKINGS',label:'Open related operations'};
  if(category==='ACCOUNT_CHANGE_REQUEST')return {path:'/dashboard?admin=ACCOUNT_REQUESTS',label:'Open account change requests'};
  return {path:'/dashboard',label:'Open dashboard'};
 }
 if(category==='ACCOUNT_CHANGE_DECISION')return {path:'/account',label:'Open My Account'};
 if(role==='SAFARI_OPERATOR'){
  if(category==='TRIP_ASSIGNMENT')return {path:'/dashboard?tab=assignments',label:'Open assignments'};
  if(category==='INCIDENT')return {path:'/dashboard?tab=incidents',label:'Open incidents'};
  if(category==='CONTACT')return {path:'/dashboard?tab=contacts',label:'Open contact requests'};
  if(category==='NEW_BOOKING'||category==='BOOKING_UPDATE'||category.startsWith('PAYMENT')||category.startsWith('GATE')||category==='TRIP_COMPLETED')return {path:'/dashboard?tab=bookings',label:'Open bookings'};
  return {path:'/dashboard',label:'Open dashboard'};
 }
 if(role==='FINANCE_MANAGER'){
  if(category==='PAYMENT_REVIEW')return {path:'/dashboard#bank-review',label:'Open bank payment review'};
  if(category==='REFUND')return {path:'/dashboard#refunds',label:'Open refund workflow'};
  if(category.startsWith('PAYMENT'))return {path:'/dashboard#payment-ledger',label:'Open payment ledger'};
  return {path:'/dashboard',label:'Open finance dashboard'};
 }
 if(role==='PARK_OFFICER'){
  if(category==='PERMIT')return {path:'/dashboard?tab=permits',label:'Open permit review'};
  if(category.startsWith('GATE'))return {path:'/dashboard?tab=validate',label:'Open gate validation'};
  if(category==='INCIDENT')return {path:'/dashboard?tab=incidents',label:'Open incidents'};
  return {path:'/dashboard',label:'Open park dashboard'};
 }
 if(role==='SAFARI_GUIDE'){
  if(category==='LEAVE_DECISION')return {path:'/dashboard#guide-leave',label:'Open leave requests'};
  if(category==='TRIP_ASSIGNMENT'||category.startsWith('GATE')||category==='TRIP_COMPLETED')return {path:'/dashboard#guide-assignments',label:'Open safari assignments'};
  return {path:'/dashboard',label:'Open guide dashboard'};
 }
 if(role==='JEEP_DRIVER'){
  if(category==='TRIP_ASSIGNMENT'||category.startsWith('GATE')||category==='TRIP_COMPLETED')return {path:'/dashboard#driver-trips',label:'Open assigned trips'};
  return {path:'/dashboard',label:'Open driver dashboard'};
 }
 if(role==='TOURIST'){
  if(category==='TRIP_ASSIGNMENT'||category==='PERMIT'||category.startsWith('GATE')||category==='TRIP_COMPLETED')return {path:'/dashboard?view=trip-status',label:'Open Trip Status'};
  if(category.startsWith('PAYMENT')||category==='REFUND'||category==='BOOKING_UPDATE')return {path:'/dashboard',label:'Open my bookings'};
  return {path:'/dashboard',label:'Open tourist dashboard'};
 }
 return {path:'/dashboard',label:'Open dashboard'};
}

export default function NotificationsPage(){
 const {user}=useAuth();const isAdmin=user?.role==='SYSTEM_ADMIN';const nav=useNavigate();
 const [items,setItems]=useState([]),[users,setUsers]=useState([]),[err,setErr]=useState(''),[msg,setMsg]=useState(''),[selected,setSelected]=useState(null);
 const [form,setForm]=useState({targetType:'ALL',recipientId:'',role:'SAFARI_OPERATOR',title:'',message:''});
 const load=async()=>{try{const [n,u]=await Promise.all([api.get('/notifications/mine'),isAdmin?api.get('/admin/users'):Promise.resolve({data:[]})]);setItems(n.data);setUsers(u.data.filter(x=>x.active&&!x.archived));}catch(e){setErr(messageOf(e));}};
 useEffect(()=>{load();const timer=setInterval(load,15000);return()=>clearInterval(timer);},[isAdmin]);
 const unread=items.filter(x=>!x.readFlag).length;
 const markRead=async n=>{if(n.readFlag)return;try{await api.patch(`/notifications/${n.id}/read`);setItems(xs=>xs.map(x=>x.id===n.id?{...x,readFlag:true}:x));window.dispatchEvent(new Event('safari-notifications-changed'));}catch(e){setErr(messageOf(e));}};
 const openNotification=async n=>{setSelected(n);await markRead(n);};
 const readAll=async()=>{try{await api.patch('/notifications/read-all');setItems(xs=>xs.map(x=>({...x,readFlag:true})));window.dispatchEvent(new Event('safari-notifications-changed'));}catch(e){setErr(messageOf(e));}};
 const send=async e=>{e.preventDefault();setErr('');setMsg('');try{if(isAdmin){await api.post('/notifications/admin/send',{...form,recipientId:form.targetType==='USER'?Number(form.recipientId):null});setMsg('Notice sent successfully.');}else{await api.post('/notifications/message-admin',{title:form.title,message:form.message});setMsg('Your message was sent to System Administration.');}setForm(f=>({...f,title:'',message:''}));await load();}catch(e){setErr(messageOf(e));}};
 const targetUsers=useMemo(()=>users.filter(x=>x.id!==user?.id),[users,user]);
 const related=selected?relatedDestination(selected,user?.role):null;
 const goRelated=()=>{const path=related?.path;setSelected(null);if(path)nav(path);};
 return <DashboardShell title="Notifications & Messages" subtitle="Latest booking, payment, permit, leave and administration updates in one place.">
  {err&&<div className="alert error">{err}</div>}{msg&&<div className="alert success">{msg}</div>}
  <div className="notification-page-grid">
   <section className="panel notification-inbox">
    <div className="panel-head"><div><h2><Bell size={20}/> Notification inbox</h2><p>{unread} unread • latest 100 notifications</p></div><button className="mini-action" disabled={!unread} onClick={readAll}><CheckCheck size={15}/>Mark all read</button></div>
    <div className="notification-list">{items.map(n=><button type="button" key={n.id} className={`notification-card ${n.readFlag?'':'unread'}`} onClick={()=>openNotification(n)}><span className="notification-dot"/><div className="notification-copy"><div className="notification-title-row"><b>{n.title}</b><small>{fmt(n.createdAt)}</small></div><p>{n.message}</p><div className="notification-meta"><span>{(n.category||'SYSTEM').replaceAll('_',' ')}</span>{n.sender&&<span>From: {n.sender.fullName}</span>}{!n.readFlag&&<span className="new-chip">NEW</span>}<span className="notification-open-hint">Click to open</span></div></div></button>)}{!items.length&&<div className="empty compact">No notifications yet. New booking, payment, permit, leave and administration events will appear here.</div>}</div>
   </section>
   <section className="panel notification-compose">
    <div className="panel-head"><div><h2><MessageSquareText size={20}/>{isAdmin?'Send notice / message':'Message System Administrator'}</h2><p>{isAdmin?'Send a direct notice to one login, a complete role, or everyone.':'Use this for special needs, account questions or operational assistance.'}</p></div></div>
    <form className="form-grid" onSubmit={send}>
     {isAdmin&&<><label>Target<select value={form.targetType} onChange={e=>setForm({...form,targetType:e.target.value})}><option value="ALL">All other logins</option><option value="ROLE">A role</option><option value="USER">One login</option></select></label>{form.targetType==='ROLE'&&<label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}{form.targetType==='USER'&&<label>Login<select value={form.recipientId} onChange={e=>setForm({...form,recipientId:e.target.value})} required><option value="">Select login</option>{targetUsers.map(u=><option key={u.id} value={u.id}>{u.fullName} • {u.role.replaceAll('_',' ')}</option>)}</select></label>}</>}
     <label className="span2">Subject<input maxLength="180" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={isAdmin?'Example: Safari operations notice':'Example: Special requirement for upcoming trip'} required/></label>
     <label className="span2">Message<textarea rows="7" maxLength="2500" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Write your note or notice..." required/></label>
     <button className="btn btn-dark span2" disabled={!form.title.trim()||!form.message.trim()||(isAdmin&&form.targetType==='USER'&&!form.recipientId)}><Send size={16}/>{isAdmin?'Send notice':'Send to Admin'}</button>
    </form>
   </section>
  </div>

  {selected&&<div className="notification-popup-backdrop" onMouseDown={()=>setSelected(null)}>
   <section className="notification-popup-card" role="dialog" aria-modal="true" aria-label={selected.title} onMouseDown={e=>e.stopPropagation()}>
    <button className="notification-popup-close" type="button" onClick={()=>setSelected(null)} aria-label="Close notification"><X size={18}/></button>
    <div className="notification-popup-icon"><BellRing size={35}/></div>
    <span className="notification-popup-kicker">NOTIFICATION</span>
    <h2>{selected.title}</h2>
    <p>{selected.message}</p>
    <div className="notification-popup-meta"><span>{(selected.category||'SYSTEM').replaceAll('_',' ')}</span><span>{fmt(selected.createdAt)}</span>{selected.sender&&<span>From {selected.sender.fullName}</span>}</div>
    <div className="notification-popup-actions"><button type="button" className="btn btn-outline-dark" onClick={()=>setSelected(null)}>Close</button><button type="button" className="btn btn-dark" onClick={goRelated}>{related?.label||'Open related area'}<ArrowRight size={15}/></button></div>
   </section>
  </div>}
 </DashboardShell>;
}
