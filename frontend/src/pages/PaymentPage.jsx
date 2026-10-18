import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Landmark, ShieldCheck, Upload, FileText } from 'lucide-react';
import api, { messageOf } from '../utils/api';
import PublicNav from '../components/PublicNav';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/currency';

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');
const formatCardNumber = (value) => onlyDigits(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

export default function PaymentPage() {
  const { bookingId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [method, setMethod] = useState('CARD');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState({ cardholderName: '', cardNumber: '', expiry: '', cvv: '' });
  const [bankReference, setBankReference] = useState('');
  const [slip, setSlip] = useState(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then((r) => setData(r.data)).catch((e) => setErr(messageOf(e)));
  }, [bookingId]);

  const cardDigits = useMemo(() => onlyDigits(card.cardNumber), [card.cardNumber]);

  const validateCard = () => {
    if (!card.cardholderName.trim()) return 'Cardholder name is required.';
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ .'-]{2,80}$/.test(card.cardholderName.trim())) return 'Enter a valid cardholder name.';
    if (!/^\d{16}$/.test(cardDigits)) return 'Card number must contain exactly 16 digits.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'Expiry must be in MM/YY format with a month from 01 to 12.';

    const [month, shortYear] = card.expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const expiryYear = 2000 + shortYear;

    if (expiryYear < currentYear || (expiryYear === currentYear && month < currentMonth)) {
      return 'This card is expired.';
    }
    if (expiryYear > currentYear + 10 || (expiryYear === currentYear + 10 && month > currentMonth)) {
      return 'Expiry date cannot be more than 10 years from the current month.';
    }
    if (!/^\d{3,4}$/.test(card.cvv)) return 'CVV / CVC must contain 3 or 4 digits.';
    return '';
  };

  const pay = async () => {
    setErr('');
    if (method === 'CARD') {
      const problem = validateCard();
      if (problem) {
        setErr(problem);
        return;
      }
    } else {
      if (bankReference.trim().length < 3) {
        setErr('Enter the bank deposit/reference number.');
        return;
      }
      if (!slip) {
        setErr('Upload the bank payment slip as a PDF.');
        return;
      }
      if (slip.type !== 'application/pdf' || !slip.name.toLowerCase().endsWith('.pdf')) {
        setErr('Bank payment slip must be a PDF file.');
        return;
      }
      if (slip.size > 10 * 1024 * 1024) {
        setErr('Bank payment slip must be 10 MB or smaller.');
        return;
      }
    }

    setBusy(true);
    try {
      if (method === 'CARD') {
        await api.post(`/payments/booking/${bookingId}/card`, {
          cardholderName: card.cardholderName.trim(),
          cardNumber: card.cardNumber,
          expiry: card.expiry,
          cvv: card.cvv
        });
        nav('/dashboard', { state: { notice: 'Card payment validated and completed successfully.' } });
      } else {
        const fd = new FormData();
        fd.append('bankReference', bankReference.trim());
        fd.append('slip', slip);
        await api.post(`/payments/booking/${bookingId}/bank`, fd);
        nav('/dashboard', { state: { notice: 'Bank payment slip uploaded. Payment is pending Finance Officer approval.' } });
      }
    } catch (e) {
      setErr(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const b = data?.booking;
  if (!b) return <><PublicNav /><div className="page-loader">Loading booking...</div></>;
  const paymentLocked=b.bookingStatus!=='CONFIRMED';

  return <div className="public-page cream"><PublicNav /><section className="payment-wrap">
    <button className="back-link" onClick={() => nav(-1)}><ArrowLeft />Back</button>
    <div className="payment-card">
      <div className="payment-intro">
        <span className="eyebrow dark">SECURE CHECKOUT</span>
        <h1>Complete your booking</h1>
        <p>Payment is available only after Safari Operations confirms your booking. Choose card payment for immediate validation, or upload a bank deposit slip for Finance approval.</p>
        <div className="invoice-preview"><small>Booking</small><b>{b.bookingCode}</b><span>{b.safariPackage.name}</span><span>{b.visitDate} • {b.visitorCount} visitor(s)</span><div><small>Amount due</small><strong>{formatMoney(b.totalAmount,user?.preferredCurrency||'LKR')}</strong></div></div>
      </div>
      <div className="payment-form">
        <h3>Select payment option</h3>
        {paymentLocked&&<div className="alert info">Waiting for Safari Operator confirmation. Payment will be available once your booking is confirmed.</div>}
        {err && <div className="alert error">{err}</div>}
        <div className="pay-methods">
          <button type="button" className={method === 'CARD' ? 'selected' : ''} onClick={() => setMethod('CARD')}><CreditCard /><span>Card payment</span></button>
          <button type="button" className={method === 'BANK_TRANSFER' ? 'selected' : ''} onClick={() => setMethod('BANK_TRANSFER')}><Landmark /><span>Bank deposit</span></button>
        </div>

        {method === 'CARD' ? <div className="payment-fields">
          <label>Cardholder name<input maxLength="80" autoComplete="cc-name" value={card.cardholderName} onChange={(e) => setCard({ ...card, cardholderName: e.target.value })} placeholder="Name on card" /></label>
          <label>Card number<input inputMode="numeric" autoComplete="cc-number" maxLength="19" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })} placeholder="0000 0000 0000 0000" /><small>Exactly 16 digits. Spaces are added automatically after every 4 digits.</small></label>
          <div className="form-row"><label>Expiry (MM/YY)<input inputMode="numeric" autoComplete="cc-exp" maxLength="5" value={card.expiry} onChange={(e) => { let v = onlyDigits(e.target.value).slice(0, 4); if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`; setCard({ ...card, expiry: v }); }} placeholder="MM/YY" /><small>Month 01–12 • maximum 10 years ahead</small></label><label>CVV / CVC<input type="password" inputMode="numeric" autoComplete="cc-csc" maxLength="4" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: onlyDigits(e.target.value).slice(0, 4) })} placeholder="3 or 4 digits" /></label></div>
          <div className="simulation-box"><ShieldCheck /><div><b>Validated without storing sensitive card data</b><p>The server checks the 16-digit card number, expiry month/year and security code. Full card number and CVV are not saved in the database.</p></div></div>
        </div> : <div className="payment-fields">
          <label>Bank deposit / transaction reference<input maxLength="80" value={bankReference} onChange={(e) => setBankReference(e.target.value)} placeholder="Enter the reference shown on your deposit" /></label>
          <label className="file-upload-box"><Upload /><span><b>Upload payment slip (PDF)</b><small>{slip ? `${slip.name} • ${(slip.size / 1024 / 1024).toFixed(2)} MB` : 'Browse device • PDF only • max 10 MB'}</small></span><input type="file" accept="application/pdf,.pdf" onChange={(e) => setSlip(e.target.files?.[0] || null)} /></label>
          <div className="simulation-box"><FileText /><div><b>Finance review required</b><p>After upload, your payment shows as PENDING until a Finance Officer approves the slip. Once approved, the dashboard shows the payment as PAID. Your booking remains confirmed by Safari Operations.</p></div></div>
        </div>}

        <button className="btn btn-gold-dark full" onClick={pay} disabled={paymentLocked || busy || b.paymentStatus === 'PAID' || b.paymentStatus === 'PENDING'}>{paymentLocked ? 'Waiting for operator confirmation' : b.paymentStatus === 'PAID' ? 'Already paid' : b.paymentStatus === 'PENDING' ? 'Pending Finance approval' : busy ? 'Processing...' : method === 'CARD' ? `Pay ${formatMoney(b.totalAmount,user?.preferredCurrency||'LKR')}` : 'Submit bank payment for approval'}</button>
      </div>
    </div>
  </section></div>;
}
