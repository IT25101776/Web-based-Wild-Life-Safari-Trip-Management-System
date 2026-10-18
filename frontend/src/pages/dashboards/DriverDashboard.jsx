import { useEffect, useState } from 'react';
import { CalendarDays, Truck, CheckCircle2, Gauge, Wrench, Search, Pencil, Trash2, X } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import api, { messageOf } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function DriverDashboard() {
  const { user, setUser } = useAuth();
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState({});
  const [maintenanceVehicle, setMaintenanceVehicle] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ serviceDate: '', description: '' });
  const [maintenanceEditId,setMaintenanceEditId]=useState(null);
  const [err, setErr] = useState('');
  const [q,setQ]=useState('');

  const loadMaintenance = async (vehicleList) => {
    const entries = await Promise.all(vehicleList.map(async (v) => {
      const r = await api.get(`/vehicles/${v.id}/maintenance`);
      return [v.id, r.data];
    }));
    setMaintenance(Object.fromEntries(entries));
  };

  const load = async () => {
    try {
      const [a, v] = await Promise.all([api.get('/assignments/mine'), api.get('/vehicles/mine')]);
      setItems(a.data);
      setVehicles(v.data);
      await loadMaintenance(v.data);
    } catch (e) {
      setErr(messageOf(e));
    }
  };

  useEffect(() => { load(); const timer=setInterval(load,5000); return()=>clearInterval(timer); }, []);

  const query=q.trim().toLowerCase();
  const filteredItems=items.filter(a=>!query||[a.booking.bookingCode,a.booking.safariPackage?.name,a.booking.visitDate,a.booking.specialRequirements,a.guide?.fullName,a.vehicle?.registrationNo].filter(Boolean).join(' ').toLowerCase().includes(query));

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/assignments/${id}/status`, { status });
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const availability = async () => {
    try {
      const r = await api.patch('/staff/me', { available: !user.available, licenseNumber: user.licenseNumber });
      const nu = { ...user, ...r.data };
      setUser(nu);
      localStorage.setItem('safari_user', JSON.stringify(nu));
    } catch (e) { setErr(messageOf(e)); }
  };

  const openMaintenance = (v) => {
    setMaintenanceVehicle(v);
    setMaintenanceForm({ serviceDate: new Date().toISOString().slice(0, 10), description: '' });
    setMaintenanceEditId(null);
  };

  const refreshMaintenance=async()=>{
    const r=await api.get(`/vehicles/${maintenanceVehicle.id}/maintenance`);
    setMaintenance(x=>({...x,[maintenanceVehicle.id]:r.data}));
    const v=await api.get('/vehicles/mine');setVehicles(v.data);
    const refreshed=v.data.find(x=>x.id===maintenanceVehicle.id);if(refreshed)setMaintenanceVehicle(refreshed);
  };

  const reportMaintenance = async () => {
    try {
      const payload={serviceDate:maintenanceForm.serviceDate,description:maintenanceForm.description,status:'SCHEDULED'};
      if(maintenanceEditId) await api.put(`/vehicles/maintenance/${maintenanceEditId}`,payload);
      else await api.post(`/vehicles/${maintenanceVehicle.id}/maintenance`,payload);
      await refreshMaintenance();
      setMaintenanceEditId(null);setMaintenanceForm({ serviceDate: new Date().toISOString().slice(0, 10), description: '' });
    } catch (e) { setErr(messageOf(e)); }
  };

  const editMaintenance=(m)=>{setMaintenanceEditId(m.id);setMaintenanceForm({serviceDate:m.serviceDate,description:m.description||''});};
  const cancelMaintenanceEdit=()=>{setMaintenanceEditId(null);setMaintenanceForm({serviceDate:new Date().toISOString().slice(0,10),description:''});};
  const deleteMaintenance=async(m)=>{
    if(!window.confirm('Delete this scheduled maintenance request?'))return;
    try{await api.delete(`/vehicles/maintenance/${m.id}`);await refreshMaintenance();if(maintenanceEditId===m.id)cancelMaintenanceEdit();}catch(e){setErr(messageOf(e));}
  };

  return <DashboardShell title="Jeep Driver Workspace" subtitle="View assigned tours, vehicle details, maintenance and update trip status.">
    {err && <div className="alert error">{err}</div>}

    <div className="stats-grid">
      <StatCard icon={CalendarDays} label="Assigned trips" value={items.length} />
      <StatCard icon={Truck} label="Linked vehicles" value={vehicles.length} />
      <StatCard icon={CheckCircle2} label="Completed" value={items.filter(x => x.status === 'COMPLETED').length} />
      <StatCard icon={Gauge} label="Availability" value={user.available ? 'Available' : 'Unavailable'} />
    </div>

    <section className="two-panels">
      <div className="panel">
        <div className="panel-head"><h2>Driver profile</h2></div>
        <div className="profile-data"><span>Driving licence <b>{user.licenseNumber || 'Not recorded'}</b></span><span>Current availability <StatusBadge value={user.available ? 'AVAILABLE' : 'UNAVAILABLE'} /></span></div>
        <button className="btn btn-outline-dark" onClick={availability}>Toggle availability</button>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>My safari jeep</h2></div>
        {vehicles.map(v => <div className="vehicle-card vehicle-card-actions" key={v.id}>
          <Truck />
          <div><b>{v.registrationNo}</b><span>{v.model}</span><small>{v.capacity} passenger capacity • documents to {v.documentValidUntil}</small></div>
          <div className="vehicle-side-actions"><StatusBadge value={v.status} /><button className="mini-action" onClick={() => openMaintenance(v)}><Wrench size={14} />Maintenance</button></div>
        </div>)}
        {!vehicles.length && <div className="empty compact">No vehicle linked to your profile.</div>}
      </div>
    </section>

    <section className="panel" id="driver-trips">
      <div className="panel-head search-panel-head"><h2>Assigned trips</h2><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking ID, package, guide, date..."/></div></div>
      <div className="assignment-grid">{filteredItems.map(a => <div className="trip-card" key={a.id}>
        <div className="trip-card-top"><div><small>{a.booking.visitDate}</small><h3>{a.booking.safariPackage.name}</h3></div><StatusBadge value={a.status} /></div>
        <div className="trip-details"><span>Booking <b>{a.booking.bookingCode}</b></span><span>Group <b>{a.booking.visitorCount} visitors</b></span><span>Guide <b>{a.guide.fullName}</b></span><span>Jeep <b>{a.vehicle.registrationNo}</b></span><span>Visitor group <b>{a.booking.adultCount||a.booking.visitorCount} adults • {a.booking.childFiveToElevenCount||0} child 5–11 • {a.booking.childBelowFiveCount||0} below 5</b></span><span>Gate status <b>{a.permit?.status||'PENDING'}{a.permit?.checkedOutAt?' • checked out':''}</b></span><span>Special requirements <b>{a.booking.specialRequirements||'None recorded'}</b></span></div>
        <div className="trip-actions">{a.status === 'ASSIGNED' && <button onClick={() => setStatus(a.id, 'ACCEPTED')}>Accept trip</button>}{a.status === 'ACCEPTED' && <button onClick={() => setStatus(a.id, 'IN_PROGRESS')}>Start trip</button>}{a.status === 'IN_PROGRESS' && <>{a.permit?.status==='COMPLETED'&&a.permit?.checkedOutAt?<button className="complete-trip-ready" onClick={() => setStatus(a.id, 'COMPLETED')}>Complete Trip</button>:<><button disabled title="Waiting for Park Officer checkout.">Complete Trip</button><span className="trip-checkout-wait">Waiting for Park Officer checkout.</span></>}</>}</div>
      </div>)}</div>
    </section>

    <Modal open={!!maintenanceVehicle} title={`Vehicle maintenance • ${maintenanceVehicle?.registrationNo || ''}`} onClose={() => setMaintenanceVehicle(null)} wide>
      {maintenanceVehicle && <div className="modal-body">
        <div className="maintenance-summary"><Truck /><div><b>{maintenanceVehicle.model}</b><small>Current vehicle status</small></div><StatusBadge value={maintenanceVehicle.status} /></div>
        <div className="maintenance-form-grid">
          <label>Issue / service date<input type="date" value={maintenanceForm.serviceDate} onChange={e => setMaintenanceForm({ ...maintenanceForm, serviceDate: e.target.value })} /></label>
          <label className="span2">Maintenance details<textarea rows="4" value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} placeholder="Describe the fault, repair or maintenance required" /></label>
          <button className="btn btn-dark span2" disabled={!maintenanceForm.serviceDate || !maintenanceForm.description.trim()} onClick={reportMaintenance}><Wrench size={16} />{maintenanceEditId?'Save maintenance changes':'Report vehicle maintenance'}</button>
          {maintenanceEditId&&<button className="mini-action span2" onClick={cancelMaintenanceEdit}><X size={14}/>Cancel edit</button>}
          <p className="form-note span2">Reporting maintenance marks the linked vehicle as MAINTENANCE so Safari Operations will not assign it to a new trip until the maintenance is completed.</p>
        </div>
        <div className="detail-section"><h3>Maintenance history</h3>{(maintenance[maintenanceVehicle.id] || []).map(m => <div className="maintenance-row" key={m.id}><div><b>{m.serviceDate}</b><small>{m.description}</small></div><div className="actions"><StatusBadge value={m.status} />{m.status==='SCHEDULED'&&<><button className="mini-action" onClick={()=>editMaintenance(m)}><Pencil size={13}/>Edit</button><button className="mini-action danger" onClick={()=>deleteMaintenance(m)}><Trash2 size={13}/>Delete</button></>}</div></div>)}{!(maintenance[maintenanceVehicle.id] || []).length && <div className="empty compact">No maintenance records for this vehicle.</div>}</div>
      </div>}
    </Modal>
  </DashboardShell>;
}
