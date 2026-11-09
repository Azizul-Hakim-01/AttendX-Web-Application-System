
import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import Sidebar from "../components/Sidebar";

const S = {
    root: {
        display: "flex",
        minHeight: "100vh",
        background: "#f0f2f7",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    main: {
        flex: 1,
        padding: "24px 28px",
        overflowY: "auto",
    },
    title: {
        fontSize: "22px",
        fontWeight: 700,
        color: "#0f172a",
        margin: 0,
    },
    sub: {
        fontSize: "13px",
        color: "#94a3b8",
        marginTop: "4px",
        marginBottom: "24px",
    },
    panel: {
        background: "#fff",
        borderRadius: "14px",
        border: "0.5px solid #e2e8f0",
        padding: "20px",
        marginBottom: "20px",
    },
    panelTitle: {
        fontSize: "14px",
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: "16px",
    },
    formRow: {
        display: "flex",
        gap: "14px",
        alignItems: "flex-end",
        flexWrap: "wrap",
    },
    group: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "12px",
        fontWeight: 500,
        color: "#475569",
    },
    select: {
        width: "280px",
        maxWidth: "100%",
        padding: "9px 12px",
        borderRadius: "8px",
        border: "0.5px solid #cbd5e1",
        background: "#f8fafc",
        fontSize: "13px",
        color: "#0f172a",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    primary: {
        background: "#6366f1",
        color: "#fff",
        border: "none",
        padding: "9px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
    },
    danger: {
        background: "#fef2f2",
        color: "#ef4444",
        border: "0.5px solid #fecaca",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        cursor: "pointer",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
    },
    th: {
        padding: "10px 14px",
        textAlign: "left",
        fontSize: "11px",
        fontWeight: 600,
        color: "#94a3b8",
        textTransform: "uppercase",
        borderBottom: "0.5px solid #e2e8f0",
        background: "#f8fafc",
    },
    td: {
        padding: "12px 14px",
        borderBottom: "0.5px solid #f1f5f9",
        color: "#334155",
    },
    empty: {
        textAlign: "center",
        padding: "40px 0",
        color: "#94a3b8",
        fontSize: "14px",
    },
    badge: {
        display: "inline-flex",
        background: "#f0f2f7",
        color: "#64748b",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "20px",
        marginLeft: "8px",
    },
};

function Enrollments() {
    const role = localStorage.getItem("role");
    const isAdmin = role === "ADMIN";

    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const authHeader = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedSubjectId) {
            loadEnrollments(selectedSubjectId);
        } else {
            setEnrollments([]);
        }
    }, [selectedSubjectId]);

    const loadInitialData = async () => {
        setLoading(true);
        setError("");

        try {
            const subjectResponse = await api.get(
                "/subjects",
                authHeader()
            );

            setSubjects(subjectResponse.data);

            if (subjectResponse.data.length > 0) {
                setSelectedSubjectId(
                    String(subjectResponse.data[0].id)
                );
            }

            if (isAdmin) {
                const studentResponse = await api.get(
                    "/students",
                    authHeader()
                );

                setStudents(studentResponse.data);
            }
        } catch (e) {
            console.error(e);
            setError("Unable to load enrollment information.");
        } finally {
            setLoading(false);
        }
    };

    const loadEnrollments = async (subjectId) => {
        setError("");

        try {
            const response = await api.get(
                `/enrollments/subject/${subjectId}`,
                authHeader()
            );

            setEnrollments(response.data);
        } catch (e) {
            console.error(e);
            setEnrollments([]);
            setError("Unable to load enrolled students.");
        }
    };

    const enrollStudent = async () => {
        if (!selectedStudentId || !selectedSubjectId) {
            setError("Please select both a student and a subject.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            await api.post(
                `/enrollments/student/${selectedStudentId}/subject/${selectedSubjectId}`,
                {},
                authHeader()
            );

            setMessage("Student enrolled successfully.");
            await loadEnrollments(selectedSubjectId);
        } catch (e) {
            console.error(e);
            setError(
                e.response?.data?.message ||
                e.response?.data ||
                "Unable to enroll student. They may already be enrolled."
            );
        } finally {
            setSaving(false);
        }
    };

    const removeEnrollment = async (enrollment) => {
        const confirmed = window.confirm(
            `Remove ${enrollment.studentName} from ${enrollment.subjectName}?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await api.delete(
                `/enrollments/student/${enrollment.studentId}/subject/${enrollment.subjectId}`,
                authHeader()
            );

            setMessage("Enrollment removed successfully.");
            await loadEnrollments(selectedSubjectId);
        } catch (e) {
            console.error(e);
            setError("Unable to remove enrollment.");
        }
    };

    return (
        <div style={S.root}>
            <Sidebar />

            <main style={S.main}>
                <h1 style={S.title}>Student Enrollments</h1>

                <p style={S.sub}>
                    {isAdmin
                        ? "Enroll students in subjects and manage their registrations."
                        : "View students enrolled in your assigned subjects."}
                </p>

                {message && (
                    <div style={{
                        background: "#ecfdf5",
                        color: "#047857",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontSize: "13px",
                    }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        background: "#fef2f2",
                        color: "#dc2626",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontSize: "13px",
                    }}>
                        {typeof error === "string"
                            ? error
                            : "Unable to complete the operation."}
                    </div>
                )}

                {isAdmin && (
                    <div style={S.panel}>
                        <div style={S.panelTitle}>
                            Enroll Student in a Subject
                        </div>

                        <div style={S.formRow}>
                            <div style={S.group}>
                                <label style={S.label}>Select Student</label>

                                <select
                                    style={S.select}
                                    value={selectedStudentId}
                                    onChange={(e) =>
                                        setSelectedStudentId(e.target.value)
                                    }
                                >
                                    <option value="">Choose a student</option>

                                    {students.map((student) => (
                                        <option
                                            key={student.id}
                                            value={student.id}
                                        >
                                            {student.rollNo} - {student.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={S.group}>
                                <label style={S.label}>Select Subject</label>

                                <select
                                    style={S.select}
                                    value={selectedSubjectId}
                                    onChange={(e) =>
                                        setSelectedSubjectId(e.target.value)
                                    }
                                >
                                    <option value="">Choose a subject</option>

                                    {subjects.map((subject) => (
                                        <option
                                            key={subject.id}
                                            value={subject.id}
                                        >
                                            {subject.subjectName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                style={{
                                    ...S.primary,
                                    opacity: saving ? 0.6 : 1,
                                }}
                                onClick={enrollStudent}
                                disabled={saving || loading}
                            >
                                {saving ? "Enrolling..." : "Enroll Student"}
                            </button>
                        </div>
                    </div>
                )}

                <div style={S.panel}>
                    <div style={S.panelTitle}>
                        {isAdmin
                            ? "Enrolled Students"
                            : "Students in My Assigned Subject"}

                        <span style={S.badge}>
                            {enrollments.length}
                        </span>
                    </div>

                    <div style={{
                        ...S.group,
                        marginBottom: "18px",
                        maxWidth: "400px",
                    }}>
                        <label style={S.label}>Filter by Subject</label>

                        <select
                            style={S.select}
                            value={selectedSubjectId}
                            onChange={(e) =>
                                setSelectedSubjectId(e.target.value)
                            }
                        >
                            <option value="">Select a subject</option>

                            {subjects.map((subject) => (
                                <option
                                    key={subject.id}
                                    value={subject.id}
                                >
                                    {subject.subjectName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div style={S.empty}>Loading enrollments...</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>ID</th>
                                        <th style={S.th}>Roll No</th>
                                        <th style={S.th}>Student Name</th>
                                        <th style={S.th}>Email</th>
                                        {isAdmin && (
                                            <th style={S.th}>Actions</th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {enrollments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={isAdmin ? 5 : 4}
                                                style={S.empty}
                                            >
                                                No students enrolled in this subject.
                                            </td>
                                        </tr>
                                    ) : (
                                        enrollments.map((item) => (
                                            <tr key={item.enrollmentId}>
                                                <td style={S.td}>
                                                    #{item.studentId}
                                                </td>

                                                <td style={S.td}>
                                                    {item.rollNo}
                                                </td>

                                                <td style={{
                                                    ...S.td,
                                                    fontWeight: 500,
                                                    color: "#0f172a",
                                                }}>
                                                    {item.studentName}
                                                </td>

                                                <td style={S.td}>
                                                    {item.studentEmail || "—"}
                                                </td>

                                                {isAdmin && (
                                                    <td style={S.td}>
                                                        <button
                                                            style={S.danger}
                                                            onClick={() =>
                                                                removeEnrollment(item)
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Enrollments;
