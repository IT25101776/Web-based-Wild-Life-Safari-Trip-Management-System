import { useEffect, useState } from 'react';
import {useLocation} from 'react-router-dom';
import { CalendarDays, Package, Truck, Users, Plus, Link2, Upload, Printer, Wrench, Trash2, Video, X, Search, AlertTriangle, MessageSquareText, Eye } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import api, { messageOf, publicAssetUrl } from '../../utils/api';

const emptyPkg = {
  name: '',
  description: '',
  routeZone: 'Block I',
  timeSlot: '05:30 - 10:30',
  pricePerPerson: 10000,
  additionalVehicleFee: 10000,
  maxVisitors: 24,
  maxVehicles: 4,
  published: true,
  imageUrl: '/images/packages/yala-dawn-leopard-quest.png',
  videoUrl: '',
  duration: '5 hours'
};

const esc = (value) => String(value ?? '—')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export default function OperatorDashboard() {
  const location=useLocation();
  const queryTab=new URLSearchParams(location.search).get('tab');
  const allowedTabs=['bookings','packages','resources','assignments','incidents','contacts'];
  const [tab, setTab] = useState(allowedTabs.includes(queryTab)?queryTab:'bookings');
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [guides, setGuides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [guideRosters,setGuideRosters]=useState([]);
  const [err, setErr] = useState('');
  const [pkg, setPkg] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [assign, setAssign] = useState(null);
  const [aform, setAform] = useState({ driverId: '', guideId: '' });
  const [maintenanceVehicle, setMaintenanceVehicle] = useState(null);
  const [maintenanceRows, setMaintenanceRows] = useState([]);
  const [maintenanceForm, setMaintenanceForm] = useState({ serviceDate: '', description: '', status: 'SCHEDULED' });
  const [q, setQ] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactDetail, setContactDetail] = useState(null);
  const [bookingDetail,setBookingDetail]=useState(null);
  const [cancelTarget,setCancelTarget]=useState(null);
  const [cancelReason,setCancelReason]=useState('');

  useEffect(()=>{if(allowedTabs.includes(queryTab)&&queryTab!==tab)setTab(queryTab);},[queryTab]);

  const load = () => Promise.all([
    api.get('/bookings/all'),
    api.get('/packages/all'),
    api.get('/vehicles'),
    api.get('/staff/guides'),
    api.get('/staff/drivers'),
    api.get('/assignments'),
    api.get('/guide-rosters'),
    api.get('/incidents'),
    api.get('/contact')
  ]).then(([b, p, v, g, d, a, gr, i, c]) => {
    setBookings(b.data);
    setPackages(p.data);
    setVehicles(v.data);
    setGuides(g.data);
    setDrivers(d.data);
    setAssignments(a.data);
    setGuideRosters(gr.data);
    setIncidents(i.data);
    setContacts(c.data);
  }).catch(e => setErr(messageOf(e)));

  useEffect(() => { load(); }, []);

  const query=q.trim().toLowerCase();
  const filteredBookings=bookings.filter(x=>!query || [x.booking.bookingCode,x.booking.tourist?.fullName,x.booking.safariPackage?.name,x.booking.visitDate,x.booking.specialRequirements].filter(Boolean).join(' ').toLowerCase().includes(query));
  const filteredIncidents=incidents.filter(i=>!query || [i.booking?.bookingCode,i.type,i.details,i.reporter?.fullName,i.status].filter(Boolean).join(' ').toLowerCase().includes(query));
  const filteredContacts=contacts.filter(c=>!query || [c.fullName,c.email,c.phone,c.bookingCode,c.subject,c.message,c.status].filter(Boolean).join(' ').toLowerCase().includes(query));
  const activeOnDate=(a,date)=>a.booking?.visitDate===date&&!['CANCELLED','DECLINED'].includes(a.status);
  const driverVehicle=(driverId)=>vehicles.find(v=>v.driver?.id===Number(driverId));
  const availableDrivers=assign?drivers.filter(d=>{const v=driverVehicle(d.id);if(!d.available||d.onLeave||!v||['MAINTENANCE','INACTIVE'].includes(v.status))return false;return !assignments.some(a=>activeOnDate(a,assign.booking.visitDate)&&(a.driver?.id===d.id||a.vehicle?.id===v.id));}):[];
  const rosterAllows=(g,date)=>{const rows=guideRosters.filter(r=>r.guide?.id===g.id&&r.rosterDate===date);return rows.length===0||rows.some(r=>r.available);};
  const availableGuides=assign?guides.filter(g=>g.available&&!g.onLeave&&rosterAllows(g,assign.booking.visitDate)&&!assignments.some(a=>activeOnDate(a,assign.booking.visitDate)&&a.guide?.id===g.id)):[];
  const selectedDriver=drivers.find(d=>d.id===Number(aform.driverId));
  const selectedVehicle=selectedDriver?driverVehicle(selectedDriver.id):null;

  const savePkg = async () => {
    try {
      if (pkg.id) await api.put(`/packages/${pkg.id}`, pkg);
      else await api.post('/packages', pkg);
      setPkg(null);
      load();
    } catch (e) { setErr(messageOf(e)); }
  };


  const deletePkg = async (packageRow) => {
    if (!packageRow?.id) return;
    const ok = window.confirm(`Delete package "${packageRow.name}"?\n\nExisting booking history will be preserved, but this package will no longer appear to tourists or in package management.`);
    if (!ok) return;
    try {
      setErr('');
      await api.delete(`/packages/${packageRow.id}`);
      if (pkg?.id === packageRow.id) setPkg(null);
      await load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const uploadPkgImage = async (file) => {
    if (!file) return;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WEBP image.');
      if (file.size > 8 * 1024 * 1024) throw new Error('Image must be 8 MB or smaller.');
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post('/packages/upload-image', fd);
      setPkg(x => ({ ...x, imageUrl: r.data.url }));
    } catch (e) { setErr(messageOf(e)); }
  };

  const uploadPkgVideo = async (file) => {
    if (!file) return;
    try {
      if (!['video/mp4', 'video/webm'].includes(file.type)) throw new Error('Choose an MP4 or WEBM video.');
      if (file.size > 50 * 1024 * 1024) throw new Error('Video must be 50 MB or smaller.');
      const fd = new FormData();
      fd.append('video', file);
      fd.append('packageName', pkg?.name || 'package');
      const r = await api.post('/packages/upload-video', fd);
      setPkg(x => ({ ...x, videoUrl: r.data.url }));
    } catch (e) { setErr(messageOf(e)); }
  };

  const saveVehicle = async () => {
    try {
      const payload = { ...vehicle, capacity: Number(vehicle.capacity), driverId: vehicle.driverId ? Number(vehicle.driverId) : null };
      if (vehicle.id) await api.put(`/vehicles/${vehicle.id}`, payload);
      else await api.post('/vehicles', payload);
      setVehicle(null);
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const doAssign = async () => {
    try {
      await api.post(`/assignments/booking/${assign.booking.id}`, {
        driverId: Number(aform.driverId),
        guideId: Number(aform.guideId)
      });
      setAssign(null);
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const status = async (id, value, reason='') => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: value, reason });
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const confirmCancellation=async()=>{
    if(!cancelTarget||!cancelReason.trim()){setErr('Enter a booking cancellation reason.');return;}
    await status(cancelTarget.booking.id,'CANCELLED',cancelReason.trim());
    setCancelTarget(null);setCancelReason('');
  };

  const contactStatus = async (id, value) => {
    try {
      await api.patch(`/contact/${id}/status`, { status: value });
      if (contactDetail?.id === id) setContactDetail(x => ({ ...x, status: value }));
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const openMaintenance = async (v) => {
    try {
      const r = await api.get(`/vehicles/${v.id}/maintenance`);
      setMaintenanceVehicle(v);
      setMaintenanceRows(r.data);
      setMaintenanceForm({ serviceDate: new Date().toISOString().slice(0, 10), description: '', status: 'SCHEDULED' });
    } catch (e) { setErr(messageOf(e)); }
  };

  const addMaintenance = async () => {
    try {
      await api.post(`/vehicles/${maintenanceVehicle.id}/maintenance`, maintenanceForm);
      const r = await api.get(`/vehicles/${maintenanceVehicle.id}/maintenance`);
      setMaintenanceRows(r.data);
      setMaintenanceForm({ serviceDate: new Date().toISOString().slice(0, 10), description: '', status: 'SCHEDULED' });
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const changeMaintenanceStatus = async (recordId, value) => {
    try {
      await api.patch(`/vehicles/maintenance/${recordId}`, { status: value });
      const r = await api.get(`/vehicles/${maintenanceVehicle.id}/maintenance`);
      setMaintenanceRows(r.data);
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const printBooking = (x) => {
    const b = x.booking;
    const bookingAssignments = x.assignments || (x.assignment ? [x.assignment] : []);
    const visitorGroup = `<tr><td>Adults</td><td>${esc(b.adultCount ?? b.visitorCount)}</td></tr><tr><td>Children 5–11</td><td>${esc(b.childFiveToElevenCount || 0)}</td></tr><tr><td>Children below 5</td><td>${esc(b.childBelowFiveCount || 0)}</td></tr><tr><td><b>Total visitors</b></td><td><b>${esc(b.visitorCount)}</b></td></tr>`;
    const team = bookingAssignments.length ? `<section><h2>Assigned safari team</h2>${bookingAssignments.map((assignment,i)=>`
        <div style="margin-bottom:14px"><p><b>Vehicle ${i+1}:</b> ${esc(assignment.vehicle.registrationNo)} — ${esc(assignment.vehicle.model)}</p>
        <p><b>Driver:</b> ${esc(assignment.driver.fullName)} | ${esc(assignment.driver.phone || 'No phone')} | Licence ${esc(assignment.driver.licenseNumber || 'Not recorded')}</p>
        <p><b>Guide:</b> ${esc(assignment.guide.fullName)} | ${esc(assignment.guide.phone || 'No phone')} | Languages ${esc(assignment.guide.languages || 'Not recorded')}</p>
        <p><b>Assignment status:</b> ${esc(assignment.status)}</p></div>`).join('')}</section>` : '<section><h2>Assigned safari team</h2><p>Resources have not been assigned yet.</p></section>';

    const w = window.open('', '_blank', 'width=900,height=760');
    if (!w) {
      setErr('Allow pop-ups for this site to print a booking summary.');
      return;
    }
    w.document.write(`<!doctype html><html><head><title>${esc(b.bookingCode)} - Booking Summary</title><style>
      body{font-family:Arial,sans-serif;color:#152d25;margin:36px;line-height:1.45}h1{margin:0 0 4px}h2{font-size:17px;border-bottom:1px solid #ccd7d2;padding-bottom:6px;margin-top:24px}.muted{color:#62756d}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 30px}.grid p{margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #d8e0dc;padding:8px;text-align:left;font-size:12px}.top{border-bottom:3px solid #0b3a2c;padding-bottom:14px}.status{font-weight:bold}.footer{margin-top:30px;font-size:11px;color:#6b7a74}@media print{body{margin:18mm}.no-print{display:none}}
    </style></head><body>
      <div class="top"><h1>Safari Lanka</h1><div class="muted">Booking Summary</div></div>
      <section><h2>Booking</h2><div class="grid">
        <p><b>Booking code:</b> ${esc(b.bookingCode)}</p><p><b>Date:</b> ${esc(b.visitDate)}</p>
        <p><b>Tourist:</b> ${esc(b.tourist.fullName)}</p><p><b>Contact:</b> ${esc(b.contactPhone)}</p>
        <p><b>Package:</b> ${esc(b.safariPackage.name)}</p><p><b>Route:</b> ${esc(b.safariPackage.routeZone)}</p>
        <p><b>Visitors:</b> ${esc(b.visitorCount)}</p><p><b>Vehicles required:</b> ${esc(b.vehicleCount || Math.ceil(b.visitorCount/6))}</p>
        <p><b>Chargeable visitors (age 5+):</b> ${(b.adultCount ?? b.visitorCount) + (b.childFiveToElevenCount || 0)}</p><p><b>Children below 5:</b> ${b.childBelowFiveCount || 0} (free per-person)</p><p><b>Additional vehicle fee:</b> LKR ${Number(b.vehicleSurcharge||0).toLocaleString()}</p><p><b>Total:</b> LKR ${Number(b.totalAmount).toLocaleString()}</p>
        <p><b>Booking status:</b> ${esc(b.bookingStatus)}</p><p><b>Payment status:</b> ${esc(b.paymentStatus)}</p>
        <p><b>Permit status:</b> ${esc(x.permit?.status || 'PENDING')}</p><p><b>Permit code:</b> ${esc(x.permit?.permitCode || 'Not issued')}</p>
      </div><p><b>Special requirements:</b> ${esc(b.specialRequirements || 'None')}</p></section>
      <section><h2>Visitor group</h2><table><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>${visitorGroup}</tbody></table></section>
      ${team}
      <div class="footer">Printed from Safari Lanka Safari Operations.</div>
      <script>window.onload=()=>{window.print();};<\/script>
    </body></html>`);
    w.document.close();
  };

  return <DashboardShell title="Safari Operations" subtitle="Manage packages, booking requests, schedules and safari resources.">
    {err && <div className="alert error">{err}</div>}

    <div className="stats-grid">
      <StatCard icon={CalendarDays} label="Bookings" value={bookings.length} />
      <StatCard icon={Package} label="Packages" value={packages.length} />
      <StatCard icon={Truck} label="Vehicles" value={vehicles.length} />
      <StatCard icon={Users} label="Guides" value={guides.length} />
    </div>

    <div className="tabs">{['bookings', 'packages', 'resources', 'assignments', 'incidents', 'contacts'].map(t => <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>{t==='contacts'?'Contact requests':t[0].toUpperCase() + t.slice(1)}</button>)}</div>

    {tab === 'bookings' && <section className="panel">
      <div className="panel-head search-panel-head"><div><h2>Booking requests</h2><p>Review reservations, print summaries and coordinate resource assignment.</p></div><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking ID, tourist, package, date..."/></div></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Tourist</th><th>Package / Date</th><th>Visitors</th><th>Special requirements</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filteredBookings.map(x => <tr key={x.booking.id}>
          <td><b>{x.booking.bookingCode}</b></td>
          <td>{x.booking.tourist.fullName}</td>
          <td>{x.booking.safariPackage.name}<small className="cell-small">{x.booking.visitDate}</small></td>
          <td><b>{x.booking.visitorCount}</b><small className="cell-small">{x.booking.adultCount??x.booking.visitorCount} adult • {x.booking.childFiveToElevenCount||0} child 5–11 • {x.booking.childBelowFiveCount||0} below 5</small><small className="cell-small">{x.booking.vehicleCount || Math.ceil(x.booking.visitorCount/6)} vehicle(s)</small></td>
          <td className="requirements-cell">{x.booking.specialRequirements||'None'}<small>Review before confirming/assigning.</small></td>
          <td><StatusBadge value={x.booking.paymentStatus} />{x.latestPayment?.status==='REJECTED'&&x.latestPayment?.rejectionReason&&<small className="cell-small rejection-note">{x.latestPayment.rejectionReason}</small>}</td>
          <td><StatusBadge value={x.booking.bookingStatus} />{x.booking.cancellationReason&&<small className="cell-small rejection-note">{x.booking.cancellationReason}</small>}</td>
          <td className="actions">
            <button className="mini-action" onClick={() => setBookingDetail(x)}><Eye size={14}/>Details</button>
            <button className="mini-action" onClick={() => printBooking(x)}><Printer size={14} />Print</button>
            {x.booking.bookingStatus === 'PENDING' && <><button className="mini-action" onClick={() => status(x.booking.id, 'CONFIRMED')}>Confirm</button><button className="mini-action danger" onClick={() => status(x.booking.id, 'REJECTED')}>Reject</button></>}
            {x.permit?.checkedOutAt && x.booking.bookingStatus==='CONFIRMED' && <span className="cell-small trip-completion-note">Checked out • waiting for assigned driver to complete</span>}
            {!['CANCELLED', 'COMPLETED', 'REJECTED'].includes(x.booking.bookingStatus) && <button className="mini-action danger" onClick={() => {setCancelTarget(x);setCancelReason('');}}>Cancel</button>}
            <button className="mini-action" disabled={x.booking.paymentStatus !== 'PAID' || x.booking.bookingStatus !== 'CONFIRMED' || (x.assignments?.length || 0) >= (x.booking.vehicleCount || 1)} title={x.booking.paymentStatus !== 'PAID' ? 'Payment must be completed/approved first' : x.booking.bookingStatus !== 'CONFIRMED' ? 'Confirm the booking first' : 'Assign each required safari team'} onClick={() => { setAssign(x); setAform({ driverId: '', guideId: '' }); }}><Link2 size={14} />{(x.assignments?.length || 0) >= (x.booking.vehicleCount || 1) ? 'Assigned' : `Assign ${(x.assignments?.length || 0)+1}/${x.booking.vehicleCount || 1}`}</button>
          </td>
        </tr>)}
      </tbody></table></div>
    </section>}

    {tab === 'packages' && <section className="panel">
      <div className="panel-head"><div><h2>Safari package management</h2><p>Create, update, price and publish Yala packages.</p></div><button className="btn btn-dark btn-sm" onClick={() => setPkg({ ...emptyPkg })}><Plus size={16} />New package</button></div>
      <div className="card-list">{packages.map(p => <div className="admin-card" key={p.id}><div className="admin-thumb" style={{ backgroundImage: `url(${publicAssetUrl(p.imageUrl)})` }} />{p.videoUrl && <span className="admin-video-badge"><Video size={12} />Video</span>}<div className="grow"><b>{p.name}</b><small>{p.routeZone} • {p.timeSlot} • LKR {Number(p.pricePerPerson).toLocaleString()}</small></div><StatusBadge value={p.published ? 'PUBLISHED' : 'DRAFT'} /><div className="actions"><button className="mini-action" onClick={() => setPkg({ ...p })}>Edit</button><button className="mini-action danger-action" onClick={() => deletePkg(p)}><Trash2 size={14} />Delete</button></div></div>)}</div>
    </section>}

    {tab === 'resources' && <section className="two-panels">
      <div className="panel">
        <div className="panel-head"><h2>Safari jeeps</h2><button className="mini-action" onClick={() => setVehicle({ registrationNo: '', model: 'Toyota Hilux Safari Jeep', capacity: 6, status: 'AVAILABLE', documentValidUntil: '', driverId: '' })}><Plus size={14} />Add jeep</button></div>
        {vehicles.map(v => <div className="list-row" key={v.id}><div><b>{v.registrationNo}</b><small>{v.model} • {v.capacity} seats{v.driver ? ` • ${v.driver.fullName}` : ''}</small></div><div className="actions"><StatusBadge value={v.status} /><button className="mini-action" onClick={() => openMaintenance(v)}><Wrench size={14} />Maintenance</button><button className="mini-action" onClick={() => setVehicle({ ...v, driverId: v.driver?.id || '' })}>Edit</button></div></div>)}
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Guides & drivers</h2></div>
        {guides.map(g => <div className="list-row" key={g.id}><div><b>{g.fullName}</b><small>Guide • {g.languages}</small></div><StatusBadge value={g.available && !g.onLeave ? 'AVAILABLE' : 'UNAVAILABLE'} /></div>)}
        {drivers.map(d => <div className="list-row" key={d.id}><div><b>{d.fullName}</b><small>Driver • {d.licenseNumber || 'No license recorded'}</small></div><StatusBadge value={d.available && !d.onLeave ? 'AVAILABLE' : 'UNAVAILABLE'} /></div>)}
      </div>
    </section>}

    {tab === 'incidents' && <section className="panel">
      <div className="panel-head search-panel-head"><div><h2>Guide / driver incident reports</h2><p>Reports submitted from safari trips are visible here for Safari Operations follow-up.</p></div><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking ID, reporter, incident type..."/></div></div>
      {filteredIncidents.map(i=><div className="incident-card" key={i.id}><div><b>{i.type}</b><small>{i.booking?.bookingCode} • {i.booking?.visitDate}</small></div><div><b>{i.details}</b><small>Reporter: {i.reporter?.fullName||i.reporter?.email||'Staff member'}</small></div><div><StatusBadge value={i.status}/></div><AlertTriangle size={20}/></div>)}
      {!filteredIncidents.length&&<div className="empty compact">No incident reports match your search.</div>}
    </section>}

    {tab === 'contacts' && <section className="panel">
      <div className="panel-head search-panel-head"><div><h2>Contact requests</h2><p>View messages submitted from the public Contact Us page and follow up with tourists.</p></div><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, email, phone, booking ID, subject..."/></div></div>
      {filteredContacts.map(c=><div className="incident-card" key={c.id}><div><b>{c.fullName}</b><small>{c.email}{c.phone?` • ${c.phone}`:''}{c.bookingCode?` • ${c.bookingCode}`:''}</small></div><div><b>{c.subject}</b><small>{c.message}</small></div><StatusBadge value={c.status}/><div className="actions"><button className="mini-action" onClick={()=>setContactDetail(c)}><Eye size={14}/>View details</button>{c.status==='NEW'&&<button className="mini-action" onClick={()=>contactStatus(c.id,'READ')}>Mark read</button>}{c.status!=='RESOLVED'&&<button className="mini-action" onClick={()=>contactStatus(c.id,'RESOLVED')}>Resolve</button>}</div></div>)}
      {!filteredContacts.length&&<div className="empty compact">No contact requests match your search.</div>}
    </section>}

    {tab === 'assignments' && <section className="panel">
      <div className="panel-head"><h2>Trip assignments</h2></div>
      <div className="table-wrap"><table><thead><tr><th>Booking</th><th>Date</th><th>Jeep</th><th>Driver</th><th>Guide</th><th>Status</th></tr></thead><tbody>{assignments.map(a => <tr key={a.id}><td>{a.booking.bookingCode}</td><td>{a.booking.visitDate}</td><td>{a.vehicle.registrationNo}</td><td>{a.driver.fullName}</td><td>{a.guide.fullName}</td><td><StatusBadge value={a.status} /></td></tr>)}</tbody></table></div>
    </section>}

    <Modal open={!!contactDetail} title={`Contact request • #${contactDetail?.id||''}`} onClose={()=>setContactDetail(null)} wide>
      {contactDetail&&<div className="modal-body"><div className="contact-detail-grid"><div><small>Full name</small><b>{contactDetail.fullName}</b></div><div><small>Status</small><StatusBadge value={contactDetail.status}/></div><div><small>Email</small><b>{contactDetail.email}</b></div><div><small>Phone</small><b>{contactDetail.phone||'Not provided'}</b></div><div><small>Booking ID</small><b>{contactDetail.bookingCode||'Not provided'}</b></div><div><small>Submitted</small><b>{contactDetail.createdAt?String(contactDetail.createdAt).replace('T',' ').slice(0,16):'—'}</b></div><div className="span2"><small>Subject</small><b>{contactDetail.subject}</b></div></div><div className="contact-detail-message"><small>Message</small><p>{contactDetail.message}</p></div><div className="actions" style={{marginTop:16}}>{contactDetail.status==='NEW'&&<button className="mini-action" onClick={()=>contactStatus(contactDetail.id,'READ')}>Mark read</button>}{contactDetail.status!=='RESOLVED'&&<button className="mini-action" onClick={()=>contactStatus(contactDetail.id,'RESOLVED')}>Mark resolved</button>}</div></div>}
    </Modal>

    <Modal open={!!pkg} title={pkg?.id ? 'Edit safari package' : 'Create safari package'} onClose={() => setPkg(null)} wide>
      <div className="modal-body form-grid">{pkg && <>
        <label>Package name<input value={pkg.name} onChange={e => setPkg({ ...pkg, name: e.target.value })} /></label>
        <label>Route / zone<input value={pkg.routeZone} onChange={e => setPkg({ ...pkg, routeZone: e.target.value })} /></label>
        <label>Time slot<input value={pkg.timeSlot} onChange={e => setPkg({ ...pkg, timeSlot: e.target.value })} /></label>
        <label>Duration<input value={pkg.duration || ''} onChange={e => setPkg({ ...pkg, duration: e.target.value })} /></label>
        <label>Price per person<input type="number" value={pkg.pricePerPerson} onChange={e => setPkg({ ...pkg, pricePerPerson: Number(e.target.value) })} /></label>
        <label>Additional vehicle fee<input type="number" min="0" value={pkg.additionalVehicleFee ?? pkg.pricePerPerson} onChange={e => setPkg({ ...pkg, additionalVehicleFee: Number(e.target.value) })} /><small>Added once for every vehicle after the first. One vehicle carries up to 6 visitors.</small></label>
        <label>Max visitors<input type="number" value={pkg.maxVisitors} onChange={e => setPkg({ ...pkg, maxVisitors: Number(e.target.value) })} /></label>
        <label>Max vehicles<input type="number" value={pkg.maxVehicles} onChange={e => setPkg({ ...pkg, maxVehicles: Number(e.target.value) })} /></label>
        <label>Image URL (optional)<input value={pkg.imageUrl || ''} onChange={e => setPkg({ ...pkg, imageUrl: e.target.value })} placeholder="Paste image URL or upload below" /></label>
        <label>Package image upload<div className="inline-upload"><Upload size={17} /><span>Choose JPG / PNG / WEBP</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => uploadPkgImage(e.target.files?.[0])} /></div></label>
        {pkg.imageUrl && <div className="image-preview span2" style={{ backgroundImage: `url(${publicAssetUrl(pkg.imageUrl)})` }}><span>Package image preview</span></div>}
        <label>Video URL (optional)<input value={pkg.videoUrl || ''} onChange={e => setPkg({ ...pkg, videoUrl: e.target.value })} placeholder="/videos/packages/package-name.mp4 or upload below" /></label>
        <label>Package hover video<div className="inline-upload"><Video size={17} /><span>Choose MP4 / WEBM • max 50 MB</span><input type="file" accept="video/mp4,video/webm" onChange={e => uploadPkgVideo(e.target.files?.[0])} /></div></label>
        {pkg.videoUrl && <div className="video-preview span2"><video src={pkg.videoUrl} controls muted playsInline preload="metadata" /><div><span>Hover preview video</span><button type="button" className="mini-action danger-action" onClick={() => setPkg({ ...pkg, videoUrl: '' })}><X size={13} />Remove video</button></div></div>}
        <p className="form-note span2">Package videos are stored locally in <b>frontend/public/videos/packages/</b>. On the tourist package image, the video plays automatically while the mouse is hovering and stops when the mouse leaves.</p>
        <label className="span2">Description<textarea rows="4" value={pkg.description || ''} onChange={e => setPkg({ ...pkg, description: e.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={pkg.published} onChange={e => setPkg({ ...pkg, published: e.target.checked })} /> Published to tourists</label>
        <button className="btn btn-dark span2" onClick={savePkg}>Save package</button>
      </>}</div>
    </Modal>

    <Modal open={!!vehicle} title={vehicle?.id ? 'Edit safari jeep' : 'Register safari jeep'} onClose={() => setVehicle(null)}>
      <div className="modal-body">{vehicle && <>
        <label>Registration number<input value={vehicle.registrationNo} onChange={e => setVehicle({ ...vehicle, registrationNo: e.target.value })} /></label>
        <label>Vehicle model<input value={vehicle.model || ''} onChange={e => setVehicle({ ...vehicle, model: e.target.value })} /></label>
        <div className="form-row"><label>Passenger capacity<input type="number" min="1" value={vehicle.capacity} onChange={e => setVehicle({ ...vehicle, capacity: e.target.value })} /></label><label>Status<select value={vehicle.status || 'AVAILABLE'} onChange={e => setVehicle({ ...vehicle, status: e.target.value })}><option>AVAILABLE</option><option>ASSIGNED</option><option>MAINTENANCE</option><option>INACTIVE</option></select></label></div>
        <label>Document valid until<input type="date" value={vehicle.documentValidUntil || ''} onChange={e => setVehicle({ ...vehicle, documentValidUntil: e.target.value })} /></label>
        <label>Linked driver<select value={vehicle.driverId || ''} onChange={e => setVehicle({ ...vehicle, driverId: e.target.value })}><option value="">No driver</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}</select></label>
        <button className="btn btn-dark full" onClick={saveVehicle}>Save jeep</button>
      </>}</div>
    </Modal>

    <Modal open={!!maintenanceVehicle} title={`Vehicle maintenance • ${maintenanceVehicle?.registrationNo || ''}`} onClose={() => setMaintenanceVehicle(null)} wide>
      {maintenanceVehicle && <div className="modal-body">
        <div className="maintenance-form-grid">
          <label>Service date<input type="date" value={maintenanceForm.serviceDate} onChange={e => setMaintenanceForm({ ...maintenanceForm, serviceDate: e.target.value })} /></label>
          <label>Status<select value={maintenanceForm.status} onChange={e => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}><option value="SCHEDULED">Scheduled</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></label>
          <label className="span2">Maintenance details<textarea rows="3" value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} placeholder="Service, repair or vehicle issue details" /></label>
          <button className="btn btn-dark span2" disabled={!maintenanceForm.serviceDate || !maintenanceForm.description.trim()} onClick={addMaintenance}><Wrench size={16} />Add maintenance record</button>
        </div>
        <div className="detail-section"><h3>Maintenance history</h3>{maintenanceRows.map(m => <div className="maintenance-row" key={m.id}><div><b>{m.serviceDate}</b><small>{m.description}</small></div><div className="actions"><StatusBadge value={m.status} />{m.status !== 'COMPLETED' && <button className="mini-action" onClick={() => changeMaintenanceStatus(m.id, 'COMPLETED')}>Mark completed</button>}</div></div>)}{!maintenanceRows.length && <div className="empty compact">No maintenance records for this vehicle.</div>}</div>
      </div>}
    </Modal>


    <Modal open={!!bookingDetail} title={`Booking details • ${bookingDetail?.booking?.bookingCode||''}`} onClose={()=>setBookingDetail(null)} wide>
      {bookingDetail&&<div className="modal-body booking-details-modal"><div className="detail-grid"><span>Tourist <b>{bookingDetail.booking.tourist.fullName}</b></span><span>Package <b>{bookingDetail.booking.safariPackage.name}</b></span><span>Visit date <b>{bookingDetail.booking.visitDate}</b></span><span>Visitors <b>{bookingDetail.booking.visitorCount}</b></span><span>Adults <b>{bookingDetail.booking.adultCount??bookingDetail.booking.visitorCount}</b></span><span>Children 5–11 <b>{bookingDetail.booking.childFiveToElevenCount||0}</b></span><span>Children below 5 <b>{bookingDetail.booking.childBelowFiveCount||0}</b></span><span>Booking <StatusBadge value={bookingDetail.booking.bookingStatus}/></span><span>Payment <StatusBadge value={bookingDetail.booking.paymentStatus}/></span></div>{bookingDetail.booking.cancellationReason&&<div className="workflow-reason danger-reason"><b>Booking cancellation reason</b><p>{bookingDetail.booking.cancellationReason}</p></div>}{bookingDetail.latestPayment?.status==='REJECTED'&&bookingDetail.latestPayment?.rejectionReason&&<div className="workflow-reason danger-reason"><b>Payment rejection reason</b><p>{bookingDetail.latestPayment.rejectionReason}</p></div>}<div className="requirement-callout"><b>Special requirement / note</b><p>{bookingDetail.booking.specialRequirements||'None recorded.'}</p></div><div className="detail-section"><h3>Assigned safari teams</h3>{(bookingDetail.assignments||[]).map((a,i)=><div className="detail-person" key={a.id}><b>Team {i+1}: {a.driver.fullName} • {a.vehicle.registrationNo}</b><small>Guide: {a.guide.fullName} • Vehicle: {a.vehicle.model} • {a.status}</small></div>)}{!(bookingDetail.assignments||[]).length&&<div className="empty compact">No safari team assigned yet.</div>}</div></div>}
    </Modal>

    <Modal open={!!cancelTarget} title={`Cancel booking • ${cancelTarget?.booking?.bookingCode||''}`} onClose={()=>{setCancelTarget(null);setCancelReason('')}}>
      <div className="modal-body"><p>Enter the reason for cancelling this booking. The tourist will be able to see this reason.</p><label>Cancellation reason<textarea rows="4" maxLength="1000" value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Explain why this booking is being cancelled..."/></label><button className="btn btn-dark full" disabled={!cancelReason.trim()} onClick={confirmCancellation}>Cancel booking and save reason</button></div>
    </Modal>
    <Modal open={!!assign} title={`Assign safari team ${(assign?.assignments?.length || 0)+1} of ${assign?.booking.vehicleCount || 1} • ${assign?.booking.bookingCode || ''}`} onClose={() => setAssign(null)}>
      <div className="modal-body">
        <label>Jeep driver<select value={aform.driverId} onChange={e => setAform({ ...aform, driverId: e.target.value })}><option value="">Select available driver</option>{availableDrivers.map(d => {const v=driverVehicle(d.id);return <option value={d.id} key={d.id}>{d.fullName} • {v?.registrationNo}</option>})}</select></label>
        {selectedVehicle&&<div className="auto-vehicle-card"><Truck size={20}/><div><small>Automatically assigned vehicle</small><b>{selectedVehicle.registrationNo}</b><span>{selectedVehicle.model} • {selectedVehicle.capacity} seats</span></div></div>}
        <label>Safari guide<select value={aform.guideId} onChange={e => setAform({ ...aform, guideId: e.target.value })}><option value="">Select available guide</option>{availableGuides.map(g => <option value={g.id} key={g.id}>{g.fullName} • {g.languages}</option>)}</select></label>
        <button className="btn btn-dark full" disabled={!aform.driverId || !aform.guideId || !selectedVehicle} onClick={doAssign}>Validate & assign safari team</button>
        <p className="form-note">Choose only a driver and safari guide. The driver's linked vehicle is assigned automatically. Drivers, guides and vehicles already used on {assign?.booking.visitDate||'this date'} are excluded automatically.</p>
      </div>
    </Modal>
  </DashboardShell>;
}
