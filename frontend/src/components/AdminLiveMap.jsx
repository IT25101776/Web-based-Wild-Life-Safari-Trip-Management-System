import {useEffect,useMemo,useRef,useState} from 'react';
import {
  Binoculars,Clock3,Eye,Gauge,Landmark,Layers3,LocateFixed,MapPin,MapPinned,
  Minus,Mountain,Move,Navigation,Plus,Radio,Route,ShieldCheck,Umbrella,UserRound,Waves
} from 'lucide-react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import api from '../utils/api';

// Admin-only Yala live operations map.
// Real booking/trip data refreshes every second.
const LIVE_DATA_REFRESH_MS=1000;
const MIN_ZOOM=1;
const MAX_ZOOM=3.8;
const DEFAULT_ZOOM=1.12;
const SLOWEST_MOVE_MS=90000; // zoomed out = ultra slow
const FASTEST_MOVE_MS=12000;  // zoomed in = faster, but still smooth

// Waypoints are aligned to the supplied Yala map image and follow visible safari roads/trails.
const ROUTES=[
  [[37.3,83.1],[34.8,80.5],[32.3,77.5],[29.9,73.8],[27.5,69.5],[25.0,65.8],[23.0,61.7],[22.4,57.6],[24.2,53.7],[27.1,50.7],[30.5,47.8],[34.1,44.9],[38.0,42.0],[42.0,39.8],[46.2,38.7],[50.7,39.8],[54.8,43.0],[58.0,47.1],[59.8,53.3]],
  [[14.2,39.0],[17.7,40.7],[21.6,42.6],[25.6,44.3],[29.5,44.8],[33.3,43.5],[37.0,40.9],[40.3,37.3],[43.4,33.8],[46.7,30.9],[50.0,28.5],[53.8,27.2],[57.4,28.4],[60.3,31.0],[62.6,34.7],[64.5,38.5],[63.1,43.1],[60.4,48.0],[59.8,53.3]],
  [[63.7,9.0],[61.8,11.8],[59.4,14.2],[56.8,16.7],[54.0,19.0],[51.3,21.5],[48.8,24.3],[47.3,27.3],[48.8,30.4],[51.0,33.4],[53.2,36.6],[55.7,40.0],[57.7,44.2],[59.1,48.6],[59.8,53.3]],
  [[59.8,53.3],[63.0,51.0],[66.0,48.0],[69.2,44.8],[72.2,41.0],[75.0,37.1],[77.7,33.8],[80.1,30.6],[82.0,27.9],[80.4,25.7],[77.4,24.6],[74.1,25.4],[71.0,27.8],[68.1,31.3],[65.6,35.4],[63.5,40.1],[61.8,45.7]]
];

const GATES=[
  {id:'gate-pal',name:'Palatupana Gate',x:37.3,y:83.1,side:'Main Entrance',block:'Block I (South)',detail:'The principal visitor entrance for the classic Yala safari circuit. Admin can use this point to review permits, safari check-ins and active vehicle movements.'},
  {id:'gate-kat',name:'Katagamuwa Gate',x:14.2,y:39.0,side:'Secondary Entrance',block:'Western approach / Block II side',detail:'Secondary western access to the Yala complex. The live operations layer can show vehicles associated with this gate and their active safari details.'},
  {id:'gate-gal',name:'Galge Gate',x:63.7,y:9.0,side:'North Entrance',block:'Block V / northern approach',detail:'Northern entrance near the Galge approach. This marker provides an operations reference for northern arrivals, permits and safari vehicle tracking.'}
];

