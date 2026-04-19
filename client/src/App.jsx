import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/shared/PrivateRoute';
import Layout from './components/shared/Layout';

// Auth
import Login from './pages/auth/Login';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentRisk from './pages/student/Risk';
import StudentAttendance from './pages/student/Attendance';
import StudentLMS from './pages/student/LMS';
import StudentAssignments from './pages/student/Assignments';
import StudentSchedule from './pages/student/Schedule';
import StudentFaculty from './pages/student/Faculty';
import StudentGrades from './pages/student/Grades';
import StudentHallTicket from './pages/student/HallTicket';

// Mentor Pages
import MentorDashboard from './pages/mentor/Dashboard';
import MentorStudents from './pages/mentor/Students';
import StudentDetail from './pages/mentor/StudentDetail';
import MentorInterventions from './pages/mentor/Interventions';
import MentorRemedial from './pages/mentor/Remedial';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherLMS from './pages/teacher/LMS';
import TeacherAssignments from './pages/teacher/Assignments';
import TeacherMarks from './pages/teacher/Marks';
import TeacherGrades from './pages/teacher/Grades';
import TeacherAttendance from './pages/teacher/Attendance';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminTimetable from './pages/admin/Timetable';
import AdminClassrooms from './pages/admin/Classrooms';
import AdminHallTicket from './pages/admin/HallTicket';
import AdminEvents from './pages/admin/Events';
import ViewPDFs from "./pages/student/ViewPDFs";

<Route path="/pdfs" element={<ViewPDFs />} />

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />


      <Route path="/pdfs" element={<ViewPDFs />} />
      {/* Student Routes */}
      <Route path="/student/dashboard" element={<PrivateRoute role={['student']}><Layout><StudentDashboard /></Layout></PrivateRoute>} />
      <Route path="/student/risk" element={<PrivateRoute role={['student']}><Layout><StudentRisk /></Layout></PrivateRoute>} />
      <Route path="/student/attendance" element={<PrivateRoute role={['student']}><Layout><StudentAttendance /></Layout></PrivateRoute>} />
      <Route path="/student/lms" element={<PrivateRoute role={['student']}><Layout><StudentLMS /></Layout></PrivateRoute>} />
      <Route path="/student/assignments" element={<PrivateRoute role={['student']}><Layout><StudentAssignments /></Layout></PrivateRoute>} />
      <Route path="/student/schedule" element={<PrivateRoute role={['student']}><Layout><StudentSchedule /></Layout></PrivateRoute>} />
      <Route path="/student/faculty" element={<PrivateRoute role={['student']}><Layout><StudentFaculty /></Layout></PrivateRoute>} />
      <Route path="/student/grades" element={<PrivateRoute role={['student']}><Layout><StudentGrades /></Layout></PrivateRoute>} />
      <Route path="/student/hallticket" element={<PrivateRoute role={['student']}><Layout><StudentHallTicket /></Layout></PrivateRoute>} />

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard" element={<PrivateRoute role={['mentor']}><Layout><MentorDashboard /></Layout></PrivateRoute>} />
      <Route path="/mentor/students" element={<PrivateRoute role={['mentor']}><Layout><MentorStudents /></Layout></PrivateRoute>} />
      <Route path="/mentor/students/:id" element={<PrivateRoute role={['mentor']}><Layout><StudentDetail /></Layout></PrivateRoute>} />
      <Route path="/mentor/interventions" element={<PrivateRoute role={['mentor']}><Layout><MentorInterventions /></Layout></PrivateRoute>} />
      <Route path="/mentor/remedial" element={<PrivateRoute role={['mentor']}><Layout><MentorRemedial /></Layout></PrivateRoute>} />

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={<PrivateRoute role={['teacher']}><Layout><TeacherDashboard /></Layout></PrivateRoute>} />
      <Route path="/teacher/lms" element={<PrivateRoute role={['teacher']}><Layout><TeacherLMS /></Layout></PrivateRoute>} />
      <Route path="/teacher/assignments" element={<PrivateRoute role={['teacher']}><Layout><TeacherAssignments /></Layout></PrivateRoute>} />
      <Route path="/teacher/marks" element={<PrivateRoute role={['teacher']}><Layout><TeacherMarks /></Layout></PrivateRoute>} />
      <Route path="/teacher/grades" element={<PrivateRoute role={['teacher']}><Layout><TeacherGrades /></Layout></PrivateRoute>} />
      <Route path="/teacher/attendance" element={<PrivateRoute role={['teacher']}><Layout><TeacherAttendance /></Layout></PrivateRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<PrivateRoute role={['admin']}><Layout><AdminDashboard /></Layout></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute role={['admin']}><Layout><AdminUsers /></Layout></PrivateRoute>} />
      <Route path="/admin/timetable" element={<PrivateRoute role={['admin']}><Layout><AdminTimetable /></Layout></PrivateRoute>} />
      <Route path="/admin/classrooms" element={<PrivateRoute role={['admin']}><Layout><AdminClassrooms /></Layout></PrivateRoute>} />
      <Route path="/admin/hallticket" element={<PrivateRoute role={['admin']}><Layout><AdminHallTicket /></Layout></PrivateRoute>} />
      <Route path="/admin/events" element={<PrivateRoute role={['admin']}><Layout><AdminEvents /></Layout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
