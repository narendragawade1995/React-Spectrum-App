/**
 * receiptApi.js
 * Replace mock functions with your real API endpoints.
 */

/**
 * Fetch loans by borrower from backend.
 * Replace with: fetch(`${BASE_URL}/borrowers/${borrowerId}/loans`)
 */
export const fetchLoansByBorrower = async borrowerId => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1600));

  // Mock API response — replace with real fetch
  return [
    {
      id: 1,
      accountNumber: '01000005702',
      borrowerName: 'Rajesh Kumar',
      loanType: 'Home Loan',
      status: 'Live',
      paymentFor: '',
      amount: '',
    },
    {
      id: 2,
      accountNumber: '01000008841',
      borrowerName: 'Rajesh Kumar',
      loanType: 'Personal Loan',
      status: 'Live',
      paymentFor: '',
      amount: '',
    },
    {
      id: 3,
      accountNumber: '01000011203',
      borrowerName: 'Rajesh Kumar',
      loanType: 'Vehicle Loan',
      status: 'Overdue',
      paymentFor: '',
      amount: '',
    },
  ];
};

/**
 * Submit payment receipt to backend.
 * Replace with: fetch(`${BASE_URL}/receipts`, { method: 'POST', body: JSON.stringify(payload) })
 */
export const submitPaymentReceipt = async payload => {
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log('Submitted:', JSON.stringify(payload, null, 2));
  // Example real call:
  // const res = await fetch(`${BASE_URL}/receipts`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Submit failed');
};
