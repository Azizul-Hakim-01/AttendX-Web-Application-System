import { SUBJECT_NAMES } from "../constants/options";
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
    pageTitle: {
        fontSize: "22px",
        fontWeight: 700,
        color: "#0f172a",
        margin: 0,
    },
    pageSub: {
        fontSize: "13px",
        color: "#94a3b8",
        marginTop: "4px",
        marginBottom: "24px",
    },
    panel: {
        background: "#ffffff",
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
        gap: "12px",
        alignItems: "flex-end",
        flexWrap: "wrap",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "12px",
        fontWeight: 500,
        color: "#475569",
    },
    input: {
        padding: "9px 14px",
        borderRadius: "8px",
        border: "0.5px solid #cbd5e1",
        background: "#f8fafc",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        width: "280px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    btnPrimary: {
        background: "#6366f1",
        color: "#fff",
        border: "none",
        padding: "9px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    btnWarning: {
        background: "#fffbeb",
        color: "#d97706",
        border: "0.5px solid #fde68a",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    btnDanger: {
        background: "#fef2f2",
        color: "#ef4444",
        border: "0.5px solid #fecaca",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    btnCancel: {
        background: "#f8fafc",
        color: "#64748b",
        border: "0.5px solid #e2e8f0",
        padding: "9px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
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
        letterSpacing: "0.6px",
        borderBottom: "0.5px solid #e2e8f0",
        background: "#f8fafc",
    },
    td: {
        padding: "12px 14px",
        borderBottom: "0.5px solid #f1f5f9",
        color: "#334155",
        verticalAlign: "middle",
    },
    emptyState: {
        textAlign: "center",
        padding: "48px 0",
        color: "#94a3b8",
        fontSize: "14px",
    },
    countBadge: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f7",
        color: "#64748b",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "20px",
        marginLeft: "8px",
    },
    assignmentBox: {
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px",
        maxHeight: "220px",
        overflowY: "auto",
        minWidth: "280px",
    },
    facultyOption: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "7px 4px",
        fontSize: "13px",
        color: "#334155",
    },
};

