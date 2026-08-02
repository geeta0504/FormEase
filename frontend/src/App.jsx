import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import FormPage from "./pages/FormPage";
import SubmissionPage from "./pages/SubmissionPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RecoveryPage from "./pages/RecoveryPage";
// import VerifyEmailPage removed



function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Navbar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/submission" element={<SubmissionPage />} />
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
// <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;