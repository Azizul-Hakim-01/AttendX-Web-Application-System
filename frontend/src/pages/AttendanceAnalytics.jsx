import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import Sidebar from "../components/Sidebar";

const styles = {
    root: {
        display: "flex",
        minHeight: "100vh",
        background: "#f0f2f7",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    main: {
        flex: 1,
        minWidth: 0,
        padding: "24px 28px",
        overflowY: "auto",
    },
    title: {
        fontSize: "23px",
        fontWeight: 700,
        color: "#0f172a",
        margin: 0,
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: "13px",
        margin: "5px 0 22px",
    },
    panel: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "20px",
    },
    panelTitle: {
        fontSize: "15px",
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: "16px",
    },
    cards: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
        gap: "14px",
        marginBottom: "20px",
    },
    card: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "13px",
        padding: "18px",
    },
    cardLabel: {
        color: "#64748b",
        fontSize: "12px",
        marginBottom: "9px",
    },
    cardValue: {
        color: "#0f172a",
        fontSize: "25px",
        fontWeight: 700,
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
        minWidth: "600px",
    },
    th: {
        padding: "11px 12px",
        textAlign: "left",
        color: "#64748b",
        fontSize: "11px",
        textTransform: "uppercase",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
    },
    td: {
        padding: "12px",
        color: "#334155",
        borderBottom: "1px solid #f1f5f9",
    },
    input: {
        padding: "9px 11px",
        border: "1px solid #cbd5e1",
        borderRadius: "7px",
        fontSize: "13px",
    },
    button: {
        padding: "10px 17px",
        border: "none",
        borderRadius: "7px",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
    },
    muted: {
        color: "#94a3b8",
        fontSize: "13px",
        textAlign: "center",
        padding: "25px",
    },
};

const percent = (value) => `${Number(value || 0).toFixed(2)}%`;

function StatusBadge({ low }) {
    return (
        <span style={{
            display: "inline-block",
            padding: "4px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 600,
            color: low ? "#dc2626" : "#059669",
            background: low ? "#fef2f2" : "#ecfdf5",
        }}>
            {low ? "Low Attendance" : "Good"}
        </span>
    );
}

function AttendanceBar({ percentage, color = "#2563eb" }) {
    const value = Math.min(100, Math.max(0, Number(percentage) || 0));

    return (
        <div style={{
            height: "11px",
            borderRadius: "10px",
            background: "#e2e8f0",
            overflow: "hidden",
        }}>
            <div style={{
                height: "100%",
                width: `${value}%`,
                background: color,
                borderRadius: "10px",
                transition: "width 0.3s ease",
            }} />
        </div>
    );
}

