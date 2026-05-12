import React, { useState, useEffect } from 'react';
import { X, Phone, Save } from 'lucide-react';
import { authFetch } from '../utils/api.js';

export default function LogCallModal({ lead, existingLog, onSave, onClose }) {
    const [status, setStatus]     = useState(existingLog?.successful_status || '');
    const [interest, setInterest] = useState(existingLog?.interest_level    || '');
    const [followUp, setFollowUp] = useState(
        existingLog?.follow_up_datetime ? existingLog.follow_up_datetime.slice(0,10) : ''
    );
    const [notes, setNotes] = useState(existingLog?.notes || '');
    const [saving, setSaving] = useState(false);

    const isAnswered = status === 'Answered';

    async function handleSave() {
        if (!status) return;
        setSaving(true);
        try {
            const res = await authFetch('/api/crm/manual-followups', {
                method: 'POST',
                body: JSON.stringify({
                    lead_id: lead?.id || existingLog?.lead_id,
                    call_log_id: existingLog?.id,
                    status,
                    interest_level: isAnswered ? interest : null,
                    follow_up_datetime: isAnswered && followUp ? new Date(followUp).toISOString() : null,
                    notes,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || 'Failed to save follow-up');
            onSave({ status, interest: isAnswered ? interest : null, followUp: isAnswered ? followUp : null, notes, followup: data.followup });
            setSaving(false);
        } catch (err) {
            setSaving(false);
            alert(err.message);
        }
    }

    return (
        <div className="cdash-detail-overlay" onClick={onClose}>
            <div className="lcm-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="cdash-detail-header">
                    <div>
                        <h2 style={{fontSize:'1.05rem'}}>{existingLog ? 'Update Call Log' : 'Log New Call'}</h2>
                        <span className="cdash-detail-phone">{lead?.name} · {lead?.mobile_no}</span>
                    </div>
                    <button className="btn-ghost" onClick={onClose}><X size={18}/></button>
                </div>

                {/* Lead info strip */}
                <div className="lcm-lead-strip">
                    {[['State', lead?.state], ['District', lead?.district], ['Language', lead?.mother_tongue],
                      ['Financial', lead?.financial_state], ['Loan Req.', lead?.bank_loan_requirement ? 'Yes' : 'No']
                    ].map(([k,v]) => (
                        <div key={k} className="lcm-lead-kv">
                            <span className="lcm-k">{k}</span>
                            <span className="lcm-v">{v||'—'}</span>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="lcm-form">
                    {/* Call Status */}
                    <div className="lcm-field">
                        <label>Call Status <span style={{color:'var(--error)'}}>*</span></label>
                        <div className="lcm-btn-group">
                            {['Answered','Busy','Voicemail'].map(s => (
                                <button key={s}
                                    className={`lcm-opt ${status===s?'lcm-opt--active':''}`}
                                    style={status===s ? {
                                        background: s==='Answered'?'rgba(34,197,94,0.15)':s==='Busy'?'rgba(239,68,68,0.15)':'rgba(100,116,139,0.15)',
                                        borderColor: s==='Answered'?'var(--success)':s==='Busy'?'var(--error)':'var(--text-dim)',
                                        color: s==='Answered'?'var(--success)':s==='Busy'?'var(--error)':'var(--text-dim)'
                                    } : {}}
                                    onClick={() => { setStatus(s); if(s!=='Answered'){setInterest('');setFollowUp('');} }}
                                >{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Interest Level (only if Answered) */}
                    {isAnswered && (
                        <div className="lcm-field">
                            <label>Interest Level</label>
                            <div className="lcm-btn-group">
                                {[['Hot','var(--success)','rgba(34,197,94,0.15)'],
                                  ['Warm','var(--info)','rgba(59,130,246,0.12)'],
                                  ['Cold','var(--text-dim)','rgba(100,116,139,0.12)']
                                ].map(([lvl,col,bg]) => (
                                    <button key={lvl}
                                        className={`lcm-opt ${interest===lvl?'lcm-opt--active':''}`}
                                        style={interest===lvl?{background:bg,borderColor:col,color:col}:{}}
                                        onClick={() => setInterest(lvl)}
                                    >{lvl}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Follow-up Date (only if Answered) */}
                    {isAnswered && (
                        <div className="lcm-field">
                            <label>Follow-up Date</label>
                            <div className="cdash-date-field" style={{width:'fit-content'}}>
                                <input type="date" value={followUp}
                                    min={new Date().toISOString().slice(0,10)}
                                    onChange={e => setFollowUp(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="lcm-field">
                        <label>Notes / Remarks</label>
                        <textarea
                            className="lcm-textarea"
                            rows={3}
                            placeholder="Add any notes about this call…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="lcm-actions">
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={!status || saving}
                            style={{background:'var(--success)',color:'#000',gap:'0.4rem'}}
                        >
                            {saving ? 'Saving…' : <><Save size={15}/> Save Log</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
