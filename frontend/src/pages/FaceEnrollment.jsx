
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import Sidebar from "../components/Sidebar";

const FACE_API = "http://127.0.0.1:5000";
const TARGET = 120;

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
    subtitle: {
        fontSize: "13px",
        color: "#94a3b8",
        marginTop: "4px",
        marginBottom: "24px",
    },
    panel: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "20px",
    },
    panelTitle: {
        fontSize: "14px",
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: "14px",
    },
    button: {
        background: "#6366f1",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
    stopButton: {
        background: "#ef4444",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
};

function FaceEnrollment() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const runningRef = useRef(false);
    const busyRef = useRef(false);

    const [student, setStudent] = useState(null);
    const [consent, setConsent] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [training, setTraining] = useState(false);
    const [count, setCount] = useState(0);
    const [status, setStatus] = useState("Loading student information...");
    const [error, setError] = useState("");
    const [enrolled, setEnrolled] = useState(false);

    const stopCamera = () => {
        runningRef.current = false;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    const loadInformation = async () => {
        try {
            const [studentResponse, statusResponse] = await Promise.all([
                api.get(`/students/${studentId}`),
                fetch(`${FACE_API}/enroll/status/${studentId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }),
            ]);

            if (!statusResponse.ok) {
                throw new Error("Could not connect to the face enrollment service.");
            }

            const statusData = await statusResponse.json();

            setStudent(studentResponse.data);
            setCount(statusData.count || 0);
            setEnrolled(statusData.status === "ENROLLED");

            if (statusData.status === "ENROLLED") {
                setStatus("Face enrollment already completed.");
            } else if (statusData.count >= TARGET) {
                setStatus("120 samples are ready. You can complete training.");
            } else {
                setStatus("Ready for face enrollment.");
            }
        } catch (err) {
            setError(err.message);
            setStatus("Could not load enrollment information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInformation();

        return () => {
            runningRef.current = false;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [studentId]);

    const wait = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const trainModel = async () => {
        stopCamera();
        setTraining(true);
        setError("");
        setStatus("Training the face recognition model...");

        try {
            const response = await fetch(`${FACE_API}/enroll/train`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    studentId: Number(studentId),
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Model training failed.");
            }

            setEnrolled(true);
            setStatus("Face enrollment completed successfully!");
            await loadInformation();
        } catch (err) {
            setError(err.message);
            setStatus("Training failed.");
        } finally {
            setTraining(false);
        }
    };

    const captureSamples = async () => {
        while (runningRef.current && count < TARGET) {
            if (busyRef.current) {
                await wait(200);
                continue;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas || video.readyState < 2 || !video.videoWidth) {
                await wait(200);
                continue;
            }

            busyRef.current = true;

            try {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const context = canvas.getContext("2d");
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const image = canvas.toDataURL("image/jpeg", 0.8);

                const response = await fetch(`${FACE_API}/enroll/capture`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        studentId: Number(studentId),
                        image,
                    }),
                });

                const result = await response.json();

                if (result.count !== undefined) {
                    setCount(result.count);
                }

                if (result.complete || result.count >= TARGET) {
                    runningRef.current = false;
                    stopCamera();
                    setStatus("All 120 samples collected. Starting model training...");
                    await trainModel();
                    return;
                }

                if (!response.ok) {
                    setStatus(result.message || "Adjust your face position.");
                } else if (result.success) {
                    setStatus("Capturing face samples. Look slightly in different directions.");
                } else {
                    setStatus(result.message || "Position your face inside the camera.");
                }
            } catch (err) {
                setError(err.message);
                setStatus("Could not communicate with the enrollment service.");
                runningRef.current = false;
                stopCamera();
                return;
            } finally {
                busyRef.current = false;
            }

            await wait(350);
        }
    };

    const startEnrollment = async () => {
        if (!consent) {
            setError("Please confirm consent before starting enrollment.");
            return;
        }

        if (!student || enrolled || training) return;

        if (count >= TARGET) {
            await trainModel();
            return;
        }

        try {
            setError("");
            setStatus("Requesting camera permission...");

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
                stopCamera();
                return;
            }

            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setCameraActive(true);
            setStatus("Camera ready. Capturing samples...");

            runningRef.current = true;
            captureSamples();
        } catch (err) {
            stopCamera();
            setError(err.message);
            setStatus("Camera unavailable.");
        }
    };

    return (
        <div style={S.root}>
            <Sidebar />

            <main style={S.main}>
                <h1 style={S.title}>Face Enrollment</h1>
                <p style={S.subtitle}>
                    Register a student's face for AttendX attendance recognition.
                </p>

                <div style={S.panel}>
                    <div style={S.panelTitle}>Student Information</div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : student ? (
                        <div style={{ lineHeight: 1.9, fontSize: "13px", color: "#475569" }}>
                            <div><strong>Name:</strong> {student.name}</div>
                            <div><strong>Student ID:</strong> {student.id}</div>
                            <div><strong>Roll No:</strong> {student.rollNo}</div>
                            <div><strong>Department:</strong> {student.department || "—"}</div>
                            <div><strong>Enrollment status:</strong> {enrolled ? "ENROLLED" : student.faceEnrollmentStatus || "NOT_ENROLLED"}</div>
                        </div>
                    ) : (
                        <p>Student information unavailable.</p>
                    )}
                </div>

                <div style={S.panel}>
                    <div style={S.panelTitle}>Consent and Privacy</div>

                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7 }}>
                        Face enrollment collects facial images to create a face
                        recognition model for attendance. Samples are saved in
                        the local AttendX face-recognition dataset.
                        Enrollment should only proceed with the student's
                        informed permission.
                    </p>

                    <label style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "13px",
                        color: "#334155",
                        lineHeight: 1.6,
                        marginTop: "14px",
                    }}>
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            disabled={cameraActive || enrolled || training}
                            style={{ marginTop: "3px" }}
                        />
                        I confirm that the student has been informed and has
                        agreed to this face-data collection.
                    </label>
                </div>

                <div style={S.panel}>
                    <div style={S.panelTitle}>Camera Enrollment</div>

                    <div style={{
                        background: "#0f172a",
                        borderRadius: "12px",
                        overflow: "hidden",
                        maxWidth: "720px",
                        minHeight: "300px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px",
                    }}>
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
                            <div style={{ color: "#cbd5e1", fontSize: "14px" }}>
                                Camera is currently off
                            </div>
                        )}
                    </div>

                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    <div style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "8px",
                    }}>
                        Sample progress: {count} / {TARGET}
                    </div>

                    <div style={{
                        height: "10px",
                        background: "#e2e8f0",
                        borderRadius: "20px",
                        overflow: "hidden",
                        marginBottom: "16px",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${Math.min((count / TARGET) * 100, 100)}%`,
                            background: "#6366f1",
                            transition: "width 0.2s",
                        }} />
                    </div>

                    {!cameraActive && !enrolled && (
                        <button
                            style={S.button}
                            onClick={startEnrollment}
                            disabled={loading || !student || !consent || training}
                        >
                            {count >= TARGET ? "Complete Enrollment" : "Start Face Enrollment"}
                        </button>
                    )}

                    {cameraActive && (
                        <button style={S.stopButton} onClick={() => {
                            stopCamera();
                            setStatus("Capture paused. You can resume enrollment.");
                        }}>
                            Stop Camera
                        </button>
                    )}

                    {enrolled && (
                        <div style={{
                            color: "#16a34a",
                            fontWeight: 700,
                            fontSize: "14px",
                        }}>
                            Face enrollment successful!
                        </div>
                    )}

                    {training && (
                        <p style={{ color: "#6366f1", fontSize: "13px" }}>
                            Please wait while the model is being trained...
                        </p>
                    )}

                    <div style={{
                        marginTop: "16px",
                        padding: "14px",
                        borderRadius: "9px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13px",
                        color: "#475569",
                    }}>
                        <strong>Status:</strong> {status}
                    </div>

                    {error && (
                        <p style={{ color: "#dc2626", fontSize: "13px" }}>
                            {error}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => navigate("/students")}
                    style={{
                        ...S.button,
                        background: "#64748b",
                    }}
                >
                    Back to Students
                </button>
            </main>
        </div>
    );
}

export default FaceEnrollment;
