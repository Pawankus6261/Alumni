const INSTITUTION_NAME = 'Bansal Group of Institutions';
const ASSOCIATION_NAME = 'BIST Alumni Association (BISTAA)';
const QR_CREDIT = 'System created by DevLinkHub Team';
let qrLibraryPromise;
const generatedQrCache = new Map();

export function preloadMemberQr() {
  qrLibraryPromise ||= import('qrcode').then(module => module.default);
  return qrLibraryPromise;
}

export async function createMemberIdentityQr(payload) {
  if (generatedQrCache.has(payload)) return generatedQrCache.get(payload);
  const QRCode = await preloadMemberQr();
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'L', margin: 4, width: 480,
    color: { dark: '#17365B', light: '#FFFFFF' },
  });
  generatedQrCache.set(payload, dataUrl);
  return dataUrl;
}

export function createMemberIdentityPayload(member = {}) {
  const name = String(member.name || [member.firstname, member.lastname].filter(Boolean).join(' ') || 'BISTAA Member').trim();
  const memberId = String(member.membership_id || member.bistaa_id || member.enrollment || member.enroll_no || member.id || 'ID unavailable').trim();
  const college = String(member.college || 'BIST').trim();
  const branch = String(member.branch || member.course || '').trim();

  // Plain labeled text makes the result readable in standard phone camera / QR apps.
  return [
    'BISTAA OFFICIAL MEMBER PASS',
    `Name: ${name}`,
    `Membership ID: ${memberId}`,
    `College: ${college}`,
    branch ? `Branch / Course: ${branch}` : '',
    `Organization: ${INSTITUTION_NAME}`,
    `Association: ${ASSOCIATION_NAME}`,
    QR_CREDIT,
  ].filter(Boolean).join('\n');
}

export { INSTITUTION_NAME, ASSOCIATION_NAME, QR_CREDIT };
