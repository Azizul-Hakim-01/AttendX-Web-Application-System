

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
        overflowX: "auto",
    },
    panelTitle: {
        fontSize: "14px",
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: "16px",
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
    },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        color: "#475569",
        marginBottom: "6px",
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "9px 10px",
        border: "1px solid #cbd5e1",
        borderRadius: "7px",
        fontSize: "13px",
        color: "#334155",
        background: "#fff",
    },
    btnSecondary: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #cbd5e1",
        padding: "8px 14px",
        borderRadius: "7px",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
    },
    table: {
        width: "100%",
        minWidth: "850px",
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
    emptyState: {
        textAlign: "center",
        padding: "48px 0",
        color: "#94a3b8",
    },
};

function Avatar({ name }) {
    const initials = name
        ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    return (
        <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            color: "#3b82f6",
            flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

function Prediction() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const role = localStorage.getItem("role");

    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [filterStudent, setFilterStudent] = useState("");
    const [filterRollNo, setFilterRollNo] = useState("");
    const [filterSubject, setFilterSubject] = useState("");
    const [filterRisk, setFilterRisk] = useState("");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");

    const authHeader = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    useEffect(() => {
        loadPredictions();
        loadFilterOptions();
    }, []);

    const loadPredictions = async () => {
        try {
            setError("");

            const response = await api.get(
                "/predictions",
                authHeader()
            );

            setPredictions(response.data);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Could not load prediction records."
            );
        }
    };

    const loadFilterOptions = async () => {
        try {
            const subjectRes = await api.get("/subjects", authHeader());
            const subjectList = subjectRes.data;
            setSubjects(subjectList);

            if (role === "ADMIN") {
                const studentRes = await api.get("/students", authHeader());
                setStudents(studentRes.data);
            } else if (role === "FACULTY") {
                const enrollmentResults = await Promise.all(
                    subjectList.map((subject) =>
                        api.get(`/enrollments/subject/${subject.id}`, authHeader())
                    )
                );

                const studentMap = new Map();

                enrollmentResults.forEach((response) => {
                    response.data.forEach((enrollment) => {
                        studentMap.set(String(enrollment.studentId), {
                            id: enrollment.studentId,
                            name: enrollment.studentName,
                            rollNo: enrollment.rollNo,
                        });
                    });
                });

                setStudents(Array.from(studentMap.values()));
            }
        } catch (err) {
            console.error("Could not load prediction filter options:", err);
            setError("Could not load filter options.");
        }
    };
    const generateAllPredictions = async () => {
        try {
            setLoading(true);
            setError("");

            await api.post(
                "/predictions/generate-all",
                {},
                authHeader()
            );

            await loadPredictions();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Prediction generation failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const deletePrediction = async (id) => {
        if (!window.confirm("Delete this prediction record?")) {
            return;
        }

        try {
            await api.delete(
                `/predictions/${id}`,
                authHeader()
            );

            await loadPredictions();
        } catch (err) {
            console.error(err);
            setError("Could not delete this prediction.");
        }
    };

    const filteredPredictions = predictions.filter((prediction) => {
        const studentId = String(prediction.student?.id ?? "");
        const rollNo = String(prediction.student?.rollNo ?? "");
        const subjectId = String(prediction.subject?.id ?? "");
        const risk = prediction.riskLevel ?? "";
        const predictionDate = prediction.predictionDate
            ? String(prediction.predictionDate).slice(0, 10)
            : "";

        if (filterStudent && studentId !== String(filterStudent)) {
            return false;
        }

        if (filterRollNo && !rollNo.toLowerCase().includes(filterRollNo.toLowerCase())) {
            return false;
        }

        if (filterSubject && subjectId !== String(filterSubject)) {
            return false;
        }

        if (filterRisk && risk !== filterRisk) {
            return false;
        }

        if (filterFromDate && (!predictionDate || predictionDate < filterFromDate)) {
            return false;
        }

        if (filterToDate && (!predictionDate || predictionDate > filterToDate)) {
            return false;
        }

        return true;
    });
    const getRiskBadge = (risk) => {
        switch (risk) {
            case "LOW":
                return {
                    background: "#ecfdf5",
                    color: "#10b981",
                    border: "1px solid #a7f3d0",
                };

            case "MEDIUM":
                return {
                    background: "#fffbeb",
                    color: "#d97706",
                    border: "1px solid #fde68a",
                };

            default:
                return {
                    background: "#fef2f2",
                    color: "#ef4444",
                    border: "1px solid #fecaca",
                };
        }
    };

    return (
        <div style={S.root}>
            <Sidebar />

            <main style={S.main}>
                <h1 style={S.pageTitle}>
                    Attendance Prediction
                </h1>

                <p style={S.pageSub}>
                    Subject-wise Attendance Risk Analysis
                </p>

                <div style={S.panel}>
                    {role === "ADMIN" && (
                        <button
                            style={{
                                ...S.btnPrimary,
                                opacity: loading ? 0.65 : 1,
                            }}
                            onClick={generateAllPredictions}
                            disabled={loading}
                        >
                            {loading
                                ? "Generating..."
                                : "Generate Predictions"}
                        </button>
                    )}

                    <p style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "12px",
                        marginBottom: 0,
                    }}>
                        Predictions are calculated separately for each
                        student and subject using recorded attendance.
                    </p>
                </div>

                {error && (
                    <div style={{
                        ...S.panel,
                        color: "#dc2626",
                        background: "#fef2f2",
                        borderColor: "#fecaca",
                    }}>
                        {error}
                    </div>
                )}

                <div style={S.panel}>
                    <div style={S.panelTitle}>Filter Prediction Records</div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px",
                    }}>
                        {role !== "STUDENT" && (
                            <>
                                <div>
                                    <label style={S.label}>Student</label>
                                    <select
                                        style={S.input}
                                        value={filterStudent}
                                        onChange={(e) => setFilterStudent(e.target.value)}
                                    >
                                        <option value="">All Students</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.name} ({student.rollNo})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={S.label}>Roll No</label>
                                    <input
                                        style={S.input}
                                        type="text"
                                        placeholder="Search by roll number"
                                        value={filterRollNo}
                                        onChange={(e) => setFilterRollNo(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label style={S.label}>Subject</label>
                            <select
                                style={S.input}
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                            >
                                <option value="">All Subjects</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.subjectName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={S.label}>Risk Level</label>
                            <select
                                style={S.input}
                                value={filterRisk}
                                onChange={(e) => setFilterRisk(e.target.value)}
                            >
                                <option value="">All Risk Levels</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>

                        <div>
                            <label style={S.label}>From Date</label>
                            <input
                                style={S.input}
                                type="date"
                                value={filterFromDate}
                                onChange={(e) => setFilterFromDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={S.label}>To Date</label>
                            <input
                                style={S.input}
                                type="date"
                                value={filterToDate}
                                onChange={(e) => setFilterToDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        style={{ ...S.btnSecondary, marginTop: "16px" }}
                        onClick={() => {
                            setFilterStudent("");
                            setFilterRollNo("");
                            setFilterSubject("");
                            setFilterRisk("");
                            setFilterFromDate("");
                            setFilterToDate("");
                        }}
                    >
                        Reset Filters
                    </button>
                </div>

                <div style={S.panel}>
                    <div style={S.panelTitle}>
                        Subject-wise Prediction Records
                    </div>

                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>ID</th>
                                <th style={S.th}>Student</th>
                                <th style={S.th}>Roll No</th>
                                <th style={S.th}>Subject</th>
                                <th style={S.th}>Current Attendance %</th>
                                <th style={S.th}>Risk</th>
                                <th style={S.th}>Prediction Date</th>
                                {role === "ADMIN" && <th style={S.th}>Actions</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredPredictions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={role === "ADMIN" ? 8 : 7}
                                        style={S.emptyState}
                                    >
                                        {predictions.length === 0 ? "No Predictions Found" : "No Matching Records"}
                                    </td>
                                </tr>
                            ) : (
                                filteredPredictions.map((prediction) => (
                                    <tr key={prediction.id}>
                                        <td style={S.td}>
                                            {prediction.id}
                                        </td>

                                        <td style={S.td}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                            }}>
                                                <Avatar
                                                    name={prediction.student?.name}
                                                />
                                                {prediction.student?.name || "Unknown"}
                                            </div>
                                        </td>

                                        <td style={S.td}>
                                            {prediction.student?.rollNo || "—"}
                                        </td>

                                        <td style={S.td}>
                                            {prediction.subject?.subjectName || "Overall"}
                                        </td>

                                        <td style={{
                                            ...S.td,
                                            fontWeight: 600,
                                        }}>
                                            {Number(
                                                prediction.predictedPercentage
                                            ).toFixed(2)}%
                                        </td>

                                        <td style={S.td}>
                                            <span style={{
                                                ...getRiskBadge(prediction.riskLevel),
                                                padding: "5px 10px",
                                                borderRadius: "20px",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                            }}>
                                                {prediction.riskLevel}
                                            </span>
                                        </td>

                                        <td style={S.td}>
                                            {prediction.predictionDate
                                                ? new Date(
                                                    prediction.predictionDate
                                                ).toLocaleString()
                                                : "—"}
                                        </td>

                                        {role === "ADMIN" && (
                                            <td style={S.td}>
                                                <button
                                                    style={S.btnDanger}
                                                    onClick={() =>
                                                        deletePrediction(prediction.id)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

export default Prediction;


