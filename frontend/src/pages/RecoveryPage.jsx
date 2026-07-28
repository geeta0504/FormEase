import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { KeyRound, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
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

const STAGES = ["enterAnchor", "verifyAnchor", "enterNew", "verifyNew"];
const STAGE_LABELS = ["Verify Current Number", "Confirm OTP", "New Number", "Confirm New OTP"];

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
  const stageIndex = STAGES.indexOf(stage);

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
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-md mx-auto">
        {/* progress steps */}
        <div className="flex items-center justify-between mb-6 px-1">
          {STAGE_LABELS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-data border-2 transition-colors ${
                    i <= stageIndex
                      ? "bg-primary border-primary text-primary-content"
                      : "border-base-300 text-base-content/40"
                  }`}
                >
                  {i + 1}
                </div>
              </div>
              {i < STAGE_LABELS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${i < stageIndex ? "bg-primary" : "bg-base-300"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <KeyRound size={18} />
            <h2 className="font-display text-lg text-base-content">Change Phone Number</h2>
          </div>
          <p className="text-xs opacity-60 mb-5">{STAGE_LABELS[stageIndex]}</p>

          {stage === "enterAnchor" && (
            <form onSubmit={handleSendAnchorOtp} className="flex flex-col gap-4">
              <p className="text-sm bg-base-200 rounded-lg p-3 flex gap-2">
                <Phone size={16} className="shrink-0 mt-0.5 opacity-50" />
                Enter whichever number still works — student's or parent's — so we can verify it's you.
              </p>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs uppercase tracking-wide opacity-60">This number belongs to</span>
                </label>
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
                <label className="label py-1">
                  <span className="label-text text-xs uppercase tracking-wide opacity-60">Working Phone Number</span>
                </label>
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
              <button type="submit" className="btn btn-primary w-full rounded-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Send OTP"}
              </button>
            </form>
          )}

          {stage === "verifyAnchor" && (
            <form onSubmit={handleVerifyAnchorOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs uppercase tracking-wide opacity-60">
                    Enter OTP sent to {fullAnchorPhone}
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="input input-bordered w-full text-center tracking-[0.5em] font-data text-lg"
                  value={anchorOtp}
                  onChange={(e) => setAnchorOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full rounded-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Verify"}
              </button>
            </form>
          )}

          {stage === "enterNew" && (
            <form onSubmit={handleSendNewOtp} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-lg p-3">
                <ShieldCheck size={16} />
                Current number verified
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs uppercase tracking-wide opacity-60">New Phone Number</span>
                </label>
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
              <button type="submit" className="btn btn-primary w-full rounded-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Send OTP to New Number"}
              </button>
            </form>
          )}

          {stage === "verifyNew" && (
            <form onSubmit={handleVerifyNewOtp} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs uppercase tracking-wide opacity-60">
                    Enter OTP sent to {fullNewPhone}
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="input input-bordered w-full text-center tracking-[0.5em] font-data text-lg"
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full rounded-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Verify & Login"}
              </button>
            </form>
          )}

          <button
            className="btn btn-ghost btn-sm gap-1 mt-4 w-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={14} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecoveryPage;