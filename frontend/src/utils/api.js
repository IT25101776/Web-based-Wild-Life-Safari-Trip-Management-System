import axios from 'axios';
import {showFeedback} from './feedback';

// Always use the current website origin. In local/LAN/ngrok mode Vite proxies
// /api to the Spring Boot server on localhost:8080. This avoids mixed-content,
// CORS and remote-browser localhost problems when the site is shared by ngrok.
const isNgrokHost = typeof window !== 'undefined' && /(^|\.)ngrok(?:-free)?\.(?:app|dev)$/i.test(window.location.hostname);

const api = axios.create({
  baseURL: '/api',
  // Free ngrok endpoints can show a browser-warning interstitial. Sending this
  // header on API calls bypasses that warning for XHR/fetch requests.
  headers: isNgrokHost ? { 'ngrok-skip-browser-warning': 'true' } : undefined
});

api.interceptors.request.use(c => {
  const t = localStorage.getItem('safari_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const parseBody=(data)=>{
  if(!data)return {};
  if(typeof data==='object')return data;
  try{return JSON.parse(data)}catch{return {}}
};

const feedbackForSuccess=(response)=>{
  const config=response.config||{};
  const method=String(config.method||'get').toLowerCase();
  const url=String(config.url||'');
  if(!['post','put','patch','delete'].includes(method))return null;
  // Reading/clearing notification state is intentionally quiet.
  if(/\/notifications\/(?:read-all|\d+\/read)/.test(url))return null;
  const body=parseBody(config.data);
  const serverMessage=typeof response.data?.message==='string'?response.data.message.trim():'';
  if(serverMessage){
    if(/\/admin\/users\/\d+\/permanent/.test(url))return {type:'success',title:'Account permanently deleted',message:serverMessage};
    if(/\/auth\/(?:tourist-email|admin-email)/.test(url))return {type:'success',title:'Email updated',message:serverMessage};
    if(/\/account-change-requests/.test(url))return {type:'success',title:/review/.test(url)?'Request reviewed':'Request sent',message:serverMessage};
    return {type:'success',title:'Success',message:serverMessage};
  }

  if(/\/auth\/login/.test(url))return {type:'success',title:'Welcome back',message:'Sign in successful. Your Safari Lanka dashboard is ready.'};
  if(/\/auth\/register/.test(url))return {type:'success',title:'Account created',message:'Your Safari Lanka tourist account was created successfully.'};
  if(/\/auth\/account/.test(url))return {type:'success',title:'Account updated',message:'Your account details were saved successfully.'};
  if(/\/auth\/(?:tourist-email|admin-email)/.test(url))return {type:'success',title:'Email updated',message:'Your login email was changed successfully. Use the new address the next time you sign in.'};
  if(/profile-image/.test(url))return {type:'success',title:'Profile updated',message:method==='delete'?'Profile picture removed successfully.':'Profile picture updated successfully.'};
  if(/\/bookings$/.test(url)&&method==='post')return {type:'success',title:'Booking submitted',message:'Your safari booking was created successfully and is waiting for Safari Operator confirmation.'};
  if(/\/bookings\/\d+\/status/.test(url))return {type:'success',title:'Booking updated',message:`Booking status updated${body.status?` to ${String(body.status).replaceAll('_',' ')}`:''}.`};
  if(/\/bookings\/\d+\/(?:cancel|withdraw)/.test(url))return {type:'success',title:'Booking updated',message:'The booking change was saved successfully.'};
  if(/\/payments\/card/.test(url))return {type:'success',title:'Payment successful',message:'Card payment completed successfully. Safari Operations can continue preparing your trip.'};
  if(/\/payments\/bank/.test(url)&&!/bank-review/.test(url))return {type:'success',title:'Bank payment submitted',message:'Your bank transfer details and payment slip were submitted for Finance review.'};
  if(/bank-review/.test(url))return {type:'success',title:body.status==='REJECTED'?'Payment rejected':'Payment approved',message:body.status==='REJECTED'?'The bank payment was rejected and the reason was saved.':'The bank payment was approved successfully. Safari Operations can now continue the assignment process.'};
  if(/refund/.test(url))return {type:'success',title:'Refund updated',message:'The refund request was updated successfully.'};
  if(/\/permits\/validate/.test(url)){const checkout=body.action==='CHECK_OUT';return {type:'success',title:checkout?'Check-out successful':'Check-in successful',message:checkout?'Park exit has been recorded. The assigned driver can now complete the trip.':'Park entry has been recorded and the safari is now ongoing.'};}
  if(/\/permits\/\d+\/decision/.test(url))return {type:'success',title:body.approved===false?'Permit rejected':'Permit issued',message:body.approved===false?'The permit decision and rejection reason were saved.':'The digital permit was approved and issued successfully.'};
  if(/\/assignments\/\d+\/status/.test(url))return {type:'success',title:'Trip status updated',message:`Trip status updated${body.status?` to ${String(body.status).replaceAll('_',' ')}`:''}.`};
  if(/\/assignments/.test(url))return {type:'success',title:'Safari team assigned',message:'Driver, guide and vehicle assignment was saved successfully.'};
  if(/\/leave-requests/.test(url))return {type:'success',title:'Leave request updated',message:/review/.test(url)?'The leave request decision was saved successfully.':'Your leave request was submitted successfully.'};
  if(/guide-rosters/.test(url))return {type:'success',title:'Roster updated',message:method==='delete'?'The roster entry was deleted successfully.':'The guide roster was saved successfully.'};
  if(/\/incidents/.test(url))return {type:'success',title:'Incident updated',message:/status/.test(url)?'The incident status was updated successfully.':'The incident record was saved successfully.'};
  if(/\/contact\/\d+\/status/.test(url))return {type:'success',title:'Contact request updated',message:'The contact request status was updated successfully.'};
  if(/\/contact$/.test(url)&&method==='post')return {type:'success',title:'Message received',message:'Your message was sent successfully. Safari Lanka staff can now review it.'};
  if(/\/packages/.test(url))return {type:'success',title:'Safari package updated',message:method==='delete'?'The safari package was deleted successfully.':'The safari package details were saved successfully.'};
  if(/\/vehicles\/(?:maintenance|\d+\/maintenance)/.test(url))return {type:'success',title:'Maintenance updated',message:method==='delete'?'The maintenance record was deleted successfully.':'The vehicle maintenance record was saved successfully.'};
  if(/\/reviews/.test(url))return {type:'success',title:'Review submitted',message:'Your safari review was saved successfully.'};
  if(/\/compliance/.test(url))return {type:'success',title:'Compliance updated',message:method==='delete'?'The draft compliance record was deleted.':/finalize/.test(url)?'The compliance record was finalized successfully.':'The compliance record was saved successfully.'};
  if(/\/vehicles/.test(url))return {type:'success',title:'Vehicle updated',message:'Vehicle information was updated successfully.'};
  if(/\/staff\/me/.test(url))return {type:'success',title:'Availability updated',message:'Your availability status was updated successfully.'};
  if(/\/admin\/users\/\d+\/permanent/.test(url))return {type:'success',title:'Account permanently deleted',message:'The account and directly linked database records were permanently removed.'};
  if(/\/admin\/users/.test(url))return {type:'success',title:'Account updated',message:method==='post'?'The role login was created successfully.':method==='delete'?'The login was disabled and moved to deleted accounts.':'The account changes were saved successfully.'};
  if(/\/account-change-requests/.test(url))return {type:'success',title:/review/.test(url)?'Request reviewed':'Request sent',message:/review/.test(url)?'The staff name / login email request was reviewed successfully.':'Your staff name / login email change request was sent to System Administration.'};
  if(/\/admin\/settings/.test(url))return {type:'success',title:'Setting updated',message:'The system setting was saved successfully.'};
  if(/\/notifications\/admin\/send/.test(url))return {type:'success',title:'Notice sent',message:'The notification was sent successfully.'};
  if(/\/notifications\/message-admin/.test(url))return {type:'success',title:'Message sent',message:'Your message was sent to System Administration.'};
  return {type:'success',title:'Success',message:'Activity completed successfully.'};
};

api.interceptors.response.use(
  r => {
    const feedback=feedbackForSuccess(r);
    if(feedback)showFeedback(feedback);
    return r;
  },
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('safari_token');
      localStorage.removeItem('safari_user');
    }
    const method=String(err.config?.method||'get').toLowerCase();
    const url=String(err.config?.url||'');
    if(['post','put','patch','delete'].includes(method)&&!/\/notifications\/(?:read-all|\d+\/read)/.test(url)){
      showFeedback({type:'error',title:'Unable to complete',message:err.response?.data?.message||err.message||'Something went wrong. Please try again.'});
    }
    return Promise.reject(err);
  }
);

// Older database rows may contain an absolute local backend URL such as
// http://localhost:8080/uploads/.... Convert only backend-upload paths to the
// current website origin so those images also work through ngrok.
export const publicAssetUrl = (value) => {
  if (!value) return value;
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Keep original value when it is not a URL that needs normalising.
  }
  return value;
};

export const messageOf = (e) => {
  if (e?.response?.status === 403 && isNgrokHost) {
    return e?.response?.data?.message || 'Request was blocked while using ngrok. Refresh the page and try again.';
  }
  return e?.response?.data?.message || e?.message || 'Something went wrong';
};

export default api;
