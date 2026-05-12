// ── Mock data aligned with DB schema ─────────────────────────────────────────

export const CATEGORIES = [
    { id: 1, category_name: 'B.Tech' },
    { id: 2, category_name: 'BCA' },
    { id: 3, category_name: 'MBA' },
    { id: 4, category_name: 'B.Pharm' },
    { id: 5, category_name: 'B.Sc' },
];

export const COURSES = [
    { id: 1, category_id: 1, course_name: 'B.Tech CSE', college_name: 'BCRFC', duration_years: 4, admission_fees: 85000, sem_fees: 42000 },
    { id: 2, category_id: 1, course_name: 'B.Tech ECE', college_name: 'BCRFC', duration_years: 4, admission_fees: 80000, sem_fees: 40000 },
    { id: 3, category_id: 2, course_name: 'BCA', college_name: 'BCRFC', duration_years: 3, admission_fees: 55000, sem_fees: 28000 },
    { id: 4, category_id: 3, course_name: 'MBA Finance', college_name: 'BCRFC', duration_years: 2, admission_fees: 95000, sem_fees: 48000 },
    { id: 5, category_id: 3, course_name: 'MBA Marketing', college_name: 'BCRFC', duration_years: 2, admission_fees: 92000, sem_fees: 46000 },
    { id: 6, category_id: 4, course_name: 'B.Pharm', college_name: 'BCRFC', duration_years: 4, admission_fees: 78000, sem_fees: 39000 },
    { id: 7, category_id: 5, course_name: 'B.Sc Data Science', college_name: 'BCRFC', duration_years: 3, admission_fees: 60000, sem_fees: 30000 },
    { id: 8, category_id: 5, course_name: 'B.Sc Physics', college_name: 'BCRFC', duration_years: 3, admission_fees: 50000, sem_fees: 25000 },
];

export const COUNSELLORS = [
    { id: 1, user_id: 101, councillor_name: 'Sarah Khan', mobile_no: '+91 9876543210', email_id: 'sarah@provaani.com', calling_language: 'Hindi, English', category_id: 1 },
    { id: 2, user_id: 102, councillor_name: 'Raj Patel', mobile_no: '+91 9876543211', email_id: 'raj@provaani.com', calling_language: 'Gujarati, Hindi', category_id: 1 },
    { id: 3, user_id: 103, councillor_name: 'Meena Sharma', mobile_no: '+91 9876543212', email_id: 'meena@provaani.com', calling_language: 'Hindi', category_id: 1 },
    { id: 4, user_id: 104, councillor_name: 'James Dsouza', mobile_no: '+91 9876543213', email_id: 'james@provaani.com', calling_language: 'English, Kannada', category_id: 2 },
    { id: 5, user_id: 105, councillor_name: 'Priya Nair', mobile_no: '+91 9876543214', email_id: 'priya@provaani.com', calling_language: 'Malayalam, English', category_id: 2 },
    { id: 6, user_id: 106, councillor_name: 'Arjun Singh', mobile_no: '+91 9876543215', email_id: 'arjun@provaani.com', calling_language: 'Hindi, Punjabi', category_id: 3 },
    { id: 7, user_id: 107, councillor_name: 'Kavitha Reddy', mobile_no: '+91 9876543216', email_id: 'kavitha@provaani.com', calling_language: 'Telugu, English', category_id: 3 },
    { id: 8, user_id: 108, councillor_name: 'Suresh Kumar', mobile_no: '+91 9876543217', email_id: 'suresh@provaani.com', calling_language: 'Tamil, English', category_id: 4 },
    { id: 9, user_id: 109, councillor_name: 'Anita Joshi', mobile_no: '+91 9876543218', email_id: 'anita@provaani.com', calling_language: 'Marathi, Hindi', category_id: 5 },
    { id: 10, user_id: 110, councillor_name: 'Deepak Verma', mobile_no: '+91 9876543219', email_id: 'deepak@provaani.com', calling_language: 'Hindi', category_id: 5 },
];

const LEAD_NAMES = [
    'Priya Patel', 'Rahul Verma', 'Sneha Gupta', 'Amit Kumar',
    'Pooja Singh', 'Deepak Nair', 'Anita Reddy', 'Vikram Joshi', 'Kavita Mehta',
    'Rohan Bose', 'Nisha Rao', 'Suresh Das', 'Meena Iyer', 'Aakash Tiwari',
    'Ritu Malhotra', 'Gaurav Soni', 'Swati Kapoor', 'Nitin Pandey', 'Preeti Shah',
    'Harish Goel', 'Divya Menon', 'Sandeep Rao', 'Lalitha Krishnan', 'Mohan Das',
    'Sunita Yadav', 'Kartik Bhatt', 'Neha Dubey', 'Vijay Pillai', 'Rekha Nambiar',
];

