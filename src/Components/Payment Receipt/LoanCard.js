/**
 * LoanCard.js
 *
 * Renders a single loan account row as a card.
 * Data shape matches the Angular API response from payment-receipt/getaccountDetails.
 *
 * Props:
 *   loan              {object}    - account detail object from API
 *   index             {number}    - row index (for display numbering)
 *   onAmountChange    {function}  - (lan, 'amount', value) => void
 *   onPaymentForPress {function}  - (lan) => void
 *   submitted         {boolean}   - whether form was submitted (to show errors)
 *
 * Loan object shape (from Angular API):
 *   {
 *     lan: '01000005702',          // account number
 *     totalamountpayable: '150000',
 *     mios_as_on_date: '5000' | 'null' | '',
 *     reol_type: 'Normal',
 *     closed_flag: '0' | '1',
 *     resolution_amount: '200000',
 *     payment_for: '',             // user-selected
 *     amount: null,                // user-entered
 *     readonly: false,             // true when single account (auto-filled)
 *   }
 */

import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {FieldLabel, PaymentForSelector, StatusBadge} from './Paymentindex';

const LoanCard = ({loan, index, onAmountChange, onPaymentForPress, submitted}) => {
  const isLive = loan.closed_flag === '0';
  const loanStatus = isLive ? 'Live' : 'Closed';

  // Compute max payable for display
  const mios = loan.mios_as_on_date === 'null' || loan.mios_as_on_date === '' || loan.mios_as_on_date == null
    ? 0
    : parseFloat(loan.mios_as_on_date) || 0;
  const maxPayable = (parseFloat(loan.totalamountpayable) || 0) + mios;

  const amountStr = loan.amount != null ? String(loan.amount) : '';
  const amountNum = parseFloat(amountStr) || 0;
  const amountExceedsMax = amountNum > maxPayable && maxPayable > 0;

  const showPaymentForError = submitted && amountNum > 0 && !loan.payment_for;
  const showAmountError = submitted && loan.amount == null;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: !isLive ? '#fde68a' : '#e2e8f0',
          backgroundColor: !isLive ? '#fffbeb' : index % 2 === 0 ? '#fafbfc' : '#fff',
        },
      ]}>
      {/* ── Card Header ── */}
      <View style={styles.cardHeader}>
        <View style={[styles.numberBadge, {backgroundColor: isLive ? '#001a6e' : '#ca8a04'}]}>
          <Text style={styles.numberBadgeText}>{index + 1}</Text>
        </View>

        <View style={styles.accountInfo}>
          <View style={styles.accountTopRow}>
            <Text style={styles.accountNumber}>{loan.lan}</Text>
            <StatusBadge status={loanStatus} />
          </View>
          <Text style={styles.loanMeta}>Resolution: {loan.reol_type}</Text>
        </View>
      </View>

      {/* ── Outstanding Amount Info ── */}
      <View style={styles.outstandingRow}>
        <Text style={styles.outstandingLabel}>Max Payable:</Text>
        <Text style={styles.outstandingValue}>
          ₹{maxPayable.toLocaleString('en-IN', {minimumFractionDigits: 2})}
        </Text>
      </View>

      {/* ── Input Row: Payment For + Amount ── */}
      <View style={styles.inputRow}>
        <View style={styles.inputHalf}>
          <FieldLabel text="Payment For" />
          <PaymentForSelector
            value={loan.payment_for || ''}
            onPress={() => onPaymentForPress(loan.lan)}
            error={showPaymentForError ? 'Select Payment For' : null}
          />
        </View>

        <View style={styles.inputHalf}>
          <FieldLabel text="Amount ₹" />
          <TextInput
            style={[
              styles.amountInput,
              amountStr ? styles.amountInputFilled : styles.amountInputEmpty,
              amountExceedsMax ? styles.amountInputError : null,
              showAmountError ? styles.amountInputError : null,
              loan.readonly ? styles.amountInputReadonly : null,
            ]}
            value={amountStr}
            onChangeText={val => onAmountChange(loan.lan, 'amount', val)}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            editable={!loan.readonly}
          />
          {amountExceedsMax ? (
            <Text style={styles.errorTextSmall}>Exceeds max payable</Text>
          ) : null}
          {showAmountError ? (
            <Text style={styles.errorTextSmall}>Amount required</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 13,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  numberBadgeText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  accountInfo: {flex: 1},
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumber: {fontSize: 13, fontWeight: '700', color: '#1e293b', letterSpacing: 0.3},
  loanMeta: {fontSize: 11, color: '#64748b', marginTop: 2},
  outstandingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  outstandingLabel: {fontSize: 10, color: '#94a3b8'},
  outstandingValue: {fontSize: 11, color: '#001a6e', fontWeight: '700'},
  inputRow: {flexDirection: 'row', gap: 8},
  inputHalf: {flex: 1},
  amountInput: {
    borderWidth: 1.5,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    color: '#001a6e',
  },
  amountInputFilled: {borderColor: '#bfdbfe', backgroundColor: '#eff6ff'},
  amountInputEmpty: {borderColor: '#e2e8f0', backgroundColor: '#fff'},
  amountInputError: {borderColor: '#fca5a5', backgroundColor: '#fff1f2'},
  amountInputReadonly: {backgroundColor: '#f1f5f9', color: '#64748b'},
  errorTextSmall: {fontSize: 10, color: '#dc2626', marginTop: 2},
});

export default LoanCard;
