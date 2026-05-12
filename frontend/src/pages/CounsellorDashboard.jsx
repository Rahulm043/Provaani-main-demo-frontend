import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { BarChart3, Calendar, CheckCircle, RefreshCw, Search, Star, UserCheck, Users } from 'lucide-react';
import { swrFetcher } from '../utils/api.js';
import { useAuth } from '../components/AuthProvider.jsx';
import LogCallModal from '../components/LogCallModal.jsx';

function fmtDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="cdash-stat-card compact-stat">
            <div className={`cdash-stat-icon cdash-icon-${color}`}><Icon size={18} /></div>
            <div className="cdash-stat-body">
                <div className="cdash-stat-value">{value}</div>
                <div className="cdash-stat-label">{label}</div>
                {sub && <div className="cdash-stat-sub">{sub}</div>}
            </div>
        </div>
    );
}

function InterestBadge({ level }) {
    if (!level) return <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>-</span>;
    const cls = level === 'Hot' ? 'cdash-outcome-converted' : level === 'Warm' ? 'cdash-outcome-interested' : 'cdash-outcome-nope';
    return <span className={`cdash-outcome-badge ${cls}`}>{level}</span>;
}

function leadPriority(lead, log) {
    if (log?.interest_level) return log.interest_level;
    if ((lead.interest_score || 0) >= 8) return 'Hot';
    if ((lead.interest_score || 0) >= 5) return 'Warm';
    return 'Cold';
}

