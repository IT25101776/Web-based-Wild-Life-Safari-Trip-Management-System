import {useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {
  ArrowRight,BookOpen,CalendarCheck,ChevronRight,CircleHelp,CreditCard,
  LayoutDashboard,MapPinned,MessageCircle,Send,ShieldCheck,Sparkles,X
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import api from '../utils/api';

const FAQS=[
  {label:'How do I book?',query:'How do I book a safari?'},
  {label:'Payment flow',query:'When can I pay?'},
  {label:'Bank transfer',query:'How does bank transfer approval work?'},
  {label:'Trip status',query:'Where can I see my trip status?'},
  {label:'Permit & gate',query:'How does the digital permit work?'},
  {label:'Visitor capacity',query:'How many visitors can travel in one jeep?'}
];

const BOT_HEAD='/models/kavi-parts/head-center.png';
const BOT_BODY='/models/kavi-parts/body.png';
const BOT_HAND='/models/kavi-parts/hand.png';


function replyFor(raw,user){
  const q=raw.toLowerCase();
  if(/book|reservation|reserve|safari package/.test(q)) return {
    text:'Choose a Safari Package first. Select the package, date and visitor counts, then submit the booking. Same-day bookings are not allowed. Your booking waits for Safari Operator confirmation before payment.',
    actionLabel:'Browse safari packages',actionPath:'/packages'
  };
  if(/bank|transfer|slip/.test(q)) return {
    text:'For a bank transfer, upload the payment slip after the booking is confirmed. The Finance Officer must approve that payment before the Safari Operator can assign the driver, vehicle and guide.',
    actionLabel:user?'Open dashboard':'Sign in',actionPath:user?'/dashboard':'/login'
  };
  if(/pay|payment|card/.test(q)) return {
    text:'Payment becomes available only after the Safari Operator confirms your booking. Card payments are validated immediately. Bank-transfer payments wait for Finance approval before safari-team assignment.',
    actionLabel:user?'Check my dashboard':'Sign in to continue',actionPath:user?'/dashboard':'/login'
  };
  if(/trip status|status|ongoing|on-going|assignment/.test(q)) return {
    text:'Tourists can use Trip Status after payment succeeds, the safari team is assigned and the digital permit has been issued. It then shows the current safari progress and gate status.',
    actionLabel:user?.role==='TOURIST'?'Open Trip Status':user?'Open dashboard':'Sign in to view status',
    actionPath:user?.role==='TOURIST'?'/dashboard?view=trip-status':user?'/dashboard':'/login'
  };
  if(/permit|gate|check.?in|check.?out|park officer/.test(q)) return {
    text:'The Park/Gate Officer reviews and issues the digital permit, then validates it for check-in and check-out. A driver can complete a trip only after the Park Officer has checked the tourists out.',
    actionLabel:user?'Open dashboard':'Sign in',actionPath:user?'/dashboard':'/login'
  };
  if(/visitor|people|capacity|jeep|vehicle|6/.test(q)) return {
    text:'One safari vehicle carries up to 6 visitors. Children below 5 are free of the package per-person charge, but they still count toward vehicle capacity. If the total group needs more than one jeep, the additional vehicle fee still applies.',
    actionLabel:'View packages',actionPath:'/packages'
  };
  if(/cancel|cancellation|reject|rejection/.test(q)) return {
    text:'When an Operator cancels a booking or Finance rejects a payment, the reason is saved and shown in the relevant Tourist and Operator views so the decision is clear.',
    actionLabel:user?'Open dashboard':'Sign in',actionPath:user?'/dashboard':'/login'
  };
  if(/yala|block|wildlife|animal|route/.test(q)) return {
    text:'You can explore Yala block by block, including habitat, wildlife and route context, from the About Yala section.',
    actionLabel:'Explore About Yala',actionPath:'/about-yala'
  };
  if(/review|experience|photo|rating/.test(q)) return {
    text:'After a safari is successfully completed, tourists can publish a verified review and rate the overall trip, driver and guide, with optional media.',
    actionLabel:'See guest experiences',actionPath:'/experience'
  };
  if(/contact|help|support|problem|issue/.test(q)) return {
    text:'For booking-specific help or another issue, use Contact Us. If you are signed in, your profile details can help prefill the support form.',
    actionLabel:'Contact Safari Lanka',actionPath:'/contact'
  };
  if(/login|sign in|account|profile/.test(q)) return {
    text:user?'You are already signed in. You can open My Dashboard for role-specific tools, or My Account to update your profile.':'Sign in to access your dashboard, bookings, payments, trip information and account features.',
    actionLabel:user?'Open dashboard':'Sign in',actionPath:user?'/dashboard':'/login'
  };
  return {
    text:'I can help with Safari Lanka bookings, payments, bank transfers, visitor capacity, digital permits, trip status, Yala information and support. Try one of the quick questions below.',
    actionLabel:'Browse safari packages',actionPath:'/packages'
  };
}

export default function SafariBot(){
  const {user}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const [open,setOpen]=useState(false);
  const [text,setText]=useState('');
  const [messages,setMessages]=useState([]);
  const [nudge,setNudge]=useState(()=>localStorage.getItem('safari_bot_seen')!=='yes');
  const [minimized,setMinimized]=useState(()=>localStorage.getItem('safari_bot_minimized')==='yes');
  const [enabled,setEnabled]=useState(false);
  const endRef=useRef(null);
  const botRef=useRef(null);

  const firstName=useMemo(()=>user?.fullName?.trim()?.split(/\s+/)[0]||'',[user]);
  const roleLabel=useMemo(()=>user?.role?.replaceAll('_',' ').toLowerCase()||'',[user]);

  useEffect(()=>{
    if(user?.role!=='TOURIST'){setEnabled(false);return undefined;}
    let live=true;const load=()=>api.get('/public-settings/chatbot').then(r=>{if(live)setEnabled(Boolean(r.data?.enabled));}).catch(()=>{if(live)setEnabled(false);});
    load();const timer=setInterval(load,30000);return()=>{live=false;clearInterval(timer);};
  },[user?.id,user?.role]);

  useEffect(()=>{
    if(!messages.length){
      setMessages([{id:'hello',from:'bot',text:firstName
        ?`Hi ${firstName}! I’m Kavi, your Safari Lanka assistant. I can help with your ${roleLabel||'safari'} journey.`
        :'Ayubowan! I’m Kavi, your Safari Lanka assistant. Ask me about packages, bookings, payments, permits or Yala.'}]);
    }
  },[firstName,roleLabel]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[messages,open]);
  useEffect(()=>{setOpen(false);},[location.pathname]);

  const minimizeBot=()=>{setOpen(false);setNudge(false);setMinimized(true);localStorage.setItem('safari_bot_minimized','yes');localStorage.setItem('safari_bot_seen','yes');};
  const restoreBot=()=>{setMinimized(false);localStorage.removeItem('safari_bot_minimized');};

  const toggle=()=>{
    setOpen(v=>!v);
    setNudge(false);
    localStorage.setItem('safari_bot_seen','yes');
  };

  const go=(path)=>{navigate(path);setOpen(false);};

  const ask=(question)=>{
    const q=String(question||'').trim();
    if(!q)return;
    const response=replyFor(q,user);
    const stamp=Date.now();
    setMessages(m=>[...m,{id:`u-${stamp}`,from:'user',text:q},{id:`b-${stamp}`,from:'bot',...response}]);
    setText('');
  };

  const submit=e=>{e.preventDefault();ask(text)};

  const tripPath=user?.role==='TOURIST'?'/dashboard?view=trip-status':user?'/dashboard':'/login';
  const quickActions=[
    {label:'Safari packages',sub:'Explore & choose',icon:BookOpen,path:'/packages'},
    {label:user?'My dashboard':'Sign in',sub:user?'Bookings & tools':'Access your account',icon:LayoutDashboard,path:user?'/dashboard':'/login'},
    {label:'Trip status',sub:user?.role==='TOURIST'?'Track my safari':'Tourist trip tracking',icon:MapPinned,path:tripPath},
    {label:'Contact support',sub:'Questions & help',icon:CircleHelp,path:'/contact'}
  ];

  if(user?.role!=='TOURIST'||!enabled)return null;
  if(minimized)return <button type="button" className="assistant-restore-mini" onClick={restoreBot} aria-label="Restore Safari assistant" title="Open Kavi Safari Assistant"><MessageCircle size={19}/><span>Kavi</span></button>;

  return <div className={`safari-assistant ${open?'is-open':''}`}>
    {open&&<section className="safari-assistant-panel" aria-label="Safari Lanka assistant">
      <header className="assistant-head">
        <div className="assistant-identity">
          <span className="assistant-mini-avatar"><img src="/models/safari-lanka-assistant.png" alt=""/></span>
          <div><b>Kavi • Safari Assistant</b><small><span className="assistant-live-dot"/> Online • Safari Lanka</small></div>
        </div>
        <button type="button" className="assistant-close" onClick={toggle} aria-label="Close Safari assistant"><X size={18}/></button>
      </header>

      <div className="assistant-context-strip"><Sparkles size={14}/><span>Ask about your Safari Lanka journey</span></div>

      <div className="assistant-messages">
        {messages.map(m=><div className={`assistant-message ${m.from}`} key={m.id}>
          <p>{m.text}</p>
          {m.actionPath&&<button type="button" onClick={()=>go(m.actionPath)}>{m.actionLabel}<ArrowRight size={13}/></button>}
        </div>)}
        <div ref={endRef}/>
      </div>

      <div className="assistant-actions-grid">
        {quickActions.map(({label,sub,icon:Icon,path})=><button type="button" key={label} onClick={()=>go(path)}>
          <span><Icon size={16}/></span><div><b>{label}</b><small>{sub}</small></div><ChevronRight size={14}/>
        </button>)}
      </div>

      <div className="assistant-faqs">
        {FAQS.map(x=><button type="button" key={x.label} onClick={()=>ask(x.query)}>{x.label}</button>)}
      </div>

      <form className="assistant-input" onSubmit={submit}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Ask Kavi about Safari Lanka…" maxLength={220} aria-label="Ask Safari Lanka assistant"/>
        <button type="submit" disabled={!text.trim()} aria-label="Send question"><Send size={17}/></button>
      </form>
      <div className="assistant-footnote"><ShieldCheck size={12}/> Website guide • For booking-specific decisions, check your dashboard.</div>
    </section>}

    <div className="assistant-launch-row">
      {(nudge&&!open)&&<button type="button" className="assistant-nudge" onClick={toggle}>
        <MessageCircle size={20}/><span><b>Need safari help?</b><small>Click Kavi to ask</small></span>
      </button>}
      <button type="button" className="assistant-minimize-x" onClick={minimizeBot} aria-label="Minimize Safari assistant" title="Hide Kavi"><X size={12}/></button>
      <button ref={botRef} type="button" className="assistant-bot-launch" onClick={toggle} aria-expanded={open} aria-label={open?'Close Safari assistant':'Open Safari assistant'}>
        <span className="assistant-bot-glow"/>
        <span className="assistant-bot-figure" aria-hidden="true">
          <img className="assistant-bot-base" src={BOT_BODY} alt=""/>
          <img className="assistant-bot-head" src={BOT_HEAD} alt=""/>
          <img className="assistant-bot-hand" src={BOT_HAND} alt=""/>
        </span>
        <span className="assistant-hello-bubble" aria-hidden="true">Hi!</span>
        <span className="assistant-bot-status"/>
      </button>
    </div>
  </div>;
}
