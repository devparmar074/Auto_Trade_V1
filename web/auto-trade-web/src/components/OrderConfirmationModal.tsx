import React from 'react';
import type { TransactionType } from '../types/trading';

interface Props {
  isOpen: boolean;
  transactionType: TransactionType;
  quantity: number;
  stockName: string;
  tradingSymbol: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const OrderConfirmationModal: React.FC<Props> = ({
  isOpen,
  transactionType,
  quantity,
  stockName,
  tradingSymbol,
  onConfirm,
  onCancel,
  isSubmitting
}) => {
  if (!isOpen) return null;

  const isBuy = transactionType === 'BUY';

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={badgeStyle(isBuy)}>
            {transactionType}
          </span>
        </div>

        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#f8fafc', textAlign: 'center' }}>
          Confirm Live Order
        </h3>

        <div style={detailsBoxStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Security:</span>
            <span style={valueStyle}>{stockName} ({tradingSymbol})</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Action:</span>
            <span style={{ fontWeight: 700, color: isBuy ? '#10b981' : '#ef4444' }}>{transactionType}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Order Type:</span>
            <span style={valueStyle}>MARKET (Day)</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Quantity:</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>{quantity} Share{quantity > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div style={warningAlertStyle}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>REAL MONEY ORDER</div>
          This is a <strong>LIVE order</strong> and will be sent immediately to your <strong>real Upstox account</strong>.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            style={cancelBtnStyle}
          >
            CANCEL
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            disabled={isSubmitting}
            style={confirmBtnStyle(isBuy)}
          >
            {isSubmitting ? 'SENDING TO UPSTOX...' : 'CONFIRM LIVE ORDER'}
          </button>
        </div>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
  padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.75rem',
  maxWidth: '420px',
  width: '100%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
};

const badgeStyle = (isBuy: boolean): React.CSSProperties => ({
  backgroundColor: isBuy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
  color: isBuy ? '#10b981' : '#ef4444',
  border: `1px solid ${isBuy ? '#10b981' : '#ef4444'}`,
  borderRadius: '9999px',
  padding: '0.25rem 0.85rem',
  fontWeight: 700,
  fontSize: '0.85rem',
  letterSpacing: '0.05em'
});

const detailsBoxStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  borderRadius: '8px',
  padding: '1rem',
  margin: '1rem 0',
  border: '1px solid #334155'
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem',
  fontSize: '0.95rem'
};

const labelStyle: React.CSSProperties = {
  color: '#94a3b8'
};

const valueStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 600
};

const warningAlertStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  border: '1px solid rgba(239, 68, 68, 0.4)',
  color: '#fca5a5',
  padding: '0.85rem',
  borderRadius: '8px',
  fontSize: '0.85rem',
  lineHeight: 1.4,
  textAlign: 'center'
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  backgroundColor: '#334155',
  color: '#f8fafc',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.95rem'
};

const confirmBtnStyle = (isBuy: boolean): React.CSSProperties => ({
  flex: 2,
  padding: '0.75rem',
  backgroundColor: isBuy ? '#10b981' : '#ef4444',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '0.95rem',
  boxShadow: isBuy ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(239, 68, 68, 0.4)'
});
