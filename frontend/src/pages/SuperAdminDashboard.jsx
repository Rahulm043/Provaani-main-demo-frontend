import React, { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import {
    Users, Phone, ThumbsUp, TrendingUp, Calendar,
    RefreshCw, ChevronRight, ArrowUpRight, Search, X,
    UserPlus, BookOpen, BarChart3, ChevronLeft,
    GraduationCap, PhoneCall, Clock, Star,
    Shield, Filter, Info, Activity, LayoutDashboard
} from 'lucide-react';
import { swrFetcher } from '../utils/api.js';
import { todayStr, nDaysAgo } from '../utils/date.js';
import { useAuth } from '../components/AuthProvider.jsx';
import AddCounsellorModal from '../components/AddCounsellorModal.jsx';
import AddHODModal from '../components/AddHODModal.jsx';
import { Link } from 'react-router-dom';

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

function MetricTile({ icon: Icon, label, value, color }) {
    return (
        <div className="sa-metric-tile">
            <div className="sa-tile-header">
                <div className="sa-tile-label">{label}</div>
                <div className={`sa-tile-icon sa-icon-${color}`}><Icon size={14} /></div>
            </div>
            <div className="sa-tile-value">{value}</div>
        </div>
    );
}

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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '-0.25rem', marginBottom: '0.6rem' }}>
                HOD: <span style={{ color: 'var(--text-secondary)' }}>{stats.hodName}</span>
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
    const id = counsellor.councillor_id || counsellor.id;
    const myCalls = logs.filter(l => l.councillor_id === id);
    const answered = myCalls.filter(l => l.successful_status === 'Answered').length;
    const converted = myCalls.filter(l => l.interest_level === 'Hot').length;
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
function QABtn({ icon: Icon, label, color, to }) {
    if (to) {
        return (
            <Link to={to} className={`sa-qa-btn sa-qa-${color}`}>
                <Icon size={16} />
                <span>{label}</span>
            </Link>
        );
    }
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
    const { data, mutate, isLoading } = useSWR('/api/crm/dashboard?scope=superadmin', swrFetcher, { refreshInterval: 10000 });
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
    const [showAddHOD, setShowAddHOD] = useState(false);

    const departments = data?.departments || [];
    const courses = data?.courses || [];
    const counsellors = data?.councillors || [];
    const hods = data?.hods || [];
    const leads = data?.leads || [];
    const allLogs = data?.call_logs || [];

    function handleAddCounsellor(newC) {
        mutate();
    }
    function handleAddHOD(newHOD) {
        mutate();
    }

    const applyPreset = useCallback((p) => {
        setActivePreset(p);
        const e = todayStr();
        const s = p === 'today' ? todayStr() : p === '7d' ? nDaysAgo(7) : p === '30d' ? nDaysAgo(30) : '2024-01-01';
        setStartDate(s); setEndDate(e);
    }, []);

    // Filtered logs for the date range
    const rangeLogs = useMemo(() =>
        allLogs.filter(l => {
            const d = l.call_datetime.slice(0, 10);
            return d >= startDate && d <= endDate;
        }), [allLogs, startDate, endDate]);

    // Global stats
    const globalStats = useMemo(() => {
        const totalCounsellors = counsellors.length;
        const callsToday = allLogs.filter(l => l.call_datetime.slice(0, 10) === todayStr()).length;
        const answered = rangeLogs.filter(l => l.successful_status === 'Answered').length;
        const converted = rangeLogs.filter(l => l.interest_level === 'Hot').length;
        const liveCalls = allLogs.filter(l => l.call_datetime.slice(0, 10) === todayStr() && l.successful_status === 'Answered').length;
        const followUps = allLogs.filter(l => l.follow_up_datetime).length;
        return { totalCounsellors, callsToday, answered, converted, liveCalls, followUps };
    }, [rangeLogs, counsellors, allLogs]);

    // Per-category stats
    const catStats = useMemo(() =>
        departments.map(cat => {
            const courseIds = courses.filter(c => (c.category_id || c.department_id) === cat.id).map(c => c.id);
            const logs = rangeLogs.filter(l => courseIds.includes(l.course_id) || l.department_id === cat.id);
            const answered = logs.filter(l => l.successful_status === 'Answered').length;
            const highInterest = logs.filter(l => l.interest_level === 'Hot').length;
            const hod = hods.find(h => h.category_id === cat.id || h.department_id === cat.id);
            return { cat, stats: {
                counsellorCount: counsellors.filter(c => c.category_id === cat.id).length,
                hodName: hod?.hod_name || hod?.name || 'No HOD assigned',
                totalLeads: new Set(logs.map(l => l.lead_id)).size,
                totalCalls: logs.length,
                answered,
                highInterest,
                responseRate: logs.length ? Math.round((answered / logs.length) * 100) : 0,
                converted: highInterest,
            }};
        }),
        [departments, courses, counsellors, hods, rangeLogs]);

    // Drill-down: counsellors for selected category from the real CRM API
    const drillCounsellors = useMemo(() => {
        if (!selectedCategory) return [];
        return counsellors.filter(c => c.category_id === selectedCategory.id)
            .filter(c => c.councillor_name.toLowerCase().includes(searchCounsellor.toLowerCase()));
    }, [selectedCategory, searchCounsellor, counsellors]);

    // Level 3: call logs for selected counsellor
    const counsellorLogs = useMemo(() => {
        if (!selectedCounsellor) return [];
        return rangeLogs
            .filter(l => l.councillor_id === (selectedCounsellor.councillor_id || selectedCounsellor.id))
            .filter(l => {
                if (logStatusFilter !== 'all' && l.successful_status !== logStatusFilter) return false;
                if (logInterestFilter !== 'all' && l.interest_level !== logInterestFilter) return false;
                const q = logSearch.toLowerCase();
                if (q && !l.lead_name?.toLowerCase().includes(q) && !l.lead_mobile?.includes(q) && !(l.interest_course_name || l.course_name)?.toLowerCase().includes(q)) return false;
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
            const cnt = allLogs.filter(l => l.call_datetime.slice(0, 10) === d).length;
            return { label: new Date(d).toLocaleDateString([], { weekday: 'short' }), value: cnt };
        });
    }, [allLogs]);

    // Interest distribution
    const interestDist = useMemo(() => {
        const hot = rangeLogs.filter(l => l.interest_level === 'Hot').length;
        const warm = rangeLogs.filter(l => l.interest_level === 'Warm').length;
        const cold = rangeLogs.filter(l => l.interest_level === 'Cold').length;
        return [
            { label: 'Hot Interest', value: hot || 1 },
            { label: 'Warm Interest', value: warm || 1 },
            { label: 'Cold Interest', value: cold || 1 },
        ];
    }, [rangeLogs]);

    return (
        <div className="fade-in sa-root">
            {isLoading && <div className="empty-state card" style={{ marginBottom: '1rem' }}><BarChart3 size={40} /><h3>Loading real CRM data...</h3></div>}
            {/* ── Welcome Banner ── */}
            <div className="sa-welcome-banner">
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />Super Admin Console
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#fff' }}>Welcome Back, Super Admin</h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Run AI campaigns, manage course/stream routing, and monitor qualified leads.
                    </p>
                </div>
                <div className="sa-banner-right">
                    {/* Badges row */}
                    <div className="sa-banner-badges-row">
                        <div className="sa-health-badge">
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Depts</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>{departments.length}</div>
                        </div>
                        <div className="sa-health-badge">
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HODs</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8' }}>{hods.length}</div>
                        </div>
                        <div className="sa-health-badge">
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leads</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa' }}>{leads.length}</div>
                        </div>
                    </div>
                    {/* Action buttons row */}
                    <div className="sa-banner-actions-row">
                        <button className="sa-banner-action-btn green" onClick={() => setShowAddHOD(true)}>
                            <GraduationCap size={13} />Add HOD
                        </button>
                        <button className="sa-banner-action-btn purple" onClick={() => setShowAddCounsellor(true)}>
                            <UserPlus size={13} />Add Counsellor
                        </button>
                        <Link to="/courses" className="sa-banner-action-btn blue">
                            <BookOpen size={13} />Manage Courses
                        </Link>
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

            {/* ── Consolidated Dashboard Insights ── */}
            <div className="sa-insights-panel">
                {/* Metrics Grid */}
                <div className="sa-metrics-column">
                    <MetricTile icon={PhoneCall} label="Total Leads" value={leads.length} color="blue" />
                    <MetricTile icon={Activity} label="AI Calls Today" value={globalStats.callsToday} color="red" />
                    <MetricTile icon={ThumbsUp} label="AI Answered" value={globalStats.answered} color="green" />
                    <MetricTile icon={TrendingUp} label="Converted" value={globalStats.converted} color="teal" />
                    <MetricTile icon={Calendar} label="Follow Ups" value={globalStats.followUps} color="yellow" />
                    <MetricTile icon={Users} label="Counselors" value={globalStats.totalCounsellors} color="purple" />
                    <MetricTile icon={BookOpen} label="Total Courses" value={courses.length} color="indigo" />
                    <MetricTile icon={GraduationCap} label="Active HODs" value={hods.length} color="purple" />
                </div>

                {/* Charts Area */}
                <div className="sa-charts-column">
                    <div className="sa-compact-chart-card">
                        <div className="sa-compact-chart-title">Call Volume (7D)</div>
                        <div className="sa-compact-chart-content">
                            <BarChartWidget data={volumeData} />
                        </div>
                    </div>
                    <div className="sa-compact-chart-card">
                        <div className="sa-compact-chart-title">Interest Distribution</div>
                        <div className="sa-compact-chart-content">
                            <DonutChart segments={interestDist} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Dashboard Content ── */}
            <div className="sa-main-content-full">

                <div className="sa-col-main">
                    {/* ── Breadcrumb ── */}
                    <div className="sa-breadcrumb" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(selectedCategory || selectedCounsellor) && (
                            <button className="btn-secondary" style={{ marginRight: '1rem', padding: '0.4rem 0.8rem', height: 'auto', fontSize: '0.8rem' }} onClick={() => {
                                if (selectedCounsellor) setSelectedCounsellor(null);
                                else if (selectedCategory) setSelectedCategory(null);
                            }}>
                                <ChevronLeft size={14} /> Back
                            </button>
                        )}
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
                                    HOD: {catStats.find(x => x.cat.id === selectedCategory.id)?.stats?.hodName || 'No HOD assigned'} · {drillCounsellors.length} counsellor{drillCounsellors.length !== 1 ? 's' : ''} in {selectedCategory.category_name}
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
                                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No counsellors found. HOD is still visible for this course bucket.</td></tr>
                                        ) : (
                                            drillCounsellors.map(c => (
                                                <CounsellorDetailRow key={c.councillor_id || c.id} counsellor={c} logs={rangeLogs} onSelect={setSelectedCounsellor} />
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
                                        ['Total', rangeLogs.filter(l => l.councillor_id === (selectedCounsellor.councillor_id || selectedCounsellor.id)).length, 'var(--text)'],
                                        ['Answered', rangeLogs.filter(l => l.councillor_id === (selectedCounsellor.councillor_id || selectedCounsellor.id) && l.successful_status === 'Answered').length, 'var(--success)'],
                                        ['Hot Interest', rangeLogs.filter(l => l.councillor_id === (selectedCounsellor.councillor_id || selectedCounsellor.id) && l.interest_level === 'Hot').length, '#818cf8'],
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
                                        <option value="Hot">Hot</option>
                                        <option value="Warm">Warm</option>
                                        <option value="Cold">Cold</option>
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
                                                    <td style={{ fontSize: '0.8rem' }}>{log.interest_course_name || log.course_name || '—'}{log.unsupported_course ? ' (unsupported)' : ''}</td>
                                                    <td><span className="badge in_progress" style={{ fontSize: '0.7rem' }}>#{log.call_number}</span></td>
                                                    <td>
                                                        <span className={`badge ${log.successful_status === 'Answered' ? 'completed' : log.successful_status === 'Busy' ? 'no_answer' : 'queued'}`}>
                                                            {log.successful_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {log.interest_level ? (
                                                            <span className={`cdash-outcome-badge ${log.interest_level === 'Hot' ? 'cdash-outcome-converted' : log.interest_level === 'Warm' ? 'cdash-outcome-interested' : 'cdash-outcome-nope'}`}>
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
            </div>

            {/* ── Add Counsellor Modal ── */}
            {showAddCounsellor && (
                <AddCounsellorModal
                    onSave={handleAddCounsellor}
                    onClose={() => setShowAddCounsellor(false)}
                    departments={departments}
                    courses={courses}
                />
            )}
            {showAddHOD && (
                <AddHODModal
                    onSave={handleAddHOD}
                    onClose={() => setShowAddHOD(false)}
                    departments={departments}
                    courses={courses}
                />
            )}
        </div>
    );
}
