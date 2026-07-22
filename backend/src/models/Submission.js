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
  { _id: false } // no need for a separate _id per version, versionLabel is enough
);

const submissionSchema = new mongoose.Schema(
  {
    studentPhone: {
      type: String,
      required: true,
      unique: true, // enforces one document per student phone number
    },
    parentPhone: {
      type: String,
      required: true,
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