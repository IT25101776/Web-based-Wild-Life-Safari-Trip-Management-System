import {useState} from 'react';
import {CheckCircle2,Clock3,Mail,MapPin,MessageSquareText,Phone,ShieldCheck} from 'lucide-react';
import PublicNav from '../components/PublicNav';
import {useAuth} from '../context/AuthContext';
import api,{messageOf} from '../utils/api';

export default function ContactPage(){
 const {user}=useAuth();
 const [form,setForm]=useState({fullName:user?.fullName||'',email:user?.email||'',phone:user?.phone||'',bookingCode:'',subject:'Booking & safari support',message:''});
 const [busy,setBusy]=useState(false),[ok,setOk]=useState(''),[err,setErr]=useState('');
 const submit=async e=>{e.preventDefault();setErr('');setOk('');if(form.phone&&!/^\d{7,15}$/.test(form.phone))return setErr('Phone number must contain 7 to 15 digits only.');setBusy(true);try{await api.post('/contact',form);setOk('Your message has been received. Safari Lanka staff can review it from the operations/admin workspace.');setForm(f=>({...f,bookingCode:'',message:''}));}catch(ex){setErr(messageOf(ex));}finally{setBusy(false)}};
 return <div className="public-page contact-page"><PublicNav/>
  <section className="contact-hero"><div><span className="eyebrow">SAFARI LANKA SUPPORT</span><h1>Contact us before or after your Yala safari.</h1><p>Ask about bookings, accessibility, special requirements, payments, permits, trip support or a completed safari.</p></div></section>
  <section className="contact-main">
   <div className="contact-info-column">
    <span className="eyebrow dark">HOW WE CAN HELP</span><h2>One place for safari support.</h2><p>Use the form for questions that need attention from Safari Operations or the system administrator. Add your booking code when your question is about an existing reservation.</p>
    <div className="contact-card-grid">
     <div className="contact-info-card"><MessageSquareText/><div><b>Booking support</b><span>Dates, visitor details, assignments and trip questions.</span></div></div>
     <div className="contact-info-card"><ShieldCheck/><div><b>Permits & special requirements</b><span>Mobility, language, photography and park-entry questions.</span></div></div>
     <div className="contact-info-card"><Mail/><div><b>Payments & documents</b><span>Bank-deposit review, invoices and payment-status questions.</span></div></div>
     <div className="contact-info-card"><Clock3/><div><b>Response workflow</b><span>Requests are saved for staff review inside this academic prototype.</span></div></div>
    </div>
    <div className="contact-card-grid contact-direct-grid">
     <div className="contact-info-card"><Phone/><div><b>Call us</b><span>+94 77 582 7903</span></div></div>
     <div className="contact-info-card"><Mail/><div><b>Email support</b><span>support@safarilanka.lk</span></div></div>
     <div className="contact-info-card"><Clock3/><div><b>Support hours</b><span>Daily • 7:00 AM to 8:00 PM</span></div></div>
     <div className="contact-info-card"><MapPin/><div><b>Office location</b><span>Tissamaharama gateway route • Yala region, Sri Lanka</span></div></div>
    </div>
    <div className="contact-location"><MapPin/><div><b>Safari Lanka Operations Desk</b><span>Contact messages are reviewed by Safari Operations and System Administration.</span></div></div>
   </div>
   <form className="contact-form-card" onSubmit={submit}>
    <div><span className="eyebrow dark">SEND A MESSAGE</span><h2>Tell us what you need.</h2></div>
    {ok&&<div className="alert success"><CheckCircle2 size={18}/>{ok}</div>}{err&&<div className="alert error">{err}</div>}
    <div className="form-grid">
     <label>Full name<input required maxLength="120" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label>
     <label>Email<input required type="email" maxLength="180" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
     <label>Phone (optional)<input inputMode="numeric" maxLength="15" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,'').slice(0,15)})} placeholder="0771234567"/><small>Numbers only • 7 to 15 digits maximum.</small></label>
     <label>Booking ID (optional)<input maxLength="40" value={form.bookingCode} onChange={e=>setForm({...form,bookingCode:e.target.value.toUpperCase()})} placeholder="SL-XXXXXXXX"/></label>
     <label className="span2">Subject<select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option>Booking & safari support</option><option>Special requirement / accessibility</option><option>Payment / bank deposit</option><option>Permit / park entry</option><option>Driver / guide / trip support</option><option>Other enquiry</option></select></label>
     <label className="span2">Message<textarea required minLength="10" maxLength="3000" rows="7" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Describe your question or request. If this is about a booking, include any useful details."/></label>
     <button className="btn btn-dark span2" disabled={busy}><Phone size={17}/>{busy?'Sending...':'Send contact request'}</button>
    </div>
   </form>
  </section>
 </div>
}