const BLOCKS=[
  {id:'block1',short:'Block I',name:'Block I · South',x:52.4,y:68.5,accent:'b1',access:'Main visitor safari area',bestFor:'Leopard-focused drives, elephants, waterholes, coastal habitat and the largest routine safari road choice.',detail:'The best-known visitor area of Yala. It combines scrub, rocky outcrops, water bodies, grassland and coastal habitat with the park’s most familiar safari road network.',highlights:['Leopard habitat','Waterholes & lagoons','Dense safari road network','Main visitor operations']},
  {id:'block2',short:'Block II',name:'Block II · West',x:28.6,y:55.7,accent:'b2',access:'More controlled visitor access',bestFor:'Remote wilderness context, western landscapes and quieter safari terrain when access is available.',detail:'A more remote western management block with fewer routine visitor movements than Block I and strong wilderness character.',highlights:['Remote landscape','Lower routine traffic','Western habitat','Controlled access']},
  {id:'block3',short:'Block III',name:'Block III · Central',x:51.1,y:43.3,accent:'b3',access:'Restricted / variable visitor access',bestFor:'Understanding wildlife movement through Yala’s central interior ecosystem.',detail:'Central forest, seasonal water, scrub and open country create an important habitat connection between the southern and northern Yala landscape.',highlights:['Interior forest','Seasonal water','Elephant movement','Ecosystem connectivity']},
  {id:'block4',short:'Block IV',name:'Block IV · East',x:72.9,y:32.4,accent:'b4',access:'Not a routine main safari circuit',bestFor:'Understanding the larger eastern protected landscape and low-traffic wildlife habitat.',detail:'An expansive eastern section of Yala that contributes to continuous protected dry-zone habitat and movement corridors.',highlights:['Large protected landscape','Dry-zone woodland','Wildlife connectivity','Low visitor emphasis']},
  {id:'block5',short:'Block V',name:'Block V · North',x:58.2,y:20.3,accent:'b5',access:'Variable northern operations',bestFor:'Northern conservation linkages, inland habitat and the wider protected-area context.',detail:'The northern part of the Yala complex, forming a transition toward the broader conservation landscape around the park.',highlights:['Northern landscape','Habitat transition','Conservation linkage','Variable access']}
];

const POIS=[
  {id:'poi-yoda',name:'Yoda Wewa',type:'lake',x:36.0,y:24.2,block:'Block V / western edge',detail:'Large water body shown on the Yala operations map. Water sources are useful orientation points for habitat and wildlife movement.'},
  {id:'poi-kumbukkana',name:'Kumbukkana Wewa',type:'lake',x:28.5,y:33.2,block:'Western Yala',detail:'Prominent western water body used as a visual map reference for nearby roads and wildlife habitat.'},
  {id:'poi-manik',name:'Manik Wewa',type:'lake',x:39.1,y:48.1,block:'Block II / III area',detail:'Central-west water body that helps orient safari movement through the interior road network.'},
  {id:'poi-kirinda',name:'Kirinda Wewa',type:'lake',x:68.8,y:68.0,block:'Block I',detail:'Water body close to the south-eastern visitor landscape and Block I safari routes.'},
  {id:'poi-butawa',name:'Butawa View Point',type:'viewpoint',x:31.4,y:63.8,block:'Block II',detail:'Mapped viewpoint in the western safari landscape. Useful as an orientation landmark on the operations map.'},
  {id:'poi-sithul',name:'Sithulpawwa View Point',type:'viewpoint',x:59.8,y:53.3,block:'Block III / Block I approach',detail:'Important interior reference point near the central road network and the Sithulpawwa area.'},
  {id:'poi-kottowa',name:'Kottowa Peak',type:'peak',x:75.0,y:21.5,block:'Block IV',detail:'Elevated landmark in the eastern/northern landscape, shown as a geographic reference on the map.'},
  {id:'poi-magula',name:'Magul Maha Vihara',type:'landmark',x:48.3,y:75.4,block:'Block I',detail:'Historic landmark shown within the southern Yala landscape. This is an orientation point, not a live GPS source.'},
  {id:'poi-beach',name:'Yala Beach',type:'beach',x:73.7,y:70.1,block:'Block I coast',detail:'Coastal reference point on the Indian Ocean side of Yala, useful for understanding the southern/eastern edge of the park.'}
];

