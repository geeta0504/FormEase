import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { User, Users, PenLine, GraduationCap, Home } from "lucide-react";
import api from "../utils/api";

function FormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    studentName: "",
    degree: "",
    branch: "",
    rollNumber: "",
    semester: "",
    hostel: "",
    roomNumber: "",
    parentName: "",
    parentAddressLine1: "",
    parentAddressLine2: "",
  });

  const [studentSignature, setStudentSignature] = useState(null);
  const [parentSignature, setParentSignature] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentSignature || !parentSignature) {
      toast.error("Please upload both signatures");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append("studentSignature", studentSignature);
    data.append("parentSignature", parentSignature);

    setLoading(true);
    try {
      await api.post("/submissions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Form submitted successfully!");
      navigate("/submission");
    } catch (error) {
      const message = error.response?.data?.message || "Submission failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 pb-28">
      {/* header banner */}
      <div className="bg-neutral text-neutral-content py-10 px-4 mb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-content/60 mb-2">
            New Joinee
          </p>
          <h1 className="font-display text-3xl">Undertaking for Room Allotment</h1>
          <p className="text-sm text-neutral-content/70 mt-2">
            Complete all sections below and upload both signatures to submit your declaration.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 flex flex-col gap-6">
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
          </div>
        </Section>

        <Section icon={<Users size={18} />} title="Parent / Guardian Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Parent Name" name="parentName" value={formData.parentName} onChange={handleChange} span2 />
            <Field label="Address Line 1" name="parentAddressLine1" value={formData.parentAddressLine1} onChange={handleChange} span2 />
            <Field label="Address Line 2" name="parentAddressLine2" value={formData.parentAddressLine2} onChange={handleChange} span2 />
          </div>
        </Section>

        <Section icon={<PenLine size={18} />} title="Signatures">
          <p className="text-xs opacity-60 -mt-2 mb-2">
            Upload a clear photo or scan of each signature — a plain white background works best.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <SignatureUpload
              label="Student Signature"
              file={studentSignature}
              onChange={setStudentSignature}
            />
            <SignatureUpload
              label="Parent Signature"
              file={parentSignature}
              onChange={setParentSignature}
            />
          </div>
        </Section>
      </form>

      {/* floating submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            className="btn btn-primary w-full rounded-full"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner"></span> : "Submit Undertaking"}
          </button>
        </div>
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

function Field({ label, name, value, onChange, type = "text", span2 = false }) {
  return (
    <div className={`form-control ${span2 ? "col-span-2" : ""}`}>
      <label className="label py-1">
        <span className="label-text text-xs uppercase tracking-wide opacity-60">{label}</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="input input-bordered w-full"
      />
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
          <>
            <User size={20} className="opacity-40" />
            <span className="text-xs opacity-50">Click to upload</span>
          </>
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

export default FormPage;