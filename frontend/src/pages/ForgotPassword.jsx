import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

function ForgotPassword() {
    const [role, setRole] = useState("STUDENT");
    const [rollNo, setRollNo] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();

    const resetPassword = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim() || !email.trim() || !newPassword.trim()) {
            setError("Please complete all required fields.");
            return;
        }

        if (role === "STUDENT" && !rollNo.trim()) {
            setError("Please enter your roll number.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must contain at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/forgot-password", {
                role,
                rollNo: role === "STUDENT" ? rollNo.trim() : null,
                name: name.trim(),
                email: email.trim(),
                newPassword,
            });

            setSuccess("Password reset successfully. You can now sign in.");

            setRollNo("");
            setName("");
            setEmail("");
            setNewPassword("");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Password reset failed. Please verify your information."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "11px 14px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        background: "#f8fafc",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        boxSizing: "border-box",
    };

    const labelStyle = {
        fontSize: "12px",
        fontWeight: 600,
        color: "#475569",
        display: "block",
        marginBottom: "6px",
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f0f2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
            padding: "20px",
        }}>
            <div style={{
                width: "100%",
                maxWidth: "440px",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "36px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 35px rgba(15,23,42,0.06)",
            }}>
                <div style={{ marginBottom: "26px" }}>
                    <div style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        marginBottom: "18px",
                    }}>
                        🔐
                    </div>

                    <h2 style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: 0,
                    }}>
                        Reset Your Password
                    </h2>

                    <p style={{
                        fontSize: "13px",
                        color: "#94a3b8",
                        marginTop: "8px",
                        lineHeight: 1.6,
                    }}>
                        Verify your profile information to create a new password.
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: "#dc2626",
                        marginBottom: "16px",
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        fontSize: "13px",
                        color: "#15803d",
                        marginBottom: "16px",
                    }}>
                        {success}
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                display: "block",
                                marginTop: "10px",
                                border: "none",
                                background: "none",
                                color: "#166534",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            Go to Sign In →
                        </button>
                    </div>
                )}

                <form onSubmit={resetPassword}>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Account Type</label>
                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                setRollNo("");
                                setError("");
                            }}
                            style={inputStyle}
                        >
                            <option value="STUDENT">Student</option>
                            <option value="FACULTY">Faculty</option>
                        </select>
                    </div>

                    {role === "STUDENT" && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Roll Number</label>
                            <input
                                type="text"
                                placeholder="Enter your roll number"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Full Name</label>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: "22px" }}>
                        <label style={labelStyle}>New Password</label>
                        <input
                            type="password"
                            placeholder="Enter a new password (minimum 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            background: loading || success
                                ? "#a5b4fc"
                                : "linear-gradient(135deg,#6366f1,#4f46e5)",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: loading || success
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        {loading ? "Resetting Password..." : "Reset Password"}
                    </button>
                </form>

                <div style={{
                    textAlign: "center",
                    marginTop: "22px",
                    fontSize: "12px",
                }}>
                    <Link
                        to="/"
                        style={{
                            color: "#6366f1",
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        ← Back to Sign In
                    </Link>
                </div>

                <p style={{
                    fontSize: "11px",
                    color: "#cbd5e1",
                    textAlign: "center",
                    marginTop: "24px",
                    marginBottom: 0,
                }}>
                    © {new Date().getFullYear()} AttendX
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;