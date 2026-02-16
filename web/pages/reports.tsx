import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import DateRangePicker from '../components/DateRangePicker';
import BoothChart from '../components/Charts/BoothChart';
import GenderPieChart from '../components/Charts/GenderPieChart';
import AgeLineChart from '../components/Charts/AgeLineChart';
import VillageBarChart from '../components/Charts/VillageBarChart';

type DateRange = {
  start: string;
  end: string;
};

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');
  const [workerPerformance, setWorkerPerformance] = useState<any[]>([]);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [showWorkerPerformance, setShowWorkerPerformance] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats(range?: DateRange | null) {
    try {
      setLoading(true);
      let url = '/api/reports/stats';
      if (range) {
        url += `?start_date=${range.start}&end_date=${range.end}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleApplyDateRange(range: DateRange) {
    setDateRange(range);
    fetchStats(range);
  }

  function handleClearDateRange() {
    setDateRange(null);
    fetchStats(null);
  }

  async function fetchWorkerPerformance() {
    try {
      setWorkerLoading(true);
      let url = '/api/reports/worker-performance';
      if (dateRange) {
        url += `?start_date=${dateRange.start}&end_date=${dateRange.end}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWorkerPerformance(data.workers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWorkerLoading(false);
    }
  }

  function getPerformanceColor(score: number) {
    if (score >= 70) return { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' };
    if (score >= 40) return { bg: '#fef3c7', border: '#fde68a', text: '#92400e' };
    return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' };
  }

  function toggleWorkerPerformance() {
    if (!showWorkerPerformance && workerPerformance.length === 0) {
      fetchWorkerPerformance();
    }
    setShowWorkerPerformance(!showWorkerPerformance);
  }

  async function exportReport(type: 'booth' | 'village' | 'status') {
    try {
      setExporting(type);
      let apiUrl = `/api/reports/export-${type}`;
      if (dateRange) {
        apiUrl += `?start_date=${dateRange.start}&end_date=${dateRange.end}`;
      }
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}-wise-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      // Show success message
      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!`);
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to export ${type} report. Please try again.`);
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ margin: 0, color: '#64748b' }}>Loading reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
              📊 अहवाल / Reports & Analytics
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
              Comprehensive voter data analytics and statistics
            </p>
          </div>

          {/* Date Range Picker */}
          <div style={{ marginBottom: 24 }}>
            <DateRangePicker
              onApply={handleApplyDateRange}
              onClear={handleClearDateRange}
              currentRange={dateRange}
            />
          </div>

          {/* View Toggle */}
          <div className="card" style={{ marginBottom: 24, padding: 16, display: 'flex', justifyContent: 'center', gap: 12, background: '#f8fafc' }}>
            <button
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              📊 Table View
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={viewMode === 'charts' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              📈 Chart View
            </button>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>एकूण मतदार / Total Voters</p>
              <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700 }}>{stats?.totals?.voters || 0}</p>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', border: 'none' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>👨‍👩‍👧‍👦</div>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>एकूण कुटुंबे / Total Families</p>
              <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700 }}>{stats?.totals?.families || 0}</p>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🙋</div>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>कार्यकर्ते / Workers</p>
              <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700 }}>{stats?.totals?.workers || 0}</p>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', border: 'none' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💼</div>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>कर्मचारी / Employees</p>
              <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700 }}>{stats?.totals?.employees || 0}</p>
            </div>
          </div>

          {/* Charts View */}
          {viewMode === 'charts' && stats && (
            <div style={{ display: 'grid', gap: 24 }}>
              {/* Row 1: Booth and Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
                <div className="card">
                  <BoothChart data={stats.booths || {}} />
                </div>
                <div className="card">
                  <GenderPieChart data={stats.gender || {}} />
                </div>
              </div>

              {/* Row 2: Age and Village */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
                <div className="card">
                  <AgeLineChart data={stats.ageGroups || {}} />
                </div>
                <div className="card">
                  <VillageBarChart data={stats.villages || {}} />
                </div>
              </div>
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              {/* Status Breakdown */}
              <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                स्थिती विश्लेषण / Status Breakdown
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {stats?.status && Object.entries(stats.status).map(([status, count]: [string, any]) => (
                  <div key={status} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 500,
                      color: status === 'Active' ? '#065f46' : '#991b1b'
                    }}>
                      {status === 'Active' ? '✅' : '⚠️'} {status}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: Math.min((count / (stats.totals.voters || 1)) * 200, 200),
                        height: 8,
                        background: status === 'Active' ? '#10b981' : '#ef4444',
                        borderRadius: 4
                      }}></div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Breakdown */}
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                लिंग विभाजन / Gender Distribution
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {stats?.gender && Object.entries(stats.gender).map(([gender, count]: [string, any]) => {
                  let genderLabel = gender;
                  if (gender === 'M') genderLabel = '👨 पुरुष / Male';
                  else if (gender === 'F') genderLabel = '👩 स्त्री / Female';
                  
                  return (
                    <div key={gender} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                        {genderLabel}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: Math.min((count / (stats.totals.voters || 1)) * 200, 200),
                          height: 8,
                          background: gender === 'M' ? '#3b82f6' : '#ec4899',
                          borderRadius: 4
                        }}></div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {stats?.gender && (
                <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#166534' }}>
                    📊 Female Ratio: {((stats.gender.F / (stats.totals.voters || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* Age Groups */}
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                वयोगट / Age Groups
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {stats?.ageGroups && Object.entries(stats.ageGroups).map(([group, count]: [string, any]) => (
                  <div key={group} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {group} years
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: Math.min((count / (stats.totals.voters || 1)) * 200, 200),
                        height: 8,
                        background: '#8b5cf6',
                        borderRadius: 4
                      }}></div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Village-wise Count */}
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                गावनिहाय / Village-wise Distribution
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {stats?.villages && Object.entries(stats.villages)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([village, count]: [string, any]) => (
                    <div key={village} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                        📍 {village}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: Math.min((count / (stats.totals.voters || 1)) * 200, 200),
                          height: 8,
                          background: '#10b981',
                          borderRadius: 4
                        }}></div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          {/* Booth-wise Analysis (Detailed Table) */}
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              बुथनिहाय विश्लेषण / Booth-wise Analysis
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                      बुथ नं / Booth #
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                      मतदार / Voters
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                      टक्केवारी / Percentage
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                      Visual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.booths && Object.entries(stats.booths)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 20)
                    .map(([booth, count]: [string, any]) => {
                      const percentage = ((count / (stats.totals.voters || 1)) * 100).toFixed(1);
                      return (
                        <tr key={booth} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                            🗳️ {booth}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            {count}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#64748b' }}>
                            {percentage}%
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{
                              width: `${percentage}%`,
                              minWidth: 20,
                              height: 8,
                              background: '#3b82f6',
                              borderRadius: 4
                            }}></div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {stats?.booths && Object.keys(stats.booths).length > 20 && (
              <p style={{ margin: '16px 0 0', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                Showing top 20 booths. Total booths: {Object.keys(stats.booths).length}
              </p>
            )}
          </div>
        </div>
          )}

          {/* Export Actions */}
          <div className="card" style={{ marginTop: 24, background: '#f8fafc', textAlign: 'center' }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
              📥 Download detailed reports (CSV format with bilingual headers)
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => exportReport('booth')} 
                disabled={exporting === 'booth'}
                className="btn-secondary"
                style={{ opacity: exporting === 'booth' ? 0.6 : 1 }}
              >
                {exporting === 'booth' ? '⏳ Exporting...' : '📥 Download Booth Report (CSV)'}
              </button>
              <button 
                onClick={() => exportReport('village')} 
                disabled={exporting === 'village'}
                className="btn-secondary"
                style={{ opacity: exporting === 'village' ? 0.6 : 1 }}
              >
                {exporting === 'village' ? '⏳ Exporting...' : '📥 Download Village Report (CSV)'}
              </button>
              <button 
                onClick={() => exportReport('status')} 
                disabled={exporting === 'status'}
                className="btn-secondary"
                style={{ opacity: exporting === 'status' ? 0.6 : 1 }}
              >
                {exporting === 'status' ? '⏳ Exporting...' : '📥 Download Status Report (CSV)'}
              </button>
            </div>
          </div>

          {/* Worker Performance Section */}
          <div className="card" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                🙋 कार्यकर्ता कामगिरी / Worker Performance Metrics
              </h3>
              <button
                onClick={toggleWorkerPerformance}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 14 }}
              >
                {showWorkerPerformance ? '🔼 Hide' : '🔽 Show Worker Performance'}
              </button>
            </div>

            {showWorkerPerformance && (
              <>
                {workerLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                    <p style={{ margin: 0, color: '#64748b' }}>Loading worker performance...</p>
                  </div>
                ) : (
                  <>
                    {/* Search Bar */}
                    <div style={{ marginBottom: 16 }}>
                      <input
                        type="text"
                        placeholder="🔍 Search worker by name..."
                        value={workerSearch}
                        onChange={(e) => setWorkerSearch(e.target.value)}
                        className="input"
                        style={{ maxWidth: 400 }}
                      />
                    </div>

                    {/* Performance Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              नाव / Name
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              मतदार / Voters
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              सक्रिय / Active
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              कुटुंबे / Families
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              गावे / Villages
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              संपर्क % / Contact %
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                              कामगिरी / Performance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerPerformance
                            .filter(worker => 
                              worker.name.toLowerCase().includes(workerSearch.toLowerCase())
                            )
                            .map((worker, idx) => {
                              const colors = getPerformanceColor(worker.performance_score);
                              return (
                                <tr key={worker.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                                      {idx + 1}. {worker.name}
                                    </div>
                                    {worker.mobile && (
                                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                        📱 {worker.mobile}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                    {worker.assigned_voters}
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>
                                      {worker.active_voters}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                      {worker.active_rate}%
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                                    {worker.families_covered}
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                                    {worker.villages_covered}
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#3b82f6' }}>
                                      {worker.contact_completion_rate}%
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                      {worker.voters_with_mobile}/{worker.assigned_voters}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{
                                      padding: '8px 12px',
                                      background: colors.bg,
                                      border: `1px solid ${colors.border}`,
                                      borderRadius: 6,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8
                                    }}>
                                      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                        <div style={{
                                          width: `${worker.performance_score}%`,
                                          height: '100%',
                                          background: colors.text,
                                          transition: 'width 0.3s'
                                        }}></div>
                                      </div>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: colors.text, minWidth: 40, textAlign: 'right' }}>
                                        {worker.performance_score}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {workerPerformance.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                        No worker data available
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
