import React, { useState, useMemo, useCallback } from 'react';
import { Phone, Clock, CheckCircle, Users, Calendar, RefreshCw, ChevronDown, ChevronUp, Search, AlertCircle, Star, Filter, BarChart3, ArrowUpRight, UserCheck, Info, X, Edit2 } from 'lucide-react';
import { CALL_LOGS, LEADS, COURSES, COUNSELLORS, LEAD_MAPPINGS, todayStr, nDaysAgo } from '../utils/mockData.js';
import { useAuth } from '../components/AuthProvider.jsx';
import LogCallModal from '../components/LogCallModal.jsx';
import RemainingLeads from '../components/RemainingLeads.jsx';

const MY_ID = 1;

function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmtDur(s) { if (!s) return '0s'; const m = Math.floor(s / 60); return m > 0 ? `${m}m ${s % 60}s` : `${s}s`; }
function isoToDate(iso) { return iso?.slice(0, 10) || ''; }

function StatCard({ icon: Icon, label, value, color, sub, trend }) {
    return (
        <div className="cdash-stat-card">
            <div className={`cdash-stat-icon cdash-icon-${color}`}><Icon size={20} /></div>
            <div className="cdash-stat-body">
                <div className="cdash-stat-value">{value}</div>
                <div className="cdash-stat-label">{label}</div>
                {sub && <div className="cdash-stat-sub">{sub}</div>}
            </div>
            {trend !== undefined && <div className={`cdash-trend ${trend >= 0 ? 'up' : 'down'}`}><ArrowUpRight size={13} /><span>{Math.abs(trend)}%</span></div>}
        </div>
    );
}

function CSBadge({ s }) {
    const m = { Answered: ['completed','Answered'], Busy: ['no_answer','Busy'], Voicemail: ['queued','Voicemail'] };
    const [cls, lbl] = m[s] || ['', s];
    return <span className={`badge ${cls}`}>{lbl}</span>;
}

function IBadge({ level }) {
    if (!level) return <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>;
    const cls = level === 'High' ? 'cdash-outcome-converted' : level === 'Medium' ? 'cdash-outcome-interested' : 'cdash-outcome-nope';
    return <span className={`cdash-outcome-badge ${cls}`}>{level === 'High' ? '✦ ' : level === 'Medium' ? '◈ ' : '— '}{level}</span>;
}

