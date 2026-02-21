import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Check, AlertTriangle } from 'lucide-react';

type DateRange = {
  start: string;
  end: string;
};

type DateRangePickerProps = {
  onApply: (range: DateRange) => void;
  onClear: () => void;
  currentRange?: DateRange | null;
};

export default function DateRangePicker({ onApply, onClear, currentRange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentRange) {
      setStartDate(currentRange.start);
      setEndDate(currentRange.end);
    }
  }, [currentRange]);

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last year', days: 365 },
  ];

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setError('');
  }

  function handleApply() {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }
    
    setError('');
    onApply({ start: startDate, end: endDate });
  }

  function handleClear() {
    setStartDate('');
    setEndDate('');
    setError('');
    onClear();
  }

  return (
    <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={16} /> तारीख फिल्टर / Date Range Filter
      </h3>
      
      {/* Quick Presets */}
      <div style={{ marginBottom: 16 }}>
        <label className="label">Quick Presets</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map(preset => (
            <button
              key={preset.days}
              onClick={() => applyPreset(preset.days)}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                background: 'white'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
        <div>
          <label className="label">प्रारंभ तारीख / Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
            max={endDate || undefined}
          />
        </div>
        <div>
          <label className="label">समाप्ती तारीख / End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
            min={startDate || undefined}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '8px 12px',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          color: '#991b1b',
          fontSize: 13,
          marginBottom: 12
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} /> {error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={handleClear}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} /> Clear Filter
        </button>
        <button
          onClick={handleApply}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Check size={14} /> Apply Filter
        </button>
      </div>

      {/* Current Filter Display */}
      {currentRange && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: 6,
          fontSize: 13,
          color: '#166534'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={13} /> Active: {new Date(currentRange.start).toLocaleDateString()} - {new Date(currentRange.end).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}
