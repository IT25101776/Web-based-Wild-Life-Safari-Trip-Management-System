import {useEffect,useMemo,useRef,useState} from 'react';
import {Check,ChevronDown,Search} from 'lucide-react';

export default function SearchSelect({value,onChange,options=[],placeholder='Select',searchPlaceholder='Search...',disabled=false,className=''}){
 const [open,setOpen]=useState(false);const [query,setQuery]=useState('');const ref=useRef(null);
 useEffect(()=>{const close=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 const normalized=options.map(o=>typeof o==='string'?{value:o,label:o}:o);
 const selected=normalized.find(o=>o.value===value);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return !q?normalized:normalized.filter(o=>`${o.label||''} ${o.native||''} ${o.value||''}`.toLowerCase().includes(q))},[normalized,query]);
 const choose=v=>{onChange?.(v);setOpen(false);setQuery('')};
 return <div className={`search-select ${open?'open':''} ${className}`} ref={ref}>
  <button type="button" className="search-select-trigger" disabled={disabled} onClick={()=>setOpen(x=>!x)}><span>{selected?(selected.native&&selected.native!==selected.label?`${selected.native} — ${selected.label}`:selected.label):placeholder}</span><ChevronDown size={17}/></button>
  {open&&<div className="search-select-menu"><div className="search-select-search"><Search size={16}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchPlaceholder}/></div><div className="search-select-options">{filtered.length?filtered.map(o=><button type="button" className={o.value===value?'selected':''} key={o.value} onClick={()=>choose(o.value)}><span>{o.native&&o.native!==o.label?<><b>{o.native}</b><small>{o.label}</small></>:o.label}</span>{o.value===value&&<Check size={16}/>}</button>):<div className="search-select-empty">No matches found</div>}</div></div>}
 </div>;
}
