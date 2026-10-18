import { useEffect, useState } from 'react';
import PublicNav from '../components/PublicNav';
import PackageCard from '../components/PackageCard';
import api, { messageOf } from '../utils/api';
import { Compass, Search } from 'lucide-react';

export default function Packages() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/packages')
      .then((r) => setItems(r.data))
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((p) =>
    (p.name + ' ' + (p.routeZone || '') + ' ' + (p.description || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="public-page cream packages-page">
      <PublicNav />
      <section className="page-hero small">
        <span className="eyebrow">CURATED YALA EXPERIENCES</span>
        <h1>Choose your safari.</h1>
        <p>
          Published packages are controlled by the Safari Operations Manager and connected to booking
          capacity, pricing and permit workflows in Yala National Park.
        </p>
      </section>

      <section className="packages-section">
        <div className="toolbar">
          <div>
            <h2>Available packages</h2>
            <span>{filtered.length} experiences ready to book</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="search-input"
              placeholder="Search package, route, zone..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {err && <div className="alert error">{err}</div>}

        {loading ? (
          <div className="page-loader">Loading curated experiences...</div>
        ) : filtered.length === 0 ? (
          <div className="empty panel">
            <Compass size={36} style={{ margin: '0 auto 12px', color: '#889e94' }} />
            <h3>No safari packages matched your search.</h3>
            <p>Try searching for &quot;Leopard&quot;, &quot;Elephant&quot;, &quot;Photography&quot;, or &quot;Sunset&quot;.</p>
          </div>
        ) : (
          <div className="package-grid">
            {filtered.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
