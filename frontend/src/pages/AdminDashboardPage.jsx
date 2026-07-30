import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Search, X, FileText, ChevronDown, Users } from "lucide-react";
import adminApi from "../utils/adminApi";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [rollNumberFilter, setRollNumberFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminApi.get("/admin/submissions", { params });
      setSubmissions(res.data.submissions);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Session expired, please log in again");
        localStorage.removeItem("adminToken");
        navigate("/admin");
      } else {
        toast.error("Failed to load submissions");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchSubmissions({
      name: nameFilter || undefined,
      email: emailFilter || undefined,
      rollNumber: rollNumberFilter || undefined,
      branch: branchFilter || undefined,
      semester: semesterFilter || undefined,
    });
  };

  const handleClear = () => {
    setNameFilter(""); setEmailFilter(""); setRollNumberFilter("");
    setBranchFilter(""); setSemesterFilter("");
    fetchSubmissions();
  };

  const hasActiveFilters = nameFilter || emailFilter || rollNumberFilter || branchFilter || semesterFilter;

  const handleDownload = async (studentEmail, versionLabel, studentName) => {
    try {
      const res = await adminApi.get(
        `/admin/submissions/${encodeURIComponent(studentEmail)}/${versionLabel}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const safeName = (studentName || "student").replace(/\s+/g, "_");
      link.setAttribute("download", `${safeName}_${versionLabel}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* header banner */}
      <div className="bg-neutral text-neutral-content py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-content/60 mb-1">
              Admin Dashboard
            </p>
            <h1 className="font-display text-2xl">Student Submissions</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <Users size={16} />
            <span className="font-data text-sm">{submissions.length} total</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4">
        {/* filter card, floating up over the banner */}
        <form
          onSubmit={handleFilter}
          className="bg-base-100 rounded-2xl shadow-md border border-base-300 p-4 mb-6 flex flex-wrap gap-3 items-end"
        >
          <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} />
          <FilterInput label="Email" value={emailFilter} onChange={setEmailFilter} />
          <FilterInput label="Roll No." value={rollNumberFilter} onChange={setRollNumberFilter} />
          <FilterInput label="Branch" value={branchFilter} onChange={setBranchFilter} />
          <FilterInput label="Semester" value={semesterFilter} onChange={setSemesterFilter} />

          <div className="flex gap-2 ml-auto">
            {hasActiveFilters && (
              <button type="button" onClick={handleClear} className="btn btn-sm btn-ghost gap-1">
                <X size={14} /> Clear
              </button>
            )}
            <button type="submit" className="btn btn-sm btn-primary gap-1 rounded-full">
              <Search size={14} /> Search
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <FileText size={40} className="mx-auto mb-3" />
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {submissions.map((s) => {
              const latest = s.versions[s.versions.length - 1];
              const isExpanded = expanded === s.studentEmail;
              return (
                <div key={s.studentEmail} className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-base-200/50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : s.studentEmail)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-semibold">
                        {(latest.data.studentName || "?")[0]}
                      </div>
                      <div>
                        <p className="font-medium">{latest.data.studentName}</p>
                        <p className="text-xs font-data opacity-60">{s.studentEmail} · {latest.data.rollNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-ghost font-data text-xs">
                        {s.versions.length} version{s.versions.length > 1 ? "s" : ""}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`transition-transform opacity-50 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-base-300 bg-base-200/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-3">
                        Version History
                      </p>
                      <ul className="flex flex-col gap-2">
                        {s.versions.map((v) => (
                          <li
                            key={v.versionLabel}
                            className="flex justify-between items-center bg-base-100 rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-display text-[10px] uppercase tracking-wider border border-dashed border-primary text-primary rounded-full px-2 py-0.5 -rotate-1">
                                {v.versionLabel}
                              </span>
                              <span className="font-data text-xs opacity-60">
                                {new Date(v.submittedAt).toLocaleString()}
                              </span>
                            </span>
                            <button
                              className="btn btn-xs btn-primary gap-1 rounded-full"
                              onClick={() => handleDownload(s.studentEmail, v.versionLabel, v.data.studentName)}
                            >
                              <FileText size={12} /> Download
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange }) {
  return (
    <div className="form-control">
      <label className="label py-0.5">
        <span className="label-text text-[10px] uppercase tracking-wide opacity-50">{label}</span>
      </label>
      <input
        type="text"
        className="input input-bordered input-sm w-32"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default AdminDashboardPage;