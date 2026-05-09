import React, { useState, useMemo, useCallback } from 'react';
import {
    Users, Phone, TrendingUp, CheckCircle, Clock, Calendar,
    RefreshCw, ChevronDown, ChevronUp, Search, Filter,
    ArrowUpRight, BarChart3, UserCheck, PhoneOff, Star,
    BookOpen, Info, X, GraduationCap, Activity,
} from 'lucide-react';
import {
    CATEGORIES, COURSES, COUNSELLORS, LEADS,
    CALL_LOGS, LEAD_MAPPINGS, getCategoryStats, todayStr, nDaysAgo,
} from '../utils/mockData.js';
import { useAuth } from '../components/AuthProvider.jsx';

// ── Mock: HOD is head of B.Tech (category_id = 1)
const HOD_CATEGORY_ID = 1;

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDur(s) {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}
function isoToDate(iso) { return iso?.slice(0, 10) || ''; }

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub, trend }) {
    return (
        <div className="cdash-stat-card">
            <div className={`cdash-stat-icon cdash-icon-${color}`}><Icon size={20} /></div>
            <div className="cdash-stat-body">
                <div className="cdash-stat-value">{value}</div>
                <div className="cdash-stat-label">{label}</div>
                {sub && <div className="cdash-stat-sub">{sub}</div>}
            </div>
            {trend !== undefined && (
                <div className={`cdash-trend ${trend >= 0 ? 'up' : 'down'}`}>
                    <ArrowUpRight size={13} /><span>{Math.abs(trend)}%</span>
                </div>
            )}
        </div>
    );
}

function InterestBadge({ level }) {
    if (!level) return <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>;
    const map = {
        High: 'cdash-outcome-converted',
        Medium: 'cdash-outcome-interested',
        Low: 'cdash-outcome-nope',
    };
    return <span className={`cdash-outcome-badge ${map[level]}`}>{level}</span>;
}

function CallStatusBadge({ status }) {
    const map = {
        Answered: { cls: 'completed', label: 'Answered' },
        Busy: { cls: 'no_answer', label: 'Busy' },
        Voicemail: { cls: 'queued', label: 'Voicemail' },
    };
    const { cls, label } = map[status] || { cls: '', label: status };
    return <span className={`badge ${cls}`}>{label}</span>;
}