const STATES = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Rajasthan', 'UP', 'Kerala'];
const DISTRICTS = ['Pune', 'Bengaluru', 'Chennai', 'New Delhi', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi'];

export const LEADS = Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    mobile_no: `+91 ${6000000000 + i * 100 + 7}`,
    name: LEAD_NAMES[i % LEAD_NAMES.length],
    state: STATES[i % STATES.length],
    district: DISTRICTS[i % DISTRICTS.length],
    mother_tongue: ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'][i % 6],
    financial_state: ['High', 'Middle', 'Low'][i % 3],
    bank_loan_requirement: i % 3 === 0,
    created_at: new Date(Date.now() - i * 2 * 86400000).toISOString(),
}));

// councillor_lead_mapping
export const LEAD_MAPPINGS = LEADS.map((lead, i) => ({
    id: i + 1,
    councillor_id: COUNSELLORS[i % COUNSELLORS.length].id,
    lead_id: lead.id,
    assignment_date: lead.created_at,
    is_active: true,
}));

// call_logs — based on DB schema
const CALL_STATUSES = ['Answered', 'Busy', 'Voicemail'];
const INTEREST_LEVELS = ['Hot', 'Warm', 'Cold'];
const AI_INSIGHTS = [
    'Student showed strong interest in CSE branch, mentioned placement record.',
    'Parent was concerned about fees, asked for scholarship details.',
    'Student is comparing with another college, needs follow-up.',
    'Ready to visit campus, preferred weekend slot.',
    'Mentioned bank loan requirement, referred to finance team.',
    'Very interested, wants to talk to alumni.',
    null, null, null,
];

export const CALL_LOGS = Array.from({ length: 120 }, (_, i) => {
    const mapping = LEAD_MAPPINGS[i % LEAD_MAPPINGS.length];
    const lead = LEADS.find(l => l.id === mapping.lead_id);
    const counsellor = COUNSELLORS.find(c => c.id === mapping.councillor_id);
    const course = COURSES[i % COURSES.length];
    const daysAgo = Math.floor(i / 8);
    const callDate = new Date();
    callDate.setDate(callDate.getDate() - daysAgo);
    callDate.setHours(9 + (i % 9), (i * 7) % 60, 0, 0);
    const status = CALL_STATUSES[i % 3];
    const isAnswered = status === 'Answered';
    const interestLevel = isAnswered ? INTEREST_LEVELS[i % 3] : null;
    const followUp = isAnswered && i % 4 === 0
        ? new Date(callDate.getTime() + 3 * 86400000).toISOString()
        : null;
    
    // AI analysis variables aligned with transcriber.py/unified_setup.sql
    const ai_analysis = isAnswered ? {
        interest_score: interestLevel === 'Hot' ? 9 : interestLevel === 'Warm' ? 6 : 3,
        courses_interested: course?.course_name,
        loan_sought: i % 3 === 0,
        preferred_language: lead?.mother_tongue || 'Hindi',
        sentiment: interestLevel === 'Hot' ? 'Very Positive' : interestLevel === 'Warm' ? 'Positive' : 'Neutral',
        budget_concern: i % 5 === 0,
        ready_to_admit: interestLevel === 'Hot'
    } : null;

    return {
        id: i + 1,
        lead_id: mapping.lead_id,
        councillor_id: mapping.councillor_id,
        course_id: course.id,
        call_number: (i % 3) + 1,
        successful_status: status,
        interest_level: interestLevel,
        follow_up_datetime: followUp,
        ai_transcript: isAnswered ? 'Agent: Hello, am I speaking with ' + lead?.name + '?...' : null,
        ai_extracted_data: ai_analysis,
        call_datetime: callDate.toISOString(),
        // Enriched for display
        lead_name: lead?.name,
        lead_mobile: lead?.mobile_no,
        lead_state: lead?.state,
        councillor_name: counsellor?.councillor_name,
        course_name: course?.course_name,
        category_id: course?.category_id,
        duration_seconds: isAnswered ? 60 + (i * 37) % 840 : 0,
    };
});

// Helper to get category stats
export function getCategoryStats(categoryId, dateStart, dateEnd) {
    const catCounselors = COUNSELLORS.filter(c => c.category_id === categoryId);
    const catIds = catCounselors.map(c => c.id);
    const catCourses = COURSES.filter(c => c.category_id === categoryId);
    const courseIds = catCourses.map(c => c.id);

    const logs = CALL_LOGS.filter(l => {
        const d = l.call_datetime.slice(0, 10);
        return courseIds.includes(l.course_id) && d >= dateStart && d <= dateEnd;
    });

    const totalLeads = new Set(logs.map(l => l.lead_id)).size;
    const totalCalls = logs.length;
    const answered = logs.filter(l => l.successful_status === 'Answered').length;
    const highInterest = logs.filter(l => l.interest_level === 'Hot').length;
    const responseRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;

    return {
        categoryId,
        counsellorCount: catCounselors.length,
        totalLeads,
        totalCalls,
        answered,
        highInterest,
        responseRate,
        converted: highInterest,
    };
}

export function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export function nDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}
