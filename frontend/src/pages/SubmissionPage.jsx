import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { GraduationCap, Home, Users, Download, Pencil, History } from "lucide-react";
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
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!submission) return null;

  const latest = submission.versions[submission.versions.length - 1];

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

  if (editing) {
    return <EditForm latest={latest} onCancel={() => setEditing(false)} onSuccess={fetchSubmission} setEditing={setEditing} />;
  }

  return (
    <div className="min-h-screen bg-base-200 pb-16">
      {/* header banner */}
      <div className="bg-neutral text-neutral-content py-8 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-content/60 mb-1">
              Your Submission
            </p>
            <h1 className="font-display text-2xl">{latest.data.studentName}</h1>
          </div>
          <Seal label={latest.versionLabel} tone="primary" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 flex flex-col gap-4">
        <Section icon={<GraduationCap size={18} />} title="Academic Details">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <Info label="Degree" value={latest.data.degree} />
            <Info label="Branch" value={latest.data.branch} />
            <Info label="Roll Number" value={latest.data.rollNumber} />
            <Info label="Semester" value={latest.data.semester} />
          </div>
        </Section>

        <Section icon={<Home size={18} />} title="Hostel Details">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <Info label="Hostel" value={latest.data.hostel} />
            <Info label="Room Number" value={latest.data.roomNumber} />
            <Info label="Student Mobile" value={latest.data.studentMobile} />
          </div>
        </Section>

        <Section icon={<Users size={18} />} title="Parent / Guardian Details">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <Info label="Name" value={latest.data.parentName} />
            <Info label="Mobile" value={latest.data.parentMobile} />
            <Info label="Address Line 1" value={latest.data.parentAddressLine1} />
            <Info label="Address Line 2" value={latest.data.parentAddressLine2} />
          </div>
        </Section>

        <div className="flex flex-col gap-3">
          <button className="btn btn-outline w-full rounded-full gap-2" onClick={handleDownload}>
            <Download size={16} /> Download PDF
          </button>
          <button className="btn btn-primary w-full rounded-full gap-2" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Edit / Submit Correction
          </button>
        </div>

        {submission.versions.length > 1 && (
          <Section icon={<History size={18} />} title="Version History">
            <ul className="flex flex-col gap-2">
              {submission.versions.map((v) => (
                <li key={v.versionLabel} className="flex items-center justify-between text-sm">
                  <Seal label={v.versionLabel} tone="neutral" />
                  <span className="font-data text-xs opacity-60">
                    {new Date(v.submittedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-5">
      <div className="flex items-center gap-2 mb-4 text-primary">
        {icon}
        <h3 className="font-display text-base text-base-content">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide opacity-50">{label}</p>
      <p className="font-medium">{value || "—"}</p>
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
    studentMobile: latest.data.studentMobile || "",
    parentName: latest.data.parentName || "",
    parentAddressLine1: latest.data.parentAddressLine1 || "",
    parentAddressLine2: latest.data.parentAddressLine2 || "",
    parentMobile: latest.data.parentMobile || "",
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
    <div className="min-h-screen bg-base-200 pb-28">
      <div className="bg-neutral text-neutral-content py-8 px-4 mb-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-content/60 mb-1">
            Editing Submission
          </p>
          <h1 className="font-display text-2xl">Submit a Correction</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 flex flex-col gap-4">
        <Section icon={<GraduationCap size={18} />} title="Academic Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} span2 />
            <Field label="Degree" name="degree" value={formData.degree} onChange={handleChange} />
            <Field label="Branch" name="branch" value={formData.branch} onChange={handleChange} />
            <Field label="Roll Number" name="rollNumber" value={formData.rollNumber} onChange={handleChange} />
            <Field label="Semester" name="semester" value={formData.semester} onChange={handleChange} />
          </div>
        </Section>

        <Section icon={<Home size={18} />} title="Hostel Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hostel" name="hostel" value={formData.hostel} onChange={handleChange} />
            <Field label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleChange} />
            <Field label="Student Mobile" name="studentMobile" value={formData.studentMobile} onChange={handleChange} type="tel" />
          </div>
        </Section>

        <Section icon={<Users size={18} />} title="Parent / Guardian Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Parent Name" name="parentName" value={formData.parentName} onChange={handleChange} span2 />
            <Field label="Parent Mobile" name="parentMobile" value={formData.parentMobile} onChange={handleChange} type="tel" />
            <Field label="Address Line 1" name="parentAddressLine1" value={formData.parentAddressLine1} onChange={handleChange} span2 />
            <Field label="Address Line 2" name="parentAddressLine2" value={formData.parentAddressLine2} onChange={handleChange} span2 />
          </div>
        </Section>

        <Section icon={<Pencil size={18} />} title="Signatures (re-upload required)">
          <div className="grid grid-cols-2 gap-4">
            <SignatureUpload label="Student Signature" file={studentSignature} onChange={setStudentSignature} />
            <SignatureUpload label="Parent Signature" file={parentSignature} onChange={setParentSignature} />
          </div>
        </Section>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
          <button type="button" className="btn btn-ghost flex-1 rounded-full" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="btn btn-primary flex-1 rounded-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner"></span> : "Submit Correction"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, span2 = false, type = "text" }) {
  return (
    <div className={`form-control ${span2 ? "col-span-2" : ""}`}>
      <label className="label py-1">
        <span className="label-text text-xs uppercase tracking-wide opacity-60">{label}</span>
      </label>
      <input type={type} name={name} value={value} onChange={onChange} className="input input-bordered w-full" />
    </div>
  );
}

function SignatureUpload({ label, file, onChange }) {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-xs uppercase tracking-wide opacity-60">{label}</span>
      </label>
      <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-base-300 rounded-xl h-24 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors overflow-hidden">
        {file ? (
          <img src={URL.createObjectURL(file)} alt={label} className="h-full object-contain" />
        ) : (
          <span className="text-xs opacity-50">Click to upload</span>
        )}
        <input
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={(e) => onChange(e.target.files[0])}
        />
      </label>
    </div>
  );
}

export default SubmissionPage;