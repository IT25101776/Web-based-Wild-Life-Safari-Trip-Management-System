import {useMemo,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Eye,EyeOff} from 'lucide-react';
import SearchSelect from '../components/SearchSelect';
import {useAuth} from '../context/AuthContext';
import {messageOf} from '../utils/api';
import {COUNTRY_OPTIONS,currencyForCountry} from '../utils/currency';
import {LANGUAGE_OPTIONS,languageForCountry} from '../utils/language';

const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)};
const normalizeNic=(value)=>{const raw=String(value||'').toUpperCase().replace(/[^0-9V]/g,'');const wantsV=raw.includes('V');const digits=raw.replace(/V/g,'').slice(0,wantsV?9:12);return wantsV&&digits.length===9?`${digits}V`:digits;};

export default function Register(){
 const {register}=useAuth();const nav=useNavigate();
 const [f,setF]=useState({fullName:'',email:'',phone:'',country:'Sri Lanka',preferredCurrency:'LKR',preferredLanguage:'SINHALA',gender:'',birthDate:'',identityType:'NIC',identityNumber:'',password:'',confirmPassword:''});
 const [err,setErr]=useState('');const [showPass,setShowPass]=useState(false);const [showConfirm,setShowConfirm]=useState(false);
 const isSriLankan=f.country==='Sri Lanka';
 const countryCurrency=useMemo(()=>currencyForCountry(f.country),[f.country]);
 const changeCountry=(country)=>setF(x=>({...x,country,preferredCurrency:currencyForCountry(country),preferredLanguage:languageForCountry(country),identityType:country==='Sri Lanka'?'NIC':'PASSPORT',identityNumber:''}));
 const setIdentity=(value)=>setF(x=>({...x,identityNumber:x.identityType==='NIC'?normalizeNic(value):value.replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,20)}));
 const validate=()=>{
  if(!f.fullName.trim())return 'Full name is required.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))return 'Enter a valid email address containing @.';
  if(!/^0\d{9}$/.test(f.phone))return 'Phone number must contain exactly 10 digits and start with 0.';
  if(!f.country)return 'Select your country.';
  if(!f.preferredLanguage)return 'Select your system language.';
  if(!f.gender)return 'Select your gender.';
  if(!f.birthDate||f.birthDate>=new Date().toISOString().slice(0,10))return 'Enter a valid birthday in the past.';
  if(isSriLankan&&f.identityType==='NIC'&&!/^(?:\d{12}|\d{9}V)$/.test(f.identityNumber.toUpperCase()))return 'NIC must contain either 12 digits or 9 digits followed by V.';
  if(f.identityType==='PASSPORT'&&!/^[A-Za-z0-9]{6,20}$/.test(f.identityNumber))return 'Passport must contain 6 to 20 letters/numbers only.';
  if(!isSriLankan&&f.identityType!=='PASSPORT')return 'International tourists must use a passport.';
  if(f.password.length<8||!/\d/.test(f.password)||!/[A-Za-z]/.test(f.password))return 'Password must be at least 8 characters and include a letter and a number.';
  if(f.password!==f.confirmPassword)return 'Passwords do not match. Re-enter the same password.';
  return '';
 };
 const submit=async e=>{e.preventDefault();setErr('');const v=validate();if(v){setErr(v);return;}try{await register({fullName:f.fullName.trim(),email:f.email.trim(),phone:f.phone,country:f.country,preferredCurrency:f.preferredCurrency,preferredLanguage:f.preferredLanguage,gender:f.gender,birthDate:f.birthDate,identityType:f.identityType,identityNumber:f.identityNumber.trim().toUpperCase(),password:f.password});nav('/dashboard')}catch(x){setErr(messageOf(x))}};
 return <div className="auth-page"><div className="auth-art register-art"><Link className="brand site-logo-link auth-logo-link" to="/" aria-label="Safari Lanka home"><img src="/images/brand/safari-lanka-logo.png" alt="Safari Lanka - Yala National Park" className="site-logo auth-site-logo"/></Link><div className="auth-quote"><h2>Plan your Yala safari in one place.</h2><p>Create a tourist account with your travel identity and preferred display currency.</p></div></div><div className="auth-panel"><form className="auth-form register-form-wide" onSubmit={submit}><span className="eyebrow dark">TOURIST REGISTRATION</span><h1>Create your account</h1>{err&&<div className="alert error">{err}</div>}
  <label>Full name<input value={f.fullName} onChange={e=>setF({...f,fullName:e.target.value})} required/></label>
  <label>Email<input type="email" placeholder="name@example.com" value={f.email} onChange={e=>setF({...f,email:e.target.value})} required/><small>Must contain a valid @ email address.</small></label>
  <label>Phone<input inputMode="numeric" placeholder="0771234567" maxLength="10" value={f.phone} onChange={e=>setF({...f,phone:e.target.value.replace(/\D/g,'').slice(0,10)})} required/><small>Exactly 10 digits, starting with 0.</small></label>
  <div className="form-row"><label>Country<SearchSelect value={f.country} onChange={changeCountry} options={COUNTRY_OPTIONS.map(x=>({value:x.country,label:x.country}))} placeholder="Select country" searchPlaceholder="Search country..."/><small>Default price currency: {countryCurrency}</small></label><label>Display currency<input value={f.preferredCurrency} readOnly/><small>You can change this later from My Account.</small></label></div>
  <div className="form-row"><label>System Language<SearchSelect value={f.preferredLanguage} onChange={v=>setF({...f,preferredLanguage:v})} options={LANGUAGE_OPTIONS} placeholder="Select language" searchPlaceholder="Search language..."/><small>Your country selects its main supported language automatically. You can change it here. The website switches to it after you create/sign in to your account.</small></label><label>Gender<select value={f.gender} onChange={e=>setF({...f,gender:e.target.value})} required><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></label></div>
  <label>Birthday<input type="date" max={yesterday()} value={f.birthDate} onChange={e=>setF({...f,birthDate:e.target.value})} required/></label>
  {isSriLankan?<div className="form-row"><label>Identity document<select value={f.identityType} onChange={e=>setF({...f,identityType:e.target.value,identityNumber:''})}><option value="NIC">NIC</option><option value="PASSPORT">Passport</option></select></label><label>{f.identityType==='NIC'?'NIC number':'Passport number'}<input value={f.identityNumber} inputMode={f.identityType==='NIC'?'text':'text'} maxLength={f.identityType==='NIC'?12:20} placeholder={f.identityType==='NIC'?'12 digits or 9 digits + V':'6–20 letters/numbers'} onChange={e=>setIdentity(e.target.value)} required/></label></div>:<label>Passport number<input value={f.identityNumber} maxLength="20" placeholder="6–20 letters/numbers" onChange={e=>setIdentity(e.target.value)} required/><small>Passport is required for tourists outside Sri Lanka.</small></label>}
  <label>Password<div className="password-input"><input type={showPass?'text':'password'} minLength="8" value={f.password} onChange={e=>setF({...f,password:e.target.value})} required/><button type="button" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><small>At least 8 characters with a letter and a number.</small></label>
  <label>Re-enter password<div className="password-input"><input type={showConfirm?'text':'password'} minLength="8" value={f.confirmPassword} onChange={e=>setF({...f,confirmPassword:e.target.value})} required/><button type="button" onClick={()=>setShowConfirm(!showConfirm)}>{showConfirm?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
  <button className="btn btn-dark full">Create account</button><p className="auth-foot">Already registered? <Link to="/login">Sign in</Link></p></form></div></div>;
}