function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [faculty, setFaculty] = useState([]);
    const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
    const [assignmentSubject, setAssignmentSubject] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [savingAssignment, setSavingAssignment] = useState(false);

    const role = localStorage.getItem("role");
    const isAdmin = role === "ADMIN";

    useEffect(() => {
        loadSubjects();

        if (isAdmin) {
            loadFaculty();
        }
    }, []);

    const getToken = () => localStorage.getItem("token");

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${getToken()}` },
    });

    const loadSubjects = async () => {
        try {
            const res = await api.get("/subjects", authHeader());
            setSubjects(res.data);
        } catch (e) {
            console.error(e);
            setError("Unable to load subjects.");
        }
    };

    const loadFaculty = async () => {
        try {
            const res = await api.get("/faculty", authHeader());
            setFaculty(res.data);
        } catch (e) {
            console.error(e);
            setError("Unable to load faculty members.");
        }
    };

    const saveSubject = async () => {
        if (!subjectName.trim()) return;

        try {
            if (editingId) {
                await api.put(
                    `/subjects/${editingId}`,
                    { subjectName },
                    authHeader()
                );
                setEditingId(null);
                setMessage("Subject updated successfully.");
            } else {
                await api.post(
                    "/subjects",
                    { subjectName },
                    authHeader()
                );
                setMessage("Subject added successfully.");
            }

            setSubjectName("");
            loadSubjects();
        } catch (e) {
            console.error(e);
            setError("Unable to save subject.");
        }
    };

    const editSubject = (subject) => {
        setEditingId(subject.id);
        setSubjectName(subject.subjectName);
        setMessage("");
        setError("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setSubjectName("");
    };

    const deleteSubject = async (id) => {
        if (!window.confirm("Delete this subject?")) return;

        try {
            await api.delete(`/subjects/${id}`, authHeader());
            setMessage("Subject deleted successfully.");
            loadSubjects();
        } catch (e) {
            console.error(e);
            setError("Unable to delete subject.");
        }
    };

    const openAssignment = async (subject) => {
        setAssignmentSubject(subject);
        setSelectedFacultyIds([]);
        setMessage("");
        setError("");

        try {
            const res = await api.get(
                `/subjects/${subject.id}/faculty`,
                authHeader()
            );

            setSelectedFacultyIds(
                res.data.map((member) => member.id)
            );
        } catch (e) {
            console.error(e);
            setError("Unable to load current faculty assignments.");
            setAssignmentSubject(null);
        }
    };

    const toggleFaculty = (facultyId) => {
        setSelectedFacultyIds((previous) =>
            previous.includes(facultyId)
                ? previous.filter((id) => id !== facultyId)
                : [...previous, facultyId]
        );
    };

    const saveAssignment = async () => {
        if (!assignmentSubject) return;

        setSavingAssignment(true);
        setError("");
        setMessage("");

        try {
            await api.put(
                `/subjects/${assignmentSubject.id}/faculty`,
                selectedFacultyIds,
                authHeader()
            );

            setMessage(
                `Faculty assignments updated for ${assignmentSubject.subjectName}.`
            );

            setAssignmentSubject(null);
            setSelectedFacultyIds([]);
            loadSubjects();
        } catch (e) {
            console.error(e);
            setError("Unable to update faculty assignments.");
        } finally {
            setSavingAssignment(false);
        }
    };

    const getAssignedFacultyNames = (subject) => {
        if (!subject.faculty || subject.faculty.length === 0) {
            return "Not assigned";
        }

        return subject.faculty
            .map((member) => member.name)
            .filter(Boolean)
            .join(", ");
    };

    return (
        <div style={S.root}>
            <Sidebar />

            <main style={S.main}>
                <h1 style={S.pageTitle}>Subject Management</h1>

                <p style={S.pageSub}>
                    {isAdmin
                        ? "Manage subjects and assign faculty members"
                        : "View subjects assigned to you"}
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
                        {error}
                    </div>
                )}

                {isAdmin && (
                    <div style={S.panel}>
                        <div style={S.panelTitle}>
                            {editingId ? "Edit Subject" : "Add New Subject"}
                        </div>

                        <div style={S.formRow}>
                            <div style={S.formGroup}>
                                <label style={S.label}>Subject Name</label>

                                <select
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    style={S.input}
                                >
                                    <option value="">Select Subject</option>
                                    {SUBJECT_NAMES.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                style={S.btnPrimary}
                                onClick={saveSubject}
                            >
                                {editingId ? "Update Subject" : "Add Subject"}
                            </button>

                            {editingId && (
                                <button
                                    style={S.btnCancel}
                                    onClick={cancelEdit}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {isAdmin && assignmentSubject && (
                    <div style={S.panel}>
                        <div style={S.panelTitle}>
                            Assign Faculty — {assignmentSubject.subjectName}
                        </div>

                        <p style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginBottom: "12px",
                        }}>
                            Select all faculty members responsible for this subject.
                        </p>

                        <div style={S.assignmentBox}>
                            {faculty.length === 0 ? (
                                <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                                    No faculty members available.
                                </p>
                            ) : (
                                faculty.map((member) => (
                                    <label
                                        key={member.id}
                                        style={S.facultyOption}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedFacultyIds.includes(member.id)}
                                            onChange={() => toggleFaculty(member.id)}
                                        />

                                        <span>
                                            {member.name}
                                            {member.department
                                                ? ` — ${member.department}`
                                                : ""}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>

                        <div style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "14px",
                        }}>
                            <button
                                style={S.btnPrimary}
                                onClick={saveAssignment}
                                disabled={savingAssignment}
                            >
                                {savingAssignment ? "Saving..." : "Save Assignments"}
                            </button>

                            <button
                                style={S.btnCancel}
                                onClick={() => setAssignmentSubject(null)}
                                disabled={savingAssignment}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div style={S.panel}>
                    <div style={S.panelTitle}>
                        {isAdmin ? "All Subjects" : "My Assigned Subjects"}

                        <span style={S.countBadge}>
                            {subjects.length}
                        </span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>ID</th>
                                    <th style={S.th}>Subject Name</th>
                                    <th style={S.th}>Assigned Faculty</th>

                                    {isAdmin && (
                                        <th style={S.th}>Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {subjects.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={isAdmin ? 4 : 3}
                                            style={S.emptyState}
                                        >
                                            No subjects found.
                                        </td>
                                    </tr>
                                ) : (
                                    subjects.map((subject) => (
                                        <tr
                                            key={subject.id}
                                            onMouseEnter={(e) =>
                                                e.currentTarget.style.background = "#f8fafc"
                                            }
                                            onMouseLeave={(e) =>
                                                e.currentTarget.style.background = "transparent"
                                            }
                                        >
                                            <td style={{
                                                ...S.td,
                                                color: "#94a3b8",
                                                fontSize: "12px",
                                            }}>
                                                #{subject.id}
                                            </td>

                                            <td style={S.td}>
                                                <span style={{
                                                    fontWeight: 500,
                                                    color: "#0f172a",
                                                }}>
                                                    {subject.subjectName}
                                                </span>
                                            </td>

                                            <td style={S.td}>
                                                {getAssignedFacultyNames(subject)}
                                            </td>

                                            {isAdmin && (
                                                <td style={S.td}>
                                                    <div style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        flexWrap: "wrap",
                                                    }}>
                                                        <button
                                                            style={S.btnWarning}
                                                            onClick={() => editSubject(subject)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            style={S.btnPrimary}
                                                            onClick={() => openAssignment(subject)}
                                                        >
                                                            Assign Faculty
                                                        </button>

                                                        <button
                                                            style={S.btnDanger}
                                                            onClick={() => deleteSubject(subject.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {subjects.length > 0 && (
                        <div style={{
                            marginTop: "14px",
                            fontSize: "12px",
                            color: "#94a3b8",
                        }}>
                            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} total
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Subjects;
