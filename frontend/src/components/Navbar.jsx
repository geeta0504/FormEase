import { Link, useLocation, useNavigate } from "react-router";

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
    <div className="sticky top-0 z-50 bg-neutral text-neutral-content border-b-4 border-primary shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={isAdminArea ? "/admin" : "/"} className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary font-display text-sm">
            NIT
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg tracking-wide">NIT Goa</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-content/60">
              {isAdminArea ? "Admin Portal" : "Hostel Undertaking"}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 font-data text-xs">
          {isAdminArea ? (
            adminToken && (
              <button
                onClick={handleAdminLogout}
                className="btn btn-xs btn-outline border-neutral-content/40 text-neutral-content hover:bg-primary hover:border-primary hover:text-primary-content"
              >
                Log out
              </button>
            )
          ) : (
            <>
              {studentToken && (
                <button
                  onClick={handleStudentLogout}
                  className="btn btn-xs btn-outline border-neutral-content/40 text-neutral-content hover:bg-primary hover:border-primary hover:text-primary-content"
                >
                  Log out
                </button>
              )}
              <Link to="/admin" className="opacity-50 hover:opacity-100 transition-opacity uppercase tracking-wider">
                Staff →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;