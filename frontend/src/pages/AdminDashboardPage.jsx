import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import adminApi from "../utils/adminApi";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // studentPhone of currently expanded row
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
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
      phone: phoneFilter || undefined,
      rollNumber: rollNumberFilter || undefined,
      branch: branchFilter || undefined,
      semester: semesterFilter || undefined,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const handleDownload = async (studentPhone, versionLabel, studentName) => {
    try {
      const res = await adminApi.get(
        `/admin/submissions/${encodeURIComponent(studentPhone)}/${versionLabel}/pdf`,
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
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>

        <form onSubmit={handleFilter} className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Filter by name"
            className="input input-bordered"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by phone"
            className="input input-bordered"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by roll number"
            className="input input-bordered"
            value={rollNumberFilter}
            onChange={(e) => setRollNumberFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by branch"
            className="input input-bordered"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by semester/year"
            className="input input-bordered"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setNameFilter(""); setPhoneFilter(""); setRollNumberFilter("");
              setBranchFilter(""); setSemesterFilter("");
              fetchSubmissions();
            }}
          >
            Clear
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-center opacity-60 py-10">No submissions found</p>
        ) : (
          <div className="overflow-x-auto bg-base-100 rounded-box shadow">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Phone</th>
                  <th>Roll Number</th>
                  <th>Versions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const latest = s.versions[s.versions.length - 1];
                  const isExpanded = expanded === s.studentPhone;
                  return (
                    <Fragment key={s.studentPhone}>
                      <tr>
                        <td>{latest.data.studentName}</td>
                        <td>{s.studentPhone}</td>
                        <td>{latest.data.rollNumber}</td>
                        <td>{s.versions.length}</td>
                        <td>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => setExpanded(isExpanded ? null : s.studentPhone)}
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-base-200">
                            <div className="p-3">
                              <p className="text-sm font-semibold mb-2">Version History</p>
                              <ul className="flex flex-col gap-2">
                                {s.versions.map((v) => (
                                  <li key={v.versionLabel} className="flex justify-between items-center text-sm">
                                    <span>
                                      <span className="badge badge-sm mr-2">{v.versionLabel}</span>
                                      {new Date(v.submittedAt).toLocaleString()}
                                    </span>
                                    <button
                                      className="btn btn-xs btn-primary"
                                      onClick={() => handleDownload(s.studentPhone, v.versionLabel, v.data.studentName)}
                                    >
                                      Download
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;