import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../utils/api";
import Seal from "../components/Seal";


function SubmissionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const res = await api.get("/submissions/me");
      if (res.data.isNewJoinee) {
        navigate("/form");
        return;
      }
      setSubmission(res.data.submission);
    } catch (error) {
      toast.error("Session expired, please log in again");
      localStorage.removeItem("studentToken");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!submission) return null;

  const latest = submission.versions[submission.versions.length - 1];

  if (editing) {
    return <EditForm latest={latest} onCancel={() => setEditing(false)} onSuccess={fetchSubmission} setEditing={setEditing} />;
  }

  const handleDownload = async () => {
    try {
      const res = await api.get(`/submissions/${latest.versionLabel}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const safeName = (latest.data.studentName || "student").replace(/\s+/g, "_");
      link.setAttribute("download", `${safeName}_${latest.versionLabel}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="card w-full max-w-xl mx-auto bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-2">Your Submission</h2>
          <p className="text-center text-sm opacity-70 mb-4">
            Current version: <Seal label={latest.versionLabel} />
          </p>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <Info label="Student Name" value={latest.data.studentName} />
            <Info label="Degree" value={latest.data.degree} />
            <Info label="Branch" value={latest.data.branch} />
            <Info label="Roll Number" value={latest.data.rollNumber} />
            <Info label="Semester" value={latest.data.semester} />
            <Info label="Hostel" value={latest.data.hostel} />
            <Info label="Room Number" value={latest.data.roomNumber} />
            <Info label="Student Mobile" value={latest.data.studentMobile} />
            <Info label="Parent Name" value={latest.data.parentName} />
            <Info label="Parent Mobile" value={latest.data.parentMobile} />
            <Info label="Address Line 1" value={latest.data.parentAddressLine1} />
            <Info label="Address Line 2" value={latest.data.parentAddressLine2} />
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <button className="btn btn-outline w-full" onClick={handleDownload}>
              Download PDF
            </button>
            <button className="btn btn-primary w-full" onClick={() => setEditing(true)}>
              Edit / Submit Correction
            </button>
          </div>

          {submission.versions.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">Version History</p>
              <ul className="text-xs opacity-70 flex flex-col gap-1">
                {submission.versions.map((v) => (
                  <li key={v.versionLabel}>
                    {v.versionLabel} — {new Date(v.submittedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <span className="opacity-60">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EditForm({ latest, onCancel, onSuccess, setEditing }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentName: latest.data.studentName || "",
    degree: latest.data.degree || "",
    branch: latest.data.branch || "",
    rollNumber: latest.data.rollNumber || "",
    semester: latest.data.semester || "",
    hostel: latest.data.hostel || "",
    roomNumber: latest.data.roomNumber || "",
    parentName: latest.data.parentName || "",
    parentAddressLine1: latest.data.parentAddressLine1 || "",
    parentAddressLine2: latest.data.parentAddressLine2 || "",
  });
  const [studentSignature, setStudentSignature] = useState(null);
  const [parentSignature, setParentSignature] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentSignature || !parentSignature) {
      toast.error("Please upload both signatures again for this correction");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append("studentSignature", studentSignature);
    data.append("parentSignature", parentSignature);

    setLoading(true);
    try {
      await api.put("/submissions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Correction submitted successfully");
      setEditing(false);
      onSuccess();
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">Edit Submission</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} />
              <Field label="Degree" name="degree" value={formData.degree} onChange={handleChange} />
              <Field label="Branch" name="branch" value={formData.branch} onChange={handleChange} />
              <Field label="Roll Number" name="rollNumber" value={formData.rollNumber} onChange={handleChange} />
              <Field label="Semester" name="semester" value={formData.semester} onChange={handleChange} />
              <Field label="Hostel" name="hostel" value={formData.hostel} onChange={handleChange} />
              <Field label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleChange} />
            </div>

            <div className="divider">Parent / Guardian Details</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parent Name" name="parentName" value={formData.parentName} onChange={handleChange} />
              <Field label="Address Line 1" name="parentAddressLine1" value={formData.parentAddressLine1} onChange={handleChange} />
              <Field label="Address Line 2" name="parentAddressLine2" value={formData.parentAddressLine2} onChange={handleChange} />
            </div>

            <div className="divider">Signatures (re-upload required)</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Student Signature</span></label>
                <input type="file" accept="image/png, image/jpeg" className="file-input file-input-bordered w-full" onChange={(e) => setStudentSignature(e.target.files[0])} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Parent Signature</span></label>
                <input type="file" accept="image/png, image/jpeg" className="file-input file-input-bordered w-full" onChange={(e) => setParentSignature(e.target.files[0])} />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Submit Correction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <div className="form-control">
      <label className="label"><span className="label-text">{label}</span></label>
      <input type="text" name={name} value={value} onChange={onChange} className="input input-bordered w-full" />
    </div>
  );
}

export default SubmissionPage;