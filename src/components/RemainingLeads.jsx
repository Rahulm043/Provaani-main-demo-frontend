import React, { useState } from 'react';
import { Phone, Search, Filter, User, MapPin, Banknote, PhoneCall, CheckCircle } from 'lucide-react';

const PRIORITY_COLOR = { High:'var(--success)', Medium:'var(--warning)', Low:'var(--text-dim)' };

function PriorityBadge({ priority }) {
    return (
        <span className="cdash-outcome-badge"
            style={{ background:`${PRIORITY_COLOR[priority]}22`, color:PRIORITY_COLOR[priority], border:`1px solid ${PRIORITY_COLOR[priority]}44` }}>
            {priority}
        </span>
    );
}

export default function RemainingLeads({ leads, onLogCall, onMarkDone }) {
    const [search, setSearch] = useState('');
    const [filterState, setFilterState] = useState('all');
    const [filterLoan, setFilterLoan] = useState('all');

    const states = [...new Set(leads.map(l => l.state))];

    const filtered = leads.filter(l => {
        const q = search.toLowerCase();
        if (q && !l.name.toLowerCase().includes(q) && !l.mobile_no.includes(q)) return false;
        if (filterState !== 'all' && l.state !== filterState) return false;
        if (filterLoan === 'yes' && !l.bank_loan_requirement) return false;
        if (filterLoan === 'no'  &&  l.bank_loan_requirement) return false;
        return true;
    });

    if (!leads.length) {
        return (
            <div className="empty-state card" style={{marginTop:'1rem'}}>
                <CheckCircle size={44} color="var(--success)" />
                <h3>All Caught Up!</h3>
                <p>No remaining leads to call. Great work!</p>
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            <div className="cdash-filters-bar" style={{marginBottom:'1rem'}}>
                <div className="cdash-search-wrap">
                    <Search size={13} className="cdash-search-icon"/>
                    <input type="text" placeholder="Search lead or phone…"
                        value={search} onChange={e=>setSearch(e.target.value)}
                        className="cdash-search-input"/>
                </div>
                <div className="cdash-filter-select-wrap">
                    <MapPin size={12}/>
                    <select value={filterState} onChange={e=>setFilterState(e.target.value)} className="cdash-filter-select">
                        <option value="all">All States</option>
                        {states.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="cdash-filter-select-wrap">
                    <Banknote size={12}/>
                    <select value={filterLoan} onChange={e=>setFilterLoan(e.target.value)} className="cdash-filter-select">
                        <option value="all">Loan: All</option>
                        <option value="yes">Needs Loan</option>
                        <option value="no">No Loan</option>
                    </select>
                </div>
                <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'var(--text-dim)'}}>
                    {filtered.length} lead{filtered.length!==1?'s':''} remaining
                </span>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Lead</th>
                            <th>Location</th>
                            <th>Language</th>
                            <th>Financial</th>
                            <th>Loan</th>
                            <th>Assigned</th>
                            <th>Priority</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(lead => (
                            <tr key={lead.id}>
                                <td>
                                    <div className="cdash-student-cell">
                                        <div className="cdash-avatar">{lead.name.charAt(0)}</div>
                                        <div>
                                            <div style={{fontWeight:500,color:'var(--text)',fontSize:'0.84rem'}}>{lead.name}</div>
                                            <div className="mono" style={{fontSize:'0.72rem',color:'var(--text-dim)'}}>{lead.mobile_no}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>
                                    {lead.district}, {lead.state}
                                </td>
                                <td style={{fontSize:'0.8rem'}}>{lead.mother_tongue}</td>
                                <td>
                                    <span className="cdash-outcome-badge"
                                        style={{
                                            background: lead.financial_state==='High'?'rgba(34,197,94,0.1)':lead.financial_state==='Middle'?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)',
                                            color: lead.financial_state==='High'?'var(--success)':lead.financial_state==='Middle'?'var(--warning)':'var(--error)',
                                            border:'none'
                                        }}>
                                        {lead.financial_state}
                                    </span>
                                </td>
                                <td>
                                    {lead.bank_loan_requirement
                                        ? <span style={{color:'var(--info)',fontSize:'0.78rem',fontWeight:600}}>✓ Required</span>
                                        : <span style={{color:'var(--text-dim)',fontSize:'0.78rem'}}>—</span>}
                                </td>
                                <td style={{fontSize:'0.78rem',color:'var(--text-dim)'}}>
                                    {new Date(lead.assignment_date).toLocaleDateString([],{month:'short',day:'numeric'})}
                                </td>
                                <td><PriorityBadge priority={lead.priority}/></td>
                                <td>
                                    <div style={{display:'flex',gap:'0.4rem'}}>
                                        <button
                                            className="btn-primary"
                                            style={{padding:'0.35rem 0.7rem',fontSize:'0.75rem',gap:'0.3rem',background:'var(--success)',color:'#000'}}
                                            onClick={() => onLogCall(lead)}
                                        >
                                            <PhoneCall size={13}/> Log Call
                                        </button>
                                        <button
                                            className="btn-ghost"
                                            style={{padding:'0.35rem 0.6rem',fontSize:'0.75rem',border:'1px solid var(--border)'}}
                                            onClick={() => onMarkDone(lead.id)}
                                            title="Mark as Not Reachable"
                                        >✕</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-dim)',padding:'2rem'}}>No leads match filters</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
