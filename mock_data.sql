-- ==========================================
-- PROVAANI MOCK DATA FOR TESTING
-- Use this script to populate the database with dummy data
-- for Frontend and Database development/testing.
-- ==========================================

-- 1. ROLES (Already in unified_setup.sql, but here for completeness)
INSERT INTO public.roles (name) 
VALUES ('super_admin'), ('hod'), ('councillor')
ON CONFLICT (name) DO NOTHING;

-- 2. DEPARTMENTS
INSERT INTO public.departments (name, description)
VALUES 
('B.Tech', 'Bachelor of Technology'),
('BCA', 'Bachelor of Computer Applications'),
('MBA', 'Master of Business Administration'),
('Diploma', 'Diploma in Engineering')
ON CONFLICT (name) DO NOTHING;

-- 3. COURSES (Streams under Departments)
INSERT INTO public.courses (department_id, name, stream_name, eligibility, duration_years, is_active)
SELECT id, 'Computer Science', 'CSE', '10+2 with PCM', 4, true FROM public.departments WHERE name = 'B.Tech'
UNION ALL
SELECT id, 'Mechanical Engineering', 'ME', '10+2 with PCM', 4, true FROM public.departments WHERE name = 'B.Tech'
UNION ALL
SELECT id, 'Information Technology', 'IT', '10+2', 3, true FROM public.departments WHERE name = 'BCA'
UNION ALL
SELECT id, 'Marketing', 'MKT', 'Graduation', 2, true FROM public.departments WHERE name = 'MBA'
ON CONFLICT DO NOTHING;

-- 4. USERS (MOCK ADMINS/HODs/COUNCILLORS)
-- Note: password_hash is 'password123' hashed (dummy)
INSERT INTO public.user_master (name, login_id, password_hash, email, role_id)
VALUES 
('Super Admin', 'admin', 'pbkdf2_sha256$260000$xxx$yyy', 'admin@provaani.com', (SELECT id FROM public.roles WHERE name = 'super_admin'))
ON CONFLICT (login_id) DO NOTHING;

-- MOCK HOD
INSERT INTO public.user_master (name, login_id, password_hash, email, role_id, department_id)
VALUES 
('Dr. Rajesh Kumar', 'hod_cse', 'xxx', 'rajesh@provaani.com', 
 (SELECT id FROM public.roles WHERE name = 'hod'), 
 (SELECT id FROM public.departments WHERE name = 'B.Tech'))
ON CONFLICT (login_id) DO NOTHING;

-- MOCK COUNCILLOR
INSERT INTO public.user_master (id, name, login_id, password_hash, email, role_id)
VALUES 
('d1234567-e89b-12d3-a456-426614174000', 'Anjali Sharma', 'anjali_c', 'xxx', 'anjali@provaani.com', 
 (SELECT id FROM public.roles WHERE name = 'councillor'))
ON CONFLICT (login_id) DO NOTHING;

INSERT INTO public.councillors (user_id, languages, is_available)
VALUES ('d1234567-e89b-12d3-a456-426614174000', '{English, Hindi, Bengali}', true)
ON CONFLICT (user_id) DO NOTHING;

-- 5. LEADS
INSERT INTO public.leads (name, phone_number, status, interest_score, interest_language, state, district)
VALUES 
('John Doe', '+919876543210', 'qualified', 8, 'English', 'West Bengal', 'Kolkata'),
('Jane Smith', '+919876543211', 'raw', 4, 'Hindi', 'Delhi', 'New Delhi'),
('Rahul Mehra', '+919876543212', 'assigned_hod', 9, 'Bengali', 'West Bengal', 'Durgapur'),
('Amit Shah', '+919876543213', 'contacted', 6, 'Hindi', 'Gujarat', 'Ahmedabad')
ON CONFLICT (phone_number) DO NOTHING;

-- 6. CAMPAIGNS
INSERT INTO public.campaigns (name, status, mode, concurrent_limit)
VALUES 
('B.Tech Admission 2024', 'completed', 'global_scheduler', 5),
('MBA Outreach May', 'active', 'global_scheduler', 2),
('BCA Follow-up', 'created', 'global_scheduler', 10);

-- 7. CALLS
INSERT INTO public.calls (campaign_id, lead_id, phone_number, recipient_name, status, duration_seconds, summary)
VALUES 
((SELECT campaign_id FROM public.campaigns LIMIT 1), (SELECT id FROM public.leads WHERE name = 'John Doe'), '+919876543210', 'John Doe', 'completed', 125, 'Interested in CSE, asked about hostel facilities.'),
((SELECT campaign_id FROM public.campaigns LIMIT 1), (SELECT id FROM public.leads WHERE name = 'Jane Smith'), '+919876543211', 'Jane Smith', 'failed', 0, 'Busy, called 3 times.'),
((SELECT campaign_id FROM public.campaigns WHERE name = 'MBA Outreach May'), (SELECT id FROM public.leads WHERE name = 'Amit Shah'), '+919876543213', 'Amit Shah', 'completed', 45, 'Wrong number/Not interested.');

-- 8. CALL LOGS
INSERT INTO public.call_logs (call_id, lead_id, councillor_id, interest_level, ai_transcript)
VALUES 
((SELECT call_id FROM public.calls WHERE recipient_name = 'John Doe'), 
 (SELECT id FROM public.leads WHERE name = 'John Doe'), 
 (SELECT id FROM public.councillors LIMIT 1), 
 'hot', 
 'AI: Hello John, I am calling from Provaani. Are you interested in our B.Tech program? John: Yes, I am. I want to know about the fees.');
