
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Faculty from "./pages/Faculty";
import Subjects from "./pages/Subjects";
import Enrollments from "./pages/Enrollments";
import Attendance from "./pages/Attendance";
import AttendanceAnalytics from "./pages/AttendanceAnalytics";
import Prediction from "./pages/Prediction";
import FaceRecognition from "./pages/FaceRecognition";
import FaceEnrollment from "./pages/FaceEnrollment";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/students"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <Students />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <Faculty />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/subjects"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "FACULTY"]}>
                            <Subjects />
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/enrollments"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "FACULTY"]}>
                            <Enrollments />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attendance"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}>
                            <Attendance />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}>
                            <AttendanceAnalytics />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/prediction"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}>
                            <Prediction />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/face"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "STUDENT"]}>
                            <FaceRecognition />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/face-enrollment/:studentId"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <FaceEnrollment />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

