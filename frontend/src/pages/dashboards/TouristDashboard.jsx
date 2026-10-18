import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CalendarDays, WalletCards, ShieldCheck, Users, Download, RotateCcw, Eye, Truck, UserRound, Star, Upload, X, Search, MapPin, CheckCircle2, Clock3, Pencil, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import api, { messageOf } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/currency';

const fmtDateTime=(value)=>value?String(value).replace('T',' ').slice(0,16):'—';
const roleName=(value='')=>value.replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const tripStage=(row)=>{
  const b=row.booking||{}; const p=row.permit||{}; const latest=row.latestPayment||{}; const required=Math.max(1,b.vehicleCount||Math.ceil((b.visitorCount||1)/6)); const assigned=row.assignedVehicleCount??row.assignments?.filter(a=>!['CANCELLED','DECLINED'].includes(a.status)).length??0;
  if(['CANCELLED','REJECTED'].includes(b.bookingStatus)) return {key:'cancelled',label:b.bookingStatus==='CANCELLED'?'Booking cancelled':'Booking rejected',message:b.cancellationReason||'This safari booking is not active.'};
  if(b.bookingStatus==='PENDING') return {key:'confirmation',label:'Waiting for confirmation',message:'Waiting for Safari Operator confirmation. Payment will be available once your booking is confirmed.'};
  if(b.paymentStatus!=='PAID') {
    if(b.paymentStatus==='PENDING') return {key:'payment',label:'Payment under review',message:'Your bank transfer is being reviewed by Finance. Safari resources cannot be assigned until Finance approves it.'};
    if(b.paymentStatus==='REJECTED') return {key:'payment',label:'Payment rejected',message:latest.rejectionReason?`Finance rejected this payment: ${latest.rejectionReason}`:'Finance rejected this payment. You can submit a new payment after reviewing the reason.'};
    return {key:'payment',label:'Payment required',message:'Your booking is confirmed. Complete payment to continue the safari workflow.'};
  }
  if(assigned<required) return {key:'assignment',label:'Awaiting safari team',message:`Payment is successful. Safari Operations must assign ${required} safari team(s) before the permit can be issued.`};
  if(p.status==='PENDING') return {key:'permit',label:'Permit under review',message:'Your safari team is assigned. The Park / Gate Officer can now review and issue the digital permit.'};
  if(p.status==='REJECTED') return {key:'rejected',label:'Permit rejected',message:p.decisionReason||'The permit was not approved. Safari Lanka will contact you about the next step.'};
  if(p.status==='APPROVED') return {key:'ready',label:'Ready for park entry',message:'Your digital permit is approved and issued. Gate check-in has not been recorded yet.'};
  if(p.status==='CHECKED_IN') return {key:'ongoing',label:'Safari ongoing',message:'Gate check-in is complete. Your safari is currently shown as ongoing.'};
  if(p.status==='COMPLETED') return {key:'checkout',label:'Checked out',message:'Gate check-out is complete and park exit has been recorded.'};
  return {key:'progress',label:'Safari in progress',message:'Your booking is moving through the safari workflow.'};
};

