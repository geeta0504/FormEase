import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../utils/api";
import nitGoaImage from "../assets/nit-goa.jpg";

// keep this list short and relevant — add more if you expect other countries
const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+971", label: "🇦🇪 +971 (UAE)" },
  { code: "+966", label: "🇸🇦 +966 (Saudi Arabia)" },
  { code: "+974", label: "🇶🇦 +974 (Qatar)" },
  { code: "+968", label: "🇴🇲 +968 (Oman)" },
  { code: "+965", label: "🇰🇼 +965 (Kuwait)" },
  { code: "+973", label: "🇧🇭 +973 (Bahrain)" },
  { code: "+964", label: "🇮🇶 +964 (Iraq)" },
  { code: "+98", label: "🇮🇷 +98 (Iran)" },
  { code: "+1", label: "🇺🇸 +1 (USA)" },
  { code: "+44", label: "🇬🇧 +44 (UK)" },
  { code: "+65", label: "🇸🇬 +65 (Singapore)" },
];

// shared classes so every input/select on this page looks identical
const FIELD_CLASS =
  "input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30 " +
  "focus:border-white/60 focus:outline-none focus:bg-white/15 transition-colors";
const SELECT_CLASS =
  "select select-bordered w-28 bg-white/10 text-white border-white/30 " +
  "focus:border-white/60 focus:outline-none transition-colors";

function LoginPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState("enterPhones");
  const [studentCode, setStudentCode] = useState("+91");
  const [studentPhone, setStudentPhone] = useState("");
  const [parentCode, setParentCode] = useState("+91");
  const [parentPhone, setParentPhone] = useState("");
  const [studentOtp, setStudentOtp] = useState("");
  const [parentOtp, setParentOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const fullStudentPhone = `${studentCode}${studentPhone}`;
  const fullParentPhone = `${parentCode}${parentPhone}`;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!studentPhone || !parentPhone) {
      toast.error("Please enter both phone numbers");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/send-otp", {
        studentPhone: fullStudentPhone,
        parentPhone: fullParentPhone,
      });
      toast.success("OTPs sent to both numbers");
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
        studentPhone: fullStudentPhone,
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
      {/* dark overlay so the glass card and white text stay readable */}
      <div className="absolute inset-0 bg-black/50" />

      {/* top-left / top-right labels, echoing the reference design */}
      <div className="absolute top-6 left-6 z-10 text-white">
        <p className="font-display text-lg tracking-wide">NIT Goa</p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Hostel Portal</p>
      </div>
      <div className="absolute top-6 right-6 z-10 text-right text-white">
        <p className="font-display text-lg">Room Allotment</p>
        <p className="text-xs text-white/70">2026</p>
      </div>

      {/* the glass card itself */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
        <h2 className="font-display text-2xl text-white text-center mb-6">
          {stage === "enterPhones" ? "Student Login" : "Enter OTP"}
        </h2>

        {stage === "enterPhones" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">Student Phone Number</span>
              </label>
              <div className="flex gap-2">
                <select
                  className={SELECT_CLASS}
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="text-black">
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="Phone number"
                  className={FIELD_CLASS}
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">Parent Phone Number</span>
              </label>
              <div className="flex gap-2">
                <select
                  className={SELECT_CLASS}
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="text-black">
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="Phone number"
                  className={FIELD_CLASS}
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2 rounded-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : "Send OTP"}
            </button>

            <button
              type="button"
              className="btn btn-link btn-sm text-white/70"
              onClick={() => navigate("/recovery")}
            >
              Changed your number? Click here
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">OTP sent to Student's phone</span>
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
                <span className="label-text text-white/80">OTP sent to Parent's phone</span>
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
              onClick={() => setStage("enterPhones")}
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