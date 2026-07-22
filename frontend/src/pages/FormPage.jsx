import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
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
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">
            Undertaking for Room Allotment
          </h2>

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

            <div className="divider">Signatures</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Student Signature</span></label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setStudentSignature(e.target.files[0])}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Parent Signature</span></label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setParentSignature(e.target.files[0])}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="form-control">
      <label className="label"><span className="label-text">{label}</span></label>
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

export default FormPage;