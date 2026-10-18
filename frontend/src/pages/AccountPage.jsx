import {useEffect,useMemo,useState} from 'react';
import {Save,UserRound,ShieldCheck,Camera,Trash2,Mail,Send,Clock3} from 'lucide-react';
import SearchSelect from '../components/SearchSelect';
import DashboardShell from '../components/DashboardShell';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {useAuth} from '../context/AuthContext';
import api,{messageOf} from '../utils/api';
import {COUNTRY_OPTIONS,CURRENCY_OPTIONS,currencyForCountry} from '../utils/currency';
import {LANGUAGE_OPTIONS,languageForCountry} from '../utils/language';
import {normalizeDrivingLicense,isValidDrivingLicense,DRIVING_LICENSE_HELP} from '../utils/drivingLicense';
import {useLanguage} from '../context/LanguageContext';

const normalizeNic=(value)=>{const raw=String(value||'').toUpperCase().replace(/[^0-9V]/g,'');const wantsV=raw.includes('V');const digits=raw.replace(/V/g,'').slice(0,wantsV?9:12);return wantsV&&digits.length===9?`${digits}V`:digits;};
const roleLabel={TOURIST:'Tourist / Visitor',SAFARI_OPERATOR:'Safari Operations Manager',SAFARI_GUIDE:'Safari Guide / Naturalist',JEEP_DRIVER:'Jeep Driver',PARK_OFFICER:'Authorized Park / Gate Officer',FINANCE_MANAGER:'Finance & Administration Manager',SYSTEM_ADMIN:'System Administrator'};
const emailDomains={SAFARI_OPERATOR:'operator.safarilanka.lk',SAFARI_GUIDE:'guide.safarilanka.lk',JEEP_DRIVER:'driver.safarilanka.lk',PARK_OFFICER:'park.safarilanka.lk',FINANCE_MANAGER:'finance.safarilanka.lk',SYSTEM_ADMIN:'admin.safarilanka.lk'};
const slugName=(name='')=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'').replace(/\.{2,}/g,'.');
const roleEmail=(name,role)=>{const slug=slugName(name);return slug&&emailDomains[role]?`${slug}@${emailDomains[role]}`:''};
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)};

