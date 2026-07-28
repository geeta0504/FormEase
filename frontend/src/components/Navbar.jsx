import { Link, useLocation, useNavigate } from "react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import nitGoaLogo from "../assets/nit-goa-logo.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminArea = location.pathname.startsWith("/admin");
  const studentToken = localStorage.getItem("studentToken");
  const adminToken = localStorage.getItem("adminToken");

  const handleStudentLogout = () => {
    localStorage.removeItem("studentToken");
    navigate("/");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  return (
    <div className="sticky top-0 z-50 bg-neutral/95 backdrop-blur-md text-neutral-content shadow-lg">
      {/* thin gradient accent line instead of a flat border */}
      <div className="h-[3px] w-full bg-gradient-to-r from-primary via-secondary to-primary" />

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={isAdminArea ? "/admin" : "/"} className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src={nitGoaLogo}
              alt="NIT Goa"
              className="w-11 h-11 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg tracking-wide">
              NIT Goa
            </span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-content/55">
              {isAdminArea && <ShieldCheck size={11} className="text-primary" />}
              {isAdminArea ? "Admin Portal" : "Hostel Undertaking"}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4 font-data text-xs">
          {isAdminArea ? (
            adminToken && (
              <button
                onClick={handleAdminLogout}
                className="btn btn-xs gap-1.5 btn-outline border-neutral-content/30 text-neutral-content/90 hover:bg-primary hover:border-primary hover:text-primary-content transition-colors"
              >
                <LogOut size={12} />
                Log out
              </button>
            )
          ) : (
            <>
              {studentToken && (
                <button
                  onClick={handleStudentLogout}
                  className="btn btn-xs gap-1.5 btn-outline border-neutral-content/30 text-neutral-content/90 hover:bg-primary hover:border-primary hover:text-primary-content transition-colors"
                >
                  <LogOut size={12} />
                  Log out
                </button>
              )}
              <div className="h-4 w-px bg-neutral-content/20" />
              <Link
                to="/admin"
                className="flex items-center gap-1 text-neutral-content/50 hover:text-primary transition-colors uppercase tracking-wider"
              >
                Staff
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;