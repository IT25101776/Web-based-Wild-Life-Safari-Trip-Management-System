import { useRef } from 'react';
import { Clock, MapPin, Users, ArrowRight, Sparkles, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/currency';
import { publicAssetUrl } from '../utils/api';

// Realistic Yala National Park photography mappings for guaranteed premium imagery
const REALISTIC_YALA_IMAGES = {
  1: '/images/packages/yala-dawn-leopard-quest.png', // Sri Lankan Leopard in dawn sunlight
  2: '/images/packages/elephant-birdlife-explorer.png', // Wild Elephant herd in Yala wetlands
  3: '/images/packages/golden-hour-sunset-safari.png', // Safari jeep in golden hour sunset
  4: '/images/packages/wildlife-photography-drive.png', // Wildlife photography telephoto drive
  5: '/images/packages/family-discovery-safari.png', // Family safari tracking spotted deer & buffalo
  6: '/images/packages/full-day-yala-explorer.png'  // Full-day comprehensive Yala Block I explorer
};

const DEFAULT_PACKAGE_VIDEOS = {
  1: '/videos/packages/yala-dawn-leopard-quest.mp4',
  2: '/videos/packages/elephant-birdlife-explorer.mp4',
  3: '/videos/packages/golden-hour-sunset-safari.mp4',
  4: '/videos/packages/wildlife-photography-drive.mp4',
  5: '/videos/packages/family-discovery-safari.mp4',
  6: '/videos/packages/full-day-yala-explorer.mp4'
};

export default function PackageCard({ pkg }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const realisticImage = publicAssetUrl(pkg.imageUrl) || REALISTIC_YALA_IMAGES[pkg.id] || '/assets/yala-fallback.svg';
  const packageVideo = pkg.videoUrl || DEFAULT_PACKAGE_VIDEOS[pkg.id] || '';

  const playPreview = () => {
    if (!packageVideo || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  };
  const stopPreview = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <article className="package-card">
      <div
        className="package-img"
        onMouseEnter={playPreview}
        onMouseLeave={stopPreview}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(5,25,19,0.85) 100%), url(${realisticImage}), url('/assets/yala-fallback.svg')`
        }}
      >
        {packageVideo && <video ref={videoRef} className="package-hover-video" src={packageVideo} poster={realisticImage} muted loop playsInline preload="metadata" />}
        {packageVideo && <span className="hover-video-hint"><Play size={12} fill="currentColor" /> Hover to preview</span>}
        <div className="package-top-tags">
          <span className="package-chip">{pkg.timeSlot}</span>
          {pkg.id === 1 && (
            <span className="signature-tag">
              <Sparkles size={11} /> Top Rated
            </span>
          )}
        </div>
        <div>
          <h3>{pkg.name}</h3>
          <p>
            <MapPin size={15} /> {pkg.routeZone}
          </p>
        </div>
      </div>

      <div className="package-body">
        <p>{pkg.description}</p>
        <div className="package-meta">
          <span>
            <Clock size={16} /> {pkg.duration || 'Half day'}
          </span>
          <span>
            <Users size={16} /> Max {pkg.maxVisitors} visitors
          </span>
        </div>
        <div className="package-footer">
          <div>
            <small>From</small>
            <strong>{formatMoney(pkg.pricePerPerson,user?.preferredCurrency||'LKR')}</strong>
            <small>/ person</small>
          </div>
          {user?.role === 'TOURIST' ? (
            <Link className="btn btn-dark" to={`/book/${pkg.id}`}>
              Book now <ArrowRight size={17} />
            </Link>
          ) : (
            <Link className="text-link" to={user ? '/dashboard' : '/login'}>
              {user ? 'Open dashboard' : 'Sign in to book'} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
