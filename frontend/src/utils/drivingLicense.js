export const normalizeDrivingLicense=(value='')=>{
  let v=String(value).toUpperCase().replace(/\s+/g,'').replace(/[–—]/g,'-').replace(/[^A-Z0-9-]/g,'');
  if(/^[0-9]+$/.test(v)&&v.length>2)v=`${v.slice(0,2)}-${v.slice(2,9)}`;
  if(/^\d{2}-/.test(v))v=`${v.slice(0,3)}${v.slice(3).replace(/\D/g,'').slice(0,7)}`;
  if(/^[A-Z]/.test(v))v=`${v[0]}${v.slice(1).replace(/\D/g,'').slice(0,7)}`;
  return v.slice(0,10);
};
export const isValidDrivingLicense=(value='')=>/^(?:[A-Z]\d{7}|\d{2}-\d{7})$/.test(normalizeDrivingLicense(value));
export const DRIVING_LICENSE_HELP='Sri Lankan licence formats: B1234567 (legacy) or 85-1234567 (current card).';
