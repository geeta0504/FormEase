import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../utils/api";

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
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">
            {stage === "enterPhones" ? "Student Login" : "Enter OTP"}
          </h2>

          {stage === "enterPhones" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Student Phone Number</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-28"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="input input-bordered w-full"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Parent Phone Number</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-28"
                    value={parentCode}
                    onChange={(e) => setParentCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="input input-bordered w-full"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Send OTP"}
              </button>

              <button
                type="button"
                className="btn btn-link btn-sm"
                onClick={() => navigate("/recovery")}
              >
                Changed your number? Click here
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">OTP sent to Student's phone</span>
                </label>
                <input
                  type="text"
                  placeholder="1234"
                  maxLength={4}
                  className="input input-bordered w-full"
                  value={studentOtp}
                  onChange={(e) => setStudentOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">OTP sent to Parent's phone</span>
                </label>
                <input
                  type="text"
                  placeholder="1234"
                  maxLength={4}
                  className="input input-bordered w-full"
                  value={parentOtp}
                  onChange={(e) => setParentOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Verify & Login"}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setStage("enterPhones")}
              >
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;