export default function CounsellorDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('logs');
    const [startDate, setStartDate] = useState(todayStr());
    const [endDate, setEndDate] = useState(todayStr());
    const [preset, setPreset] = useState('today');
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState('all');
    const [interestF, setInterestF] = useState('all');
    const [sortKey, setSortKey] = useState('call_datetime');
    const [sortDir, setSortDir] = useState('desc');
    const [detailLog, setDetailLog] = useState(null);
    const [modalLead, setModalLead] = useState(null);
    const [modalLog, setModalLog] = useState(null);
    const [localLogs, setLocalLogs] = useState(CALL_LOGS);
    const [dismissed, setDismissed] = useState(new Set());

    const applyPreset = useCallback((p) => {
        setPreset(p);
        const s = p === 'today' ? todayStr() : p === '7d' ? nDaysAgo(7) : p === '30d' ? nDaysAgo(30) : '2024-01-01';
        setStartDate(s); setEndDate(todayStr());
    }, []);

    const myLogs = useMemo(() => localLogs.filter(l => l.councillor_id === MY_ID), [localLogs]);

    const rangeLogs = useMemo(() => myLogs.filter(l => {
        const d = isoToDate(l.call_datetime);
        return d >= startDate && d <= endDate;
    }), [myLogs, startDate, endDate]);

    const stats = useMemo(() => {
        const total = rangeLogs.length;
        const answered = rangeLogs.filter(l => l.successful_status === 'Answered').length;
        const uniqueLeads = new Set(rangeLogs.map(l => l.lead_id)).size;
        const converted = rangeLogs.filter(l => l.interest_level === 'High').length;
        const convRate = answered > 0 ? Math.round((converted / answered) * 100) : 0;
        const totalSec = rangeLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0);
        const followUps = rangeLogs.filter(l => l.follow_up_datetime).length;
        return { total, answered, uniqueLeads, converted, convRate, totalSec, followUps };
    }, [rangeLogs]);

    const todayFollowUps = useMemo(() =>
        myLogs.filter(l => l.follow_up_datetime && isoToDate(l.follow_up_datetime) === todayStr()), [myLogs]);

    // Remaining leads: assigned to me but never called
    const calledLeadIds = useMemo(() => new Set(myLogs.map(l => l.lead_id)), [myLogs]);
    const myMappings = useMemo(() => LEAD_MAPPINGS.filter(m => m.councillor_id === MY_ID), []);
    const remainingLeads = useMemo(() => {
        const priorities = ['High', 'Medium', 'Low'];
        return myMappings
            .filter(m => !calledLeadIds.has(m.lead_id) && !dismissed.has(m.lead_id))
            .map((m, i) => {
                const lead = LEADS.find(l => l.id === m.lead_id);
                return { ...lead, assignment_date: m.assignment_date, priority: priorities[i % 3] };
            }).filter(Boolean);
    }, [myMappings, calledLeadIds, dismissed]);

    const filteredLogs = useMemo(() => {
        let list = rangeLogs.filter(l => {
            if (statusF !== 'all' && l.successful_status !== statusF) return false;
            if (interestF !== 'all' && l.interest_level !== interestF) return false;
            const q = search.toLowerCase();
            if (q && !l.lead_name?.toLowerCase().includes(q) && !l.lead_mobile?.includes(q) && !l.course_name?.toLowerCase().includes(q)) return false;
            return true;
        });
        return [...list].sort((a, b) => {
            let aV = a[sortKey], bV = b[sortKey];
            if (sortKey === 'call_datetime') { aV = new Date(aV); bV = new Date(bV); }
            if (sortKey === 'duration_seconds') { aV = aV || 0; bV = bV || 0; }
            return sortDir === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
        });
    }, [rangeLogs, statusF, interestF, search, sortKey, sortDir]);

    const toggleSort = (k) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };
    const SI = ({ k }) => sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ChevronDown size={11} style={{ opacity: 0.3 }} />;

    function handleSaveLog({ status, interest, followUp, notes }) {
        if (modalLog) {
            setLocalLogs(prev => prev.map(l => l.id === modalLog.id
                ? { ...l, successful_status: status, interest_level: interest, follow_up_datetime: followUp || null, notes }
                : l));
        } else {
            const course = COURSES[0];
            const newLog = {
                id: Date.now(), lead_id: modalLead.id, councillor_id: MY_ID,
                course_id: course.id, call_number: 1, successful_status: status,
                interest_level: interest, follow_up_datetime: followUp || null,
                notes, call_datetime: new Date().toISOString(),
                lead_name: modalLead.name, lead_mobile: modalLead.mobile_no,
                lead_state: modalLead.state, councillor_name: 'Sarah Khan',
                course_name: course.course_name, category_id: course.category_id,
                duration_seconds: 0,
            };
            setLocalLogs(prev => [newLog, ...prev]);
        }
        setModalLead(null); setModalLog(null);
    }

    const myInfo = COUNSELLORS.find(c => c.id === MY_ID);

    return (
        <div className="fade-in cdash-root">
            <div className="page-header flex-between" style={{ marginBottom: '1.25rem' }}>
                <div>
                    <div className="agent-name-label">👋 Welcome back</div>
                    <h1>My Dashboard</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {myInfo?.councillor_name} · {myInfo?.calling_language} · {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
            </div>

            {todayFollowUps.length > 0 && (
                <div className="cdash-pending-banner" style={{ marginBottom: '1.25rem' }}>
                    <div className="cdash-pending-icon"><AlertCircle size={20} /></div>
                    <div>
                        <strong>📅 {todayFollowUps.length} follow-up{todayFollowUps.length > 1 ? 's' : ''} scheduled today</strong>
                        <p>{todayFollowUps.slice(0, 3).map(l => l.lead_name).join(', ')}{todayFollowUps.length > 3 && ` +${todayFollowUps.length - 3} more`}</p>
                    </div>
                    <button className="cdash-pending-cta" onClick={() => { applyPreset('today'); setTab('logs'); }}>View Today</button>
                </div>
            )}

            <div className="cdash-stats-grid">
                <StatCard icon={Phone} label="Total Calls" value={stats.total} color="blue" sub="in range" trend={8} />
                <StatCard icon={Users} label="Leads Contacted" value={stats.uniqueLeads} color="purple" sub="unique leads" />
                <StatCard icon={CheckCircle} label="Answered" value={stats.answered} color="green" sub="connected" trend={5} />
                <StatCard icon={UserCheck} label="High Interest" value={stats.converted} color="teal" sub={`${stats.convRate}% of answered`} trend={12} />
                <StatCard icon={Clock} label="Talk Time" value={fmtDur(stats.totalSec)} color="yellow" sub="total" />
                <StatCard icon={Star} label="Remaining" value={remainingLeads.length} color="red" sub="leads to call" />
            </div>

            <div className="cdash-conversion-card" style={{ marginBottom: '1.25rem' }}>
                <div className="cdash-conversion-header">
                    <div><h3>Conversion Rate</h3><p>High interest from answered calls</p></div>
                    <div className="cdash-conversion-pct">{stats.convRate}%</div>
                </div>
                <div className="progress-bar" style={{ height: '8px', marginTop: '0.75rem' }}>
                    <div className="progress-bar-fill green" style={{ width: `${stats.convRate}%`, transition: 'width 1s ease' }} />
                </div>
                <div className="cdash-conversion-legend">
                    <span style={{ color: 'var(--success)' }}>● High Interest: {stats.converted}</span>
                    <span style={{ color: 'var(--text-dim)' }}>● Others: {stats.answered - stats.converted}</span>
                </div>
            </div>

            {/* Date range (only for call logs tab) */}
            {tab === 'logs' && (
                <div className="cdash-filters-bar" style={{ marginBottom: '1rem' }}>
                    <div className="cdash-preset-group">
                        {[['Today','today'],['7 Days','7d'],['30 Days','30d'],['All','all']].map(([lbl,val]) => (
                            <button key={val} className={`range-btn ${preset === val ? 'active' : ''}`} onClick={() => applyPreset(val)}>{lbl}</button>
                        ))}
                    </div>
                    <div className="cdash-date-inputs">
                        <div className="cdash-date-field"><Calendar size={13} /><input type="date" value={startDate} max={endDate} onChange={e => { setStartDate(e.target.value); setPreset('custom'); }} /></div>
                        <span style={{ color: 'var(--text-dim)' }}>→</span>
                        <div className="cdash-date-field"><Calendar size={13} /><input type="date" value={endDate} min={startDate} max={todayStr()} onChange={e => { setEndDate(e.target.value); setPreset('custom'); }} /></div>
                    </div>
                </div>
            )}

            {/* Tab switcher */}
            <div className="cdash-tab-bar">
                <button className={`cdash-tab ${tab === 'logs' ? 'cdash-tab--active' : ''}`} onClick={() => setTab('logs')}>
                    📋 Call Logs <span className="cdash-tab-count">{rangeLogs.length}</span>
                </button>
                <button className={`cdash-tab ${tab === 'remaining' ? 'cdash-tab--active' : ''}`} onClick={() => setTab('remaining')}>
                    📞 Remaining Leads
                    {remainingLeads.length > 0 && <span className="cdash-tab-count cdash-tab-count--warn">{remainingLeads.length}</span>}
                </button>
            </div>

            {tab === 'logs' ? (
                <div className="cdash-table-section">
                    <div className="cdash-table-header">
                        <div>
                            <h3 className="section-title" style={{ margin: 0 }}>Call Logs</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>{filteredLogs.length} records</p>
                        </div>
                        <div className="cdash-table-controls">
                            <div className="cdash-search-wrap">
                                <Search size={13} className="cdash-search-icon" />
                                <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="cdash-search-input" />
                            </div>
                            <div className="cdash-filter-select-wrap">
                                <Filter size={12} />
                                <select value={statusF} onChange={e => setStatusF(e.target.value)} className="cdash-filter-select">
                                    <option value="all">All Status</option>
                                    <option value="Answered">Answered</option>
                                    <option value="Busy">Busy</option>
                                    <option value="Voicemail">Voicemail</option>
                                </select>
                            </div>
                            <div className="cdash-filter-select-wrap">
                                <Star size={12} />
                                <select value={interestF} onChange={e => setInterestF(e.target.value)} className="cdash-filter-select">
                                    <option value="all">All Interest</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {filteredLogs.length === 0 ? (
                        <div className="empty-state card"><BarChart3 size={44} /><h3>No logs found</h3><p>Adjust filters or date range</p></div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Lead</th>
                                        <th>Course</th>
                                        <th>Attempt</th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('successful_status')}><span className="cdash-th-inner">Status <SI k="successful_status" /></span></th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('interest_level')}><span className="cdash-th-inner">Interest <SI k="interest_level" /></span></th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('duration_seconds')}><span className="cdash-th-inner">Duration <SI k="duration_seconds" /></span></th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('call_datetime')}><span className="cdash-th-inner">Called At <SI k="call_datetime" /></span></th>
                                        <th>Follow-up</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className={log.follow_up_datetime && isoToDate(log.follow_up_datetime) === todayStr() ? 'cdash-row-pending' : ''}>
                                            <td>
                                                <div className="cdash-student-cell">
                                                    <div className="cdash-avatar">{log.lead_name?.charAt(0)}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.84rem' }}>{log.lead_name}</div>
                                                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{log.lead_mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.8rem' }}>{log.course_name}</td>
                                            <td><span className="badge in_progress" style={{ fontSize: '0.7rem' }}>#{log.call_number}</span></td>
                                            <td><CSBadge s={log.successful_status} /></td>
                                            <td><IBadge level={log.interest_level} /></td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{fmtDur(log.duration_seconds)}</td>
                                            <td className="text-dim text-sm">{fmtDate(log.call_datetime)}</td>
                                            <td style={{ fontSize: '0.78rem', color: log.follow_up_datetime ? 'var(--warning)' : 'var(--text-dim)' }}>
                                                {log.follow_up_datetime ? `📅 ${log.follow_up_datetime.slice(0, 10)}` : '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                    <button className="btn-ghost" style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.72rem', gap: '0.25rem', display: 'flex', alignItems: 'center' }}
                                                        onClick={() => { setModalLog(log); setModalLead(LEADS.find(l => l.id === log.lead_id) || { name: log.lead_name, mobile_no: log.lead_mobile }); }}
                                                        title="Update status">
                                                        <Edit2 size={12} /> Update
                                                    </button>
                                                    <button className="btn-ghost" style={{ padding: '0.3rem 0.45rem' }} onClick={() => setDetailLog(log)} title="Details">
                                                        <Info size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ marginTop: '0.5rem' }}>
                    <RemainingLeads
                        leads={remainingLeads}
                        onLogCall={lead => { setModalLead(lead); setModalLog(null); }}
                        onMarkDone={id => setDismissed(prev => new Set([...prev, id]))}
                    />
                </div>
            )}

            {/* Today's follow-up cards */}
            {todayFollowUps.length > 0 && tab === 'logs' && (
                <div className="cdash-pending-section" style={{ marginTop: '1.5rem' }}>
                    <div className="cdash-section-title-row">
                        <h3 className="section-title" style={{ margin: 0 }}><span className="cdash-pending-dot" /> Today's Follow-ups</h3>
                        <span className="cdash-pending-count">{todayFollowUps.length}</span>
                    </div>
                    <div className="cdash-pending-cards">
                        {todayFollowUps.map(log => (
                            <div key={log.id} className="cdash-pending-card">
                                <div className="cdash-pc-left">
                                    <div className="cdash-avatar cdash-avatar-warning">{log.lead_name?.charAt(0)}</div>
                                    <div>
                                        <div className="cdash-pc-name">{log.lead_name}</div>
                                        <div className="cdash-pc-phone">{log.lead_mobile}</div>
                                    </div>
                                </div>
                                <div className="cdash-pc-right">
                                    <span className="source-label">{log.course_name}</span>
                                    <button className="cdash-pending-cta" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                                        onClick={() => { setModalLog(log); setModalLead(LEADS.find(l => l.id === log.lead_id) || { name: log.lead_name, mobile_no: log.lead_mobile }); }}>
                                        Update
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Panel */}
            {detailLog && (
                <div className="cdash-detail-overlay" onClick={() => setDetailLog(null)}>
                    <div className="cdash-detail-panel" onClick={e => e.stopPropagation()}>
                        <div className="cdash-detail-header">
                            <div><h2>{detailLog.lead_name}</h2><span className="cdash-detail-phone">{detailLog.lead_mobile}</span></div>
                            <button className="btn-ghost" onClick={() => setDetailLog(null)}><X size={18} /></button>
                        </div>
                        <div className="cdash-detail-badges"><CSBadge s={detailLog.successful_status} /><IBadge level={detailLog.interest_level} /></div>
                        <div className="detail-grid" style={{ marginTop: '1.25rem' }}>
                            {[['Course', detailLog.course_name], ['Attempt', `#${detailLog.call_number}`], ['Duration', fmtDur(detailLog.duration_seconds)], ['Called At', fmtDate(detailLog.call_datetime)]].map(([k, v]) => (
                                <div key={k} className="detail-item"><div className="detail-label">{k}</div><div className="detail-value">{v}</div></div>
                            ))}
                            {detailLog.follow_up_datetime && <div className="detail-item"><div className="detail-label">Follow-up</div><div className="detail-value" style={{ color: 'var(--warning)' }}>📅 {detailLog.follow_up_datetime.slice(0, 10)}</div></div>}
                        </div>
                        {detailLog.notes && <div style={{ marginTop: '1rem' }}><div className="inspector-section"><h4>Notes</h4><div className="cdash-notes-box">{detailLog.notes}</div></div></div>}
                        {detailLog.ai_transcript && <div style={{ marginTop: '1rem' }}><div className="inspector-section"><h4>AI Transcript</h4><div className="cdash-notes-box">{detailLog.ai_transcript}</div></div></div>}
                        <div style={{ marginTop: '1.25rem' }}>
                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                onClick={() => { setModalLog(detailLog); setModalLead(LEADS.find(l => l.id === detailLog.lead_id) || { name: detailLog.lead_name, mobile_no: detailLog.lead_mobile }); setDetailLog(null); }}>
                                <Edit2 size={14} /> Update This Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log / Update Modal */}
            {modalLead && (
                <LogCallModal
                    lead={modalLead}
                    existingLog={modalLog}
                    onSave={handleSaveLog}
                    onClose={() => { setModalLead(null); setModalLog(null); }}
                />
            )}
        </div>
    );
}
