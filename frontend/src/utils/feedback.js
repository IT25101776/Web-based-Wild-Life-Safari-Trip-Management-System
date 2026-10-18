export const SAFARI_FEEDBACK_EVENT='safari-action-feedback';

export function showFeedback(detail={}){
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent(SAFARI_FEEDBACK_EVENT,{detail:{
    type:detail.type||'success',
    title:detail.title||'',
    message:detail.message||'',
    actionLabel:detail.actionLabel||'',
    actionPath:detail.actionPath||'',
    autoClose:detail.autoClose===true
  }}));
}

export function successFeedback(message,title='Success',extra={}){showFeedback({type:'success',title,message,...extra});}
export function errorFeedback(message,title='Unable to complete',extra={}){showFeedback({type:'error',title,message,...extra});}
export function infoFeedback(message,title='Notice',extra={}){showFeedback({type:'info',title,message,...extra});}
