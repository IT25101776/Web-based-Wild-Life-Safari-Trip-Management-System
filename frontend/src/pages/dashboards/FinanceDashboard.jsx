import { useEffect, useState } from 'react';
import { WalletCards, BadgeDollarSign, RotateCcw, ReceiptText, FileText, Check, X, Search } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import api, { messageOf } from '../../utils/api';

export default function FinanceDashboard() {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [report, setReport] = useState({});
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState('');
  const [q,setQ]=useState('');
  const [rejectTarget,setRejectTarget]=useState(null);
  const [rejectReason,setRejectReason]=useState('');

  const load = () => Promise.all([api.get('/payments'), api.get('/payments/refunds'), api.get('/reports/finance'), api.get('/bookings/all')])
    .then(([p, r, s, b]) => { setPayments(p.data); setRefunds(r.data); setReport(s.data); setBookings(b.data); })
    .catch((e) => setErr(messageOf(e)));

  useEffect(() => { load(); }, []);

  const decideRefund = async (id, status) => {
    try {
      await api.patch(`/payments/refunds/${id}`, { status, note: status === 'APPROVED' ? 'Approved under cancellation policy' : 'Not eligible under policy' });
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const reviewBank = async (id, status, reason='') => {
    if(status==='APPROVED'&&!window.confirm('Approve this bank payment?')) return;
    try {
      await api.patch(`/payments/${id}/bank-review`, status==='REJECTED' ? { status, reason } : { status, note:'Bank deposit slip checked and approved by Finance.' });
      load();
    } catch (e) { setErr(messageOf(e)); }
  };

  const rejectBank=async()=>{
    if(!rejectTarget||!rejectReason.trim()){setErr('Enter a payment rejection reason.');return;}
    await reviewBank(rejectTarget.id,'REJECTED',rejectReason.trim());
    setRejectTarget(null);setRejectReason('');
  };

  const viewSlip = async (id) => {
    try {
      const r = await api.get(`/payments/${id}/slip`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setErr(messageOf(e)); }
  };

  const query=q.trim().toLowerCase();
  const matchesPayment=p=>!query||[p.paymentCode,p.booking?.bookingCode,p.booking?.tourist?.fullName,p.invoiceNumber,p.transactionReference,p.method,p.status].filter(Boolean).join(' ').toLowerCase().includes(query);
  const filteredPayments=payments.filter(matchesPayment);
  const pendingBank = payments.filter((p) => p.method === 'BANK_TRANSFER' && p.status === 'PENDING' && matchesPayment(p));
  const filteredRefunds=refunds.filter(r=>!query||[r.booking?.bookingCode,r.booking?.tourist?.fullName,r.reason,r.status].filter(Boolean).join(' ').toLowerCase().includes(query));
  const unpaidBookings=bookings.filter(x=>x.booking?.paymentStatus==='UNPAID').filter(x=>!query||[x.booking?.bookingCode,x.booking?.tourist?.fullName,x.booking?.tourist?.email,x.booking?.safariPackage?.name,x.booking?.visitDate].filter(Boolean).join(' ').toLowerCase().includes(query));

  return <DashboardShell title="Finance & Administration" subtitle="Transactions, bank-deposit verification, invoices, refunds and reconciliation.">
    {err && <div className="alert error">{err}</div>}
    <div className="stats-grid">
      <StatCard icon={BadgeDollarSign} label="Revenue" value={`LKR ${Number(report.revenue || 0).toLocaleString()}`} />
      <StatCard icon={WalletCards} label="Successful payments" value={report.successfulPayments || 0} />
      <StatCard icon={FileText} label="Bank slips to review" value={pendingBank.length} />
      <StatCard icon={RotateCcw} label="Pending refunds" value={report.pendingRefunds || 0} />
      <StatCard icon={ReceiptText} label="Unpaid bookings" value={unpaidBookings.length} />
    </div>

    <section className="panel">
      <div className="panel-head search-panel-head"><div><h2>Unpaid bookings</h2><p>Bookings created by tourists that do not yet have a successful or pending payment.</p></div><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking ID, tourist, package, date..."/></div></div>
      <div className="table-wrap"><table><thead><tr><th>Booking</th><th>Tourist</th><th>Package</th><th>Visit date</th><th>Visitors</th><th>Amount due</th><th>Status</th></tr></thead><tbody>{unpaidBookings.map(x=><tr key={x.booking.id}><td><b>{x.booking.bookingCode}</b></td><td>{x.booking.tourist.fullName}<small className="cell-small">{x.booking.tourist.email}</small></td><td>{x.booking.safariPackage.name}</td><td>{x.booking.visitDate}</td><td>{x.booking.visitorCount}</td><td><b>LKR {Number(x.booking.totalAmount||0).toLocaleString()}</b></td><td><StatusBadge value={x.booking.paymentStatus}/></td></tr>)}</tbody></table>{!unpaidBookings.length&&<div className="empty compact">No unpaid bookings match your search.</div>}</div>
    </section>

    <section className="panel" id="bank-review">
      <div className="panel-head search-panel-head"><div><h2>Bank deposits awaiting approval</h2><p>Open the tourist's PDF slip, verify it, then approve or reject the payment.</p></div><div className="dashboard-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search payment, booking ID, tourist, invoice..."/></div></div>
      <div className="table-wrap"><table><thead><tr><th>Payment</th><th>Booking</th><th>Tourist</th><th>Reference</th><th>Amount</th><th>Slip</th><th>Status</th><th>Decision</th></tr></thead>
        <tbody>{pendingBank.map((p) => <tr key={p.id}>
          <td><b>{p.paymentCode}</b></td><td>{p.booking.bookingCode}</td><td>{p.booking.tourist.fullName}</td><td>{p.transactionReference}</td><td>LKR {Number(p.amount).toLocaleString()}</td>
          <td><button className="mini-action" onClick={() => viewSlip(p.id)}><FileText size={14} /> View PDF</button></td>
          <td><StatusBadge value={p.status} /></td>
          <td className="actions"><button className="mini-action" onClick={() => reviewBank(p.id, 'APPROVED')}><Check size={14} />Approve</button><button className="mini-action danger" onClick={() => {setRejectTarget(p);setRejectReason('')}}><X size={14} />Reject</button></td>
        </tr>)}</tbody></table>{!pendingBank.length && <div className="empty compact">No bank deposits are waiting for review.</div>}</div>
    </section>

    <section className="panel" id="payment-ledger"><div className="panel-head"><div><h2>Payment ledger</h2><p>Card payments are validated immediately; bank deposits remain pending until Finance approval.</p></div><button className="btn btn-outline-dark btn-sm" onClick={() => window.print()}>Print report</button></div>
      <div className="table-wrap"><table><thead><tr><th>Payment</th><th>Booking</th><th>Tourist</th><th>Method</th><th>Details</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{filteredPayments.map((p) => <tr key={p.id}><td>{p.paymentCode}</td><td>{p.booking.bookingCode}</td><td>{p.booking.tourist.fullName}</td><td>{p.method.replaceAll('_', ' ')}</td><td>{p.method === 'CARD' ? `Card •••• ${p.cardLast4 || ''}` : p.transactionReference || '—'}{p.rejectionReason&&<small className="cell-small rejection-note">Reason: {p.rejectionReason}</small>}</td><td><b>{p.invoiceNumber}</b></td><td>LKR {Number(p.amount).toLocaleString()}</td><td><StatusBadge value={p.status} /></td></tr>)}</tbody>
      </table></div>
    </section>

    <section className="panel" id="refunds"><div className="panel-head"><h2>Refund workflow</h2></div><div className="table-wrap"><table><thead><tr><th>Booking</th><th>Reason</th><th>Amount</th><th>Status</th><th>Decision</th></tr></thead><tbody>{filteredRefunds.map((r) => <tr key={r.id}><td>{r.booking.bookingCode}</td><td>{r.reason}</td><td>LKR {Number(r.amount).toLocaleString()}</td><td><StatusBadge value={r.status} /></td><td className="actions">{r.status === 'PENDING' && <><button className="mini-action" onClick={() => decideRefund(r.id, 'APPROVED')}>Approve</button><button className="mini-action danger" onClick={() => decideRefund(r.id, 'REJECTED')}>Reject</button></>}</td></tr>)}</tbody></table>{!refunds.length && <div className="empty compact">No refund requests.</div>}</div></section>

    <Modal open={!!rejectTarget} title={`Reject payment • ${rejectTarget?.paymentCode||''}`} onClose={()=>{setRejectTarget(null);setRejectReason('')}}><div className="modal-body"><p>Enter the reason this bank payment is being rejected. The tourist and Safari Operator will be able to see it.</p><label>Payment rejection reason<textarea rows="4" maxLength="1000" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Example: Slip amount does not match booking total..."/></label><button className="btn btn-dark full" disabled={!rejectReason.trim()} onClick={rejectBank}>Reject payment and save reason</button></div></Modal>
  </DashboardShell>;
}
