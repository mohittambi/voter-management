import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Cake, List, Calendar as CalendarIcon } from 'lucide-react';

const VIEW_KEY = 'birthdays_view';

function getNextBirthday(dob: string): { date: Date; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dob.split('-').map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  const daysUntil = Math.ceil((next.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return { date: next, daysUntil };
}

export default function BirthdaysPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>(() => {
    if (typeof window === 'undefined') return 'list';
    return (localStorage.getItem(VIEW_KEY) as 'list' | 'calendar') || 'list';
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetch('/api/birthdays')
      .then(r => r.json())
      .then(d => setData(d || []))
      .finally(() => setLoading(false));
  }, []);

  function setViewAndStore(v: 'list' | 'calendar') {
    setView(v);
    if (typeof window !== 'undefined') localStorage.setItem(VIEW_KEY, v);
  }

  const withNext = data
    .map((row) => {
      const { date, daysUntil } = getNextBirthday(row.dob);
      return { ...row, nextBirthday: date, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const byMonthDay: Record<string, any[]> = {};
  data.forEach((row) => {
    const [y, m, day] = row.dob.split('-').map(Number);
    if (m - 1 === currentMonth) {
      const key = `${currentMonth}-${day}`;
      const { daysUntil } = getNextBirthday(row.dob);
      if (!byMonthDay[key]) byMonthDay[key] = [];
      byMonthDay[key].push({ ...row, daysUntil });
    }
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Birthdays / जन्मदिन</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setViewAndStore('list')}
              style={{
                padding: '10px 16px', border: `1px solid ${view === 'list' ? '#0D47A1' : '#d1d5db'}`,
                borderRadius: 8, background: view === 'list' ? '#E3F0FF' : 'white', color: view === 'list' ? '#0D47A1' : '#374151',
                fontSize: 14, cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewAndStore('calendar')}
              style={{
                padding: '10px 16px', border: `1px solid ${view === 'calendar' ? '#0D47A1' : '#d1d5db'}`,
                borderRadius: 8, background: view === 'calendar' ? '#E3F0FF' : 'white', color: view === 'calendar' ? '#0D47A1' : '#374151',
                fontSize: 14, cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
        ) : view === 'list' ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Name / नाव</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Village / गाव</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Mobile / मोबाईल</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b' }}>DOB</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Days until birthday</th>
                  </tr>
                </thead>
                <tbody>
                  {withNext.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14 }}>
                        <Link href={`/voter/${row.id}`} style={{ color: '#0D47A1', fontWeight: 600, textDecoration: 'none' }}>
                          {row.name_english || row.name_marathi || '—'}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{row.village || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace' }}>{row.mobile || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>{row.dob}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: row.daysUntil === 0 ? '#059669' : row.daysUntil <= 7 ? '#d97706' : '#374151' }}>
                        {row.daysUntil === 0 ? "Today!" : row.daysUntil === 1 ? "Tomorrow" : `${row.daysUntil} days`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {withNext.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                <Cake size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                No birthdays found. Add DOB in voter profiles to see upcoming birthdays.
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>{monthNames[currentMonth]} {currentYear}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>{d}</div>
              ))}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = `${currentMonth}-${day}`;
                const birthdays = byMonthDay[key] || [];
                const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth;
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(birthdays.length > 0 ? new Date(currentYear, currentMonth, day) : null)}
                    style={{
                      minHeight: 60, padding: 8, border: `1px solid ${birthdays.length > 0 ? '#bae6fd' : '#e2e8f0'}`,
                      borderRadius: 8, cursor: birthdays.length > 0 ? 'pointer' : 'default',
                      background: isSelected ? '#E3F0FF' : birthdays.length > 0 ? '#f0f9ff' : '#fafafa',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{day}</div>
                    {birthdays.slice(0, 2).map((b: any) => (
                      <div key={b.id} style={{ fontSize: 10, color: '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Link href={`/voter/${b.id}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {b.name_english || b.name_marathi || '?'}
                        </Link>
                      </div>
                    ))}
                    {birthdays.length > 2 && <div style={{ fontSize: 10, color: '#94a3b8' }}>+{birthdays.length - 2} more</div>}
                  </div>
                );
              })}
            </div>
            {selectedDate && byMonthDay[`${selectedDate.getMonth()}-${selectedDate.getDate()}`] && (
              <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Birthdays on {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {byMonthDay[`${selectedDate.getMonth()}-${selectedDate.getDate()}`].map((row: any) => (
                    <Link key={row.id} href={`/voter/${row.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ fontWeight: 600 }}>{row.name_english || row.name_marathi}</span>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{row.village || '—'} {row.mobile ? `· ${row.mobile}` : ''}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
