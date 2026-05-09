import React, { useState, useMemo, useCallback } from 'react';
import {
    Users, Phone, ThumbsUp, TrendingUp, Activity, Calendar,
    RefreshCw, ChevronRight, ArrowUpRight, Search, X,
    UserPlus, BookOpen, Upload, Zap, BarChart3, ChevronLeft,
    GraduationCap, PhoneCall, Clock, AlertTriangle, Star,
    Shield, Brain, Filter, Info,
} from 'lucide-react';
import {
    CATEGORIES, COURSES, COUNSELLORS, LEADS, CALL_LOGS,
    LEAD_MAPPINGS, getCategoryStats, todayStr, nDaysAgo,
} from '../utils/mockData.js';
import { useAuth } from '../components/AuthProvider.jsx';
import AddCounsellorModal from '../components/AddCounsellorModal.jsx';
import AddHODModal from '../components/AddHODModal.jsx';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDur(s) {
    if (!s) return '—';
    const m = Math.floor(s / 60); const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, color, sub, trend }) {
    return (
        <div className="sa-metric-card">
            <div className={`sa-metric-icon sa-icon-${color}`}><Icon size={18} /></div>
            <div style={{ flex: 1 }}>
                <div className="sa-metric-value">{value}</div>
                <div className="sa-metric-label">{label}</div>
                {sub && <div className="sa-metric-sub">{sub}</div>}
            </div>
            {trend !== undefined && (
                <div className={`cdash-trend ${trend >= 0 ? 'up' : 'down'}`}>
                    <ArrowUpRight size={12} />
                    <span>{Math.abs(trend)}%</span>
                </div>
            )}
        </div>
    );
}

function CategoryCard({ cat, stats, onSelect, isSelected }) {
    const color = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#2dd4bf'][cat.id % 5];
    return (
        <div
            className={`sa-course-card ${isSelected ? 'sa-course-card--active' : ''}`}
            onClick={() => onSelect(cat)}
            style={{ '--cat-color': color }}
        >
            <div className="sa-cc-header">
                <div className="sa-cc-name">{cat.category_name}</div>
                {isSelected && <span className="sa-cc-badge-active">Selected</span>}
            </div>
            <div className="sa-cc-stats">
                <div className="sa-cc-stat"><span className="sa-cc-stat-v">{stats.counsellorCount}</span><span className="sa-cc-stat-l">Counsellors</span></div>
                <div className="sa-cc-stat"><span className="sa-cc-stat-v">{stats.totalLeads}</span><span className="sa-cc-stat-l">Leads</span></div>
                <div className="sa-cc-stat"><span className="sa-cc-stat-v">{stats.converted}</span><span className="sa-cc-stat-l">Converted</span></div>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                    <span>Response Rate</span><span style={{ color: stats.responseRate > 60 ? 'var(--success)' : 'var(--warning)' }}>{stats.responseRate}%</span>
                </div>
                <div className="progress-bar" style={{ height: '5px' }}>
                    <div className="progress-bar-fill green" style={{ width: `${stats.responseRate}%`, background: color }} />
                </div>
            </div>
            <button className="sa-cc-btn">
                View Details <ChevronRight size={13} />
            </button>
        </div>
    );
}

function InsightCard({ icon: Icon, color, title, text, action }) {
    return (
        <div className="sa-insight-card">
            <div className={`sa-insight-icon sa-icon-${color}`}><Icon size={16} /></div>
            <div className="sa-insight-title" style={{ color: `var(--${color === 'yellow' ? 'warning' : color === 'green' ? 'success' : color === 'red' ? 'error' : 'info'})` }}>
                {title}
            </div>
            <div className="sa-insight-text">{text}</div>
            {action && <div className="sa-insight-action">{action}</div>}
        </div>
    );
}

