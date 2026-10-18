export default function StatusBadge({value}){const v=String(value||'UNKNOWN').toLowerCase();return <span className={`status status-${v}`}>{String(value||'Unknown').replaceAll('_',' ')}</span>}
