/**
 * receiptConstants.js
 * Ported from Angular receipt-constant.ts
 * Contains all dropdown options, validation patterns, error messages, and form field configs.
 */

export const PAYMENT_TYPE_OPTIONS = [
  { label: 'Cheque/DD', icon: '🏦' },
  { label: 'Digital Payment', icon: '📱' },
  // Virtual Account and Payment Gateway intentionally excluded per Angular config
];

export const APPROPRIATION_OPTIONS = [
  { label: 'Single', value: 'Single' },
  { label: 'Multiple', value: 'Multiple' },
];

export const PAYMENT_FOR_OPTIONS_NEW = [
  { label: 'Settlement', value: 'Settlement' },
  { label: 'Restructuring', value: 'Restructuring' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Foreclosure', value: 'Foreclosure' },
];

export const PAYMENT_FROM_OPTIONS = [
  { label: 'Borrower', value: 'Borrower' },
  { label: 'Co-Borrower', value: 'Co-Borrower' },
  { label: 'Guarantor', value: 'Guarantor' },
  { label: 'Third Party', value: 'Third Party' },
];

export const LOAN_STATUS_OPTIONS = [
  { label: 'In Process', value: 'Inprocess' },
  { label: 'Hold', value: 'Hold' },
  { label: 'Accounted', value: 'Accounted' },
  { label: 'Rejected', value: 'Rejected' },
];

// Error messages keyed by resolution type
export const ERROR_MESSAGES = {
  auction: 'Collected amount cannot be greater than highest bid amount.',
  restructuring: 'Amount collected cannot be greater than total negotiated amount.',
  normal: 'Amount collected cannot be greater than total outstanding amount',
  settlement: 'Amount collected cannot be greater than total negotiated amount.',
  ots: 'Amount collected cannot be greater than total negotiated amount.',
  multishot: 'Amount collected cannot be greater than total negotiated amount.',
  mots: 'Amount collected cannot be greater than total negotiated amount.',
  anytype: 'Entered total amount does not match',
};

// Maps resolution type (cleaned) to a fixed keyword used for error/allow lookups
export const FIXED_KEYWORD_MAP = {
  auctionapproved: 'auction',
  normal: 'normal',
  otsproposalrecommended: 'ots',
  restructuringproposalinitiated: 'restructuring',
  privatetreatyapproved: 'auction',
  saleofasset: 'auction',
  restructuringproposalapproved: 'restructuring',
  auctionsuccessful: 'auction',
  otsproposalapproved: 'ots',
  otsfailed: 'otsfailed',
  otsproposalinitiated: 'otsproposalinitiated',
  multishotfailed: 'motsfailed',
  ots: 'ots',
  motsrejected: 'motsrejected',
  otssuccessful: 'ots',
  multishot: 'mots',
  mots: 'mots',
  multishotproposalapproved: 'mots',
  otsproposalrejected: 'otsfailed',
  multishotproposalrejected: 'motsfailed',
  multishotsuccessful: 'ots',
  multishotproposalinitiated: 'mots',
  multishotproposalrecommended: 'mots',
  foreclosure: 'foreclosure',
  emi: 'emi',
  auction: 'auction',
  restructuring: 'restructuring',
};

// err_behalf_paymentfor: defines invalid (payment_for → resolution_type) combos
export const ERR_BEHALF_PAYMENT_FOR = {
  auction: {
    normal: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    restructuring: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    settelement: 'Its in Settlement stage, Please select Settlement in Payment for',
  },
  ots: {
    normal: 'Its in Normal stage, Please select Normal in Payment for',
    'sale of asset': 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    restructuring: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    otsfailed: 'Its in OTS fail stage, please initiate new proposal or select normal in payment for',
  },
  otsproposalinitiated: {
    normal: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    mots: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    'sale of asset': 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    auction: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    restructuring: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    otsfailed: 'Its in OTS fail stage, please initiate new proposal or select normal in payment for',
  },
  normal: {
    otsproposalinitiated: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    'sale of asset': 'Its in Auction stage, Please select Auction in Payment for',
    auction: 'Its in Auction stage, Please select Auction in Payment for',
    treaty: 'Its in Auction stage, Please select Auction in Payment for',
    restructuring: 'Its in Restructuring stage, Please select Restructuring in Payment for',
    mots: 'It is Settlement stage, Please select Settlement in payment for',
    ots: 'It is Settlement stage, Please select Settlement in payment for',
    settelement: 'Its in Settlement stage, Please select Restructuring in Payment for',
  },
  restructuring: {
    otsproposalinitiated: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    normal: 'Its in Normal stage, Please select Normal in Payment for',
    settelement: 'Its is Restructuring stage, Please select Restructuring in Payment for',
    'sale of asset': 'Its in Auction stage, Please select Auction in Payment for',
    auction: 'Its in Auction stage, Please select Auction in Payment for',
    treaty: 'Its in Auction stage, Please select Auction in Payment for',
    otsfailed: 'Its in OTS fail stage, please initiate new proposal or select normal in payment for',
    mots: 'It is Settlement stage, Please select Settlement in payment for',
    ots: 'It is Settlement stage, Please select Settlement in payment for',
    foreclosure: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    emi: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
  },
  settlement: {
    otsfailed: 'Its in OTS fail stage, please initiate new proposal or select normal in payment for',
    auction: 'Its in Auction stage, Please select Auction in Payment for',
    treaty: 'Its in Auction stage, Please select Auction in Payment for',
    'sale of asset': 'Its in Auction stage, Please select Auction in Payment for',
    foreclosure: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    emi: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    normal: 'Its in Normal stage, Please select Normal in Payment for',
    restructuring: 'Its in Settlement stage, Please select Restructuring in Payment for',
  },
  'sale of asset': {
    otsfailed: 'Its in OTS fail stage, please initiate new proposal or select normal in payment for',
    otsproposalinitiated: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    mots: 'It is Settlement stage, Please select Settlement in payment for',
    ots: 'It is Settlement stage, Please select Settlement in payment for',
    foreclosure: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    emi: 'Proposal not yet initiated, Kindly raise the proposal or change the payment for',
    normal: 'Its in Normal stage, Please select Normal in Payment for',
    restructuring: 'Its in Auction stage, Please select Restructuring in Payment for',
  },
};

// Regex patterns for validation
export const REGEX = {
  amount: /^(?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/,
  digit: /^\d+$/,
  pan_number: /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/,
  ifsc_code: /^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$/,
  utr_ref: /^[a-zA-Z0-9]+$/,
};

// Allowed file MIME types
export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_COUNT = 2;

/**
 * Compute the fixed error message based on resolution type from receiptDetails.
 * @param {string} resolutionType - e.g. 'Normal', 'Restructuring'
 */
export function getFixedErrorMsg(resolutionType) {
  const key = resolutionType ? resolutionType.toLowerCase() : 'anytype';
  return ERROR_MESSAGES[key] ?? ERROR_MESSAGES.anytype;
}

/**
 * Get filtered payment_for options based on resolution type.
 * Removes options that are invalid for the given resolution type.
 * @param {string} resolutionType - e.g. 'Normal'
 */
export function getFilteredPaymentForOptions(resolutionType) {
  const reolType = resolutionType
    ? resolutionType.replace(/[^a-zA-Z]+/g, '').toLowerCase()
    : '';
  return PAYMENT_FOR_OPTIONS_NEW.filter(itm => {
    const errMap = ERR_BEHALF_PAYMENT_FOR[itm.label.toLowerCase()];
    if (errMap && errMap[reolType]) {
      return false;
    }
    return true;
  });
}

/**
 * Format a Date to 'yyyy-MM-dd' for API submission.
 */
export function formatDateForApi(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date to 'dd MMM yyyy' for display.
 */
export function formatDateDisplay(date) {
  if (!date) return '';
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format a number as Indian currency string.
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
