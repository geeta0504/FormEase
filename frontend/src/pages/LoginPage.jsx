import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signInWithGoogle, getGoogleRedirectResult } from "../utils/firebase";
import api from "../utils/api";
import nitGoaImage from "../assets/nit-goa.jpg";

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Handle the result after Google redirects back to this page
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (!result) return; // not returning from a redirect
        setLoading(true);
        const idToken = await result.user.getIdToken();
        const res = await api.post("/auth/verify-google", { idToken });
        const { token, isNewJoinee } = res.data;
        localStorage.setItem("studentToken", token);
        toast.success("Login successful");
        navigate(isNewJoinee ? "/form" : "/submission");
      } catch (error) {
        console.error("Google sign‑in error:", error);
        if (error.code && error.code !== "auth/no-auth-event") {
          toast.error(error.message || "Google sign‑in failed");
        }
      } finally {
        setLoading(false);
      }
    };
    checkRedirectResult();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(); // navigates away to Google; result handled in useEffect above on return
    } catch (error) {
      console.error("Google sign‑in error:", error);
      toast.error(error.message || "Google sign‑in failed");
      setLoading(false);
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
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn w-full rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 533.5 544.3"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M533.5 278.4c0-17.7-1.6-35-4.6-51.7H272v97.9h146.9c-6.4 34.5-25.5 63.7-54.4 83.4v69.1h87.8c51.4-47.4 81-117.3 81-198.7z"
                  fill="#4285F4"
                />
                <path
                  d="M272 544.3c73.5 0 135.2-24.4 180.3-66.3l-87.8-69.1c-24.4 16.4-55.8 26-92.5 26-71 0-131.2-47.8-152.8-112.1H30.4v70.5c45.1 89.5 138.3 150.9 241.6 150.9z"
                  fill="#34A853"
                />
                <path
                  d="M119.2 322.8c-10.2-30.5-10.2-63.4 0-93.9v-70.5H30.4c-40.4 80.7-40.4 176.2 0 256.9l88.8-71.5z"
                  fill="#FBBC05"
                />
                <path
                  d="M272 107.7c39.9-.6 78.5 15.2 106.9 43.5l80.2-80.2C415 21.2 345.5-1.5 272 0c-103.3 0-196.5 61.3-241.6 150.9l88.8 71.5C140.8 155.5 201 107.7 272 107.7z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;