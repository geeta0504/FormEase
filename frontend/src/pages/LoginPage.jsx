import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../utils/api";
import nitGoaImage from "../assets/nit-goa.jpg";

const FIELD_CLASS =
  "input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30 " +
  "focus:border-white/60 focus:outline-none focus:bg-white/15 transition-colors";

function LoginPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState("enterEmails");
  const [studentEmail, setStudentEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentOtp, setStudentOtp] = useState("");
  const [parentOtp, setParentOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!studentEmail || !parentEmail) {
      toast.error("Please enter both email addresses");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/send-otp", { studentEmail, parentEmail });
      toast.success("OTPs sent to both email addresses");
      setStage("enterOtps");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!studentOtp || !parentOtp) {
      toast.error("Please enter both OTP codes");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        studentEmail,
        studentOtp,
        parentOtp,
      });

      const { token, isNewJoinee } = res.data;
      localStorage.setItem("studentToken", token);
      toast.success("Login successful");

      navigate(isNewJoinee ? "/form" : "/submission");
    } catch (error) {
      const message = error.response?.data?.message || "OTP verification failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center bg-neutral-900"
      style={{ backgroundImage: `url(${nitGoaImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute top-6 left-6 z-10 text-white">
        <p className="font-display text-lg tracking-wide">NIT Goa</p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Hostel Portal</p>
      </div>
      <div className="absolute top-6 right-6 z-10 text-right text-white">
        <p className="font-display text-lg">Room Allotment</p>
        <p className="text-xs text-white/70">2026</p>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
        <h2 className="font-display text-2xl text-white text-center mb-6">
          {stage === "enterEmails" ? "Student Login" : "Enter OTP"}
        </h2>

        {stage === "enterEmails" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">Student Email</span>
              </label>
              <input
                type="email"
                placeholder="student@example.com"
                className={FIELD_CLASS}
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">Parent Email</span>
              </label>
              <input
                type="email"
                placeholder="parent@example.com"
                className={FIELD_CLASS}
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2 rounded-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : "Send OTP"}
            </button>

            <button
              type="button"
              className="btn btn-link btn-sm text-white/70"
              onClick={() => navigate("/recovery")}
            >
              Changed your email? Click here
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">OTP sent to student's email</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234"
                maxLength={4}
                className={FIELD_CLASS}
                value={studentOtp}
                onChange={(e) => setStudentOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">OTP sent to parent's email</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234"
                maxLength={4}
                className={FIELD_CLASS}
                value={parentOtp}
                onChange={(e) => setParentOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2 rounded-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : "Verify & Login"}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm text-white/70"
              onClick={() => setStage("enterEmails")}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
