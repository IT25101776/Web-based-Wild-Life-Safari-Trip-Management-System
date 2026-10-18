import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {LANGUAGE_OPTIONS,translateUi} from '../utils/language';

const LanguageContext=createContext(null);
const textState=new WeakMap();
const attrState=new WeakMap();

function translatedText(value,language){
  if(!value || !value.trim()) return value;
  const lead=value.match(/^\s*/)?.[0]||'';
  const trail=value.match(/\s*$/)?.[0]||'';
  const core=value.trim();
  return `${lead}${translateUi(core,language)}${trail}`;
}

function translateNode(root,language){
  if(!root)return;
  const processText=node=>{
    const now=node.nodeValue||'';
    let state=textState.get(node);
    if(!state){state={original:now,last:now};textState.set(node,state)}
    else if(now!==state.last){state.original=now;}
    const next=translatedText(state.original,language);
    state.last=next;
    if(now!==next)node.nodeValue=next;
  };
  const processElement=el=>{
    if(!el || !el.getAttribute)return;
    let state=attrState.get(el)||{};
    for(const attr of ['placeholder','title','aria-label']){
      const now=el.getAttribute(attr);
      if(now==null)continue;
      const item=state[attr];
      if(!item)state[attr]={original:now,last:now};
      else if(now!==item.last)item.original=now;
      const src=state[attr].original;
      const next=translateUi(src,language);
      state[attr].last=next;
      if(now!==next)el.setAttribute(attr,next);
    }
    attrState.set(el,state);
  };
  if(root.nodeType===Node.TEXT_NODE){processText(root);return;}
  if(root.nodeType===Node.ELEMENT_NODE)processElement(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let n=walker.nextNode();
  while(n){
    if(n.nodeType===Node.TEXT_NODE){
      const parent=n.parentElement;
      if(parent && !['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName))processText(n);
    }else processElement(n);
    n=walker.nextNode();
  }
}

export function LanguageProvider({children}){
  const [language,setLanguageState]=useState(()=>localStorage.getItem('safari_language')||'ENGLISH');
  const setLanguage=code=>{
    const valid=LANGUAGE_OPTIONS.some(x=>x.value===code)?code:'ENGLISH';
    localStorage.setItem('safari_language',valid);
    setLanguageState(valid);
  };
  useEffect(()=>{
    document.documentElement.lang=LANGUAGE_OPTIONS.find(x=>x.value===language)?.htmlLang||'en';
    const run=()=>translateNode(document.body,language);
    requestAnimationFrame(run);
    const observer=new MutationObserver(mutations=>{
      for(const m of mutations){
        if(m.type==='characterData')translateNode(m.target,language);
        else for(const node of m.addedNodes)translateNode(node,language);
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    return()=>observer.disconnect();
  },[language]);
  const value=useMemo(()=>({language,setLanguage,t:(text)=>translateUi(text,language),options:LANGUAGE_OPTIONS}),[language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage=()=>useContext(LanguageContext);