export default function TouristDashboard() {
  const loc = useLocation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [permit, setPermit] = useState(null);
  const [refund, setRefund] = useState(null);
  const [details, setDetails] = useState(null);
  const [reason, setReason] = useState('Change of travel plans');
  const [err, setErr] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewForm, setReviewForm] = useState({ overallRating: 5, driverRating: '', guideRating: '', title: '', reviewText: '', driverReview: '', guideReview: '', mediaUrls: [] });
  const [q,setQ]=useState('');
  const [editBooking,setEditBooking]=useState(null);
  const [refundEdit,setRefundEdit]=useState(null);

  const load = () => Promise.all([
    api.get('/bookings/mine'),
    api.get('/payments/mine'),
    api.get('/payments/refunds/mine'),
    api.get('/reviews/mine')
  ]).then(([b, p, r, rv]) => {
    setRows(b.data);
    setPayments(p.data);
    setRefunds(r.data);
    setReviews(rv.data);
  }).catch(e => setErr(messageOf(e)));

  useEffect(() => { load(); }, []);

  const paid = rows.filter(x => x.booking.paymentStatus === 'PAID').length;
  const pendingPermits = rows.filter(x => x.permit?.status === 'PENDING').length;
  const tripView=new URLSearchParams(loc.search).get('view')==='trip-status';
  const query=q.trim().toLowerCase();
  const filteredRows=rows.filter(x=>!query||[x.booking.bookingCode,x.booking.safariPackage?.name,x.booking.visitDate,x.booking.bookingStatus,x.booking.paymentStatus].filter(Boolean).join(' ').toLowerCase().includes(query));

  const openDetails = async (id) => {
    try {
      const r = await api.get(`/bookings/${id}`);
      setDetails(r.data);
    } catch (e) {
      setErr(messageOf(e));
    }
  };

  const doRefund = async () => {
    try {
      await api.post(`/payments/booking/${refund.booking.id}/refund`, { reason });
      setRefund(null);
      load();
    } catch (e) {
      setErr(messageOf(e));
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      load();
    } catch (e) {
      setErr(messageOf(e));
    }
  };

  const beginEditBooking=(row)=>{
    setEditBooking({
      bookingId:row.booking.id, packageId:row.booking.safariPackage.id, visitDate:row.booking.visitDate,
      adults:row.booking.adultCount || row.booking.visitorCount || 1,
      childFiveToEleven:row.booking.childFiveToElevenCount || 0,
      childBelowFive:row.booking.childBelowFiveCount || 0,
      groupLeaderName:row.booking.groupLeaderName||'', contactPhone:row.booking.contactPhone||'',
      emergencyContact:row.booking.emergencyContact||'', specialRequirements:row.booking.specialRequirements||''
    });
  };

  const saveBookingEdit=async()=>{
    try{
      const total=Number(editBooking.adults||0)+Number(editBooking.childFiveToEleven||0)+Number(editBooking.childBelowFive||0);
      if(Number(editBooking.adults)<1)return setErr('At least 1 adult is required.');
      if(total<1)return setErr('At least one visitor is required.');
      const payload={...editBooking,adults:Number(editBooking.adults),childFiveToEleven:Number(editBooking.childFiveToEleven),childBelowFive:Number(editBooking.childBelowFive)};
      await api.put(`/bookings/${editBooking.bookingId}`,payload);setEditBooking(null);await load();
    }catch(e){setErr(messageOf(e));}
  };

  const withdrawBooking=async(id)=>{
    if(!window.confirm('Withdraw this pending booking? This uses a safe soft delete and keeps the audit/history record.'))return;
    try{await api.delete(`/bookings/${id}`);await load();}catch(e){setErr(messageOf(e));}
  };

  const saveRefundEdit=async()=>{
    try{await api.put(`/payments/refunds/${refundEdit.id}`,{reason:refundEdit.reason});setRefundEdit(null);await load();}catch(e){setErr(messageOf(e));}
  };
  const withdrawRefund=async(r)=>{
    if(!window.confirm('Withdraw this pending refund request?'))return;
    try{await api.delete(`/payments/refunds/${r.id}`);await load();}catch(e){setErr(messageOf(e));}
  };

  const openReview = (row) => {
    setReviewTarget(row);
    setReviewForm({ overallRating: 5, driverRating: '', guideRating: '', title: '', reviewText: '', driverReview: '', guideReview: '', mediaUrls: [] });
  };

  const uploadReviewMedia = async (files) => {
    const chosen = Array.from(files || []).slice(0, Math.max(0, 8 - reviewForm.mediaUrls.length));
    if (!chosen.length) return;
    setReviewBusy(true); setErr('');
    try {
      const urls=[];
      for (const file of chosen) {
        const fd=new FormData();fd.append('media',file);
        const r=await api.post('/reviews/upload-media',fd);
        urls.push(r.data.url);
      }
      setReviewForm(f=>({...f,mediaUrls:[...f.mediaUrls,...urls].slice(0,8)}));
    } catch(e){setErr(messageOf(e));} finally {setReviewBusy(false);}
  };

  const submitReview = async () => {
    if(!reviewTarget)return;
    if((reviewForm.reviewText||'').trim().length<10){setErr('Write at least 10 characters about your safari experience.');return;}
    setReviewBusy(true);setErr('');
    try {
      await api.post(`/reviews/booking/${reviewTarget.booking.id}`,{
        ...reviewForm,
        driverRating: reviewForm.driverRating ? Number(reviewForm.driverRating) : null,
        guideRating: reviewForm.guideRating ? Number(reviewForm.guideRating) : null,
        overallRating: Number(reviewForm.overallRating)
      });
      setReviewTarget(null);load();
    } catch(e){setErr(messageOf(e));} finally {setReviewBusy(false);}
  };

  return <DashboardShell title="My Safari Journey" subtitle="Bookings, visitor groups, payments and digital permits in one place.">
    {loc.state?.notice && <div className="alert success">{loc.state.notice}</div>}
    {err && <div className="alert error">{err}</div>}

    <div className="stats-grid">
      <StatCard icon={CalendarDays} label="Bookings" value={rows.length} />
      <StatCard icon={WalletCards} label="Paid" value={paid} />
      <StatCard icon={ShieldCheck} label="Permits pending" value={pendingPermits} />
      <StatCard icon={Users} label="Visitors booked" value={rows.reduce((a, x) => a + x.booking.visitorCount, 0)} />
    </div>

    <div className="tabs journey-tabs">
      <Link className={!tripView?'active':''} to="/dashboard">My bookings</Link>
      <Link className={tripView?'active':''} to="/dashboard?view=trip-status"><MapPin size={15}/>Trip status</Link>
    </div>

    {tripView && <section className="panel trip-status-panel">
      <div className="panel-head search-panel-head"><div><h2>Trip status</h2><p>Follow payment, safari-team assignment, permit issue, gate check-in and park exit.</p></div><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking ID, package, date..."/></div></div>
      <div className="trip-status-list">{filteredRows.map(x=>{const stage=tripStage(x);const required=Math.max(1,x.booking.vehicleCount||1);const assigned=x.assignedVehicleCount??x.assignments?.length??0;const unlocked=x.booking.paymentStatus==='PAID'&&assigned>=required;return <article className={`trip-status-card trip-stage-${stage.key}`} key={x.booking.id}>
        <div className="trip-status-head"><div><small>{x.booking.bookingCode} • {x.booking.visitDate}</small><h3>{x.booking.safariPackage.name}</h3></div><span className="trip-status-pill">{stage.label}</span></div>
        <p>{stage.message}</p>
        <div className="trip-status-steps">
          <span className={x.booking.paymentStatus==='PAID'?'done':''}><CheckCircle2/>Payment <b>{x.booking.paymentStatus==='PAID'?'Successful':x.booking.paymentStatus}</b></span>
          <span className={assigned>=required?'done':''}><Users/>Safari team <b>{assigned}/{required} assigned</b></span>
          <span className={['APPROVED','CHECKED_IN','COMPLETED'].includes(x.permit?.status)?'done':''}><ShieldCheck/>Permit <b>{x.permit?.status==='APPROVED'?'Issued':x.permit?.status||'Pending'}</b></span>
          <span className={['CHECKED_IN','COMPLETED'].includes(x.permit?.status)?'done':''}><MapPin/>Gate entry <b>{x.permit?.checkedInAt?`Checked in ${fmtDateTime(x.permit.checkedInAt)}`:'Not checked in'}</b></span>
          <span className={x.permit?.status==='COMPLETED'?'done':''}><Clock3/>Gate exit <b>{x.permit?.checkedOutAt?`Checked out ${fmtDateTime(x.permit.checkedOutAt)}`:'Not checked out'}</b></span>
        </div>
        {unlocked&&x.permit?.status!=='PENDING'&&<div className="permit-trip-message"><b>Permit {x.permit?.permitCode}</b><span>{x.permit?.decisionReason||'Permit decision recorded.'}</span>{x.permit?.decisionByName&&<small>Reviewed by {x.permit.decisionByName}{x.permit.decisionByRole?` • ${roleName(x.permit.decisionByRole)}`:''}</small>}</div>}
        {!unlocked&&<div className="trip-lock-note">Permit and gate tracking becomes available after successful payment and complete driver, guide and vehicle assignment.</div>}
        <button className="mini-action" onClick={()=>openDetails(x.booking.id)}><Eye size={14}/>View full details</button>
      </article>})}</div>
      {!filteredRows.length&&<div className="empty compact">No safari trips match your search.</div>}
    </section>}

    {!tripView && <>
    <section className="panel">
      <div className="panel-head">
        <div><h2>My bookings</h2><p>Track the complete booking → payment → permit workflow.</p></div>
        <div className="actions"><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking ID, package, date..."/></div><Link className="btn btn-dark btn-sm" to="/packages">Book another safari</Link></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Booking</th><th>Experience</th><th>Date</th><th>Visitors</th><th>Booking</th><th>Payment</th><th>Permit</th><th>Actions</th></tr></thead>
          <tbody>{filteredRows.map(x => <tr key={x.booking.id}>
            <td><b>{x.booking.bookingCode}</b></td>
            <td>{x.booking.safariPackage.name}</td>
            <td>{x.booking.visitDate}</td>
            <td>{x.booking.visitorCount}<small className="cell-small">{x.booking.adultCount||x.booking.visitorCount} adult • {x.booking.childFiveToElevenCount||0} child 5–11 • {x.booking.childBelowFiveCount||0} below 5</small><small className="cell-small">{x.booking.vehicleCount || Math.ceil(x.booking.visitorCount/6)} vehicle(s)</small></td>
            <td><StatusBadge value={x.booking.bookingStatus} /></td>
            <td><StatusBadge value={x.booking.paymentStatus} />{x.booking.paymentStatus === 'PENDING' && <span className="pending-note">Pending Finance approval</span>}</td>
            <td><StatusBadge value={x.permit?.status || 'PENDING'} /></td>
            <td className="actions">
              <button className="mini-action" onClick={() => openDetails(x.booking.id)}><Eye size={14} />Details</button>
              {['UNPAID','REJECTED'].includes(x.booking.paymentStatus) && x.booking.bookingStatus === 'CONFIRMED' && <Link className="mini-action" to={`/pay/${x.booking.id}`}>Pay</Link>}
              {x.booking.bookingStatus === 'PENDING' && x.booking.paymentStatus === 'UNPAID' && <><button className="mini-action" onClick={()=>beginEditBooking(x)}><Pencil size={14}/>Edit</button><button className="mini-action danger" onClick={()=>withdrawBooking(x.booking.id)}><Trash2 size={14}/>Withdraw</button></>}
              {x.booking.bookingStatus === 'PENDING' && <span className="pending-note">Waiting for Safari Operator confirmation</span>}
              {['APPROVED', 'CHECKED_IN', 'COMPLETED'].includes(x.permit?.status) && <button className="mini-action" onClick={() => setPermit(x.permit)}>Permit</button>}
              {x.booking.bookingStatus === 'COMPLETED' && !reviews.some(r=>r.bookingId===x.booking.id) && <button className="mini-action review-action" onClick={() => openReview(x)}><Star size={14}/>Review</button>}
              {x.booking.bookingStatus === 'COMPLETED' && reviews.some(r=>r.bookingId===x.booking.id) && <span className="reviewed-chip"><Star size={13} fill="currentColor"/>Reviewed</span>}
              {x.booking.paymentStatus === 'PAID' && x.booking.bookingStatus !== 'COMPLETED' && <button className="mini-action" onClick={() => setRefund(x)}>Refund</button>}
              {x.booking.paymentStatus !== 'PAID' && x.booking.bookingStatus !== 'PENDING' && !['CANCELLED', 'COMPLETED', 'REJECTED'].includes(x.booking.bookingStatus) && <button className="mini-action danger" onClick={() => cancelBooking(x.booking.id)}>Cancel</button>}
            </td>
          </tr>)}</tbody>
        </table>
        {!rows.length && <div className="empty">No bookings yet. Choose a Yala package to begin.</div>}
      </div>
    </section>

    <section className="two-panels">
      <div className="panel">
        <div className="panel-head"><h2>Recent payments</h2></div>
        {payments.slice(0, 4).map(p => <div className="list-row" key={p.id}><div><b>{p.invoiceNumber}</b><small>{p.booking.bookingCode} • {p.method.replaceAll('_', ' ')}</small></div><div className="right"><b>{formatMoney(p.amount,user?.preferredCurrency||'LKR')}</b><StatusBadge value={p.status} />{p.status === 'PENDING' && <small className="payment-review-note">Finance checking bank slip</small>}{p.status === 'REJECTED' && p.rejectionReason && <small className="payment-review-note rejection-note">Reason: {p.rejectionReason}</small>}</div></div>)}
        {!payments.length && <div className="empty compact">No payment history.</div>}
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Refund requests</h2></div>
        {refunds.slice(0, 6).map(r => <div className="list-row" key={r.id}><div><b>{r.booking.bookingCode}</b><small>{r.reason}</small></div><div className="actions"><StatusBadge value={r.status} />{r.status==='PENDING'&&<><button className="mini-action" onClick={()=>setRefundEdit({...r})}><Pencil size={13}/>Edit</button><button className="mini-action danger" onClick={()=>withdrawRefund(r)}><Trash2 size={13}/>Withdraw</button></>}</div></div>)}
        {!refunds.length && <div className="empty compact">No refund requests.</div>}
      </div>
    </section>
    </>}

    <Modal open={!!details} title={`Booking details • ${details?.booking?.bookingCode || ''}`} onClose={() => setDetails(null)} wide>
      {details && <div className="modal-body booking-details-modal">
        <div className="detail-grid">
          <span>Experience <b>{details.booking.safariPackage.name}</b></span>
          <span>Visit date <b>{details.booking.visitDate}</b></span>
          <span>Total visitors <b>{details.booking.visitorCount}</b></span><span>Adults <b>{details.booking.adultCount||details.booking.visitorCount}</b></span><span>Children 5–11 <b>{details.booking.childFiveToElevenCount||0}</b></span><span>Children below 5 <b>{details.booking.childBelowFiveCount||0}</b></span>
          <span>Vehicles required <b>{details.booking.vehicleCount || Math.ceil(details.booking.visitorCount/6)}</b></span>
          <span>Additional vehicle fee <b>{formatMoney(details.booking.vehicleSurcharge||0,user?.preferredCurrency||'LKR')}</b></span>
          <span>Total <b>{formatMoney(details.booking.totalAmount,user?.preferredCurrency||'LKR')}</b></span>
          <span>Booking status <StatusBadge value={details.booking.bookingStatus} /></span>
          <span>Payment status <StatusBadge value={details.booking.paymentStatus} /></span>
          <span>Permit status <StatusBadge value={details.permit?.status || 'PENDING'} /></span>
          <span>Group leader <b>{details.booking.groupLeaderName}</b></span>
          <span>Contact phone <b>{details.booking.contactPhone}</b></span>
          <span>Emergency contact <b>{details.booking.emergencyContact || '—'}</b></span>
        </div>

        {details.booking.cancellationReason&&<div className="workflow-reason danger-reason"><b>Booking cancellation reason</b><p>{details.booking.cancellationReason}</p></div>}
        {details.latestPayment?.status==='REJECTED'&&details.latestPayment?.rejectionReason&&<div className="workflow-reason danger-reason"><b>Payment rejection reason</b><p>{details.latestPayment.rejectionReason}</p></div>}

        <div className="requirement-callout"><b>Your special requirement / note</b><p>{details.booking.specialRequirements||'No special requirements were added for this booking.'}</p><p>Safari Operations will review your request and the team will contact you if anything needs clarification or cannot be accommodated under park or operational rules.</p></div>

        <div className="detail-section permit-history-section"><h3>Permit & gate status</h3>{details.permit?<div className="permit-decision-card"><span>Permit ID <b>{details.permit.permitCode}</b></span><span>Status <StatusBadge value={details.permit.status}/></span><span>Decision reason <b>{details.permit.decisionReason||'Awaiting permit review.'}</b></span><span>Reviewed by <b>{details.permit.decisionByName||details.permit.decisionByEmail||'Not reviewed yet'}</b></span><span>Reviewer role <b>{details.permit.decisionByRole?roleName(details.permit.decisionByRole):'—'}</b></span><span>Issued <b>{fmtDateTime(details.permit.issuedAt)}</b></span><span>Gate check-in <b>{details.permit.checkedInAt?fmtDateTime(details.permit.checkedInAt):'Not checked in'}</b></span><span>Gate check-out <b>{details.permit.checkedOutAt?fmtDateTime(details.permit.checkedOutAt):'Not checked out'}</b></span></div>:<div className="empty compact">Permit record is not available yet.</div>}</div>

        <div className="detail-section">
          <h3>Visitor group</h3>
          <div className="visitor-group-summary"><span><b>{details.booking.adultCount||details.booking.visitorCount}</b><small>Adults</small></span><span><b>{details.booking.childFiveToElevenCount||0}</b><small>Children 5–11</small></span><span><b>{details.booking.childBelowFiveCount||0}</b><small>Children below 5</small></span><span><b>{details.booking.visitorCount}</b><small>Total visitors</small></span></div>
          {!!details.visitors?.length&&<p className="form-note">This older booking contains legacy visitor records. They are preserved for history, but new bookings no longer collect individual visitor personal details.</p>}
        </div>

        <div className="detail-section">
          <h3>Assigned safari team</h3>
          {(details.assignments?.length || 0) ? <div className="assignment-stack">{details.assignments.map((a,i)=><div className="assigned-team-grid assignment-group" key={a.id}>
            <div className="assignment-heading span2">Vehicle {i+1} of {details.booking.vehicleCount || details.assignments.length}</div>
            <div className="team-card"><UserRound /><div><small>Jeep driver</small><b>{a.driver.fullName}</b><span>Phone: {a.driver.phone || 'Not recorded'}</span><span>Licence: {a.driver.licenseNumber || 'Not recorded'}</span><span>Email: {a.driver.email}</span></div></div>
            <div className="team-card"><UserRound /><div><small>Safari guide</small><b>{a.guide.fullName}</b><span>Phone: {a.guide.phone || 'Not recorded'}</span><span>Languages: {a.guide.languages || 'Not recorded'}</span><span>Qualifications: {a.guide.qualifications || 'Not recorded'}</span></div></div>
            <div className="team-card span2"><Truck /><div><small>Assigned vehicle</small><b>{a.vehicle.registrationNo}</b><span>{a.vehicle.model} • {a.vehicle.capacity} seats</span><span>Assignment: {a.status.replaceAll('_', ' ')}</span></div></div>
          </div>)}</div> : <div className="empty compact">Driver, guide and vehicle have not been assigned yet. They will appear here after Safari Operations confirms the booking and assigns all required vehicles.</div>}
        </div>
      </div>}
    </Modal>

    <Modal open={!!permit} title="Yala Digital Permit" onClose={() => setPermit(null)}>
      <div className="permit-modal"><div className="permit-seal"><ShieldCheck /></div><h2>Safari Lanka Digital Permit</h2><p>Present this permit code to the authorized park/gate officer.</p><div className="qr-box"><QRCodeSVG value={permit?.permitCode || ''} size={180} /></div><code>{permit?.permitCode}</code><div className="permit-info"><span>Gate <b>{permit?.gateName}</b></span><span>Status <StatusBadge value={permit?.status} /></span><span>Booking <b>{permit?.booking?.bookingCode}</b></span><span>Visitor group <b>{permit?.booking?.adultCount||permit?.booking?.visitorCount||0} adults • {permit?.booking?.childFiveToElevenCount||0} child 5–11 • {permit?.booking?.childBelowFiveCount||0} below 5</b></span><span>Decision <b>{permit?.decisionReason||'Approved digital permit'}</b></span><span>Reviewed by <b>{permit?.decisionByName||permit?.decisionByEmail||'Park / Gate Officer'}</b></span><span>Check-in <b>{permit?.checkedInAt?fmtDateTime(permit.checkedInAt):'Not checked in'}</b></span><span>Check-out <b>{permit?.checkedOutAt?fmtDateTime(permit.checkedOutAt):'Not checked out'}</b></span></div><button className="btn btn-dark full" onClick={() => window.print()}><Download size={17} />Print permit</button></div>
    </Modal>

    <Modal open={!!reviewTarget} title={`Review safari • ${reviewTarget?.booking?.bookingCode || ''}`} onClose={() => setReviewTarget(null)} wide>
      {reviewTarget && <div className="modal-body review-form">
        <div className="review-form-intro"><Star fill="currentColor"/><div><h3>{reviewTarget.booking.safariPackage.name}</h3><p>Share a verified review after your completed safari. Overall rating is required; driver and guide ratings are optional.</p></div></div>
        <div className="review-rating-grid">
          <label>Overall safari rating<select value={reviewForm.overallRating} onChange={e=>setReviewForm({...reviewForm,overallRating:e.target.value})}>{[5,4,3,2,1].map(n=><option value={n} key={n}>{n} / 5</option>)}</select></label>
          <label>Driver rating (optional)<select value={reviewForm.driverRating} onChange={e=>setReviewForm({...reviewForm,driverRating:e.target.value})}><option value="">Not rated</option>{[5,4,3,2,1].map(n=><option value={n} key={n}>{n} / 5</option>)}</select></label>
          <label>Guide rating (optional)<select value={reviewForm.guideRating} onChange={e=>setReviewForm({...reviewForm,guideRating:e.target.value})}><option value="">Not rated</option>{[5,4,3,2,1].map(n=><option value={n} key={n}>{n} / 5</option>)}</select></label>
        </div>
        <label>Review title (optional)<input maxLength="180" value={reviewForm.title} onChange={e=>setReviewForm({...reviewForm,title:e.target.value})} placeholder="A memorable morning in Yala"/></label>
        <label>Your safari review<textarea rows="5" maxLength="4000" required value={reviewForm.reviewText} onChange={e=>setReviewForm({...reviewForm,reviewText:e.target.value})} placeholder="Tell other visitors about the wildlife, route, service and overall experience..."/></label>
        <div className="review-two-cols"><label>Driver comments (optional)<textarea rows="3" value={reviewForm.driverReview} onChange={e=>setReviewForm({...reviewForm,driverReview:e.target.value})}/></label><label>Guide comments (optional)<textarea rows="3" value={reviewForm.guideReview} onChange={e=>setReviewForm({...reviewForm,guideReview:e.target.value})}/></label></div>
        <label className="review-upload-box"><Upload size={20}/><span><b>Add photos or videos (optional)</b><small>JPG/PNG/WEBP up to 8 MB • MP4/WEBM up to 50 MB • maximum 8 files</small></span><input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={reviewBusy||reviewForm.mediaUrls.length>=8} onChange={e=>uploadReviewMedia(e.target.files)}/></label>
        {!!reviewForm.mediaUrls.length && <div className="review-upload-preview">{reviewForm.mediaUrls.map((url,i)=><div key={url} className="review-upload-item">{/\.(mp4|webm)(\?|$)/i.test(url)?<video src={url} controls/>:<img src={url} alt="Review upload"/>}<button type="button" onClick={()=>setReviewForm(f=>({...f,mediaUrls:f.mediaUrls.filter((_,j)=>j!==i)}))}><X size={14}/></button></div>)}</div>}
        <button className="btn btn-dark full" disabled={reviewBusy} onClick={submitReview}><Star size={17}/>{reviewBusy?'Saving...':'Publish verified review'}</button>
      </div>}
    </Modal>

    <Modal open={!!editBooking} title="Edit pending booking" onClose={()=>setEditBooking(null)} wide>
      {editBooking&&<div className="modal-body form-grid">
        <div className="span2 workflow-reason"><b>Pending booking CRUD</b><p>You can edit this booking only before Safari Operator confirmation and before any payment attempt.</p></div>
        <label>Visit date<input type="date" value={editBooking.visitDate} min={new Date(Date.now()+86400000).toISOString().slice(0,10)} onChange={e=>setEditBooking({...editBooking,visitDate:e.target.value})}/></label>
        <label>Adults<input type="number" min="1" value={editBooking.adults} onChange={e=>setEditBooking({...editBooking,adults:e.target.value})}/></label>
        <label>Child (5–11 years)<input type="number" min="0" value={editBooking.childFiveToEleven} onChange={e=>setEditBooking({...editBooking,childFiveToEleven:e.target.value})}/></label>
        <label>Child (below 5 years)<input type="number" min="0" value={editBooking.childBelowFive} onChange={e=>setEditBooking({...editBooking,childBelowFive:e.target.value})}/></label>
        <label>Group leader<input value={editBooking.groupLeaderName} onChange={e=>setEditBooking({...editBooking,groupLeaderName:e.target.value})}/></label>
        <label>Contact phone<input inputMode="numeric" value={editBooking.contactPhone} onChange={e=>setEditBooking({...editBooking,contactPhone:e.target.value.replace(/\D/g,'').slice(0,12)})}/></label>
        <label>Emergency contact<input inputMode="numeric" value={editBooking.emergencyContact} onChange={e=>setEditBooking({...editBooking,emergencyContact:e.target.value.replace(/\D/g,'').slice(0,12)})}/></label>
        <label className="span2">Special requirements<textarea rows="3" value={editBooking.specialRequirements} onChange={e=>setEditBooking({...editBooking,specialRequirements:e.target.value})}/></label>
        <div className="span2 workflow-reason"><b>Visitor total</b><p>{Number(editBooking.adults||0)+Number(editBooking.childFiveToEleven||0)+Number(editBooking.childBelowFive||0)} visitors. Children below 5 are free of the per-person charge but still count toward vehicle capacity. Vehicle requirement and price are recalculated by the backend when you save.</p></div>
        <button className="btn btn-dark span2" onClick={saveBookingEdit}>Save booking changes</button>
      </div>}
    </Modal>

    <Modal open={!!refundEdit} title="Edit pending refund" onClose={()=>setRefundEdit(null)}>
      {refundEdit&&<div className="modal-body"><p>Booking <b>{refundEdit.booking?.bookingCode}</b></p><label>Refund reason<textarea rows="4" maxLength="1000" value={refundEdit.reason||''} onChange={e=>setRefundEdit({...refundEdit,reason:e.target.value})}/></label><button className="btn btn-dark full" disabled={!refundEdit.reason?.trim()} onClick={saveRefundEdit}>Save refund changes</button></div>}
    </Modal>

    <Modal open={!!refund} title="Request refund" onClose={() => setRefund(null)}>
      <div className="modal-body"><p>Booking <b>{refund?.booking.bookingCode}</b></p><label>Reason<textarea rows="4" value={reason} onChange={e => setReason(e.target.value)} /></label><button className="btn btn-dark full" onClick={doRefund}><RotateCcw size={17} />Submit refund request</button></div>
    </Modal>
  </DashboardShell>;
}
