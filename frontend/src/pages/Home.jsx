import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Binoculars,
  CalendarCheck,
  ShieldCheck,
  MapPin,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Compass,
  Camera,
  Star,
  Mail,
  Trees,
  CircleHelp
} from 'lucide-react';
import PublicNav from '../components/PublicNav';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const experienceCards = [
    {
      image: '/images/experience/leopard-portrait.jpeg',
      title: 'Golden wildlife moments',
      text: 'From dawn leopard sightings to twilight elephant crossings, every drive is shaped around Yala’s most unforgettable encounters.',
      icon: Camera
    },
    {
      image: '/images/experience/elephant-wetland.jpeg',
      title: 'Guided with local insight',
      text: 'Experienced guides and assigned safari teams help travellers understand habitats, routes, wildlife behaviour and visitor etiquette.',
      icon: Binoculars
    },
    {
      image: '/images/experience/eagle.jpeg',
      title: 'Verified guest stories',
      text: 'See published reviews, guest photos and real safari feedback shared after completed Safari Lanka trips.',
      icon: Star
    }
  ];

  return (
    <div className="public-page home-premium-page">
      <section className="hero">
        <div className="hero-video-container">
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=2200&q=90"
          >
            <source src="/assets/yala-safari.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay" />
        </div>

        <PublicNav />
        <div className="hero-glow" />

        <div className="hero-content">
          <div className="hero-pill-badge">
            <span className="live-dot" />
            <span className="eyebrow">SRI LANKA • YALA NATIONAL PARK</span>
          </div>
          <h1>
            Crafted Yala safaris.<br />
            <em>Premium from first click to final sighting.</em>
          </h1>
          <p>
            Book immersive Yala experiences, explore the park block by block, follow a refined safari workflow,
            and enjoy a premium digital journey designed for tourists, guides and operators alike.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" to="/packages">
              Explore safari packages <ArrowRight size={18} />
            </Link>
            <Link className="btn btn-outline-light" to="/experience">
              Discover the experience
            </Link>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} />Curated premium journeys</span>
            <span><CalendarCheck size={16} />Live booking workflow</span>
            <span><MapPin size={16} />Built around Yala’s real routes</span>
          </div>
        </div>

        <div className="video-controls-badge">
          <div className="video-badge-title">
            <Sparkles size={14} className="gold-icon" />
            <span>Live Safari Ambience</span>
          </div>
          <div className="video-badge-buttons">
            <button
              type="button"
              className="video-ctrl-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause Video' : 'Play Video'}
              aria-label="Toggle safari video playback"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              className="video-ctrl-btn"
              onClick={toggleSound}
              title={isMuted ? 'Unmute Ambience' : 'Mute Ambience'}
              aria-label="Toggle audio ambience"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span className="mini-label">YALA • BLOCK I</span>
            <span className="status-live-tag"><Compass size={12} /> Featured</span>
          </div>
          <h3>Next adventure starts here</h3>
          <div className="hero-card-row">
            <div>
              <small>Signature package</small>
              <b>Dawn Leopard Quest</b>
            </div>
            <div>
              <small>Time</small>
              <b>05:30</b>
            </div>
          </div>
          <Link to="/packages">
            View all experiences <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="section home-intro-premium" id="home-experience">
        <div className="section-heading narrow left">
          <span className="eyebrow dark">EXPERIENCE YALA IN A MORE PREMIUM WAY</span>
          <h2>More than a booking. It is a curated safari atmosphere.</h2>
          <p>
            Explore moments, wildlife highlights and verified guest stories through an elegant experience layer
            built to complement your Yala adventure.
          </p>
        </div>
        <div className="home-experience-grid">
          {experienceCards.map(({ image, title, text, icon: Icon }) => (
            <article className="home-experience-card" key={title}>
              <img src={image} alt={title} />
              <div className="home-experience-card-body">
                <span className="home-experience-icon"><Icon size={18} /></span>
                <small>PREMIUM HIGHLIGHT</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="home-section-actions">
          <Link className="btn btn-dark" to="/experience">Open experience page <ArrowRight size={17} /></Link>
          <Link className="btn btn-outline-dark" to="/reviews">See guest reviews</Link>
        </div>
      </section>

      <section className="home-yala-spotlight" id="home-about-yala">
        <div className="home-yala-visual">
          <img src="/images/yala-about/yala-overview-map.jpg" alt="Yala National Park overview map" />
          <div className="home-visual-chip"><Compass size={16} /> Interactive block explorer</div>
        </div>
        <div className="home-yala-copy">
          <span className="eyebrow dark">ABOUT YALA</span>
          <h2>See Yala block by block with maps, habitats and visitor context.</h2>
          <p>
            Learn the character of Blocks I to V, discover wildlife zones, view local maps and understand how
            different safari routes shape each guest experience.
          </p>
          <div className="home-mini-feature-list">
            <span><Trees size={15} /> Wildlife and habitat highlights</span>
            <span><MapPin size={15} /> Access notes and block-specific maps</span>
            <span><Binoculars size={15} /> Best-for recommendations by block</span>
          </div>
          <Link className="btn btn-gold" to="/about-yala">Explore About Yala <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="section home-contact-premium" id="home-contact-us">
        <div className="home-contact-card">
          <div>
            <span className="eyebrow dark">CONTACT US</span>
            <h2>Need help before booking, after payment, or before your safari day?</h2>
            <p>
              Reach Safari Lanka for package questions, special requirements, permit follow-up, support messages
              and general Yala safari assistance.
            </p>
          </div>
          <div className="home-contact-points">
            <span><Mail size={16} /> Booking support & enquiry handling</span>
            <span><CircleHelp size={16} /> Special requirement clarification</span>
            <span><ShieldCheck size={16} /> Payment, permit and trip assistance</span>
          </div>
          <div className="home-section-actions">
            <Link className="btn btn-dark" to="/contact">Open Contact Us <ArrowRight size={17} /></Link>
            <Link className="btn btn-home-light" to="/packages">Browse packages</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>
          <b>Safari Lanka</b>
          <p>SE2030 • Web Based Wildlife Safari Trip Management System</p>
        </div>
        <p>Academic prototype for Yala National Park, Sri Lanka.</p>
      </footer>
    </div>
  );
}
