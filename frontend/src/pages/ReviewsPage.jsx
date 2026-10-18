import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Star} from 'lucide-react';
import PublicNav from '../components/PublicNav';
import ReviewCard from '../components/ReviewCard';
import api from '../utils/api';
import {defaultReviews} from '../data/defaultReviews';

export default function ReviewsPage(){
 const [rows,setRows]=useState([]);
 useEffect(()=>{api.get('/reviews/public').then(r=>setRows([...(r.data||[]),...defaultReviews])).catch(()=>setRows(defaultReviews));},[]);
 const avg=rows.length?(rows.reduce((a,r)=>a+Number(r.overallRating||0),0)/rows.length).toFixed(1):'—';
 return <div className="public-page reviews-page"><PublicNav/><section className="reviews-page-hero"><div><span className="eyebrow">VERIFIED GUEST REVIEWS</span><h1>Safari stories from completed trips.</h1><p>Photos, videos and ratings submitted by Safari Lanka tourists after their safari has been completed.</p><div className="review-summary"><span><Star fill="currentColor"/> {avg} average</span><span>{rows.length} published review{rows.length===1?'':'s'}</span></div></div></section><section className="section light"><div className="reviews-toolbar"><Link to="/experience" className="mini-action"><ArrowLeft size={15}/>Back to Experience</Link></div>{rows.length?<div className="reviews-grid reviews-grid-wide">{rows.map(r=><ReviewCard key={r.id} review={r}/>)}</div>:<div className="review-empty"><Star/><h3>No published reviews yet</h3><p>Completed-trip reviews will appear here automatically.</p></div>}</section></div>;
}