export default function AccountPage(){
 const {user,setUser}=useAuth();
 const {setLanguage}=useLanguage();
 const [form,setForm]=useState({fullName:'',email:'',phone:'',address:'',qualifications:'',languages:'',licenseNumber:'',country:'Sri Lanka',preferredCurrency:'LKR',gender:'PREFER_NOT_TO_SAY',birthDate:'',identityType:'NIC',identityNumber:'',preferredLanguage:'ENGLISH',newPassword:''});
 const [msg,setMsg]=useState(''); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false); const [uploading,setUploading]=useState(false);
 const [changeOpen,setChangeOpen]=useState(false),[requestedName,setRequestedName]=useState(''),[changeRequests,setChangeRequests]=useState([]),[requestBusy,setRequestBusy]=useState(false);
 const isGuide=user?.role==='SAFARI_GUIDE'; const isDriver=user?.role==='JEEP_DRIVER'; const isTourist=user?.role==='TOURIST'; const isAdmin=user?.role==='SYSTEM_ADMIN'; const isSriLankan=form.country==='Sri Lanka';
 const proposedStaffEmail=useMemo(()=>roleEmail(requestedName,user?.role),[requestedName,user?.role]);
 const latestRequest=changeRequests[0];

 useEffect(()=>{if(user)setForm({fullName:user.fullName||'',email:user.email||'',phone:user.phone||'',address:user.address||'',qualifications:user.qualifications||'',languages:user.languages||'',licenseNumber:user.licenseNumber||'',country:user.country||'Sri Lanka',preferredCurrency:user.preferredCurrency||currencyForCountry(user.country||'Sri Lanka'),gender:user.gender||'PREFER_NOT_TO_SAY',birthDate:user.birthDate||'',identityType:user.identityType||'NIC',identityNumber:user.identityNumber||'',preferredLanguage:user.preferredLanguage||'ENGLISH',newPassword:''});},[user]);
 useEffect(()=>{if(user&&!isTourist&&!isAdmin)api.get('/account-change-requests/mine').then(r=>setChangeRequests(r.data)).catch(()=>{});else setChangeRequests([]);},[user?.id,isTourist,isAdmin]);
 const syncUser=(data)=>{setUser(data);localStorage.setItem('safari_user',JSON.stringify(data));};
 const changeCountry=(country)=>setForm(x=>({...x,country,preferredCurrency:currencyForCountry(country),preferredLanguage:languageForCountry(country),identityType:country==='Sri Lanka'?'NIC':'PASSPORT',identityNumber:''}));
 const setIdentity=value=>setForm(x=>({...x,identityNumber:x.identityType==='NIC'?normalizeNic(value):value.replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,20)}));

 const save=async e=>{
  e.preventDefault();setErr('');setMsg('');
  if(isTourist||isAdmin){
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))return setErr('Enter a valid email address.');
  }
  if(isTourist){
   if(!form.birthDate)return setErr('Birthday is required.');
   if(isSriLankan&&form.identityType==='NIC'&&!/^(?:\d{12}|\d{9}V)$/.test(form.identityNumber.toUpperCase()))return setErr('NIC must contain either 12 digits or 9 digits followed by V.');
   if(form.identityType==='PASSPORT'&&!/^[A-Za-z0-9]{6,20}$/.test(form.identityNumber))return setErr('Passport must contain 6 to 20 letters/numbers only.');
  }
  if(isDriver&&!isValidDrivingLicense(form.licenseNumber))return setErr(DRIVING_LICENSE_HELP);
  if(form.newPassword&&(form.newPassword.length<8||!/[A-Za-z]/.test(form.newPassword)||!/\d/.test(form.newPassword)))return setErr('New password must be at least 8 characters and include a letter and a number.');
  setBusy(true);
  try{
   const profile=await api.put('/auth/account',form);let nextUser=profile.data;
   if(isTourist&&form.email.trim().toLowerCase()!==String(user?.email||'').toLowerCase()){
    const emailResult=await api.put('/auth/tourist-email',{email:form.email.trim()});
    localStorage.setItem('safari_token',emailResult.data.token);nextUser=emailResult.data.user;
   }
   if(isAdmin&&form.email.trim().toLowerCase()!==String(user?.email||'').toLowerCase()){
    const emailResult=await api.put('/auth/admin-email',{email:form.email.trim()});
    localStorage.setItem('safari_token',emailResult.data.token);nextUser=emailResult.data.user;
   }
   syncUser(nextUser);setLanguage(nextUser.preferredLanguage||'ENGLISH');setForm(f=>({...f,email:nextUser.email||f.email,newPassword:''}));setMsg('Account details updated successfully.');
  }catch(x){setErr(messageOf(x));}finally{setBusy(false)}
 };

 const submitStaffChange=async()=>{
  setErr('');setMsg('');if(!requestedName.trim())return setErr('Enter the new full name you want to request.');setRequestBusy(true);
  try{const r=await api.post('/account-change-requests',{requestedFullName:requestedName.trim()});setMsg(r.data?.message||'Request sent to System Administration.');setChangeOpen(false);setRequestedName('');const mine=await api.get('/account-change-requests/mine');setChangeRequests(mine.data);}catch(x){setErr(messageOf(x));}finally{setRequestBusy(false)}
 };
 const uploadProfile=async file=>{if(!file)return;setUploading(true);setErr('');setMsg('');try{if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WEBP profile image.');if(file.size>5*1024*1024)throw new Error('Profile picture must be 5 MB or smaller.');const fd=new FormData();fd.append('image',file);const r=await api.post('/auth/profile-image',fd);syncUser(r.data);setMsg('Profile picture updated.');}catch(x){setErr(messageOf(x)||x.message)}finally{setUploading(false)}};
 const removeProfile=async()=>{try{const r=await api.delete('/auth/profile-image');syncUser(r.data);setMsg('Profile picture removed.');}catch(x){setErr(messageOf(x))}};

 return <DashboardShell title="My Account" subtitle="View and update your account details, profile picture and role-related information.">
  {msg&&<div className="alert success">{msg}</div>}{err&&<div className="alert error">{err}</div>}
  <section className="panel account-panel"><div className="account-summary"><div className={`account-avatar ${user?.profileImageUrl?'has-photo':''}`}>{user?.profileImageUrl?<img src={user.profileImageUrl} alt={`${user.fullName} profile`}/>:<UserRound/>}</div><div className="account-summary-copy"><h2>{user?.fullName}</h2><p>{user?.email}</p><div className="actions"><span className="role-pill">{roleLabel[user?.role]}</span><StatusBadge value={user?.active?'ACTIVE':'DISABLED'}/></div><div className="profile-photo-actions"><label className="mini-action profile-upload"><Camera size={15}/>{uploading?'Uploading...':'Change profile picture'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e=>uploadProfile(e.target.files?.[0])}/></label>{user?.profileImageUrl&&<button type="button" className="mini-action danger" onClick={removeProfile}><Trash2 size={14}/>Remove</button>}</div><small>JPG, PNG or WEBP • maximum 5 MB. If no image is added, the default profile icon is shown.</small></div></div>
   <form className="form-grid account-form" onSubmit={save}>
    <label>Full name<input value={form.fullName} disabled={!(isTourist||isAdmin)} onChange={e=>setForm({...form,fullName:e.target.value})} required/>{!isTourist&&!isAdmin&&<small>Staff names are changed through an Admin-approved login rename request.</small>}{isAdmin&&<small>System Administrators can update their own profile name directly.</small>}</label>
    {(isTourist||isAdmin)?<label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/><small>{isAdmin?'System Administrators can change their own login email directly. Your current session will continue with the new email.':'Tourists can change their own email. Your login switches to the new address immediately after saving.'}</small></label>:<label>Email<input value={user?.email||''} disabled/><small>Your role domain is protected and cannot be edited directly.</small><button type="button" className="account-inline-request" onClick={()=>{setRequestedName(user?.fullName||'');setChangeOpen(true)}}><Mail size={14}/>Request name / email change</button>{latestRequest&&<span className={`account-request-state ${String(latestRequest.status).toLowerCase()}`}><Clock3 size={13}/>{latestRequest.status}: {latestRequest.requestedFullName} → {latestRequest.requestedEmail}</span>}</label>}
    <label>Phone<input inputMode="numeric" maxLength="12" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,'').slice(0,12)})} placeholder="Phone number"/></label>
    <label>Role<input value={roleLabel[user?.role]||user?.role||''} disabled/></label>
    <label>System Language<SearchSelect value={form.preferredLanguage} onChange={v=>setForm({...form,preferredLanguage:v})} options={LANGUAGE_OPTIONS} placeholder="Select language" searchPlaceholder="Search language..."/><small>Saving this changes the website interface language for your account.</small></label>
    {isTourist&&<>
      <label>Country<SearchSelect value={form.country} onChange={changeCountry} options={COUNTRY_OPTIONS.map(x=>({value:x.country,label:x.country}))} placeholder="Select country" searchPlaceholder="Search country..."/></label>
      <label>Preferred display currency<SearchSelect value={form.preferredCurrency} onChange={v=>setForm({...form,preferredCurrency:v})} options={CURRENCY_OPTIONS.map(c=>({value:c,label:c}))} placeholder="Select currency" searchPlaceholder="Search currency..."/><small>Safari prices will be displayed in this currency. Stored accounting values remain in LKR.</small></label>
      <label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></label>
      <label>Birthday<input type="date" max={yesterday()} value={form.birthDate} onChange={e=>setForm({...form,birthDate:e.target.value})} required/></label>
      {isSriLankan?<><label>Identity type<select value={form.identityType} onChange={e=>setForm({...form,identityType:e.target.value,identityNumber:''})}><option value="NIC">NIC</option><option value="PASSPORT">Passport</option></select></label><label>{form.identityType==='NIC'?'NIC number':'Passport number'}<input value={form.identityNumber} maxLength={form.identityType==='NIC'?12:20} inputMode="text" placeholder={form.identityType==='NIC'?'12 digits or 9 digits + V':'6–20 letters/numbers'} onChange={e=>setIdentity(e.target.value)} required/></label></>:<label className="span2">Passport number<input value={form.identityNumber} maxLength="20" onChange={e=>setIdentity(e.target.value)} required/><small>Passport is required for tourists outside Sri Lanka.</small></label>}
      <label className="span2">Address<textarea rows="3" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Your contact address"/></label>
    </>}
    {isGuide&&<><label>Qualifications<input value={form.qualifications} onChange={e=>setForm({...form,qualifications:e.target.value})} required/></label><label>Languages<input value={form.languages} onChange={e=>setForm({...form,languages:e.target.value})} required/></label></>}
    {isDriver&&<label className="span2">Driving licence<input value={form.licenseNumber} onChange={e=>setForm({...form,licenseNumber:normalizeDrivingLicense(e.target.value)})} placeholder="B1234567 or 85-1234567" required/><small>{DRIVING_LICENSE_HELP}</small></label>}
    {(isGuide||isDriver)&&<div className="profile-status span2"><ShieldCheck/><span>Availability: <b>{user?.available&&!user?.onLeave?'Available':'Unavailable / On leave'}</b></span></div>}
    <label className="span2">New password (optional)<input type="password" minLength="8" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})} placeholder="Leave blank to keep current password"/><small>At least 8 characters with a letter and number.</small></label>
    <button className="btn btn-dark span2" disabled={busy}><Save size={17}/>{busy?'Saving...':'Save account changes'}</button>
   </form>
  </section>

  {!isTourist&&!isAdmin&&<Modal open={changeOpen} title="Request staff login rename" onClose={()=>!requestBusy&&setChangeOpen(false)}>
   <div className="modal-body account-change-request-modal"><p>Staff login email addresses are generated from your approved name and your existing role. The role/domain part cannot be changed here.</p><label>Requested new full name<input value={requestedName} onChange={e=>setRequestedName(e.target.value)} placeholder="Enter the new full name" autoFocus/></label><label>Proposed login email<input value={proposedStaffEmail} disabled/><small>Your role stays {roleLabel[user?.role]}. Only System Administration can approve this change.</small></label><div className="account-change-rule"><ShieldCheck size={17}/><span>The <b>@{emailDomains[user?.role]}</b> part is protected. A rename request never changes your role.</span></div><button type="button" className="btn btn-dark full" onClick={submitStaffChange} disabled={requestBusy||!proposedStaffEmail}><Send size={16}/>{requestBusy?'Sending request...':'Send request to Admin'}</button></div>
  </Modal>}
 </DashboardShell>;
}
