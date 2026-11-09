
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
    { to: "/dashboard", label: "Dashboard", emoji: "📊", roles: ["ADMIN", "FACULTY", "STUDENT"] },
    { to: "/students", label: "Students", emoji: "👨‍🎓", roles: ["ADMIN"] },
    { to: "/faculty", label: "Faculty", emoji: "👨‍🏫", roles: ["ADMIN"] },
    { to: "/subjects", label: "Subjects", emoji: "📚", roles: ["ADMIN", "FACULTY"] },
    { to: "/enrollments", label: "Enrollments", emoji: "📋", roles: ["ADMIN", "FACULTY"] },
    { to: "/attendance", label: "Attendance", emoji: "📅", roles: ["ADMIN", "FACULTY", "STUDENT"] },
    { to: "/analytics", label: "Analytics", emoji: "📊", roles: ["ADMIN", "FACULTY", "STUDENT"] },
    { to: "/prediction", label: "Prediction", emoji: "🤖", roles: ["ADMIN", "FACULTY", "STUDENT"] },
    { to: "/face", label: "Face Recognition", emoji: "📷", roles: ["STUDENT"] },
];

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem("role");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    const visibleItems = navItems.filter(item =>
        item.roles.includes(role)
    );

    return (
        <div style={{
            width: "220px",
            minHeight: "100vh",
            background: "#0f172a",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}>
            <div style={{
                padding: "24px 20px 20px",
                borderBottom: "0.5px solid rgba(255,255,255,0.07)",
            }}>
                <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    marginBottom: "10px",
                }}>
                    🎓
                </div>

                <div style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "0.3px",
                }}>
                    AttendX
                </div>

                <div style={{
                    fontSize: "11px",
                    color: "#475569",
                    marginTop: "2px",
                }}>
                    Attendance Portal
                </div>

                <div style={{
                    fontSize: "10px",
                    color: "#a5b4fc",
                    marginTop: "8px",
                    fontWeight: 600,
                }}>
                    {role}
                </div>
            </div>

            <nav style={{ padding: "16px 12px", flex: 1 }}>
                <div style={{
                    fontSize: "10px",
                    color: "#334155",
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    padding: "0 8px",
                    marginBottom: "8px",
                    fontWeight: 600,
                }}>
                    Main Menu
                </div>

                {visibleItems.map(({ to, label, emoji }) => {
                    const active = location.pathname === to;

                    return (
                        <Link
                            key={to}
                            to={to}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "9px 10px",
                                borderRadius: "8px",
                                marginBottom: "2px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: 500,
                                transition: "all 0.15s",
                                background: active
                                    ? "rgba(99,102,241,0.18)"
                                    : "transparent",
                                color: active ? "#a5b4fc" : "#64748b",
                            }}
                            onMouseEnter={e => {
                                if (!active) {
                                    e.currentTarget.style.background =
                                        "rgba(255,255,255,0.05)";
                                    e.currentTarget.style.color = "#cbd5e1";
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "#64748b";
                                }
                            }}
                        >
                            <span style={{ fontSize: "15px" }}>{emoji}</span>

                            {label}

                            {active && (
                                <span style={{
                                    marginLeft: "auto",
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "50%",
                                    background: "#818cf8",
                                    flexShrink: 0,
                                }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: "12px" }}>
                <button
                    onClick={logout}
                    style={{
                        width: "100%",
                        padding: "9px",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.1)",
                        color: "#fca5a5",
                        border: "0.5px solid rgba(239,68,68,0.22)",
                        fontSize: "13px",
                        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                    }}
                >
                    🚪 Logout
                </button>
            </div>
        </div>
    );
}

export default Sidebar;