function CounsellorCard({ counsellor, logs, onSelect, isSelected }) {
    const myCalls = logs.filter(l => l.councillor_id === counsellor.id);
    const answered = myCalls.filter(l => l.successful_status === 'Answered').length;
    const converted = myCalls.filter(l => l.interest_level === 'High').length;
    const rate = myCalls.length > 0 ? Math.round((answered / myCalls.length) * 100) : 0;
    const followUps = myCalls.filter(l => l.follow_up_datetime).length;

    return (
        <div
            className={`hod-counsellor-card ${isSelected ? 'hod-counsellor-card--active' : ''}`}
            onClick={() => onSelect(isSelected ? null : counsellor)}
        >
            <div className="hod-cc-top">
                <div className="cdash-avatar" style={{ width: 38, height: 38, fontSize: '0.9rem', flexShrink: 0, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                    {counsellor.councillor_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{counsellor.councillor_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{counsellor.calling_language}</div>
                </div>
                {isSelected && <span className="sa-cc-badge-active">Selected</span>}
            </div>
            <div className="hod-cc-stats">
                <div className="hod-cc-stat"><div className="hod-cc-sv">{myCalls.length}</div><div className="hod-cc-sl">Calls</div></div>
                <div className="hod-cc-stat"><div className="hod-cc-sv" style={{ color: 'var(--success)' }}>{converted}</div><div className="hod-cc-sl">Converted</div></div>
                <div className="hod-cc-stat"><div className="hod-cc-sv" style={{ color: 'var(--warning)' }}>{followUps}</div><div className="hod-cc-sl">Follow-ups</div></div>
            </div>
            <div style={{ marginTop: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                    <span>Response Rate</span>
                    <span style={{ color: rate > 55 ? 'var(--success)' : 'var(--warning)' }}>{rate}%</span>
                </div>
                <div className="progress-bar" style={{ height: '4px' }}>
                    <div className="progress-bar-fill green" style={{ width: `${rate}%` }} />
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HODDashboard() {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(nDaysAgo(7));
    const [endDate, setEndDate] = useState(todayStr());
    const [activePreset, setActivePreset] = useState('7d');
    const [selectedCounsellor, setSelectedCounsellor] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [interestFilter, setInterestFilter] = useState('all');
    const [sortKey, setSortKey] = useState('call_datetime');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedLog, setSelectedLog] = useState(null);

    const applyPreset = useCallback((p) => {
        setActivePreset(p);
        const e = todayStr();
        const s = p === 'today' ? todayStr() : p === '7d' ? nDaysAgo(7) : p === '30d' ? nDaysAgo(30) : '2024-01-01';
        setStartDate(s); setEndDate(e);
    }, []);

    // My category counsellors & courses
    const myCounsellors = useMemo(() =>
        COUNSELLORS.filter(c => c.category_id === HOD_CATEGORY_ID), []);
    const myCourses = useMemo(() =>
        COURSES.filter(c => c.category_id === HOD_CATEGORY_ID), []);
    const myCourseIds = useMemo(() => myCourses.map(c => c.id), [myCourses]);
    const myCounsellorIds = useMemo(() => myCounsellors.map(c => c.id), [myCounsellors]);

    // Range logs for my dept
    const rangeLogs = useMemo(() =>
        CALL_LOGS.filter(l => {
            const d = isoToDate(l.call_datetime);
            return d >= startDate && d <= endDate && myCourseIds.includes(l.course_id);
        }), [startDate, endDate, myCourseIds]);

    // Stats
    const stats = useMemo(() => {
        const totalCalls = rangeLogs.length;
        const answered = rangeLogs.filter(l => l.successful_status === 'Answered').length;
        const converted = rangeLogs.filter(l => l.interest_level === 'High').length;
        const followUps = rangeLogs.filter(l => l.follow_up_datetime).length;
        const responseRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;
        const uniqueLeads = new Set(rangeLogs.map(l => l.lead_id)).size;
        const todayCalls = rangeLogs.filter(l => isoToDate(l.call_datetime) === todayStr()).length;
        return { totalCalls, answered, converted, followUps, responseRate, uniqueLeads, todayCalls };
    }, [rangeLogs]);

    // Filtered logs (with optional counsellor drill-down)
    const filteredLogs = useMemo(() => {
        let list = rangeLogs.filter(l => {
            if (selectedCounsellor && l.councillor_id !== selectedCounsellor.id) return false;
            if (statusFilter !== 'all' && l.successful_status !== statusFilter) return false;
            if (interestFilter !== 'all' && l.interest_level !== interestFilter) return false;
            const q = search.toLowerCase();
            if (q && !l.lead_name?.toLowerCase().includes(q) &&
                !l.lead_mobile?.includes(q) &&
                !l.course_name?.toLowerCase().includes(q) &&
                !l.councillor_name?.toLowerCase().includes(q)) return false;
            return true;
        });

        list = [...list].sort((a, b) => {
            let aVal = a[sortKey], bVal = b[sortKey];
            if (sortKey === 'call_datetime') { aVal = new Date(aVal); bVal = new Date(bVal); }
            if (sortKey === 'duration_seconds') { aVal = aVal || 0; bVal = bVal || 0; }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [rangeLogs, selectedCounsellor, statusFilter, interestFilter, search, sortKey, sortDir]);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };
    const SortIcon = ({ k }) => sortKey === k
        ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
        : <ChevronDown size={11} style={{ opacity: 0.3 }} />;

    const category = CATEGORIES.find(c => c.id === HOD_CATEGORY_ID);

    return (
        <div className="fade-in cdash-root">
            {/* ── Header ── */}
            <div className="page-header flex-between" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <div className="agent-name-label">
                        <GraduationCap size={12} style={{ display: 'inline', marginRight: 4 }} />
                        HOD Console — {category?.category_name} Department
                    </div>
                    <h1>HOD Dashboard</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {user?.email?.split('@')[0] || 'Head of Department'} · {myCounsellors.length} counsellors · {myCourses.length} courses
                    </p>
                </div>
                <button className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* ── Date Range ── */}
            <div className="cdash-filters-bar" style={{ marginBottom: '1.25rem' }}>
                <div className="cdash-preset-group">
                    {[{ label: 'Today', value: 'today' }, { label: '7 Days', value: '7d' }, { label: '30 Days', value: '30d' }, { label: 'All Time', value: 'all' }].map(p => (
                        <button key={p.value} className={`range-btn ${activePreset === p.value ? 'active' : ''}`} onClick={() => applyPreset(p.value)}>{p.label}</button>
                    ))}
                </div>
                <div className="cdash-date-inputs">
                    <div className="cdash-date-field"><Calendar size={13} /><input type="date" value={startDate} max={endDate} onChange={e => { setStartDate(e.target.value); setActivePreset('custom'); }} /></div>
                    <span style={{ color: 'var(--text-dim)' }}>→</span>
                    <div className="cdash-date-field"><Calendar size={13} /><input type="date" value={endDate} min={startDate} max={todayStr()} onChange={e => { setEndDate(e.target.value); setActivePreset('custom'); }} /></div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="cdash-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <StatCard icon={Phone} label="Total Calls" value={stats.totalCalls} color="blue" sub="in range" trend={6} />
                <StatCard icon={Users} label="Unique Leads" value={stats.uniqueLeads} color="purple" sub="contacted" />
                <StatCard icon={CheckCircle} label="Answered" value={stats.answered} color="green" sub={`${stats.responseRate}% response rate`} trend={11} />
                <StatCard icon={UserCheck} label="Converted (High)" value={stats.converted} color="teal" sub="high interest leads" />
                <StatCard icon={Clock} label="Follow-ups" value={stats.followUps} color="yellow" sub="scheduled" />
                <StatCard icon={Activity} label="Today's Calls" value={stats.todayCalls} color="red" sub="in your department" />
            </div>

            {/* ── Counsellor Cards ── */}
            <div style={{ margin: '1.5rem 0 1rem' }}>
                <div className="sa-section-header" style={{ marginBottom: '0.85rem' }}>
                    <h3 className="section-title">My Counsellors</h3>
                    {selectedCounsellor && (
                        <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setSelectedCounsellor(null)}>
                            × Clear filter
                        </button>
                    )}
                </div>
                <div className="hod-counsellor-grid">
                    {myCounsellors.map(c => (
                        <CounsellorCard
                            key={c.id}
                            counsellor={c}
                            logs={rangeLogs}
                            onSelect={setSelectedCounsellor}
                            isSelected={selectedCounsellor?.id === c.id}
                        />
                    ))}
                </div>
            </div>

            {/* ── Call Log Table ── */}
            <div className="cdash-table-section">
                <div className="cdash-table-header">
                    <div>
                        <h3 className="section-title" style={{ margin: 0 }}>
                            Call Logs
                            {selectedCounsellor && <span style={{ fontWeight: 400, color: 'var(--text-dim)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>— {selectedCounsellor.councillor_name}</span>}
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>{filteredLogs.length} records</p>
                    </div>
                    <div className="cdash-table-controls">
                        <div className="cdash-search-wrap">
                            <Search size={13} className="cdash-search-icon" />
                            <input type="text" placeholder="Search lead, course…" value={search}
                                onChange={e => setSearch(e.target.value)} className="cdash-search-input" />
                        </div>
                        <div className="cdash-filter-select-wrap">
                            <Filter size={12} />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cdash-filter-select">
                                <option value="all">All Status</option>
                                <option value="Answered">Answered</option>
                                <option value="Busy">Busy</option>
                                <option value="Voicemail">Voicemail</option>
                            </select>
                        </div>
                        <div className="cdash-filter-select-wrap">
                            <Star size={12} />
                            <select value={interestFilter} onChange={e => setInterestFilter(e.target.value)} className="cdash-filter-select">
                                <option value="all">All Interest</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {filteredLogs.length === 0 ? (
                    <div className="empty-state card"><BarChart3 size={44} /><h3>No logs found</h3><p>Adjust your filters or date range</p></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Counsellor</th>
                                    <th>Course</th>
                                    <th>Attempt</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('successful_status')}>
                                        <span className="cdash-th-inner">Status <SortIcon k="successful_status" /></span>
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('interest_level')}>
                                        <span className="cdash-th-inner">Interest <SortIcon k="interest_level" /></span>
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('duration_seconds')}>
                                        <span className="cdash-th-inner">Duration <SortIcon k="duration_seconds" /></span>
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('call_datetime')}>
                                        <span className="cdash-th-inner">Called At <SortIcon k="call_datetime" /></span>
                                    </th>
                                    <th>Follow-up</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div className="cdash-student-cell">
                                                <div className="cdash-avatar">{log.lead_name?.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.84rem' }}>{log.lead_name}</div>
                                                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{log.lead_mobile}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.councillor_name}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{log.course_name}</td>
                                        <td><span className="badge in_progress" style={{ fontSize: '0.7rem' }}>#{log.call_number}</span></td>
                                        <td><CallStatusBadge status={log.successful_status} /></td>
                                        <td><InterestBadge level={log.interest_level} /></td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{fmtDur(log.duration_seconds)}</td>
                                        <td className="text-dim text-sm">{fmtDate(log.call_datetime)}</td>
                                        <td style={{ fontSize: '0.78rem', color: log.follow_up_datetime ? 'var(--warning)' : 'var(--text-dim)' }}>
                                            {log.follow_up_datetime ? `📅 ${log.follow_up_datetime.slice(0, 10)}` : '—'}
                                        </td>
                                        <td>
                                            <button className="btn-ghost" style={{ padding: '0.3rem' }} onClick={e => { e.stopPropagation(); setSelectedLog(log); }}>
                                                <Info size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Log Detail Panel ── */}
            {selectedLog && (
                <div className="cdash-detail-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="cdash-detail-panel" onClick={e => e.stopPropagation()}>
                        <div className="cdash-detail-header">
                            <div>
                                <h2>{selectedLog.lead_name}</h2>
                                <span className="cdash-detail-phone">{selectedLog.lead_mobile}</span>
                            </div>
                            <button className="btn-ghost" onClick={() => setSelectedLog(null)}><X size={18} /></button>
                        </div>
                        <div className="cdash-detail-badges">
                            <CallStatusBadge status={selectedLog.successful_status} />
                            <InterestBadge level={selectedLog.interest_level} />
                        </div>
                        <div className="detail-grid" style={{ marginTop: '1.25rem' }}>
                            <div className="detail-item"><div className="detail-label">Counsellor</div><div className="detail-value">{selectedLog.councillor_name}</div></div>
                            <div className="detail-item"><div className="detail-label">Course</div><div className="detail-value">{selectedLog.course_name}</div></div>
                            <div className="detail-item"><div className="detail-label">Attempt</div><div className="detail-value">Call #{selectedLog.call_number}</div></div>
                            <div className="detail-item"><div className="detail-label">Duration</div><div className="detail-value">{fmtDur(selectedLog.duration_seconds)}</div></div>
                            <div className="detail-item"><div className="detail-label">Called At</div><div className="detail-value">{fmtDate(selectedLog.call_datetime)}</div></div>
                            {selectedLog.follow_up_datetime && (
                                <div className="detail-item"><div className="detail-label">Follow-up</div><div className="detail-value" style={{ color: 'var(--warning)' }}>{selectedLog.follow_up_datetime.slice(0, 10)}</div></div>
                            )}
                        </div>
                        {selectedLog.ai_transcript && (
                            <div style={{ marginTop: '1.25rem' }}>
                                <div className="inspector-section">
                                    <h4>AI Transcript (preview)</h4>
                                    <div className="cdash-notes-box">{selectedLog.ai_transcript}</div>
                                </div>
                            </div>
                        )}
                        {selectedLog.ai_extracted_data && (
                            <div style={{ marginTop: '1rem' }}>
                                <div className="inspector-section">
                                    <h4>AI Insights</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <div className="detail-label">Budget Concern</div>
                                            <div className="detail-value">{selectedLog.ai_extracted_data.budget_concern ? '⚠️ Yes' : '✅ No'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">Ready to Admit</div>
                                            <div className="detail-value">{selectedLog.ai_extracted_data.ready_to_admit ? '✅ Yes' : '❌ No'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
