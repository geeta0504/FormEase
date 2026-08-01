import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    versionLabel: {
      type: String,
      required: true, // e.g. "original", "update1", "update2"
    },
    data: {
      type: Object,
      required: true, // the actual form field values at this version
    },
    pdfPath: {
      type: String,
      required: true, // path to the generated PDF file for this version
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    studentEmail: {
      type: String,
      required: true,
      unique: true, // one document per student email
    },
    parentEmail: {
      type: String,
      required: false,
    },
    versions: {
      type: [versionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