const DEMO_TRACKERS=[
  {id:'demo-1',vehicleNo:'WP-SF-1001',vehicleModel:'Toyota Hilux Safari Jeep',driver:'Yala Jeep Driver',driverPhone:'0771000004',guide:'Senior Safari Guide',guideLanguages:'English, Sinhala',packageName:'Yala Dawn Leopard Quest',bookingCode:'SL-LIVE01',tourist:'Demo Tourist',visitors:4,permit:'YALA-LIVE01',status:'ONGOING',routeIndex:0,routeOffset:0,gate:'Palatupana Gate',started:'07:05'},
  {id:'demo-2',vehicleNo:'WP-SF-1002',vehicleModel:'Mahindra Double Cab Safari',driver:'Nuwan Perera',driverPhone:'0772456123',guide:'Dinithi Silva',guideLanguages:'English, Sinhala',packageName:'Elephant & Birdlife Explorer',bookingCode:'SL-LIVE02',tourist:'Sofia Martin',visitors:3,permit:'YALA-LIVE02',status:'ONGOING',routeIndex:1,routeOffset:6,gate:'Katagamuwa Gate',started:'06:38'},
  {id:'demo-3',vehicleNo:'WP-SF-1003',vehicleModel:'Toyota Land Cruiser Safari',driver:'Kasun Jayasekara',driverPhone:'0713389120',guide:'Ayesha Fernando',guideLanguages:'English, Sinhala, Tamil',packageName:'Golden Hour Sunset Safari',bookingCode:'SL-LIVE03',tourist:'Daniel Wong',visitors:5,permit:'YALA-LIVE03',status:'ONGOING',routeIndex:2,routeOffset:11,gate:'Galge Gate',started:'14:12'}
];

function JeepIcon({size=24}){
  return <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" fill="none">
    <path d="M7.3 13.5 9.7 8.8h16.6l2.5 4.7 3.1 2.1v9h-2.5v2.8h-4.7v-2.8H11.3v2.8H6.6v-2.8H4.1v-9l3.2-2.1Z" fill="currentColor"/>
    <path d="M11.1 10.6h13.8l1.4 2.8H9.7l1.4-2.8Z" fill="rgba(255,255,255,.94)"/>
    <path d="M9.1 17.6a2.05 2.05 0 1 0 0 4.1 2.05 2.05 0 0 0 0-4.1Zm17.8 0a2.05 2.05 0 1 0 0 4.1 2.05 2.05 0 0 0 0-4.1Z" fill="rgba(255,255,255,.94)"/>
    <path d="M13.3 18.1h9.4v2.7h-9.4z" fill="rgba(255,255,255,.92)"/>
    <path d="M11.2 13.4V9.9M24.8 13.4V9.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}

function PoiIcon({type,size=14}){
  if(type==='lake')return <Waves size={size}/>;
  if(type==='peak')return <Mountain size={size}/>;
  if(type==='landmark')return <Landmark size={size}/>;
  if(type==='beach')return <Umbrella size={size}/>;
  return <Binoculars size={size}/>;
}

function activeTripRows(rows=[]){
  return rows.flatMap((detail,rowIndex)=>{
    const b=detail.booking||{};
    const p=detail.permit||{};
    const assignments=detail.assignments||[];
    const started=(p.checkedInAt&&!p.checkedOutAt)||assignments.some(a=>a.status==='IN_PROGRESS');
    if(!started)return[];
    return assignments.filter(a=>!['CANCELLED','COMPLETED','DECLINED'].includes(a.status)).map((a,i)=>({
      id:`live-${a.id}`,real:true,detail,
      vehicleNo:a.vehicle?.registrationNo||`Vehicle ${i+1}`,
      vehicleModel:a.vehicle?.model||'Safari vehicle',
      driver:a.driver?.fullName||'Assigned driver',driverPhone:a.driver?.phone||'—',
      guide:a.guide?.fullName||'Assigned guide',guideLanguages:a.guide?.languages||'—',
      packageName:b.safariPackage?.name||'Safari package',bookingCode:b.bookingCode||'—',
      tourist:b.tourist?.fullName||'Tourist',visitors:b.visitorCount||0,permit:p.permitCode||'—',
      status:p.checkedInAt&&!p.checkedOutAt?'ONGOING':(a.status==='IN_PROGRESS'?'ONGOING':a.status),
      routeIndex:(rowIndex+i)%ROUTES.length,
      routeOffset:(rowIndex*5+i*7)%ROUTES[(rowIndex+i)%ROUTES.length].length,
      gate:p.gateName||'Yala safari gate',
      started:p.checkedInAt?String(p.checkedInAt).replace('T',' ').slice(11,16):'In progress',
      visitDate:b.visitDate,payment:b.paymentStatus,permitStatus:p.status,
      specialRequirements:b.specialRequirements||'None recorded'
    }));
  });
}

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export default function AdminLiveMap({compact=false,onOpenBooking}){
  const viewportRef=useRef(null);
  const dragRef=useRef(null);
  const [remote,setRemote]=useState([]);
  const [tick,setTick]=useState(0);
  const [selected,setSelected]=useState(null);
  const [hovered,setHovered]=useState(null);
  const [selectedGate,setSelectedGate]=useState(null);
  const [selectedBlock,setSelectedBlock]=useState(null);
  const [selectedPoi,setSelectedPoi]=useState(null);
  const [demoDetail,setDemoDetail]=useState(null);
  const [lastSync,setLastSync]=useState(new Date());
  const [zoom,setZoom]=useState(DEFAULT_ZOOM);
  const [pan,setPan]=useState({x:0,y:0});
  const [dragging,setDragging]=useState(false);
  const [layers,setLayers]=useState({vehicles:true,gates:true,blocks:true,pois:true,trails:true});

  const movementMs=useMemo(()=>{
    const ratio=(zoom-MIN_ZOOM)/(MAX_ZOOM-MIN_ZOOM);
    return Math.round(SLOWEST_MOVE_MS-(ratio*(SLOWEST_MOVE_MS-FASTEST_MOVE_MS)));
  },[zoom]);
  const paceLabel=zoom<1.35?'Ultra slow':zoom<1.95?'Very slow':zoom<2.7?'Slow':'Faster';

  useEffect(()=>{
    let mounted=true;
    const sync=()=>api.get('/bookings/all').then(r=>{
      if(mounted){setRemote(activeTripRows(r.data));setLastSync(new Date())}
    }).catch(()=>{});
    sync();
    const id=setInterval(sync,LIVE_DATA_REFRESH_MS);
    return()=>{mounted=false;clearInterval(id)};
  },[]);

  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),movementMs);
    return()=>clearInterval(id);
  },[movementMs]);

  const vehicles=useMemo(()=>{
    const occupied=new Set(remote.map(v=>v.vehicleNo));
    const defaults=DEMO_TRACKERS.filter(v=>!occupied.has(v.vehicleNo));
    return[...remote,...defaults].slice(0,Math.max(3,remote.length+defaults.length));
  },[remote]);

  useEffect(()=>{
    if(!selected&&!selectedGate&&!selectedBlock&&!selectedPoi&&vehicles.length)setSelected(vehicles[0]);
    if(selected&&!vehicles.some(v=>v.id===selected.id))setSelected(vehicles[0]||null);
  },[vehicles,selected,selectedGate,selectedBlock,selectedPoi]);

  const position=v=>{
    const route=ROUTES[v.routeIndex%ROUTES.length];
    const idx=(tick+(v.routeOffset||0))%route.length;
    return{x:route[idx][0],y:route[idx][1]};
  };

  const clampPan=(next,nextZoom=zoom)=>{
    const node=viewportRef.current;
    if(!node)return next;
    const maxX=Math.max(0,(node.clientWidth*(nextZoom-1))/2);
    const maxY=Math.max(0,(node.clientHeight*(nextZoom-1))/2);
    return{x:clamp(next.x,-maxX,maxX),y:clamp(next.y,-maxY,maxY)};
  };

  const applyZoom=next=>{
    const value=clamp(Number(next.toFixed(2)),MIN_ZOOM,MAX_ZOOM);
    setZoom(value);
    setPan(p=>clampPan(p,value));
  };
  const resetView=()=>{setZoom(DEFAULT_ZOOM);setPan({x:0,y:0})};
  const onWheel=e=>{e.preventDefault();applyZoom(zoom+(e.deltaY<0 ? .18 : -.18))};
  const onPointerDown=e=>{
    if(e.target.closest('button'))return;
    dragRef.current={x:e.clientX,y:e.clientY,panX:pan.x,panY:pan.y};
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove=e=>{
    if(!dragRef.current)return;
    const dx=e.clientX-dragRef.current.x,dy=e.clientY-dragRef.current.y;
    setPan(clampPan({x:dragRef.current.panX+dx,y:dragRef.current.panY+dy}));
  };
  const stopDrag=()=>{dragRef.current=null;setDragging(false)};

  const clearSelection=()=>{setSelected(null);setSelectedGate(null);setSelectedBlock(null);setSelectedPoi(null)};
  const selectVehicle=v=>{clearSelection();setSelected(v)};
  const selectGate=g=>{clearSelection();setSelectedGate(g)};
  const selectBlock=b=>{clearSelection();setSelectedBlock(b)};
  const selectPoi=p=>{clearSelection();setSelectedPoi(p)};
  const toggleLayer=key=>setLayers(s=>({...s,[key]:!s[key]}));
  const showMore=()=>{
    if(!selected)return;
    if(selected.real&&selected.detail&&onOpenBooking)onOpenBooking(selected.detail);
    else setDemoDetail(selected);
  };

  const gateVehicleCount=g=>vehicles.filter(v=>String(v.gate||'').toLowerCase().includes(g.name.split(' ')[0].toLowerCase())).length;
  const selectedPos=selected?position(selected):null;

  const stageStyle={
    transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
    '--gps-inverse-zoom':1/zoom,
    '--gps-inverse-hover':1.08/zoom,
    '--gps-vehicle-transition':`${Math.max(2500,movementMs-1200)}ms`
  };

  return <div className={`admin-gps-widget gps-v3 ${compact?'compact':''}`}>
    <div className="gps-widget-head">
      <div><span className="eyebrow dark">ADMIN • YALA LIVE OPERATIONS</span><h3>Yala satellite-style safari control map</h3><p>Enhanced Yala-only admin tracker using the supplied park map. Pan, zoom, inspect blocks, gates and landmarks, and follow live safari jeeps. Real booking data refreshes every second.</p></div>
      <div className="gps-head-badges">
        <div className="gps-live-badge"><span/><Radio size={14}/>LIVE • {vehicles.length} vehicle{vehicles.length===1?'':'s'}</div>
        <div className="gps-speed-badge"><Gauge size={14}/>{paceLabel} map pace</div>
      </div>
    </div>

    <div className="gps-layout">
      <div className="gps-map-shell gps-custom-map" ref={viewportRef} onWheel={onWheel}>
        <div className={`gps-map-stage ${dragging?'dragging':''}`} style={stageStyle} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} onDoubleClick={()=>applyZoom(zoom+.32)}>
          <img className="gps-map-image" src="/images/yala-about/yala-live-operations-map.png" alt="Yala National Park blocks, roads, gates and landmarks operations map" draggable="false"/>
          <div className="gps-map-vignette" aria-hidden="true"/>

          {layers.trails&&<svg className="gps-route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {ROUTES.map((route,i)=><polyline key={i} points={route.map(([x,y])=>`${x},${y}`).join(' ')} className={`gps-route-line route-${i}`}/>) }
          </svg>}

          {layers.blocks&&BLOCKS.map(b=><button key={b.id} type="button" className={`gps-block-marker ${b.accent}`} style={{left:`${b.x}%`,top:`${b.y}%`}} onClick={()=>selectBlock(b)} title={`${b.short} details`}><MapPinned size={13}/><span>{b.short}</span></button>)}

          {layers.gates&&GATES.map(g=><button key={g.id} type="button" className="gps-gate-marker" style={{left:`${g.x}%`,top:`${g.y}%`}} onClick={()=>selectGate(g)} title={`${g.name} • ${g.side}`}><ShieldCheck size={14}/><span>{g.name}</span>{gateVehicleCount(g)>0&&<b className="gps-marker-count">{gateVehicleCount(g)}</b>}</button>)}

          {layers.pois&&POIS.map(p=><button key={p.id} type="button" className={`gps-poi-marker ${p.type}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>selectPoi(p)} title={p.name}><PoiIcon type={p.type}/><span>{p.name}</span></button>)}

          {layers.vehicles&&vehicles.map(v=>{const pos=position(v);const isHover=hovered===v.id;const isSelected=selected?.id===v.id;return <div key={v.id} className={`gps-vehicle-wrap ${isSelected?'selected':''}`} style={{left:`${pos.x}%`,top:`${pos.y}%`}} onMouseEnter={()=>setHovered(v.id)} onMouseLeave={()=>setHovered(null)}>
            <button type="button" className="gps-vehicle-marker" onClick={()=>selectVehicle(v)} title={`${v.vehicleNo} • ${v.packageName}`}><JeepIcon size={25}/><span className="gps-heading-arrow"><Navigation size={10}/></span></button>
            {isHover&&<div className="gps-hover-card"><div className="gps-hover-title"><JeepIcon size={18}/><b>{v.vehicleNo}</b><StatusBadge value={v.status}/></div><span>{v.packageName}</span><small><b>Driver:</b> {v.driver}</small><small><b>Guide:</b> {v.guide}</small><small><b>Gate:</b> {v.gate}</small><small>{v.bookingCode} • {v.visitors} visitor{v.visitors===1?'':'s'}</small></div>}
          </div>})}
        </div>

        <div className="gps-map-controls" aria-label="Map zoom controls">
          <button type="button" onClick={()=>applyZoom(zoom+.2)} title="Zoom in"><Plus size={18}/></button>
          <button type="button" onClick={()=>applyZoom(zoom-.2)} title="Zoom out"><Minus size={18}/></button>
          <button type="button" onClick={resetView} title="Reset Yala map view"><LocateFixed size={18}/></button>
        </div>

        <div className="gps-layer-control">
          <div className="gps-layer-title"><Layers3 size={14}/><b>Map layers</b></div>
          {[
            ['vehicles','Jeeps'],['gates','Gates'],['blocks','Blocks'],['pois','Places'],['trails','GPS trails']
          ].map(([key,label])=><button key={key} type="button" className={layers[key]?'active':''} onClick={()=>toggleLayer(key)}><span className="gps-layer-check"/>{label}</button>)}
        </div>

        <div className="gps-zoom-readout"><Move size={13}/><span>{Math.round(zoom*100)}%</span><small>{paceLabel} vehicle pace • ~{Math.round(movementMs/1000)}s/step</small></div>
        <div className="gps-map-key"><span><i className="vehicle-dot"/>Live jeep</span><span><i className="gate-dot"/>Gate</span><span><i className="block-dot"/>Block</span><span><i className="poi-dot"/>Place</span><span><i className="route-dot"/>GPS trail</span></div>
        <div className="gps-map-hint">Wheel: zoom • drag: pan • double-click: zoom in</div>
      </div>

      <aside className="gps-detail-panel">
        {selectedGate? <>
          <div className="gps-detail-icon gate"><ShieldCheck/></div><span className="eyebrow dark">YALA SAFARI GATE</span><h4>{selectedGate.name}</h4><p>{selectedGate.detail}</p>
          <div className="gps-mini-grid"><span>Entrance type<b>{selectedGate.side}</b></span><span>Related zone<b>{selectedGate.block}</b></span><span>Tracked jeeps<b>{gateVehicleCount(selectedGate)}</b></span><span>Operations use<b>Permit, entry & vehicle movement</b></span></div>
        </>:selectedBlock? <>
          <div className="gps-detail-icon block"><MapPinned/></div><span className="eyebrow dark">YALA MANAGEMENT BLOCK</span><h4>{selectedBlock.name}</h4><p>{selectedBlock.detail}</p>
          <div className="gps-block-highlights">{selectedBlock.highlights.map(x=><span key={x}>{x}</span>)}</div>
          <div className="gps-mini-grid"><span>Visitor access<b>{selectedBlock.access}</b></span><span>Best for<b>{selectedBlock.bestFor}</b></span><span>Admin map use<b>Operational orientation</b></span></div>
          <div className="gps-map-disclaimer">The base map is used for the project’s operations visualization. Vehicle locations are simulated unless connected to real GPS hardware.</div>
        </>:selectedPoi? <>
          <div className="gps-detail-icon poi"><PoiIcon type={selectedPoi.type} size={27}/></div><span className="eyebrow dark">YALA MAP PLACE</span><h4>{selectedPoi.name}</h4><p>{selectedPoi.detail}</p>
          <div className="gps-mini-grid"><span>Type<b>{selectedPoi.type==='viewpoint'?'View point':selectedPoi.type.charAt(0).toUpperCase()+selectedPoi.type.slice(1)}</b></span><span>Related area<b>{selectedPoi.block}</b></span><span>Map use<b>Safari orientation landmark</b></span></div>
        </>:selected? <>
          <div className="gps-detail-top"><div className="gps-detail-icon jeep"><JeepIcon size={31}/></div><StatusBadge value={selected.status}/></div>
          <span className="eyebrow dark">LIVE TRACKED SAFARI</span><h4>{selected.vehicleNo}</h4><p>{selected.vehicleModel}</p>
          <div className="gps-mini-grid">
            <span><UserRound/>Driver<b>{selected.driver}</b></span><span><Binoculars/>Guide<b>{selected.guide}</b></span><span><Route/>Package<b>{selected.packageName}</b></span><span><MapPinned/>Booking<b>{selected.bookingCode}</b></span><span><ShieldCheck/>Gate<b>{selected.gate}</b></span><span><Clock3/>Started<b>{selected.started}</b></span><span><MapPin/>Map position<b>{selectedPos?`${selectedPos.x.toFixed(1)} / ${selectedPos.y.toFixed(1)}`:'—'}</b></span>
          </div>
          <button className="btn btn-dark full gps-more-btn" type="button" onClick={showMore}><Eye size={16}/>Show full safari details</button>
        </>:<div className="gps-empty"><MapPinned/><b>Select a jeep, gate, block or place</b><p>Click a marker to inspect the selected Yala operation or map location.</p></div>}
      </aside>
    </div>

    <div className="gps-widget-foot"><span>Last real-time sync: {lastSync.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span><span>Default view = very slow movement • zoom out = ultra slow • zoom in = faster</span></div>

    <Modal open={!!demoDetail} title={`Tracked safari • ${demoDetail?.vehicleNo||''}`} onClose={()=>setDemoDetail(null)} wide>{demoDetail&&<div className="modal-body booking-details-modal"><div className="detail-grid"><span>Booking <b>{demoDetail.bookingCode}</b></span><span>Trip status <StatusBadge value={demoDetail.status}/></span><span>Package <b>{demoDetail.packageName}</b></span><span>Visitors <b>{demoDetail.visitors}</b></span><span>Tourist / group <b>{demoDetail.tourist}</b></span><span>Permit <b>{demoDetail.permit}</b></span><span>Vehicle <b>{demoDetail.vehicleNo} • {demoDetail.vehicleModel}</b></span><span>Gate <b>{demoDetail.gate}</b></span><span>Driver <b>{demoDetail.driver}</b></span><span>Driver phone <b>{demoDetail.driverPhone}</b></span><span>Guide <b>{demoDetail.guide}</b></span><span>Guide languages <b>{demoDetail.guideLanguages}</b></span><span>Started <b>{demoDetail.started}</b></span><span>GPS source <b>Safari Lanka simulated live tracker</b></span></div><div className="requirement-callout"><b>Tracking note</b><p>This is one of the three default demonstration vehicles. Real checked-in trips are added automatically from live booking, assignment and permit data.</p></div></div>}</Modal>
  </div>;
}
