import React, { useState } from 'react';
import { X, Save, Phone, Mail, User, BookOpen, GraduationCap } from 'lucide-react';
import { authFetch } from '../utils/api.js';

const INITIAL = { name: '', email: '', mobile: '', category_id: '', course_id: '' };

export default function AddHODModal({ onSave, onClose, departments = [], courses = [] }) {
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

    function validate() {
        const e = {};
        if (!form.name.trim())   e.name = 'Name is required';
        if (!form.email.trim())  e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (!form.mobile.trim()) e.mobile = 'Mobile is required';
        else if (!/^\+?[\d\s-]{10,}$/.test(form.mobile)) e.mobile = 'Invalid number';
        if (!form.category_id)   e.category_id = 'Department is required';
        if (!form.course_id)     e.course_id = 'Stream is required';
        return e;
    }

    const filteredCourses = courses.filter(c =>
        form.category_id ? (c.category_id || c.department_id) === Number(form.category_id) : false
    );

    async function handleSave() {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setSaving(true);
        try {
            const res = await authFetch('/api/crm/hods', {
                method: 'POST',
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    mobile: form.mobile.trim(),
                    department_id: Number(form.category_id),
                    course_id: Number(form.course_id),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to create HOD');
            onSave(data.hod);
            setSaving(false);
            setSaved(true);
            setTimeout(onClose, 800);
        } catch (err) {
            setSaving(false);
            setErrors({ form: err.message });
        }
    }

    return (
        <div className="cdash-detail-overlay" onClick={onClose}>
            <div className="acm-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="acm-header">
                    <div className="acm-header-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Add Head of Department</h2>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                            Assign an HOD to manage one department and stream
                        </p>
                    </div>
                    <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <div className="acm-form">
                    {/* Name */}
                    <div className="acm-field">
                        <label className="acm-label"><User size={13} /> Full Name <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span></label>
                        <input type="text" className={`acm-input ${errors.name ? 'acm-input--error' : ''}`}
                            placeholder="e.g. Dr. Ramesh Kumar"
                            value={form.name} onChange={e => set('name', e.target.value)} />
                        {errors.name && <span className="acm-error">{errors.name}</span>}
                    </div>

                    {/* Email + Mobile */}
                    <div className="acm-row">
                        <div className="acm-field">
                            <label className="acm-label"><Mail size={13} /> Email ID <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span></label>
                            <input type="email" className={`acm-input ${errors.email ? 'acm-input--error' : ''}`}
                                placeholder="hod@provaani.com"
                                value={form.email} onChange={e => set('email', e.target.value)} />
                            {errors.email && <span className="acm-error">{errors.email}</span>}
                        </div>
                        <div className="acm-field">
                            <label className="acm-label"><Phone size={13} /> Mobile No. <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span></label>
                            <input type="tel" className={`acm-input ${errors.mobile ? 'acm-input--error' : ''}`}
                                placeholder="+91 98765 43210"
                                value={form.mobile} onChange={e => set('mobile', e.target.value)} />
                            {errors.mobile && <span className="acm-error">{errors.mobile}</span>}
                        </div>
                    </div>

                    {/* Department + Stream */}
                    <div className="acm-field">
                        <label className="acm-label"><BookOpen size={13} /> Department <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span></label>
                        <select className={`acm-select ${errors.category_id ? 'acm-input--error' : ''}`}
                            value={form.category_id} onChange={e => { setForm(f => ({ ...f, category_id: e.target.value, course_id: '' })); setErrors(er => ({ ...er, category_id: '', course_id: '' })); }}>
                            <option value="">— Select Department —</option>
                            {departments.map(c => (
                                <option key={c.id} value={c.id}>{c.category_name || c.name}</option>
                            ))}
                        </select>
                        {errors.category_id && <span className="acm-error">{errors.category_id}</span>}
                    </div>
                    <div className="acm-field">
                        <label className="acm-label"><BookOpen size={13} /> Stream <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span></label>
                        <select className={`acm-select ${errors.course_id ? 'acm-input--error' : ''}`}
                            value={form.course_id} onChange={e => set('course_id', e.target.value)} disabled={!form.category_id}>
                            <option value="">— Select Stream —</option>
                            {filteredCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.stream_name || c.course_name || c.name}</option>
                            ))}
                        </select>
                        {errors.course_id && <span className="acm-error">{errors.course_id}</span>}
                        {errors.form && <span className="acm-error">{errors.form}</span>}
                    </div>
                </div>

                {/* Footer */}
                <div className="acm-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={saving || saved}
                        style={{
                            background: saved ? 'var(--success)' : 'linear-gradient(135deg,#22c55e,#4ade80)',
                            color: '#000',
                            gap: '0.4rem',
                            minWidth: 120,
                        }}
                    >
                        {saved ? '✓ Saved!' : saving ? 'Saving…' : <><Save size={15} /> Add HOD</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
