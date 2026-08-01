import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { isSignInWithEmailLink, signInWithEmailLink, signInWithCustomToken } from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "../utils/firebase";
import api from "../utils/api";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("sessionId") || localStorage.getItem("loginSessionId");
        const role = params.get("role");
        const firebaseToken = params.get("firebaseToken");

        let idToken = null;

        if (firebaseToken) {
          const result = await signInWithCustomToken(auth, firebaseToken);
          idToken = await result.user.getIdToken();
        } else if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = localStorage.getItem("emailForSignIn") || prompt("Please confirm your student email address:");

          if (!email) {
            setStatus("invalid");
            return;
          }

          const result = await signInWithEmailLink(auth, email, window.location.href);
          idToken = await result.user.getIdToken();
        } else {
          setStatus("invalid");
          return;
        }

        const res = await api.post("/auth/verify-link", { sessionId, role, idToken });

        if (res.data.stage === "complete") {
          localStorage.setItem("studentToken", res.data.token);
          localStorage.removeItem("emailForSignIn");
          localStorage.removeItem("loginSessionId");
          toast.success("Login successful");
          navigate(res.data.isNewJoinee ? "/form" : "/submission");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("invalid");
        toast.error(error.response?.data?.message || "Verification failed");
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="bg-base-100 rounded-2xl shadow-md p-8 max-w-md text-center">
        {status === "verifying" && <p>Verifying your email…</p>}
        {status === "invalid" && <p className="text-error">This link is invalid or expired. Please start over.</p>}
      </div>
    </div>
  );
}

export default VerifyEmailPage;