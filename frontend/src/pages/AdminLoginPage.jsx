import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import adminApi from "../utils/adminApi";
import nitGoaImage from "../assets/nit-goa.jpg";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.post("/admin/login", { username, password });
      localStorage.setItem("adminToken", res.data.token);
      toast.success("Login successful");
      navigate("/admin/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${nitGoaImage})` }}
    >
      {/* darker overlay than student login — signals a more restricted area */}
      <div className="absolute inset-0 bg-black/65" />

      <div className="absolute top-6 left-6 z-10 text-white">
        <p className="font-display text-lg tracking-wide">NIT Goa</p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Hostel Portal</p>
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-black/45 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-3">
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl text-white">Admin Login</h2>
          <p className="text-xs text-white/50 uppercase tracking-[0.2em] mt-1">Staff Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white/80 text-xs uppercase tracking-wide">Username</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white/80 text-xs uppercase tracking-wide">Password</span>
            </label>
            <input
              type="password"
              className="input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2 rounded-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner"></span> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;