function AttendanceAnalytics() {
    const role = localStorage.getItem("role");

    const [data, setData] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async (filters = {}) => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await api.get("/analytics", {
                params: filters,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setData(response.data);
        } catch (err) {
            console.error("Analytics loading failed:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load attendance analytics."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const applyFilters = () => {
        if (startDate && endDate && startDate > endDate) {
            setError("Start date cannot be after end date.");
            return;
        }

        const filters = {};

        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        loadData(filters);
    };

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        loadData();
    };

    const summary = data?.summary;
    const subjects = data?.subjectBreakdown || [];
    const students = data?.studentBreakdown || [];
    const trends = data?.trends || [];

    const summaryCards = summary ? [
        {
            label: "Total Students",
            value: summary.totalStudents,
        },
        {
            label: "Total Classes",
            value: summary.totalClasses,
        },
        {
            label: "Present",
            value: summary.presentClasses,
        },
        {
            label: "Absent",
            value: summary.absentClasses,
        },
        {
            label: "Attendance Rate",
            value: percent(summary.attendancePercentage),
        },
        {
            label: "Low Attendance",
            value: summary.lowAttendanceCount,
        },
    ] : [];

    return (
        <div style={styles.root}>
            <Sidebar />

            <main style={styles.main}>
                <h1 style={styles.title}>Attendance Analytics</h1>

                <p style={styles.subtitle}>
                    Monitor attendance performance and identify low-attendance cases.
                    {" "}Role: {role}
                </p>

                <section style={styles.panel}>
                    <div style={styles.panelTitle}>Filter Analytics by Date</div>

                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "end",
                        gap: "12px",
                    }}>
                        <label style={{
                            display: "grid",
                            gap: "6px",
                            fontSize: "12px",
                        }}>
                            Start Date
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={styles.input}
                            />
                        </label>

                        <label style={{
                            display: "grid",
                            gap: "6px",
                            fontSize: "12px",
                        }}>
                            End Date
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={styles.input}
                            />
                        </label>

                        <button
                            style={styles.button}
                            onClick={applyFilters}
                            disabled={loading}
                        >
                            Apply Filter
                        </button>

                        <button
                            style={{
                                ...styles.button,
                                background: "#64748b",
                            }}
                            onClick={resetFilters}
                            disabled={loading}
                        >
                            Reset
                        </button>
                    </div>
                </section>

                {error && (
                    <div style={{
                        ...styles.panel,
                        color: "#dc2626",
                        background: "#fef2f2",
                    }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={styles.panel}>
                        <div style={styles.muted}>Loading analytics...</div>
                    </div>
                ) : data && (
                    <>
                        <section style={styles.cards}>
                            {summaryCards.map((item) => (
                                <div key={item.label} style={styles.card}>
                                    <div style={styles.cardLabel}>
                                        {item.label}
                                    </div>
                                    <div style={styles.cardValue}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section style={styles.panel}>
                            <div style={styles.panelTitle}>
                                Subject-wise Attendance
                                <span style={{
                                    marginLeft: "8px",
                                    color: "#94a3b8",
                                    fontSize: "12px",
                                }}>
                                    ({subjects.length})
                                </span>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            {[
                                                "Subject",
                                                "Total Classes",
                                                "Present",
                                                "Absent",
                                                "Attendance %",
                                                "Status",
                                            ].map((heading) => (
                                                <th key={heading} style={styles.th}>
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={styles.muted}>
                                                    No subject attendance records found.
                                                </td>
                                            </tr>
                                        ) : subjects.map((item) => (
                                            <tr key={item.subjectId}>
                                                <td style={styles.td}>
                                                    <strong>{item.subjectName}</strong>
                                                </td>
                                                <td style={styles.td}>{item.totalClasses}</td>
                                                <td style={styles.td}>{item.presentClasses}</td>
                                                <td style={styles.td}>{item.absentClasses}</td>
                                                <td style={styles.td}>
                                                    {percent(item.attendancePercentage)}
                                                </td>
                                                <td style={styles.td}>
                                                    <StatusBadge low={item.lowAttendance} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section style={styles.panel}>
                            <div style={styles.panelTitle}>
                                {role === "STUDENT"
                                    ? "My Overall Attendance"
                                    : "Student-wise Attendance"}
                                {role !== "STUDENT" && (
                                    <span style={{
                                        marginLeft: "8px",
                                        color: "#94a3b8",
                                        fontSize: "12px",
                                    }}>
                                        ({students.length})
                                    </span>
                                )}
                            </div>

                            {role === "STUDENT" ? (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                {[
                                                    "Total Classes",
                                                    "Present",
                                                    "Absent",
                                                    "Overall Attendance",
                                                ].map((heading) => (
                                                    <th key={heading} style={styles.th}>
                                                        {heading}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={styles.td}>
                                                    {summary?.totalClasses ?? 0}
                                                </td>
                                                <td style={styles.td}>
                                                    {summary?.presentClasses ?? 0}
                                                </td>
                                                <td style={styles.td}>
                                                    {summary?.absentClasses ?? 0}
                                                </td>
                                                <td style={styles.td}>
                                                    <strong>
                                                        {percent(summary?.attendancePercentage)}
                                                    </strong>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                {[
                                                    "Student",
                                                    "Roll No",
                                                    "Subject",
                                                    "Total Classes",
                                                    "Present",
                                                    "Absent",
                                                    "Attendance %",
                                                    "Status",
                                                ].map((heading) => (
                                                    <th key={heading} style={styles.th}>
                                                        {heading}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={styles.muted}>
                                                        No student attendance records found.
                                                    </td>
                                                </tr>
                                            ) : students.map((item, index) => (
                                                <tr key={`${item.studentId}-${item.subjectId}-${index}`}>
                                                    <td style={styles.td}>{item.studentName}</td>
                                                    <td style={styles.td}>{item.rollNo}</td>
                                                    <td style={styles.td}>{item.subjectName}</td>
                                                    <td style={styles.td}>{item.totalClasses}</td>
                                                    <td style={styles.td}>{item.presentClasses}</td>
                                                    <td style={styles.td}>{item.absentClasses}</td>
                                                    <td style={styles.td}>
                                                        {percent(item.attendancePercentage)}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <StatusBadge low={item.lowAttendance} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                        <section style={styles.panel}>
                            <div style={styles.panelTitle}>
                                Daily Attendance Trends
                            </div>

                            {trends.length === 0 ? (
                                <div style={styles.muted}>
                                    No daily attendance trends available.
                                </div>
                            ) : (
                                <div style={{
                                    display: "grid",
                                    gap: "18px",
                                }}>
                                    {trends.map((item) => (
                                        <div key={item.date}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: "12px",
                                                marginBottom: "8px",
                                                fontSize: "12px",
                                                flexWrap: "wrap",
                                            }}>
                                                <strong>{item.date}</strong>
                                                <span>
                                                    {item.presentClasses}/{item.totalClasses} present
                                                    {" Â· "}
                                                    {percent(item.attendancePercentage)}
                                                </span>
                                            </div>

                                            <AttendanceBar
                                                percentage={item.attendancePercentage}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section style={styles.panel}>
                            <div style={styles.panelTitle}>
                                Subject-wise Attendance Trends
                            </div>

                            <p style={{
                                color: "#94a3b8",
                                fontSize: "12px",
                                marginTop: "-8px",
                                marginBottom: "20px",
                            }}>
                                Compare attendance performance across accessible subjects.
                            </p>

                            {subjects.length === 0 ? (
                                <div style={styles.muted}>
                                    No subject-wise attendance trends available.
                                </div>
                            ) : (
                                <div style={{
                                    display: "grid",
                                    gap: "20px",
                                }}>
                                    {subjects.map((item) => (
                                        <div key={item.subjectId}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: "12px",
                                                flexWrap: "wrap",
                                                marginBottom: "9px",
                                            }}>
                                                <strong style={{
                                                    color: "#334155",
                                                    fontSize: "13px",
                                                }}>
                                                    {item.subjectName}
                                                </strong>

                                                <strong style={{
                                                    color: item.lowAttendance
                                                        ? "#dc2626"
                                                        : "#059669",
                                                    fontSize: "13px",
                                                }}>
                                                    {percent(item.attendancePercentage)}
                                                </strong>
                                            </div>

                                            <AttendanceBar
                                                percentage={item.attendancePercentage}
                                                color={
                                                    item.lowAttendance
                                                        ? "#ef4444"
                                                        : "#10b981"
                                                }
                                            />

                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                flexWrap: "wrap",
                                                gap: "8px",
                                                marginTop: "7px",
                                                color: "#64748b",
                                                fontSize: "11px",
                                            }}>
                                                <span>
                                                    Present: {item.presentClasses}
                                                </span>
                                                <span>
                                                    Absent: {item.absentClasses}
                                                </span>
                                                <span>
                                                    Total: {item.totalClasses}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default AttendanceAnalytics;
