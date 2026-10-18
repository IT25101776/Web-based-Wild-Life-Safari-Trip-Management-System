import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, ShieldCheck, Minus, Plus, Baby, UserRound } from 'lucide-react';
import api, { messageOf, publicAssetUrl } from '../utils/api';
import PublicNav from '../components/PublicNav';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/currency';

const REALISTIC_YALA_IMAGES = {
  1: '/images/packages/yala-dawn-leopard-quest.png',
  2: '/images/packages/elephant-birdlife-explorer.png',
  3: '/images/packages/golden-hour-sunset-safari.png',
  4: '/images/packages/wildlife-photography-drive.png',
  5: '/images/packages/family-discovery-safari.png',
  6: '/images/packages/full-day-yala-explorer.png'
};
const DEFAULT_PACKAGE_VIDEOS = {
  1: '/videos/packages/yala-dawn-leopard-quest.mp4', 2: '/videos/packages/elephant-birdlife-explorer.mp4',
  3: '/videos/packages/golden-hour-sunset-safari.mp4', 4: '/videos/packages/wildlife-photography-drive.mp4',
  5: '/videos/packages/family-discovery-safari.mp4', 6: '/videos/packages/full-day-yala-explorer.mp4'
};
const tomorrowLocal=()=>{const d=new Date();d.setDate(d.getDate()+1);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
const vehiclesFor=count=>Math.max(1,Math.ceil((Number(count)||1)/6));

function CounterField({label,subLabel,value,min=0,onChange,icon:Icon,disablePlus=false}){
  return <div className="visitor-counter-field">
    <div className="visitor-counter-label">{Icon&&<Icon size={18}/>}<div><b>{label}</b>{subLabel&&<small>{subLabel}</small>}</div></div>
    <div className="visitor-stepper">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value<=min} onClick={()=>onChange(Math.max(min,value-1))}><Minus size={16}/></button>
      <strong>{value}</strong>
      <button type="button" aria-label={`Increase ${label}`} disabled={disablePlus} onClick={()=>onChange(value+1)}><Plus size={16}/></button>
    </div>
  </div>;
}

