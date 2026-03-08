/**
 * LoanCard.js
 * Renders a single loan account row card.
 * Account number, borrower name, loan type and status are read-only (from API).
 * User only fills: Payment For + Amount.
 *
 * Props:
 *   loan              {object}    - loan object from API
 *   index             {number}    - row index for alternating background
 *   onAmountChange    {function}  - (id, value) => void
 *   onPaymentForPress {function}  - (id) => void
 */

import React from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import {FieldLabel, PaymentForSelector, StatusBadge} from './Paymentindex';

const LoanCard = ({loan, index, onAmountChange, onPaymentForPress}) => {
  const isOverdue = loan.status === 'Overdue';

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isOverdue ? '#fecaca' : '#e2e8f0',
          backgroundColor: isOverdue
            ? '#fff7f7'
            : index % 2 === 0
            ? '#fafbfc'
            : '#fff',
        },
      ]}>

      {/* ── Card Header: number + account info + status ── */}
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.numberBadge,
            {backgroundColor: isOverdue ? '#ef4444' : '#001a6e'},
          ]}>
          <Text style={styles.numberBadgeText}>{loan.id}</Text>
        </View>

        <View style={styles.accountInfo}>
          <View style={styles.accountTopRow}>
            <Text style={styles.accountNumber}>{loan.accountNumber}</Text>
            <StatusBadge status={loan.status} />
          </View>
          <Text style={styles.loanMeta}>
            {loan.loanType} · {loan.borrowerName}
          </Text>
        </View>
      </View>

      {/* ── Input Row: Payment For + Amount ── */}
      <View style={styles.inputRow}>
        <View style={styles.inputHalf}>
          <FieldLabel text="Payment For" />
          <PaymentForSelector
            value={loan.paymentFor}
            onPress={() => onPaymentForPress(loan.id)}
          />
        </View>

        <View style={styles.inputHalf}>
          <FieldLabel text="Amount ₹" />
          <TextInput
            style={[
              styles.amountInput,
              loan.amount ? styles.amountInputFilled : styles.amountInputEmpty,
            ]}
            value={loan.amount}
            onChangeText={val => onAmountChange(loan.id, val)}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
          />
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
    marginBottom: 10,
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
  numberBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  loanMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputHalf: {
    flex: 1,
  },
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
  amountInputFilled: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  amountInputEmpty: {
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
});

export default LoanCard;