export default function CounsellorDashboard() {
    const { user } = useAuth();
    const { data, mutate, isLoading } = useSWR('/api/crm/dashboard?scope=counsellor', swrFetcher, { refreshInterval: 10000 });
    const [tab, setTab] = useState('incoming');
    const [search, setSearch] = useState('');
    const [modalLead, setModalLead] = useState(null);

    const logs = data?.call_logs || [];
    const leads = data?.leads || [];
    const followups = data?.manual_followups || [];
    const counsellor = data?.councillors?.[0];

    const respondedLeadIds = useMemo(() => new Set(followups.map(f => f.lead_id)), [followups]);
    const incomingLeads = useMemo(() => leads.filter(lead => !respondedLeadIds.has(lead.id)), [leads, respondedLeadIds]);
    const respondedLeads = useMemo(() => leads.filter(lead => respondedLeadIds.has(lead.id)), [leads, respondedLeadIds]);

    const stats = useMemo(() => {
        const hot = logs.filter(l => l.interest_level === 'Hot').length;
        const scheduled = followups.filter(f => f.follow_up_datetime).length;
        const responseRate = leads.length ? Math.round((respondedLeads.length / leads.length) * 100) : 0;
        return { assigned: leads.length, incoming: incomingLeads.length, responded: respondedLeads.length, hot, scheduled, responseRate };
    }, [leads, logs, followups, incomingLeads, respondedLeads]);

    const visibleLeads = useMemo(() => {
        const source = tab === 'incoming' ? incomingLeads : respondedLeads;
        const q = search.toLowerCase();
        return source.filter(lead => {
            const log = logs.find(l => l.lead_id === lead.id) || {};
            if (!q) return true;
            return (lead.name || '').toLowerCase().includes(q)
                || (lead.phone_number || '').includes(q)
                || (log.interest_course_name || '').toLowerCase().includes(q)
                || (lead.interest_language || '').toLowerCase().includes(q);
        });
    }, [tab, incomingLeads, respondedLeads, search, logs]);

    function handleSaveLog() {
        mutate();
        setModalLead(null);
    }

    return (
        <div className="fade-in cdash-root wide-dashboard">
            <div className="page-header flex-between compact-header">
                <div>
                    <div className="agent-name-label">Human Counselor Workspace</div>
                    <h1>Assigned Leads</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {counsellor?.councillor_name || user?.email} · {counsellor?.calling_language || 'Counselor'}
                    </p>
                </div>
                <button className="btn-secondary" onClick={() => mutate()}><RefreshCw size={14} /> Refresh</button>
            </div>

            {isLoading && <div className="empty-state card" style={{ marginBottom: '1rem' }}><BarChart3 size={40} /><h3>Loading assigned leads...</h3></div>}

            {/* Progress bar — full width */}
            <div className="cdash-conversion-card compact-progress">
                <div className="cdash-conversion-header">
                    <div><h3>Human Follow-up Progress</h3><p>AI-qualified leads responded by this counselor</p></div>
                    <div className="cdash-conversion-pct">{stats.responseRate}%</div>
                </div>
                <div className="progress-bar" style={{ height: '7px', marginTop: '0.6rem' }}>
                    <div className="progress-bar-fill green" style={{ width: `${stats.responseRate}%` }} />
                </div>
            </div>

            {/* Two-column layout */}
            <div className="cdash-two-col-layout">
                {/* Left: tabs + table */}
                <div>
                    <div className="cdash-tab-bar">
                        <button className={`cdash-tab ${tab === 'incoming' ? 'cdash-tab--active' : ''}`} onClick={() => setTab('incoming')}>
                            Incoming Leads <span className="cdash-tab-count cdash-tab-count--warn">{incomingLeads.length}</span>
                        </button>
                        <button className={`cdash-tab ${tab === 'responded' ? 'cdash-tab--active' : ''}`} onClick={() => setTab('responded')}>
                            Responded Leads <span className="cdash-tab-count">{respondedLeads.length}</span>
                        </button>
                    </div>

                    <div className="cdash-table-section full-width-section">
                        <div className="cdash-table-header">
                            <div>
                                <h3 className="section-title" style={{ margin: 0 }}>{tab === 'incoming' ? 'Incoming Leads' : 'Responded Leads'}</h3>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                                    AI made the first call. Counselors only update human follow-up status here.
                                </p>
                            </div>
                            <div className="cdash-search-wrap">
                                <Search size={13} className="cdash-search-icon" />
                                <input type="text" placeholder="Search lead/course/language..." value={search} onChange={e => setSearch(e.target.value)} className="cdash-search-input" />
                            </div>
                        </div>

                        {visibleLeads.length === 0 ? (
                            <div className="empty-state card"><BarChart3 size={44} /><h3>No leads found</h3><p>{tab === 'incoming' ? 'No new assigned leads pending.' : 'No responded leads yet.'}</p></div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Lead</th><th>Course / Stream</th><th>AI Interest</th><th>Language</th><th>AI Call Time</th><th>Human Status</th><th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleLeads.map(lead => {
                                            const log = logs.find(l => l.lead_id === lead.id) || {};
                                            const followup = followups.find(f => f.lead_id === lead.id);
                                            return (
                                                <tr key={lead.id}>
                                                    <td>
                                                        <div className="cdash-student-cell">
                                                            <div className="cdash-avatar">{(lead.name || log.lead_name || 'L').charAt(0)}</div>
                                                            <div>
                                                                <div style={{ fontWeight: 500, color: 'var(--text)' }}>{lead.name || log.lead_name || 'Unknown Lead'}</div>
                                                                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lead.phone_number || log.lead_mobile}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{log.interest_course_name || lead.unsupported_course_name || '—'}</td>
                                                    <td><InterestBadge level={leadPriority(lead, log)} /></td>
                                                    <td>{lead.mother_tongue || lead.interest_language || '—'}</td>
                                                    <td className="text-dim text-sm">{fmtDate(log.call_datetime)}</td>
                                                    <td>{followup ? <span className="badge completed">{followup.status}</span> : <span className="badge queued">Pending</span>}</td>
                                                    <td>
                                                        <button className="btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }} onClick={() => setModalLead({ ...lead, mobile_no: lead.phone_number })}>
                                                            {followup ? 'Update' : 'Respond'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right sidebar: vertical stat cards */}
                <div className="cdash-side-panel">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Overview</div>
                    {[
                        { icon: Users,      label: 'Assigned',    value: stats.assigned,  color: 'cdash-icon-purple' },
                        { icon: Star,       label: 'Incoming',    value: stats.incoming,  color: 'cdash-icon-red' },
                        { icon: CheckCircle,label: 'Responded',   value: stats.responded, color: 'cdash-icon-green' },
                        { icon: UserCheck,  label: 'Hot Interest', value: stats.hot,      color: 'cdash-icon-teal' },
                        { icon: Calendar,   label: 'Follow-ups',  value: stats.scheduled, color: 'cdash-icon-yellow' },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="cdash-side-stat">
                            <div className={`cdash-side-stat-icon ${color}`}><Icon size={16} /></div>
                            <div className="cdash-side-stat-body">
                                <div className="cdash-side-stat-val">{value}</div>
                                <div className="cdash-side-stat-lbl">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {modalLead && (
                <LogCallModal
                    lead={modalLead}
                    existingLog={logs.find(l => l.lead_id === modalLead.id)}
                    onSave={handleSaveLog}
                    onClose={() => setModalLead(null)}
                />
            )}
        </div>
    );
}
