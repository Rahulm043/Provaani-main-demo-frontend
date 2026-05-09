import React, { useState } from 'react';
import { X, UserPlus, Save, Phone, Mail, User, Globe, BookOpen } from 'lucide-react';
import { CATEGORIES, COURSES } from '../utils/mockData.js';

const LANGUAGES = [
    'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
    'Gujarati', 'Marathi', 'Punjabi', 'Bengali', 'Odia',
];

const INITIAL = { name: '', email: '', mobile: '', category_id: '', course_id: '', languages: [] };

function FieldWrap({ icon: Icon, label, required, children }) {
    return (
        <div className="acm-field">
            <label className="acm-label">
                {Icon && <Icon size={13} />}
                {label}
                {required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
            </label>
            {children}
        </div>
    );
}

export default function AddCounsellorModal({ onSave, onClose }) {
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

    const filteredCourses = COURSES.filter(c =>
        form.category_id ? c.category_id === Number(form.category_id) : true
    );

    function toggleLang(lang) {
        setForm(f => ({
            ...f,
            languages: f.languages.includes(lang)
                ? f.languages.filter(l => l !== lang)
                : [...f.languages, lang],
        }));
        setErrors(e => ({ ...e, languages: '' }));
    }

    function validate() {
        const e = {};
        if (!form.name.trim())       e.name = 'Name is required';
        if (!form.email.trim())      e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (!form.mobile.trim())     e.mobile = 'Mobile is required';
        else if (!/^\+?[\d\s-]{10,}$/.test(form.mobile)) e.mobile = 'Invalid mobile number';
        if (!form.category_id)       e.category_id = 'Department is required';
        if (form.languages.length === 0) e.languages = 'Select at least one language';
        return e;
    }

    function handleSave() {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setSaving(true);
        setTimeout(() => {
            const newCounsellor = {
                id: Date.now(),
                user_id: Date.now(),
                councillor_name: form.name.trim(),
                email_id: form.email.trim(),
                mobile_no: form.mobile.trim(),
                category_id: Number(form.category_id),
                calling_language: form.languages.join(', '),
                course_id: form.course_id ? Number(form.course_id) : null,
            };
            onSave(newCounsellor);
            setSaving(false);
            setSaved(true);
            setTimeout(onClose, 900);
        }, 600);
    }

    return (
        <div className="cdash-detail-overlay" onClick={onClose}>
            <div className="acm-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="acm-header">
                    <div className="acm-header-icon">
                        <UserPlus size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Add New Counsellor</h2>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                            Fill in the details below to register a counsellor
                        </p>
                    </div>
                    <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <div className="acm-form">
                    {/* Name */}
                    <FieldWrap icon={User} label="Full Name" required>
                        <div className="acm-input-wrap">
                            <input
                                type="text"
                                className={`acm-input ${errors.name ? 'acm-input--error' : ''}`}
                                placeholder="e.g. Sarah Khan"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </div>
                        {errors.name && <span className="acm-error">{errors.name}</span>}
                    </FieldWrap>

                    {/* Email + Mobile (side by side) */}
                    <div className="acm-row">
                        <FieldWrap icon={Mail} label="Email ID" required>
                            <input
                                type="email"
                                className={`acm-input ${errors.email ? 'acm-input--error' : ''}`}
                                placeholder="name@provaani.com"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                            />
                            {errors.email && <span className="acm-error">{errors.email}</span>}
                        </FieldWrap>

                        <FieldWrap icon={Phone} label="Mobile No." required>
                            <input
                                type="tel"
                                className={`acm-input ${errors.mobile ? 'acm-input--error' : ''}`}
                                placeholder="+91 98765 43210"
                                value={form.mobile}
                                onChange={e => set('mobile', e.target.value)}
                            />
                            {errors.mobile && <span className="acm-error">{errors.mobile}</span>}
                        </FieldWrap>
                    </div>

                    {/* Department → then Course */}
                    <FieldWrap icon={BookOpen} label="Department" required>
                        <select
                            className={`acm-select ${errors.category_id ? 'acm-input--error' : ''}`}
                            value={form.category_id}
                            onChange={e => { set('category_id', e.target.value); set('course_id', ''); }}
                        >
                            <option value="">— Select Department —</option>
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.category_name}</option>
                            ))}
                        </select>
                        {errors.category_id && <span className="acm-error">{errors.category_id}</span>}
                    </FieldWrap>

                    {/* Course (optional, filtered by dept) */}
                    {form.category_id && (
                        <FieldWrap icon={BookOpen} label="Assigned Course (optional)">
                            <select
                                className="acm-select"
                                value={form.course_id}
                                onChange={e => set('course_id', e.target.value)}
                            >
                                <option value="">— All courses in department —</option>
                                {filteredCourses.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.course_name} ({c.duration_years}yr)
                                    </option>
                                ))}
                            </select>
                        </FieldWrap>
                    )}

                    {/* Languages */}
                    <FieldWrap icon={Globe} label="Calling Language(s)" required>
                        <div className="acm-lang-grid">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    className={`acm-lang-chip ${form.languages.includes(lang) ? 'acm-lang-chip--active' : ''}`}
                                    onClick={() => toggleLang(lang)}
                                >
                                    {form.languages.includes(lang) && <span style={{ fontSize: '0.7rem' }}>✓ </span>}
                                    {lang}
                                </button>
                            ))}
                        </div>
                        {errors.languages && <span className="acm-error">{errors.languages}</span>}
                        {form.languages.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                Selected: <span style={{ color: 'var(--text)' }}>{form.languages.join(', ')}</span>
                            </div>
                        )}
                    </FieldWrap>
                </div>

                {/* Footer */}
                <div className="acm-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={saving || saved}
                        style={{
                            background: saved ? 'var(--success)' : 'linear-gradient(135deg,#6366f1,#818cf8)',
                            color: '#fff',
                            gap: '0.4rem',
                            minWidth: 130,
                        }}
                    >
                        {saved ? '✓ Saved!' : saving ? 'Saving…' : <><Save size={15} /> Add Counsellor</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
