import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Binoculars,Camera,Feather,Map,ShieldCheck,Star,Sunset,Users} from 'lucide-react';
import PublicNav from '../components/PublicNav';
import ReviewCard from '../components/ReviewCard';
import api from '../utils/api';
import {defaultReviews} from '../data/defaultReviews';

const moments=[
 {image:'/images/experience/leopard-portrait.jpeg',icon:Binoculars,title:'Leopard encounters',tag:'Predator tracking',text:'Early-morning drives through scrub forest and rocky habitat offer memorable opportunities to observe Yala’s iconic leopards responsibly.'},
 {image:'/images/experience/elephant-wetland.jpeg',icon:Users,title:'Elephants & wetlands',tag:'Family favourite',text:'Watch elephant families move between grassland and water while wetland birds fill the edges of lagoons and tanks.'},
 {image:'/images/experience/eagle.jpeg',icon:Feather,title:'Birdlife discovery',tag:'More than mammals',text:'Raptors, waterbirds and forest species make every route rewarding for birdwatchers and first-time visitors alike.'},
 {image:'/images/experience/crocodile.jpeg',icon:Camera,title:'Wildlife photography',tag:'Slow-paced observation',text:'Photography-focused safaris allow time for composition, behaviour and patient observation while respecting park rules.'},
 {image:'/images/experience/owl-night.jpeg',icon:Sunset,title:'Golden-hour atmosphere',tag:'Light & landscape',text:'Warm evening light transforms Yala’s dry-zone landscapes and creates dramatic scenes around waterholes and open plains.'},
 {image:'/images/experience/golden-jackal.jpeg',icon:Map,title:'Unexpected sightings',tag:'Every drive is different',text:'Jackals, deer, reptiles and smaller wildlife turn every safari into a different story beyond the headline species.'}
];

export default function ExperiencePage(){
 const [reviews,setReviews]=useState([]);
 useEffect(()=>{api.get('/reviews/public').then(r=>setReviews([...(r.data||[]),...defaultReviews])).catch(()=>setReviews(defaultReviews));},[]);
 return <div className="public-page experience-page">
  <PublicNav/>
  <section className="experience-hero">
   <div className="experience-hero-copy"><span className="eyebrow">YALA • REAL SAFARI MOMENTS</span><h1>Experience Yala beyond the booking.</h1><p>Wildlife encounters, landscapes, guides, local knowledge and guest stories — all brought together in one premium safari experience.</p><div className="hero-actions"><Link className="btn btn-gold" to="/packages">Choose a safari <ArrowRight size={17}/></Link><Link className="btn btn-outline-light" to="/reviews">Read guest reviews</Link></div></div>
  </section>

  <section className="section light experience-intro"><div className="section-heading"><span className="eyebrow dark">WHAT YOUR SAFARI CAN FEEL LIKE</span><h2>Every route has its own character.</h2><p>These experience highlights use local wildlife imagery and explain the kinds of moments visitors may encounter across Yala’s habitats.</p></div><div className="experience-card-grid">{moments.map(({image,icon:Icon,title,tag,text})=><article className="experience-card" key={title}><img src={image} alt={title}/><div className="experience-card-body"><span className="experience-icon"><Icon size={20}/></span><small>{tag}</small><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

  <section className="experience-story"><div className="experience-story-image"><img src="/images/experience/leopard-waterhole.jpeg" alt="Leopard near water in Yala"/></div><div className="experience-story-copy"><span className="eyebrow dark">RESPONSIBLE WILDLIFE VIEWING</span><h2>Great sightings begin with patience.</h2><p>Safari Lanka’s workflow is designed around scheduled trips, assigned guides and drivers, permit checks and clear visitor information. The best experience comes from giving animals space and allowing guides to manage each encounter responsibly.</p><div className="experience-points"><span><ShieldCheck/>Respect wildlife distance</span><span><Camera/>Photograph without disturbance</span><span><Map/>Follow approved routes</span><span><Users/>Listen to guide instructions</span></div><Link className="btn btn-dark" to="/about-yala">Explore Yala blocks <ArrowRight size={17}/></Link></div></section>

  <section className="section reviews-preview"><div className="section-heading review-section-heading"><div><span className="eyebrow dark">VERIFIED COMPLETED SAFARIS</span><h2>Stories from Safari Lanka guests.</h2><p>Reviews can be submitted only after a booking is marked completed. Guests may rate their overall safari, driver and guide, and optionally share photos or videos.</p></div><Link className="btn btn-outline-dark" to="/reviews">View all reviews <ArrowRight size={16}/></Link></div>{reviews.length?<div className="reviews-grid">{reviews.slice(0,6).map(r=><ReviewCard key={r.id} review={r}/>)}</div>:<div className="review-empty"><Star/><h3>Guest stories will appear here</h3><p>After a completed safari, tourists can publish a verified review from their dashboard.</p></div>}</section>
  <footer className="footer"><div><b>Safari Lanka</b><p>Experience Yala responsibly.</p></div><p>SE2030 academic prototype.</p></footer>
 </div>;
}
