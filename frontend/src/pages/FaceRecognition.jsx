
import { useState, useRef, useEffect } from "react";
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
    btnPrimary: {
        background: "#6366f1",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
    },
    btnStop: {
        background: "#ef4444",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        marginLeft: "10px",
    },
    statusCard: {
        background: "#f8fafc",
        border: "0.5px solid #e2e8f0",
        borderRadius: "10px",
        padding: "16px",
        marginTop: "16px",
    },
    statusBadge: {
        display: "inline-block",
        padding: "8px 14px",
        borderRadius: "20px",
        background: "#ecfdf5",
        color: "#16a34a",
        border: "1px solid #bbf7d0",
        fontSize: "12px",
        fontWeight: 600,
    },
    workflowItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 0",
        borderBottom: "0.5px solid #f1f5f9",
        color: "#334155",
        fontSize: "14px",
    },
};

function FaceRecognition() {

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const requestRef = useRef(false);

    const streakRef = useRef(0);
    const lastStudentRef = useRef(null);

    const [status, setStatus] = useState("Scanner stopped");
    const [cameraActive, setCameraActive] = useState(false);
    const [student, setStudent] = useState(null);
    const [distance, setDistance] = useState(null);
    const [error, setError] = useState("");

    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [subjectLoading, setSubjectLoading] = useState(true);
    const [attendanceResult, setAttendanceResult] = useState("");

    useEffect(() => {
    const loadSubjects = async () => {
        try {
            const response = await api.get("/subjects");
            const data = response.data;
            setSubjects(data);

            if (data.length > 0) {
                setSelectedSubjectId(String(data[0].id));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubjectLoading(false);
        }
    };

    loadSubjects();
    }, []);

    const markAttendance = async (recognizedStudent, image) => {
        try {
            setStatus("Recording attendance...");
            setAttendanceResult("");

            const response = await fetch(
                "http://127.0.0.1:5000/recognize",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        image,
                        subjectId: Number(selectedSubjectId),
                        confirmAttendance: true,
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 409) {
                setStatus("Attendance already marked");
                setAttendanceResult(
                    data.message || "Attendance has already been recorded today."
                );
                return;
            }

            if (!response.ok || !data.attendanceRecorded) {
                throw new Error(
                    data.message || "Attendance recording failed."
                );
            }

            setStatus("Attendance marked successfully");
            setAttendanceResult(
                `${recognizedStudent.name}'s attendance has been saved successfully.`
            );

        } catch (err) {
            setStatus("Attendance recording failed");
            setAttendanceResult(err.message);
        }
    };

    const stopScanner = () => {

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        requestRef.current = false;
        streakRef.current = 0;
        lastStudentRef.current = null;

        setCameraActive(false);
    };

    const startScanner = async () => {

        try {

            setError("");
            setStudent(null);
            setDistance(null);
            setStatus("Requesting camera access...");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user",
                },
                audio: false,
            });

            streamRef.current = stream;

            if (!videoRef.current) {
                stopScanner();
                return;
            }

            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setCameraActive(true);
            setStatus("Camera ready. Scanning...");

            intervalRef.current = setInterval(async () => {

                if (
                    requestRef.current ||
                    !videoRef.current ||
                    !canvasRef.current
                ) {
                    return;
                }

                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (
                    video.readyState < 2 ||
                    video.videoWidth === 0
                ) {
                    return;
                }

                requestRef.current = true;

                try {

                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const context = canvas.getContext("2d");

                    context.drawImage(
                        video,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    const image = canvas.toDataURL(
                        "image/jpeg",
                        0.8
                    );

                    const response = await fetch(
                        "http://127.0.0.1:5000/recognize",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                            body: JSON.stringify({ image }),
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Recognition API error: ${response.status}`
                        );
                    }

                    const result = await response.json();

                    if (
                        result.recognized &&
                        result.studentId
                    ) {

                        setDistance(result.distance);

                        if (
                            lastStudentRef.current === result.studentId
                        ) {
                            streakRef.current += 1;
                        } else {
                            lastStudentRef.current = result.studentId;
                            streakRef.current = 1;
                        }

                        if (streakRef.current >= 3) {

                            const recognizedStudent = {
                                id: result.studentId,
                                name: result.name,
                            };

                            setStudent(recognizedStudent);

                            clearInterval(intervalRef.current);
                            intervalRef.current = null;

                            await markAttendance(recognizedStudent, image);

                        } else {
                            setStatus(
                                `Verifying identity (${streakRef.current}/3)...`
                            );
                        }

                    } else {

                        streakRef.current = 0;
                        lastStudentRef.current = null;

                        setStudent(null);
                        setDistance(result.distance ?? null);
                        setStatus(
                            result.message === "No face detected"
                                ? "No face detected"
                                : "Unknown face"
                        );
                    }

                } catch (err) {

                    setError(err.message);
                    setStatus("Recognition service error");

                } finally {

                    requestRef.current = false;

                }

            }, 800);

        } catch (err) {

            stopScanner();
            setError(err.message);
            setStatus("Camera unavailable");

        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                });
            }
        };
    }, []);

    return (

        <div style={S.root}>

            <Sidebar />

            <main style={S.main}>

                <h1 style={S.pageTitle}>
                    🎭 Face Recognition Attendance
                </h1>

                <p style={S.pageSub}>
                    Live face recognition using Python, OpenCV and Flask
                </p>

                {/* Scanner Panel */}

                <div style={S.panel}>

                    <div style={S.panelTitle}>
                        Live Face Scanner
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#334155",
                                    marginBottom: "8px",
                                }}
                            >
                                Select Subject
                            </label>

                            <select
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                disabled={cameraActive || subjectLoading}
                                style={{
                                    width: "100%",
                                    maxWidth: "400px",
                                    padding: "11px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    background: "#fff",
                                    fontSize: "13px",
                                }}
                            >
                                {subjectLoading && <option>Loading subjects...</option>}

                                {!subjectLoading && subjects.length === 0 && (
                                    <option value="">No subjects available</option>
                                )}

                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.subjectName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div
                        style={{
                            background: "#0f172a",
                            borderRadius: "12px",
                            overflow: "hidden",
                            maxWidth: "720px",
                            marginBottom: "16px",
                            position: "relative",
                        }}
                    >

                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                display: cameraActive ? "block" : "none",
                            }}
                        />

                        {!cameraActive && (
                            <div
                                style={{
                                    height: "360px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#cbd5e1",
                                    fontSize: "14px",
                                }}
                            >
                                Camera is currently off
                            </div>
                        )}

                    </div>

                    <canvas
                        ref={canvasRef}
                        style={{ display: "none" }}
                    />

                    {!cameraActive ? (

                        <button
                            onClick={startScanner}
                            style={S.btnPrimary}
                        >
                            📷 Start Scanner
                        </button>

                    ) : (

                        <button
                            onClick={stopScanner}
                            style={S.btnStop}
                        >
                            Stop Scanner
                        </button>

                    )}

                    <div style={S.statusCard}>

                        <div
                            style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginBottom: "8px",
                            }}
                        >
                            CURRENT STATUS
                        </div>

                        <span style={S.statusBadge}>
                            {status}
                        </span>

                        {student && (

                            <div style={{ marginTop: "16px" }}>

                                <div style={{
                                    color: "#16a34a",
                                    fontWeight: 700,
                                    fontSize: "17px",
                                }}>
                                    {student.name}
                                </div>

                                <div style={{
                                    color: "#64748b",
                                    fontSize: "13px",
                                    marginTop: "5px",
                                }}>
                                    Student ID: {student.id}
                                </div>

                                <div style={{
                                    color: "#64748b",
                                    fontSize: "13px",
                                    marginTop: "5px",
                                }}>
                                    LBPH Distance: {distance}
                                </div>

                                <div style={{
                                    color: attendanceResult.includes("successfully")
                                        ? "#16a34a"
                                        : "#d97706",
                                    fontSize: "13px",
                                    marginTop: "10px",
                                }}>
                                    {attendanceResult || "Processing attendance..."}
                                </div>

                            </div>

                        )}

                        {error && (
                            <p style={{
                                color: "#dc2626",
                                fontSize: "13px",
                                marginTop: "10px",
                            }}>
                                {error}
                            </p>
                        )}

                    </div>

                </div>

                {/* Workflow */}

                <div style={S.panel}>

                    <div style={S.panelTitle}>
                        Recognition Workflow
                    </div>

                    {[
                        ["🟢", "Flask Recognition API"],
                        ["📷", "Browser Webcam"],
                        ["🧠", "OpenCV Face Detection"],
                        ["👨‍🎓", "Student Identification"],
                        ["⏳", "Attendance Recording"],
                        ["💾", "MySQL Database"],
                    ].map(([icon, label]) => (

                        <div
                            key={label}
                            style={S.workflowItem}
                        >
                            <span>{icon}</span>
                            <span>{label}</span>
                        </div>

                    ))}

                </div>

                {/* System Information */}

                <div style={S.panel}>

                    <div style={S.panelTitle}>
                        System Information
                    </div>

                    <div style={{
                        color: "#64748b",
                        fontSize: "14px",
                        lineHeight: "1.8",
                    }}>

                        <p>
                            • Webcam video is displayed directly inside
                            the AttendX webpage.
                        </p>

                        <p>
                            • React captures webcam frames and sends them
                            to the Python Flask API.
                        </p>

                        <p>
                            • OpenCV and the trained LBPH model perform
                            face recognition.
                        </p>

                        <p>
                            • Three consecutive matching results are
                            required before confirming a student identity.
                        </p>

                        <p>
                            • Attendance recording will be connected
                            to the Spring Boot backend in the next stage.
                        </p>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default FaceRecognition;
