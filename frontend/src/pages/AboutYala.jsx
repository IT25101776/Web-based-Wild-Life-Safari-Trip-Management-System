import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Binoculars,
  Bird,
  Camera,
  Compass,
  Footprints,
  Leaf,
  Map,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trees,
  Waves
} from 'lucide-react';
import PublicNav from '../components/PublicNav';

const sections = [
  {
    id: 'overview',
    short: 'Overview',
    title: 'Yala National Park',
    eyebrow: 'THE WILD SOUTH-EAST',
    intro:
      'A landscape of dry-zone forest, scrub, grassland, lagoons, rocky outcrops and coastal habitats. Yala is managed in multiple blocks, and each area has a different character, visitor pattern and access condition.',
    map: '/images/yala-about/yala-overview-map.jpg',
    image: '/images/yala-about/block-1-wildlife.png',
    mapLabel: 'Yala park overview and management blocks',
    access: 'Visitor access varies by block and by current park management conditions.',
    highlights: ['Five management blocks', 'Dry-zone forest & scrub', 'Wetlands, lagoons & coast', 'Leopard, elephant & rich birdlife'],
    bestFor: 'First-time visitors who want to understand how the different Yala areas fit together.',
    planning: 'Always confirm the currently permitted visitor routes and gate conditions before travel.'
  },
  {
    id: 'block1',
    short: 'Block I',
    title: 'Block I · The classic Yala safari',
    eyebrow: 'PALATUPANA & KATAGAMUWA AREA',
    intro:
      'Block I is the best-known visitor area of Yala. Its road network passes through scrub, open plains, rocky outcrops, waterholes and coastal habitat, creating a varied half-day or full-day safari experience.',
    map: '/images/yala-about/block-1-map.jpg',
    image: '/images/yala-about/block-1-wildlife.png',
    mapLabel: 'Detailed Block I road and habitat map',
    access: 'This is the most commonly used block for regular safari operations, subject to park opening rules and gate controls.',
    highlights: ['Leopard habitat', 'Elephant sightings', 'Waterholes & lagoons', 'Dense safari road network'],
    bestFor: 'Leopard-focused drives, first-time safaris, photography and visitors wanting the broadest route choice.',
    planning: 'Early morning and late afternoon are popular safari periods. Routes should remain flexible because wildlife movement changes daily.'
  },
  {
    id: 'block2',
    short: 'Block II',
    title: 'Block II · Remote wilderness character',
    eyebrow: 'QUIETER & MORE CONTROLLED',
    intro:
      'Block II has a more remote character than Block I. It is less associated with routine high-volume tourism and access can be more controlled, so visitors should not assume the same route availability as the main safari block.',
    map: '/images/yala-about/block-2-map.jpg',
    image: '/images/yala-about/block-2-wildlife.png',
    mapLabel: 'Block II location within the wider Yala landscape',
    access: 'Access is more limited than Block I and may depend on current Department of Wildlife Conservation permissions and conditions.',
    highlights: ['Remote landscape', 'Lower routine traffic', 'Coastal & inland habitats', 'Wilderness-focused experience'],
    bestFor: 'Visitors interested in a more remote Yala context when access is officially available.',
    planning: 'Check current official access arrangements in advance. Do not plan a Block II visit based only on general Yala opening information.'
  },
  {
    id: 'block3',
    short: 'Block III',
    title: 'Block III · Interior habitat mosaic',
    eyebrow: 'FOREST, WATER & OPEN COUNTRY',
    intro:
      'Block III forms part of Yala’s larger interior landscape. Forest, seasonal water, scrub and open areas support wide-ranging wildlife movement beyond the heavily visited parts of the park.',
    map: '/images/yala-about/block-3-map.jpg',
    image: '/images/yala-about/block-3-wildlife.png',
    mapLabel: 'Block III highlighted in the regional Yala map',
    access: 'Routine tourist access can be restricted or different from Block I. Current official guidance should be checked before planning.',
    highlights: ['Interior forest', 'Seasonal water systems', 'Elephant movement', 'Broader ecosystem connectivity'],
    bestFor: 'Understanding Yala beyond the main tourist circuit and the ecological connection between management blocks.',
    planning: 'Treat this page as an orientation guide rather than an access permit. Operational access can change.'
  },
  {
    id: 'block4',
    short: 'Block IV',
    title: 'Block IV · Northern wilderness',
    eyebrow: 'LARGE-SCALE NATURAL HABITAT',
    intro:
      'Block IV occupies a broad northern part of the Yala complex. It helps protect continuous dry-zone habitat and contributes to the wider landscape used by large mammals and other wildlife.',
    map: '/images/yala-about/block-4-map.jpg',
    image: '/images/yala-about/block-4-wildlife.png',
    mapLabel: 'Block IV position on the regional block map',
    access: 'It is not presented as a routine public safari circuit in the same way as Block I. Access rules should be confirmed with current authorities.',
    highlights: ['Large protected landscape', 'Dry-zone woodland', 'Wildlife connectivity', 'Lower visitor emphasis'],
    bestFor: 'Learning how the wider protected landscape supports wildlife beyond the main tourism zone.',
    planning: 'Avoid promising this block as a standard package route unless current official access has been verified.'
  },
  {
    id: 'block5',
    short: 'Block V',
    title: 'Block V · Western edge of the Yala complex',
    eyebrow: 'TRANSITION LANDSCAPE',
    intro:
      'Block V lies toward the western side of the wider Yala protected landscape and connects with surrounding dry-zone habitats and neighbouring conservation areas.',
    map: '/images/yala-about/block-5-map.jpg',
    image: '/images/yala-about/block-5-wildlife.png',
    mapLabel: 'Block V location on the regional Yala map',
    access: 'Visitor operations and permitted routes can differ from the main Block I experience and should be confirmed before use in a safari itinerary.',
    highlights: ['Western Yala landscape', 'Habitat transition', 'Conservation connectivity', 'Less routine tourism'],
    bestFor: 'Visitors and students exploring how Yala connects to the wider south-eastern protected-area network.',
    planning: 'Use current park notices and official guidance when deciding whether a visitor route is available.'
  }
];