function CounsellorDetailRow({ counsellor, logs, onSelect }) {
    const myCalls = logs.filter(l => l.councillor_id === counsellor.id);
    const answered = myCalls.filter(l => l.successful_status === 'Answered').length;
    const converted = myCalls.filter(l => l.interest_level === 'High').length;
    const rate = myCalls.length > 0 ? Math.round((answered / myCalls.length) * 100) : 0;

    return (
        <tr onClick={() => onSelect(counsellor)} style={{ cursor: 'pointer' }} className="sa-counsellor-row">
            <td>
                <div className="cdash-student-cell">
                    <div className="cdash-avatar" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                        {counsellor.councillor_name.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.85rem' }}>{counsellor.councillor_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{counsellor.email_id}</div>
                    </div>
                </div>
            </td>
            <td style={{ fontSize: '0.82rem' }}>{myCalls.length}</td>
            <td style={{ fontSize: '0.82rem' }}>{answered}</td>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="progress-bar" style={{ width: '60px', height: '5px' }}>
                        <div className="progress-bar-fill green" style={{ width: `${rate}%` }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{rate}%</span>
                </div>
            </td>
            <td style={{ fontSize: '0.82rem', color: 'var(--success)' }}>{converted}</td>
            <td>
                <span className="cdash-outcome-badge cdash-outcome-interested" style={{ fontSize: '0.7rem' }}>
                    {counsellor.calling_language}
                </span>
            </td>
            <td>
                <span style={{ fontSize: '0.72rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View Logs <ChevronRight size={12} />
                </span>
            </td>
        </tr>
    );
}

// ── Mini bar chart (pure CSS) ────────────────────────────────────────────────
function BarChartWidget({ data }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="sa-bar-chart">
            {data.map((d, i) => (
                <div key={i} className="sa-bar-col">
                    <div
                        className="sa-bar"
                        style={{ height: `${(d.value / max) * 100}%` }}
                        title={`${d.label}: ${d.value}`}
                    />
                    <span className="sa-bar-label">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

// ── Donut chart (pure CSS) ────────────────────────────────────────────────────
function DonutChart({ segments }) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    let cumPct = 0;
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#2dd4bf'];
    return (
        <div className="sa-donut-wrap">
            <div className="sa-donut" style={{
                background: `conic-gradient(${segments.map((seg, i) => {
                    const pct = (seg.value / total) * 360;
                    const start = cumPct;
                    cumPct += pct;
                    return `${colors[i % colors.length]} ${start}deg ${cumPct}deg`;
                }).join(', ')})`
            }}>
                <div className="sa-donut-hole">
                    <span className="sa-donut-pct">{Math.round((segments[0]?.value / total) * 100)}%</span>
                    <span className="sa-donut-lbl">{segments[0]?.label}</span>
                </div>
            </div>
            <div className="sa-donut-legend">
                {segments.map((seg, i) => (
                    <div key={i} className="sa-donut-legend-item">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length], display: 'inline-block', marginRight: 5 }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{seg.label}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text)', marginLeft: 'auto', fontWeight: 600 }}>{Math.round((seg.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function QABtn({ icon: Icon, label, color }) {
    return (
        <button className={`sa-qa-btn sa-qa-${color}`}>
            <Icon size={16} />
            <span>{label}</span>
        </button>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(nDaysAgo(30));
    const [endDate, setEndDate] = useState(todayStr());
    const [activePreset, setActivePreset] = useState('30d');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCounsellor, setSelectedCounsellor] = useState(null);
    const [searchCounsellor, setSearchCounsellor] = useState('');
    const [logSearch, setLogSearch] = useState('');
    const [logStatusFilter, setLogStatusFilter] = useState('all');
    const [logInterestFilter, setLogInterestFilter] = useState('all');
    const [showAddCounsellor, setShowAddCounsellor] = useState(false);
    const [localCounsellors, setLocalCounsellors] = useState(COUNSELLORS);
    const [showAddHOD, setShowAddHOD] = useState(false);
    const [localHODs, setLocalHODs] = useState([]);

    function handleAddCounsellor(newC) {
        setLocalCounsellors(prev => [...prev, newC]);
    }
    function handleAddHOD(newHOD) {
        setLocalHODs(prev => [...prev, newHOD]);
    }

    const applyPreset = useCallback((p) => {
        setActivePreset(p);
        const e = todayStr();
        const s = p === 'today' ? todayStr() : p === '7d' ? nDaysAgo(7) : p === '30d' ? nDaysAgo(30) : '2024-01-01';
        setStartDate(s); setEndDate(e);
    }, []);

    // Filtered logs for the date range
    const rangeLogs = useMemo(() =>
        CALL_LOGS.filter(l => {
            const d = l.call_datetime.slice(0, 10);
            return d >= startDate && d <= endDate;
        }), [startDate, endDate]);

    // Global stats
    const globalStats = useMemo(() => {
        const totalCounsellors = localCounsellors.length;
        const callsToday = CALL_LOGS.filter(l => l.call_datetime.slice(0, 10) === todayStr()).length;
        const answered = rangeLogs.filter(l => l.successful_status === 'Answered').length;
        const converted = rangeLogs.filter(l => l.interest_level === 'High').length;
        const liveCalls = CALL_LOGS.filter(l => l.call_datetime.slice(0, 10) === todayStr() && l.successful_status === 'Answered').length;
        const followUps = CALL_LOGS.filter(l => l.follow_up_datetime).length;
        return { totalCounsellors, callsToday, answered, converted, liveCalls, followUps };
    }, [rangeLogs, localCounsellors]);

    // Per-category stats
    const catStats = useMemo(() =>
        CATEGORIES.map(cat => ({ cat, stats: getCategoryStats(cat.id, startDate, endDate) })),
        [startDate, endDate]);

    // Drill-down: counsellors for selected category (uses localCounsellors so new ones appear)
    const drillCounsellors = useMemo(() => {
        if (!selectedCategory) return [];
        return localCounsellors.filter(c => c.category_id === selectedCategory.id)
            .filter(c => c.councillor_name.toLowerCase().includes(searchCounsellor.toLowerCase()));
    }, [selectedCategory, searchCounsellor, localCounsellors]);

    // Level 3: call logs for selected counsellor
    const counsellorLogs = useMemo(() => {
        if (!selectedCounsellor) return [];
        return rangeLogs
            .filter(l => l.councillor_id === selectedCounsellor.id)
            .filter(l => {
                if (logStatusFilter !== 'all' && l.successful_status !== logStatusFilter) return false;
                if (logInterestFilter !== 'all' && l.interest_level !== logInterestFilter) return false;
                const q = logSearch.toLowerCase();
                if (q && !l.lead_name?.toLowerCase().includes(q) && !l.lead_mobile?.includes(q) && !l.course_name?.toLowerCase().includes(q)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.call_datetime) - new Date(a.call_datetime));
    }, [selectedCounsellor, rangeLogs, logSearch, logStatusFilter, logInterestFilter]);

    function selectCategory(cat) {
        setSelectedCategory(cat);
        setSelectedCounsellor(null);
        setSearchCounsellor('');
    }

    // Call volume per day (last 7 days)
    const volumeData = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = nDaysAgo(6 - i);
            const cnt = CALL_LOGS.filter(l => l.call_datetime.slice(0, 10) === d).length;
            return { label: new Date(d).toLocaleDateString([], { weekday: 'short' }), value: cnt };
        });
    }, []);

    // Interest distribution
    const interestDist = useMemo(() => {
        const high = rangeLogs.filter(l => l.interest_level === 'High').length;
        const med = rangeLogs.filter(l => l.interest_level === 'Medium').length;
        const low = rangeLogs.filter(l => l.interest_level === 'Low').length;
        return [
            { label: 'High Interest', value: high || 1 },
            { label: 'Medium Interest', value: med || 1 },
            { label: 'Low Interest', value: low || 1 },
        ];
    }, [rangeLogs]);

    // Live call activity (last 5 answered calls today)
    const liveActivity = useMemo(() =>
        CALL_LOGS
            .filter(l => l.call_datetime.slice(0, 10) === todayStr() && l.successful_status === 'Answered')
            .slice(0, 8),
        []);

    return (
        <div className="fade-in sa-root">
            {/* ── Welcome Banner ── */}
            <div className="sa-welcome-banner">
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />Super Admin Console
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#fff' }}>Welcome Back, Super Admin</h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Monitor AI counsellors, live calls, admissions and analytics in real-time.
                    </p>
                </div>
                <div className="sa-banner-badges">
                    <div className="sa-health-badge">
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Health</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>99.8%</div>
                    </div>
                    <div className="sa-health-badge">
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Accuracy</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8' }}>94.2%</div>
                    </div>
                </div>
            </div>

            {/* ── Date Range Filter ── */}
            <div className="cdash-filters-bar" style={{ marginBottom: '1.25rem' }}>
                <div className="cdash-preset-group">
                    {[{ label: 'Today', value: 'today' }, { label: '7D', value: '7d' }, { label: '30D', value: '30d' }, { label: 'All', value: 'all' }].map(p => (
                        <button key={p.value} className={`range-btn ${activePreset === p.value ? 'active' : ''}`} onClick={() => applyPreset(p.value)}>{p.label}</button>
                    ))}
                </div>
                <div className="cdash-date-inputs">
                    <div className="cdash-date-field"><Calendar size={13} /><input type="date" value={startDate} max={endDate} onChange={e => { setStartDate(e.target.value); setActivePreset('custom'); }} /></div>
                    <span style={{ color: 'var(--text-dim)' }}>→</span>
                    <div className="cdash-date-field"><Calendar size={13} /><input type="date" value={endDate} min={startDate} max={todayStr()} onChange={e => { setEndDate(e.target.value); setActivePreset('custom'); }} /></div>
                </div>
                <button className="btn-secondary" style={{ marginLeft: 'auto' }}><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* ── Global Metric Cards ── */}
            <div className="sa-metrics-grid">
                <MetricCard icon={Users} label="Total Counsellors" value={globalStats.totalCounsellors} color="purple" sub="Active AI agents" trend={4} />
                <MetricCard icon={Phone} label="Calls Today" value={globalStats.callsToday} color="blue" sub="vs yesterday" trend={13} />
                <MetricCard icon={ThumbsUp} label="Positive Responses" value={globalStats.answered} color="green" sub="Answered calls" trend={34} />
                <MetricCard icon={TrendingUp} label="Converted" value={globalStats.converted} color="teal" sub="High interest leads" trend={8} />
                <MetricCard icon={Activity} label="Active Live Calls" value={globalStats.liveCalls} color="red" sub="Right now" />
                <MetricCard icon={Calendar} label="Follow Ups" value={globalStats.followUps} color="yellow" sub="Scheduled" />
            </div>

            {/* ── Course Performance + Quick Actions ── */}
            <div className="sa-two-col">
                <div className="sa-col-main">
                    {/* ── Breadcrumb ── */}
                    <div className="sa-breadcrumb">
                        <button className={`sa-bc-item ${!selectedCategory ? 'sa-bc-active' : ''}`}
                            onClick={() => { setSelectedCategory(null); setSelectedCounsellor(null); }}>
                            All Departments
                        </button>
                        {selectedCategory && (
                            <>
                                <ChevronRight size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                                <button className={`sa-bc-item ${selectedCategory && !selectedCounsellor ? 'sa-bc-active' : ''}`}
                                    onClick={() => setSelectedCounsellor(null)}>
                                    {selectedCategory.category_name}
                                </button>
                            </>
                        )}
                        {selectedCounsellor && (
                            <>
                                <ChevronRight size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                                <span className="sa-bc-item sa-bc-active">{selectedCounsellor.councillor_name}</span>
                            </>
                        )}
                    </div>

                    {/* Level 0: All departments */}
                    {!selectedCategory && (
                        <div className="sa-course-grid">
                            {catStats.map(({ cat, stats }) => (
                                <CategoryCard key={cat.id} cat={cat} stats={stats} onSelect={selectCategory} isSelected={false} />
                            ))}
                        </div>
                    )}

                    {/* Level 1: Counsellors in department */}
                    {selectedCategory && !selectedCounsellor && (
                        <div>
                            <div className="sa-drill-header">
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                                    {drillCounsellors.length} counsellor{drillCounsellors.length !== 1 ? 's' : ''} in {selectedCategory.category_name} — click a row to view call logs
                                </div>
                                <div className="cdash-search-wrap">
                                    <Search size={13} className="cdash-search-icon" />
                                    <input type="text" placeholder="Search counsellor…"
                                        value={searchCounsellor} onChange={e => setSearchCounsellor(e.target.value)}
                                        className="cdash-search-input" style={{ width: 180 }} />
                                </div>
                            </div>
                            <div className="table-container" style={{ marginTop: '0.75rem' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Counsellor</th>
                                            <th>Total Calls</th>
                                            <th>Answered</th>
                                            <th>Response Rate</th>
                                            <th>Converted</th>
                                            <th>Languages</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drillCounsellors.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No counsellors found</td></tr>
                                        ) : (
                                            drillCounsellors.map(c => (
                                                <CounsellorDetailRow key={c.id} counsellor={c} logs={rangeLogs} onSelect={setSelectedCounsellor} />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Level 2: Call logs for selected counsellor */}
                    {selectedCounsellor && (
                        <div>
                            {/* Counsellor summary strip */}
                            <div className="sa-counsellor-strip">
                                <div className="cdash-avatar" style={{ width: 44, height: 44, fontSize: '1rem', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', flexShrink: 0 }}>
                                    {selectedCounsellor.councillor_name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{selectedCounsellor.councillor_name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{selectedCounsellor.email_id} · {selectedCounsellor.mobile_no}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Languages: {selectedCounsellor.calling_language}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.25rem', flexShrink: 0 }}>
                                    {[
                                        ['Total', rangeLogs.filter(l => l.councillor_id === selectedCounsellor.id).length, 'var(--text)'],
                                        ['Answered', rangeLogs.filter(l => l.councillor_id === selectedCounsellor.id && l.successful_status === 'Answered').length, 'var(--success)'],
                                        ['High Interest', rangeLogs.filter(l => l.councillor_id === selectedCounsellor.id && l.interest_level === 'High').length, '#818cf8'],
                                    ].map(([lbl, val, col]) => (
                                        <div key={lbl} style={{ textAlign: 'center' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: col }}>{val}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lbl}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Log filters */}
                            <div className="cdash-table-controls" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div className="cdash-search-wrap">
                                    <Search size={13} className="cdash-search-icon" />
                                    <input type="text" placeholder="Search lead, course…" value={logSearch}
                                        onChange={e => setLogSearch(e.target.value)} className="cdash-search-input" />
                                </div>
                                <div className="cdash-filter-select-wrap">
                                    <Filter size={12} />
                                    <select value={logStatusFilter} onChange={e => setLogStatusFilter(e.target.value)} className="cdash-filter-select">
                                        <option value="all">All Status</option>
                                        <option value="Answered">Answered</option>
                                        <option value="Busy">Busy</option>
                                        <option value="Voicemail">Voicemail</option>
                                    </select>
                                </div>
                                <div className="cdash-filter-select-wrap">
                                    <Star size={12} />
                                    <select value={logInterestFilter} onChange={e => setLogInterestFilter(e.target.value)} className="cdash-filter-select">
                                        <option value="all">All Interest</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-dim)' }}>{counsellorLogs.length} records</span>
                            </div>

                            {counsellorLogs.length === 0 ? (
                                <div className="empty-state card"><BarChart3 size={40} /><h3>No logs found</h3><p>Adjust filters or date range</p></div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Lead</th>
                                                <th>Course</th>
                                                <th>Attempt</th>
                                                <th>Status</th>
                                                <th>Interest</th>
                                                <th>Duration</th>
                                                <th>Called At</th>
                                                <th>Follow-up</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {counsellorLogs.map(log => (
                                                <tr key={log.id}>
                                                    <td>
                                                        <div className="cdash-student-cell">
                                                            <div className="cdash-avatar">{log.lead_name?.charAt(0)}</div>
                                                            <div>
                                                                <div style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--text)' }}>{log.lead_name}</div>
                                                                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{log.lead_mobile}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem' }}>{log.course_name}</td>
                                                    <td><span className="badge in_progress" style={{ fontSize: '0.7rem' }}>#{log.call_number}</span></td>
                                                    <td>
                                                        <span className={`badge ${log.successful_status === 'Answered' ? 'completed' : log.successful_status === 'Busy' ? 'no_answer' : 'queued'}`}>
                                                            {log.successful_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {log.interest_level ? (
                                                            <span className={`cdash-outcome-badge ${log.interest_level === 'High' ? 'cdash-outcome-converted' : log.interest_level === 'Medium' ? 'cdash-outcome-interested' : 'cdash-outcome-nope'}`}>
                                                                {log.interest_level}
                                                            </span>
                                                        ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>}
                                                    </td>
                                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{fmtDur(log.duration_seconds)}</td>
                                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{fmtDate(log.call_datetime)}</td>
                                                    <td style={{ fontSize: '0.78rem', color: log.follow_up_datetime ? 'var(--warning)' : 'var(--text-dim)' }}>
                                                        {log.follow_up_datetime ? `📅 ${log.follow_up_datetime.slice(0, 10)}` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="sa-col-side">
                    <h3 className="section-title" style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                    <div className="sa-qa-grid">
                        <button className="sa-qa-btn sa-qa-green" onClick={() => setShowAddHOD(true)}>
                            <GraduationCap size={16}/><span>Add HOD</span>
                        </button>
                        <button className="sa-qa-btn sa-qa-purple" onClick={() => setShowAddCounsellor(true)}>
                            <UserPlus size={16}/><span>Add Counsellor</span>
                        </button>
                        <QABtn icon={BookOpen} label="Add Course" color="blue" />
                        <QABtn icon={Upload} label="Upload Leads" color="green" />
                        <QABtn icon={Brain} label="Generate AI Report" color="indigo" />
                    </div>

                    {/* Summary KPIs */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Summary</h4>
                        {[
                            { label: 'Total Leads', value: LEADS.length, color: 'var(--info)' },
                            { label: 'Total Courses', value: COURSES.length, color: 'var(--success)' },
                            { label: 'Departments', value: CATEGORIES.length, color: 'var(--warning)' },
                            { label: 'Avg Response Rate', value: `${Math.round(catStats.reduce((s, { stats }) => s + stats.responseRate, 0) / catStats.length)}%`, color: '#c084fc' },
                        ].map(item => (
                            <div key={item.label} className="sa-summary-row">
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{item.label}</span>
                                <span style={{ fontWeight: 700, color: item.color, fontSize: '0.9rem' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── AI Detected Patterns ── */}
            <div style={{ margin: '1.75rem 0 1.25rem' }}>
                <div className="sa-section-header">
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={16} color="#818cf8" /> AI Detected Patterns
                    </h3>
                </div>
                <div className="sa-insights-grid">
                    <InsightCard icon={AlertTriangle} color="yellow" title="BUDGET DETECTION"
                        text="Budget concern detected in 24% of morning calls."
                        action="Recommended: Trigger scholarship script." />
                    <InsightCard icon={TrendingUp} color="green" title="HIGH INTEREST"
                        text="42 leads identified as 'Ready to Admit' by AI."
                        action="Priority 1 routing enabled." />
                    <InsightCard icon={Users} color="blue" title="INFLUENCE FACTOR"
                        text="Parent influence detected as primary blocker in B.Tech."
                        action="Schedule parent-centric webinars." />
                    <InsightCard icon={Star} color="purple" title="SENTIMENT SCORE"
                        text="Overall AI sentiment trend: Up 14%."
                        action={<span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc' }}>8.4<span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/10</span></span>} />
                </div>
            </div>

            {/* ── Live Call Activity ── */}
            <div className="sa-section-header" style={{ marginBottom: '0.75rem' }}>
                <h3 className="section-title">Live AI Call Activity</h3>
                <span className="cdash-pending-count" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="cdash-pending-dot" /> {liveActivity.length} Live
                </span>
            </div>
            <div className="table-container" style={{ marginBottom: '1.75rem' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Counsellor</th>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Call #</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Interest</th>
                            <th>Follow-up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {liveActivity.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No live calls right now</td></tr>
                        ) : (
                            liveActivity.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div className="cdash-student-cell">
                                            <div className="cdash-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                                                {log.councillor_name?.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text)' }}>AI-{log.councillor_name?.split(' ')[0]}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{log.lead_name}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{log.course_name}</td>
                                    <td><span className="badge in_progress" style={{ fontSize: '0.7rem' }}>Attempt {log.call_number}</span></td>
                                    <td><span className="badge completed" style={{ fontSize: '0.7rem' }}>Answered</span></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{fmtDur(log.duration_seconds)}</td>
                                    <td>
                                        {log.interest_level && (
                                            <span className={`cdash-outcome-badge ${log.interest_level === 'High' ? 'cdash-outcome-converted' : log.interest_level === 'Medium' ? 'cdash-outcome-interested' : 'cdash-outcome-nope'}`}>
                                                {log.interest_level}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: log.follow_up_datetime ? 'var(--warning)' : 'var(--text-dim)' }}>
                                        {log.follow_up_datetime ? `📅 ${log.follow_up_datetime.slice(0, 10)}` : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Charts Row ── */}
            <div className="sa-charts-row">
                <div className="sa-chart-card">
                    <h4 className="sa-chart-title">Call Volume Per Day</h4>
                    <BarChartWidget data={volumeData} />
                </div>
                <div className="sa-chart-card">
                    <h4 className="sa-chart-title">Interest Distribution</h4>
                    <DonutChart segments={interestDist} />
                </div>
            </div>

            {/* ── Add Counsellor Modal ── */}
            {showAddCounsellor && (
                <AddCounsellorModal
                    onSave={handleAddCounsellor}
                    onClose={() => setShowAddCounsellor(false)}
                />
            )}
            {showAddHOD && (
                <AddHODModal
                    onSave={handleAddHOD}
                    onClose={() => setShowAddHOD(false)}
                />
            )}
        </div>
    );
}
