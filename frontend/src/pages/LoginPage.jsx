import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import nitGoaImage from "../assets/nit-goa.jpg";

const RESEND_COOLDOWN = 60; // seconds

function LoginPage() {
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  // Start countdown after link is sent
  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const sendLink = async (email) => {
    const res = await api.post("/auth/start-login", { studentEmail: email });
    localStorage.setItem("emailForSignIn", email);
    localStorage.setItem("loginSessionId", res.data.sessionId);
    return res;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendLink(studentEmail);
      setSent(true);
      startCountdown();
      toast.success("Verification link sent! Check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await sendLink(studentEmail);
      startCountdown();
      toast.success("Verification link resent! Check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend link");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${nitGoaImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
        <h2 className="font-display text-2xl text-white text-center mb-6">Student Login</h2>

        {sent ? (
          <div className="flex flex-col items-center gap-5">
            {/* Email sent icon */}
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
              📧
            </div>
            <p className="text-white/80 text-center text-sm">
              A verification link has been sent to{" "}
              <span className="text-white font-semibold">{studentEmail}</span>.
              Open it on this device to continue.
            </p>

            {/* Resend button with countdown */}
            <div className="w-full">
              <button
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="btn w-full rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {resending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : countdown > 0 ? (
                  `Resend link in ${countdown}s`
                ) : (
                  "Resend Verification Link"
                )}
              </button>
              {countdown > 0 && (
                <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / RESEND_COOLDOWN) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Go back option */}
            <button
              onClick={() => { setSent(false); clearInterval(timerRef.current); setCountdown(0); }}
              className="text-white/50 text-xs hover:text-white/80 transition-colors underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Student email"
              className="input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary w-full rounded-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : "Send Verification Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;