export default function BookingPage(){
  const videoRef=useRef(null);const {packageId}=useParams();const nav=useNavigate();const {user}=useAuth();
  const [pkg,setPkg]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
  const [form,setForm]=useState({visitDate:'',adults:1,childFiveToEleven:0,childBelowFive:0,groupLeaderName:user?.fullName||'',contactPhone:user?.phone||'',emergencyContact:'',specialRequirements:''});
  useEffect(()=>{if(user?.role!=='TOURIST'){nav('/dashboard');return;}api.get(`/packages/${packageId}`).then(r=>setPkg(r.data)).catch(e=>setErr(messageOf(e)));},[packageId,user,nav]);
  const totalVisitors=form.adults+form.childFiveToEleven+form.childBelowFive;
  const maxVisitors=Math.min(pkg?.maxVisitors||6,(pkg?.maxVehicles||1)*6);
  const setCount=(key,value)=>{const next=Math.max(key==='adults'?1:0,Number(value)||0);const other=totalVisitors-form[key];if(other+next>maxVisitors)return;setForm(f=>({...f,[key]:next}));};
  const validate=()=>{if(!form.visitDate||form.visitDate<tomorrowLocal())return 'Same-day bookings are not allowed. Please choose a date from tomorrow onward.';if(form.adults<1)return 'At least 1 adult is required.';if(totalVisitors<1||totalVisitors>maxVisitors)return `This package allows up to ${maxVisitors} visitors.`;if(!/^[\p{L} .'-]{2,120}$/u.test(form.groupLeaderName.trim()))return 'Group leader name contains invalid characters.';if(!/^\d{9,12}$/.test(form.contactPhone))return 'Contact phone must contain 9 to 12 digits only.';if(!/^\d{9,12}$/.test(form.emergencyContact))return 'Emergency contact must contain 9 to 12 digits only.';return '';};
  const submit=async e=>{e.preventDefault();setErr('');const problem=validate();if(problem){setErr(problem);return;}setBusy(true);try{const r=await api.post('/bookings',{packageId:Number(packageId),visitDate:form.visitDate,adults:form.adults,childFiveToEleven:form.childFiveToEleven,childBelowFive:form.childBelowFive,groupLeaderName:form.groupLeaderName.trim(),contactPhone:form.contactPhone,emergencyContact:form.emergencyContact,specialRequirements:form.specialRequirements});nav('/dashboard',{state:{notice:`Booking ${r.data.bookingCode} created. Waiting for Safari Operator confirmation. Payment will be available once your booking is confirmed.`}});}catch(x){setErr(messageOf(x));}finally{setBusy(false);}};
  if(!pkg)return <><PublicNav/><div className="page-loader">Loading package...</div></>;
  const pkgImg=publicAssetUrl(pkg.imageUrl)||REALISTIC_YALA_IMAGES[pkg.id]||'/assets/yala-fallback.svg';const pkgVideo=pkg.videoUrl||DEFAULT_PACKAGE_VIDEOS[pkg.id]||'';
  const requiredVehicles=vehiclesFor(totalVisitors);const chargeableVisitors=form.adults+form.childFiveToEleven;const extraVehicleFee=Number(pkg.additionalVehicleFee??pkg.pricePerPerson??0);const vehicleSurcharge=Math.max(0,requiredVehicles-1)*extraVehicleFee;const estimatedTotal=Number(pkg.pricePerPerson)*chargeableVisitors+vehicleSurcharge;const canAdd=totalVisitors<maxVisitors;
  return <div className="public-page cream"><PublicNav/><section className="booking-wrap">
    <button className="back-link" onClick={()=>nav(-1)}><ArrowLeft/>Back to packages</button>
    <div className="booking-grid">
      <div className="booking-summary">
        <div className="summary-photo" onMouseEnter={()=>{if(pkgVideo&&videoRef.current){videoRef.current.currentTime=0;videoRef.current.play().catch(()=>{});}}} onMouseLeave={()=>{if(videoRef.current){videoRef.current.pause();videoRef.current.currentTime=0;}}} style={{backgroundImage:`url(${pkgImg}), url('/assets/yala-fallback.svg')`}}>
          {pkgVideo&&<video ref={videoRef} className="summary-hover-video" src={pkgVideo} poster={pkgImg} muted loop playsInline preload="metadata"/>}{pkgVideo&&<span className="summary-video-hint">Hover image to preview video</span>}
        </div>
        <span className="eyebrow dark">SELECTED EXPERIENCE</span><h2>{pkg.name}</h2><p>{pkg.description}</p>
        <div className="summary-lines"><span><CalendarDays/>{pkg.timeSlot} • {pkg.duration}</span><span><Users/>Up to {pkg.maxVisitors} visitors</span><span><ShieldCheck/>Permit application linked after booking</span></div>
        <div className="price-box"><small>Price per person (age 5+)</small><strong>{formatMoney(pkg.pricePerPerson,user?.preferredCurrency||'LKR')}</strong><span>Chargeable visitors: <b>{chargeableVisitors}</b> <small>(adults + children 5–11)</small></span><span>Children below 5: <b>FREE</b></span><span>Total visitors: <b>{totalVisitors}</b></span><span>Vehicles required: <b>{requiredVehicles}</b> <small>(all visitors count toward the 6-person vehicle capacity)</small></span>{requiredVehicles>1&&<span>Additional vehicle fee: <b>{formatMoney(vehicleSurcharge,user?.preferredCurrency||'LKR')}</b></span>}<span>Estimated total: <b>{formatMoney(estimatedTotal,user?.preferredCurrency||'LKR')}</b></span></div>
      </div>

      <form className="booking-form simplified-booking-form" onSubmit={submit}>
        <span className="eyebrow dark">VISITOR SELECTION</span><h1>Reserve your safari</h1><p className="booking-form-intro">Choose your group size and safari date. Individual visitor names, NICs and passport details are no longer required.</p>{err&&<div className="alert error">{err}</div>}
        <div className="visitor-selection-row">
          <CounterField label="Adults" subLabel="Age 12+" icon={UserRound} value={form.adults} min={1} disablePlus={!canAdd} onChange={v=>setCount('adults',v)}/>
          <CounterField label="Child" subLabel="5–11 years" icon={Users} value={form.childFiveToEleven} min={0} disablePlus={!canAdd} onChange={v=>setCount('childFiveToEleven',v)}/>
          <CounterField label="Child" subLabel="Below 5 years • Free" icon={Baby} value={form.childBelowFive} min={0} disablePlus={!canAdd} onChange={v=>setCount('childBelowFive',v)}/>
          <label className="visitor-date-field"><div className="visitor-counter-label"><CalendarDays size={18}/><div><b>Safari Date</b><small>Tomorrow onward</small></div></div><input type="date" min={tomorrowLocal()} value={form.visitDate} onChange={e=>setForm({...form,visitDate:e.target.value})} required/></label>
        </div>
        <div className="visitor-selection-summary"><span><b>{totalVisitors}</b> total visitors</span><span><b>{form.childBelowFive}</b> under-5 free</span><span><b>{requiredVehicles}</b> safari vehicle{requiredVehicles!==1?'s':''}</span><span><b>{formatMoney(estimatedTotal,user?.preferredCurrency||'LKR')}</b> estimated total</span></div>
        <div className="booking-contact-grid">
          <label>Group leader<input value={form.groupLeaderName} onChange={e=>setForm({...form,groupLeaderName:e.target.value})} required/></label>
          <label>Contact phone<input inputMode="numeric" maxLength="12" value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value.replace(/\D/g,'').slice(0,12)})} required/></label>
          <label>Emergency contact<input inputMode="numeric" maxLength="12" value={form.emergencyContact} onChange={e=>setForm({...form,emergencyContact:e.target.value.replace(/\D/g,'').slice(0,12)})} required/></label>
          <label className="span2">Special requirements (optional)<textarea rows="4" maxLength="1500" value={form.specialRequirements} onChange={e=>setForm({...form,specialRequirements:e.target.value})} placeholder="Accessibility, language, photography or other requests..."/></label>
        </div>
        <div className="booking-policy-note"><ShieldCheck size={18}/><span>Children below 5 are <b>free of the per-person charge</b> but still count toward vehicle capacity. Your booking is created as <b>Pending</b>; payment unlocks only after Safari Operator confirmation.</span></div>
        <button className="btn btn-dark full" disabled={busy||!form.visitDate}>{busy?'Creating booking...':'Create safari booking'}</button>
      </form>
    </div>
  </section></div>;
}
