import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { BookOpen, Plus, RefreshCw, Users, GraduationCap } from 'lucide-react';
import { authFetch, swrFetcher } from '../utils/api.js';

export default function CourseStreams() {
    const { data, mutate, isLoading } = useSWR('/api/crm/dashboard?scope=superadmin', swrFetcher, { refreshInterval: 10000 });
    const departments = data?.departments || [];
    const courses = data?.courses || [];
    const hods = data?.hods || [];
    const counsellors = data?.councillors || [];
    const [form, setForm] = useState({ name: 'B.Tech', stream_name: '', aliases: '', duration_years: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const baseDepartments = ['B.Tech', 'BCA', 'MBA', 'M.Tech', 'Diploma'];
    const rows = useMemo(() => departments.map(bucket => {
        const bucketCourses = courses.filter(c => (c.department_id || c.category_id) === bucket.id);
        return {
            ...bucket,
            courses: bucketCourses,
            hods: hods.filter(h => (h.department_id || h.category_id) === bucket.id),
            counsellorCount: counsellors.filter(c => c.category_id === bucket.id).length,
        };
    }), [departments, courses, hods, counsellors]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim() || !form.stream_name.trim()) return;
        setSaving(true);
        setError('');
        try {
            const res = await authFetch('/api/crm/course-streams', {
                method: 'POST',
                body: JSON.stringify({
                    name: form.name.trim(),
                    stream_name: form.stream_name.trim() || null,
                    aliases: form.aliases.split(',').map(x => x.trim()).filter(Boolean),
                    duration_years: form.duration_years || null,
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.detail || 'Failed to save course/stream');
            setForm({ name: 'B.Tech', stream_name: '', aliases: '', duration_years: '' });
            mutate();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Courses / Streams</h1>
                    <p>Manage fixed departments/courses and their streams used by AI routing, HOD visibility, and counsellor assignment.</p>
                </div>
                <button className="btn-secondary" onClick={() => mutate()}><RefreshCw size={14} /> Refresh</button>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                <div className="card">
                    <h3 className="section-title" style={{ marginBottom: '1rem' }}><Plus size={16} /> Add Stream</h3>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group">
                            <label>Department / Course</label>
                            <select value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required>
                                {baseDepartments.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Stream Name</label>
                            <input value={form.stream_name} onChange={e => setForm(f => ({ ...f, stream_name: e.target.value }))} placeholder="Mechanical" required />
                        </div>
                        <div className="form-group">
                            <label>Aliases</label>
                            <input value={form.aliases} onChange={e => setForm(f => ({ ...f, aliases: e.target.value }))} placeholder="Mechanical, Mechanical Engineering, BTech ME" />
                        </div>
                        <div className="form-group">
                            <label>Duration Years</label>
                            <input type="number" min="1" value={form.duration_years} onChange={e => setForm(f => ({ ...f, duration_years: e.target.value }))} placeholder="4" />
                        </div>
                        {error && <div className="login-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
                        <button className="btn-primary" disabled={saving} style={{ gridColumn: '1 / -1' }}>{saving ? 'Saving...' : 'Create Stream'}</button>
                    </form>
                </div>

                <div className="card">
                    <h3 className="section-title" style={{ marginBottom: '1rem' }}><BookOpen size={16} /> Routing Model</h3>
                    <div className="info-list">
                        <p><strong>Department/Course</strong> is fixed, like B.Tech, BCA, MBA.</p>
                        <p><strong>Stream</strong> is inside that department, like Mechanical, CSE, Finance.</p>
                        <p><strong>HOD and counsellors</strong> are mapped to the exact department + stream pair.</p>
                        <p><strong>Aliases</strong> help AI route phrases like Mechanical Engineering to B.Tech + Mechanical.</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
                <h3 className="section-title" style={{ marginBottom: '1rem' }}>Existing Departments and Streams</h3>
                {isLoading ? <p style={{ color: 'var(--text-dim)' }}>Loading...</p> : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Department/Course</th>
                                    <th>Streams</th>
                                    <th>HODs</th>
                                    <th>Counsellors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No departments yet</td></tr> : rows.map(row => (
                                    <tr key={row.id}>
                                        <td><strong>{row.category_name || row.name}</strong></td>
                                        <td>{row.courses.map(c => c.stream_name || c.course_name || c.name).join(', ') || '-'}</td>
                                        <td><GraduationCap size={14} /> {row.hods.map(h => `${h.hod_name || h.name}${h.course_id ? '' : ' (dept)'}`).join(', ') || 'Not assigned'}</td>
                                        <td><Users size={14} /> {row.counsellorCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
