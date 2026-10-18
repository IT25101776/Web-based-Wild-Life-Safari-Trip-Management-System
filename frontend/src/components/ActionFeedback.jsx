import {useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight,CheckCircle2,CircleAlert,Info,X} from 'lucide-react';
import {SAFARI_FEEDBACK_EVENT} from '../utils/feedback';

const iconFor={success:CheckCircle2,error:CircleAlert,info:Info};
const defaultTitle={success:'Success',error:'Unable to complete',info:'Notice'};

export default function ActionFeedback(){
  const navigate=useNavigate();
  const [item,setItem]=useState(null);
  const lastRef=useRef({key:'',at:0});

  useEffect(()=>{
    const receive=(event)=>{
      const d=event.detail||{};
      const message=String(d.message||'').trim();
      if(!message)return;
      const type=['success','error','info'].includes(d.type)?d.type:'success';
      const key=`${type}|${message}`;
      const now=Date.now();
      if(lastRef.current.key===key&&now-lastRef.current.at<1200)return;
      lastRef.current={key,at:now};
      setItem({type,title:d.title||defaultTitle[type],message,actionLabel:d.actionLabel||'',actionPath:d.actionPath||''});
    };
    window.addEventListener(SAFARI_FEEDBACK_EVENT,receive);
    return()=>window.removeEventListener(SAFARI_FEEDBACK_EVENT,receive);
  },[]);

  useEffect(()=>{
    if(!item)return;
    const onKey=e=>{if(e.key==='Escape')setItem(null)};
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[item]);

  if(!item)return null;
  const Icon=iconFor[item.type]||Info;
  const close=()=>setItem(null);
  const act=()=>{const p=item.actionPath;close();if(p)navigate(p)};

  return <div className="action-feedback-backdrop" role="presentation" onMouseDown={close}>
    <section className={`action-feedback-card ${item.type}`} role="alertdialog" aria-modal="true" aria-label={item.title} onMouseDown={e=>e.stopPropagation()}>
      <button className="action-feedback-close" type="button" onClick={close} aria-label="Close message"><X size={18}/></button>
      <div className="action-feedback-icon"><Icon size={44}/></div>
      <span className="action-feedback-kicker">{item.type==='success'?'SUCCESS':item.type==='error'?'ATTENTION':'NOTICE'}</span>
      <h2>{item.title}</h2>
      <p>{item.message}</p>
      <div className="action-feedback-actions">
        {item.actionPath&&<button type="button" className="btn btn-outline-dark" onClick={act}>{item.actionLabel||'View related'}<ArrowRight size={15}/></button>}
        <button type="button" className="btn btn-dark" onClick={close}>Continue</button>
      </div>
    </section>
  </div>;
}