const quickFacts = [
  [Footprints, 'Wildlife', 'Leopard, Asian elephant, deer, buffalo and many smaller species occur across the wider landscape.'],
  [Bird, 'Birdlife', 'Wetlands, forest, coast and open country support a rich mix of resident and migratory birds.'],
  [Trees, 'Habitats', 'Dry monsoon forest, thorn scrub, grassland, wetlands, rocky areas and coast create strong habitat variety.'],
  [Waves, 'Water', 'Natural and seasonal water bodies strongly influence wildlife distribution and safari routes.']
];

export default function AboutYala() {
  const [activeId, setActiveId] = useState('overview');
  const active = useMemo(() => sections.find(s => s.id === activeId) || sections[0], [activeId]);

  return (
    <div className="public-page yala-about-page">
      <PublicNav />

      <section className="yala-about-hero">
        <div className="yala-about-hero-bg" />
        <div className="yala-about-hero-shade" />
        <div className="yala-about-hero-content">
          <span className="yala-kicker"><Sparkles size={15} /> DISCOVER YALA BY BLOCK</span>
          <h1>One national park.<br /><em>Five different stories.</em></h1>
          <p>
            Explore Yala’s management blocks, landscape character, visitor context and wildlife habitats through an interactive visual guide.
          </p>
          <div className="yala-hero-actions">
            <button className="btn btn-gold" onClick={() => document.getElementById('block-explorer')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore blocks <Compass size={18} />
            </button>
            <Link className="btn btn-outline-light" to="/packages">View safari packages <ArrowRight size={18} /></Link>
          </div>
          <div className="yala-hero-chips">
            <span><Map size={16} /> Block maps</span>
            <span><Binoculars size={16} /> Wildlife highlights</span>
            <span><Camera size={16} /> Visitor planning</span>
          </div>
        </div>
      </section>

      <section className="yala-intro-strip">
        <div>
          <span className="eyebrow dark">YALA AT A GLANCE</span>
          <h2>A protected landscape shaped by water, rock, forest and coast.</h2>
        </div>
        <p>
          The block system is useful for understanding Yala, but it does not mean every block is always open for ordinary tourism. Access can vary with conservation management, weather, road conditions and official park decisions.
        </p>
      </section>

      <section className="yala-facts-grid">
        {quickFacts.map(([Icon, title, text]) => (
          <article className="yala-fact-card" key={title}>
            <span><Icon size={22} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="yala-block-explorer" id="block-explorer">
        <div className="yala-block-heading">
          <div>
            <span className="eyebrow dark">INTERACTIVE BLOCK EXPLORER</span>
            <h2>Select a block to view its details.</h2>
          </div>
          <p>Use the selector below to switch between the park overview and Blocks I–V.</p>
        </div>

        <div className="yala-block-tabs" role="tablist" aria-label="Yala blocks">
          {sections.map(section => (
            <button
              key={section.id}
              className={activeId === section.id ? 'active' : ''}
              onClick={() => setActiveId(section.id)}
              type="button"
              role="tab"
              aria-selected={activeId === section.id}
            >
              {section.short}
            </button>
          ))}
        </div>

        <div className="yala-block-panel" key={active.id}>
          <div className="yala-block-copy">
            <span className="yala-section-tag">{active.eyebrow}</span>
            <h3>{active.title}</h3>
            <p className="yala-lead">{active.intro}</p>

            <div className="yala-access-note">
              <ShieldCheck size={21} />
              <div><b>Visitor access</b><span>{active.access}</span></div>
            </div>

            <div className="yala-highlight-grid">
              {active.highlights.map(item => <span key={item}><Leaf size={15} /> {item}</span>)}
            </div>

            <div className="yala-detail-row">
              <div><small>BEST FOR</small><p>{active.bestFor}</p></div>
              <div><small>PLANNING NOTE</small><p>{active.planning}</p></div>
            </div>
          </div>

          <div className="yala-block-visuals">
            <figure className="yala-map-card">
              <img src={active.map} alt={active.mapLabel} />
              <figcaption><MapPin size={15} /> {active.mapLabel}</figcaption>
            </figure>
            <figure className="yala-wildlife-card">
              <img src={active.image} alt={`${active.short} wildlife landscape`} />
              <div className="yala-photo-overlay">
                <span>LANDSCAPE VIEW</span>
                <b>{active.short === 'Overview' ? 'Yala wildlife country' : `${active.short} experience`}</b>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section className="yala-map-gallery">
        <div className="yala-gallery-copy">
          <span className="eyebrow dark">MAP GALLERY</span>
          <h2>See Yala from three different map perspectives.</h2>
          <p>The maps below help visitors understand the overall block system, the detailed Block I road network and the larger regional relationship between Yala’s management areas.</p>
        </div>
        <div className="yala-gallery-grid">
          <figure><img src="/images/yala-about/yala-overview-map.jpg" alt="Yala overview map" /><figcaption>Park overview & block boundaries</figcaption></figure>
          <figure><img src="/images/yala-about/block-1-map.jpg" alt="Yala Block I detailed map" /><figcaption>Detailed Block I visitor map</figcaption></figure>
          <figure><img src="/images/yala-about/yala-regional-blocks-map.jpg" alt="Regional Yala block map" /><figcaption>Regional conservation landscape</figcaption></figure>
        </div>
      </section>

      <section className="yala-responsible-banner">
        <div className="yala-responsible-icon"><ShieldCheck size={30} /></div>
        <div>
          <span className="eyebrow">RESPONSIBLE VISITING</span>
          <h2>Wildlife decides the moment. Visitors protect the space.</h2>
          <p>Stay on permitted routes, follow guide and park-officer instructions, keep noise low, never feed wildlife and never treat a sighting as guaranteed.</p>
        </div>
        <Link className="btn btn-gold" to="/packages">Choose a safari <ArrowRight size={18} /></Link>
      </section>

      <footer className="footer">
        <div><b>Safari Lanka</b><p>Yala National Park visitor information & safari management prototype</p></div>
        <p>Block access information should always be checked against current official park guidance.</p>
      </footer>
    </div>
  );
}
