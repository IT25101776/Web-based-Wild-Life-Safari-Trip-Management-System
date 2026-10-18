// Display-only prototype currency conversion. Database prices remain stored in LKR.
// Rates represent approximate units of the target currency for 1 LKR and can be updated here.
export const CURRENCY_RATES_FROM_LKR = {
  LKR: 1,
  USD: 0.0033,
  EUR: 0.0028,
  GBP: 0.0024,
  AUD: 0.0051,
  CAD: 0.0046,
  INR: 0.29,
  SGD: 0.0042,
  AED: 0.0121,
  SAR: 0.0124,
  QAR: 0.0120,
  JPY: 0.49,
  CNY: 0.0235,
  KRW: 4.58,
  MYR: 0.0139,
  THB: 0.106,
  NZD: 0.0057,
  CHF: 0.0026,
  SEK: 0.030,
  NOK: 0.033,
  DKK: 0.021,
  ZAR: 0.056,
  BDT: 0.40,
  PKR: 0.92,
  NPR: 0.46,
  IDR: 55.0,
  PHP: 0.19,
  VND: 86.0,
  TRY: 0.14,
  PLN: 0.012,
  CZK: 0.072,
  HUF: 1.10,
  BRL: 0.018,
  MXN: 0.061
};

export const COUNTRY_OPTIONS = [
  ['Sri Lanka','LKR'], ['Australia','AUD'], ['Bangladesh','BDT'], ['Brazil','BRL'], ['Canada','CAD'],
  ['China','CNY'], ['Czech Republic','CZK'], ['Denmark','DKK'], ['France','EUR'], ['Germany','EUR'],
  ['Greece','EUR'], ['Hungary','HUF'], ['India','INR'], ['Indonesia','IDR'], ['Ireland','EUR'],
  ['Italy','EUR'], ['Japan','JPY'], ['Malaysia','MYR'], ['Mexico','MXN'], ['Nepal','NPR'],
  ['Netherlands','EUR'], ['New Zealand','NZD'], ['Norway','NOK'], ['Pakistan','PKR'], ['Philippines','PHP'],
  ['Poland','PLN'], ['Portugal','EUR'], ['Qatar','QAR'], ['Saudi Arabia','SAR'], ['Singapore','SGD'],
  ['South Africa','ZAR'], ['South Korea','KRW'], ['Spain','EUR'], ['Sweden','SEK'], ['Switzerland','CHF'],
  ['Thailand','THB'], ['Turkey','TRY'], ['United Arab Emirates','AED'], ['United Kingdom','GBP'], ['United States','USD'],
  ['Vietnam','VND'], ['Austria','EUR'], ['Belgium','EUR'], ['Finland','EUR'], ['Luxembourg','EUR'],
  ['Malta','EUR'], ['Cyprus','EUR'], ['Estonia','EUR'], ['Latvia','EUR'], ['Lithuania','EUR'], ['Slovakia','EUR'], ['Slovenia','EUR']
].map(([country,currency]) => ({country,currency}));

export const CURRENCY_OPTIONS = [...new Set(COUNTRY_OPTIONS.map(x => x.currency))].sort();

export const currencyForCountry = (country) => COUNTRY_OPTIONS.find(x => x.country === country)?.currency || 'LKR';

export function convertFromLKR(amount, currency='LKR') {
  const n = Number(amount || 0);
  const rate = CURRENCY_RATES_FROM_LKR[currency] || 1;
  return n * rate;
}

export function formatMoney(amountLkr, currency='LKR') {
  const code = CURRENCY_RATES_FROM_LKR[currency] ? currency : 'LKR';
  const amount = convertFromLKR(amountLkr, code);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: code === 'LKR' || ['JPY','KRW','VND','IDR'].includes(code) ? 0 : 2
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString(undefined,{maximumFractionDigits:2})}`;
  }
}
