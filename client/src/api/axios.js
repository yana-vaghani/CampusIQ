import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Students
export const getStudents = () => api.get('/students');
export const getStudent = (id) => api.get(`/students/${id}`);
export const getStudentRisk = (id) => api.get(`/students/${id}/risk`);
export const getStudentAttendance = (id, subjectId) => api.get(`/students/${id}/attendance`, { params: { subjectId } });
export const getStudentMarks = (id) => api.get(`/students/${id}/marks`);
export const getStudentAssignments = (id) => api.get(`/students/${id}/assignments`);
export const getStudentHallTicket = (id) => api.get(`/students/${id}/hallticket`);

// Attendance
export const markAttendance = (records) => api.post('/attendance', { records });
export const getSubjectAttendance = (subjectId, date) => api.get(`/attendance/subject/${subjectId}`, { params: { date } });

// Marks
export const getMarks = (studentId) => api.get(`/marks/${studentId}`);
export const bulkSaveMarks = (marks) => api.put('/marks/bulk', { marks });
export const uploadMarksCSV = (formData) => api.post('/marks/csv-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Assignments
export const getAssignments = (params) => api.get('/assignments', { params });
export const createAssignment = (data) => api.post('/assignments', data);
export const submitAssignment = (id, formData) => api.post(`/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getSubmissions = (id) => api.get(`/assignments/${id}/submissions`);

// LMS
export const getLMSContent = (subjectId, params) => api.get(`/lms/${subjectId}`, { params });
export const uploadLMSContent = (formData) => api.post('/lms/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteLMSContent = (id) => api.delete(`/lms/${id}`);

// Interventions
export const getInterventions = (params) => api.get('/interventions', { params });
export const getStudentInterventions = (studentId) => api.get(`/interventions/${studentId}`);
export const createIntervention = (data) => api.post('/interventions', data);

// Timetable
export const getTimetable = (section) => api.get(`/timetable/${section}`);
export const createTimetableEntry = (data) => api.post('/timetable', data);
export const updateTimetableEntry = (id, data) => api.put(`/timetable/${id}`, data);
export const deleteTimetableEntry = (id) => api.delete(`/timetable/${id}`);

// Users
export const getUsers = (params) => api.get('/users', { params });
export const createUser = (data) => api.post('/users', data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const importUsersCSV = (formData) => api.post('/users/csv-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Hall Ticket
export const getHallTicketRules = () => api.get('/hallticket/rules');
export const updateHallTicketRules = (data) => api.put('/hallticket/rules', data);
export const getEligibility = (studentId) => api.get(`/hallticket/${studentId}/eligibility`);

// Events
export const getEvents = () => api.get('/events');
export const createEvent = (data) => api.post('/events', data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

// Faculty
export const getFaculty = (params) => api.get('/faculty', { params });
export const getFacultyById = (id) => api.get(`/faculty/${id}`);
export const getMySubjects = () => api.get('/faculty/my/subjects');

// Subjects (used across the app)
export const getSubjects = () => api.get('/faculty/my/subjects');

export default api;
