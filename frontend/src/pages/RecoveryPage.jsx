import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../utils/api";

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

function RecoveryPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("enterAnchor");
  const [anchorType, setAnchorType] = useState("student");

  const [anchorCode, setAnchorCode] = useState("+91");
  const [anchorPhoneDigits, setAnchorPhoneDigits] = useState("");
  const [anchorOtp, setAnchorOtp] = useState("");

  const [newCode, setNewCode] = useState("+91");
  const [newPhoneDigits, setNewPhoneDigits] = useState("");
  const [newOtp, setNewOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const fullAnchorPhone = `${anchorCode}${anchorPhoneDigits}`;
  const fullNewPhone = `${newCode}${newPhoneDigits}`;

  const handleSendAnchorOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/recovery/send-anchor-otp", { anchorType, anchorPhone: fullAnchorPhone });
      toast.success("OTP sent to your current number");
      setStage("verifyAnchor");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnchorOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/recovery/verify-anchor-otp", { anchorPhone: fullAnchorPhone, otp: anchorOtp });
      toast.success("Verified — now enter your new number");
      setStage("enterNew");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/recovery/send-new-otp", { anchorPhone: fullAnchorPhone, newPhone: fullNewPhone });
      toast.success("OTP sent to your new number");
      setStage("verifyNew");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNewOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/recovery/verify-new-otp", { anchorPhone: fullAnchorPhone, otp: newOtp });
      localStorage.setItem("studentToken", res.data.token);
      toast.success("Number updated! Logging you in...");
      navigate("/submission");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">Change Phone Number</h2>

          {stage === "enterAnchor" && (
            <form onSubmit={handleSendAnchorOtp} className="flex flex-col gap-4">
              <p className="text-sm opacity-70">
                Enter whichever number still works — student's or parent's — so we can verify it's you.
              </p>
              <div className="form-control">
                <label className="label"><span className="label-text">This number belongs to</span></label>
                <select
                  className="select select-bordered w-full"
                  value={anchorType}
                  onChange={(e) => setAnchorType(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Working Phone Number</span></label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-28"
                    value={anchorCode}
                    onChange={(e) => setAnchorCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="input input-bordered w-full"
                    value={anchorPhoneDigits}
                    onChange={(e) => setAnchorPhoneDigits(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Send OTP"}
              </button>
            </form>
          )}

          {stage === "verifyAnchor" && (
            <form onSubmit={handleVerifyAnchorOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Enter OTP sent to {fullAnchorPhone}</span></label>
                <input
                  type="text"
                  maxLength={4}
                  className="input input-bordered w-full"
                  value={anchorOtp}
                  onChange={(e) => setAnchorOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Verify"}
              </button>
            </form>
          )}

          {stage === "enterNew" && (
            <form onSubmit={handleSendNewOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">New Phone Number</span></label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-28"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="input input-bordered w-full"
                    value={newPhoneDigits}
                    onChange={(e) => setNewPhoneDigits(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Send OTP to New Number"}
              </button>
            </form>
          )}

          {stage === "verifyNew" && (
            <form onSubmit={handleVerifyNewOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Enter OTP sent to {fullNewPhone}</span></label>
                <input
                  type="text"
                  maxLength={4}
                  className="input input-bordered w-full"
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Verify & Login"}
              </button>
            </form>
          )}

          <button className="btn btn-ghost btn-sm mt-2" onClick={() => navigate("/")}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecoveryPage;