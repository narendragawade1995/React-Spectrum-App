/**
 * receiptApi.js
 *
 * Real API calls for the Payment Receipt module.
 * Mirrors Angular's HttpService calls in receipting.component.ts and receipting-list.component.ts.
 * Uses the existing apiService.js (Api) for authenticated requests.
 */

import Api from '../../Utilities/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://testappapi.edelweissarc.in/api/v3';

// ─── Helper: multipart/form-data POST (for file uploads) ───────────────────────
async function postFormData(path, formData) {
  const token = await AsyncStorage.getItem('authtoken');
  const response = await fetch(`${BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      Token: token,
      // Do NOT set Content-Type; fetch sets multipart boundary automatically
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`);
  }
  return response.json();
}

// ─── Fetch account details for a CIF ──────────────────────────────────────────
// Angular: this.http.post('payment-receipt/getaccountDetails', { cif, receipting_type })
// Response: Array of account objects with lan, totalamountpayable, mios_as_on_date, etc.
export const getAccountDetails = async (cif, receipting_type) => {
  return Api.send({ cif, receipting_type }, 'payment-receipt/getaccountDetails');
};

// ─── Fetch bank name from IFSC ─────────────────────────────────────────────────
// Angular: this.http.post('payment-receipt/bankdetails', { ifsc_code })
export const getBankDetails = async ifsc_code => {
  return Api.send({ ifsc_code: ifsc_code.toUpperCase() }, 'payment-receipt/bankdetails');
};

// ─── Check for duplicate UTR number ───────────────────────────────────────────
// Angular: this.http.post('/payment-receipt', { ref_utr_no, ifsc_code, sortcolumn: "id", pageIndex: 0 })
export const checkDuplicateUtr = async (ref_utr_no, ifsc_code = '') => {
  return Api.send(
    { ref_utr_no, ifsc_code, sortcolumn: 'id', pageIndex: 0 },
    'payment-receipt',
  );
};

// ─── Submit payment receipt (with file attachments) ────────────────────────────
// Angular: this.http.formdata('payment-receipt/add', formData)
// payload = { ...formFields, receipting_type, accountdetails: [...] }
// files = [ { uri, name, type } ]
export const submitPaymentReceipt = async (payload, files) => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name || 'file',
    });
  });

  formData.append('data', JSON.stringify(payload));
  return postFormData('payment-receipt/add', formData);
};

// ─── Fetch receipt list ────────────────────────────────────────────────────────
// Angular: this.http.post('payment-receipt', params)
// Response: { ArrayOfResponse: [...], TotalRecords: number }
export const getReceiptList = async params => {
  return Api.send(params, 'payment-receipt');
};

// ─── Fetch images for a receipt ────────────────────────────────────────────────
// Angular: this.http.post('payment-receipt/getimages', { ...element })
export const getReceiptImages = async element => {
  return Api.send({ ...element }, 'payment-receipt/getimages');
};

// ─── Fetch customer list for payee name lookup ────────────────────────────────
// Angular: this.http.post('secure_borrowerdetails/getcustomerList', { account_no })
export const getCustomerList = async account_no => {
  return Api.send({ account_no }, 'secure_borrowerdetails/getcustomerList');
};
