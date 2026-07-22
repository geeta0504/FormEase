import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE_W = 595.28;
const PAGE_H = 841.89;

// ============================================================
// Shared design tokens — change these once, both pages update
// ============================================================
const MARGIN = 40;
const TABLE_LEFT = MARGIN;
const TABLE_RIGHT = PAGE_W - MARGIN;
const TABLE_WIDTH = TABLE_RIGHT - TABLE_LEFT;
const COL_MID = TABLE_LEFT + TABLE_WIDTH * 0.55;

const ROW_H = 22;              // uniform row height for every table on every page
const HEADER_H = 24;           // uniform shaded section-header height
const HEADER_FILL = rgb(0.90, 0.90, 0.90);
const BORDER_COLOR = rgb(0.3, 0.3, 0.3);
const BORDER_WIDTH = 0.75;
const ROW_LINE_COLOR = rgb(0.75, 0.75, 0.75);
const COL_LINE_COLOR = rgb(0.6, 0.6, 0.6);
const UNDERLINE_COLOR = rgb(0.4, 0.4, 0.4);

const TEXT_SIZE = 10;
const LABEL_SIZE = 10;
const BODY_SIZE = 9.5;
const TITLE_SIZE = 14;
const SUBTITLE_SIZE = 11;
const SECTION_SIZE = 12;
const LINE_HEIGHT = 15;
const BODY_LINE_HEIGHT = 13.5;

/**
 * Generates the complete "Undertaking for Room Allotment" PDF for one student.
 *
 * @param {Object} data - form field values (studentName, degree, branch, rollNumber,
 *   semester, hostel, roomNumber, studentMobile, studentDate, parentName,
 *   parentAddressLine1, parentAddressLine2, parentMobile, parentDate)
 * @param {Buffer} studentSignatureBuffer - PNG/JPG bytes of student's signature
 * @param {Buffer} parentSignatureBuffer - PNG/JPG bytes of parent's signature
 * @returns {Promise<Buffer>} the generated PDF as bytes
 */
export async function generateSubmissionPdf(data, studentSignatureBuffer, parentSignatureBuffer) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = fs.readFileSync(path.join(__dirname, "assets", "logo.png"));
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(60 / logoImage.width);

  // ---------- shared drawing helpers (used by both pages) ----------

  const centerText = (page, text, yPos, size, f = font) => {
    const width = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_W - width) / 2, y: yPos, size, font: f });
  };

  /** Shaded, bordered section title bar. Returns the y position just below it. */
  const drawSectionHeader = (page, text, yTop) => {
    page.drawRectangle({
      x: TABLE_LEFT,
      y: yTop - HEADER_H + 6,
      width: TABLE_WIDTH,
      height: HEADER_H,
      color: HEADER_FILL,
      borderColor: BORDER_COLOR,
      borderWidth: BORDER_WIDTH,
    });
    centerText(page, text, yTop, SECTION_SIZE, bold);
    return yTop - HEADER_H - 16;
  };

  /** Bordered paragraph box for declaration text. Returns y position just below it. */
  const drawTextBox = (page, lines, yTop) => {
    const boxPadding = 10;
    const boxHeight = lines.length * LINE_HEIGHT + boxPadding * 2 - 4;

    page.drawRectangle({
      x: TABLE_LEFT,
      y: yTop - boxHeight,
      width: TABLE_WIDTH,
      height: boxHeight,
      borderColor: BORDER_COLOR,
      borderWidth: BORDER_WIDTH,
    });

    let textY = yTop - boxPadding - 10;
    lines.forEach((line) => {
      page.drawText(line, { x: TABLE_LEFT + boxPadding, y: textY, size: TEXT_SIZE, font, lineHeight: LINE_HEIGHT });
      textY -= LINE_HEIGHT;
    });

    return yTop - boxHeight - 30;
  };

  /**
   * Two-column bordered table (label/value pairs), matching the same visual
   * style everywhere: outer border, optional vertical divider, light row lines.
   * `rows` = [{ left, leftVal, right, rightVal }, ...]. `right`/`rightVal` optional.
   * Returns the y position just below the table.
   */
  const drawTable = (page, rows, yTop, { labelColWidth = null } = {}) => {
    const tableHeight = ROW_H * rows.length;

    page.drawRectangle({
      x: TABLE_LEFT,
      y: yTop - tableHeight,
      width: TABLE_WIDTH,
      height: tableHeight,
      borderColor: BORDER_COLOR,
      borderWidth: BORDER_WIDTH,
    });

    rows.forEach((row, i) => {
      const yRowTop = yTop - i * ROW_H;
      const yText = yRowTop - 15;

      if (i > 0) {
        page.drawLine({
          start: { x: TABLE_LEFT, y: yRowTop },
          end: { x: TABLE_RIGHT, y: yRowTop },
          thickness: 0.5,
          color: ROW_LINE_COLOR,
        });
      }

      if (labelColWidth) {
        // Fixed-width label column (used on page 2's parent-details table)
        if (row.left) page.drawText(row.left, { x: TABLE_LEFT + 8, y: yText, size: LABEL_SIZE, font: bold });
        if (row.leftVal) {
          page.drawText(String(row.leftVal), { x: TABLE_LEFT + labelColWidth + 8, y: yText, size: TEXT_SIZE, font });
        }
        if (i === 0) {
          page.drawLine({
            start: { x: TABLE_LEFT + labelColWidth, y: yTop },
            end: { x: TABLE_LEFT + labelColWidth, y: yTop - tableHeight },
            thickness: 0.5,
            color: COL_LINE_COLOR,
          });
        }
      } else {
        // Inline label+value pairs, optionally split into two columns (page 1 style)
        page.drawText(row.left, { x: TABLE_LEFT + 4, y: yText, size: LABEL_SIZE, font });
        const leftValX = TABLE_LEFT + 4 + font.widthOfTextAtSize(row.left, LABEL_SIZE) + 6;
        if (row.leftVal) page.drawText(String(row.leftVal), { x: leftValX, y: yText, size: TEXT_SIZE, font });

        if (row.right) {
          page.drawLine({
            start: { x: COL_MID, y: yRowTop },
            end: { x: COL_MID, y: yRowTop - ROW_H },
            thickness: 0.5,
            color: COL_LINE_COLOR,
          });
          page.drawText(row.right, { x: COL_MID + 4, y: yText, size: LABEL_SIZE, font });
          const rightValX = COL_MID + 4 + font.widthOfTextAtSize(row.right, LABEL_SIZE) + 6;
          if (row.rightVal) page.drawText(String(row.rightVal), { x: rightValX, y: yText, size: TEXT_SIZE, font });
        }
      }
    });

    return yTop - tableHeight - 30;
  };

  /**
   * Uniform "Date: ___  Signature: ___" footer row with drawn underlines,
   * used identically on both pages.
   */
  const drawDateAndSignature = async (page, { dateVal, dateLabel = "Date:", sigLabel, yPos, signatureBuffer }) => {
    const dateLabelX = TABLE_LEFT;
    const dateValX = dateLabelX + font.widthOfTextAtSize(dateLabel, SUBTITLE_SIZE) + 8;
    const dateLineEnd = dateValX + 90;

    page.drawText(dateLabel, { x: dateLabelX, y: yPos, size: SUBTITLE_SIZE, font: bold });
    page.drawText(String(dateVal || ""), { x: dateValX, y: yPos, size: TEXT_SIZE, font });
    page.drawLine({
      start: { x: dateValX - 4, y: yPos - 4 },
      end: { x: dateLineEnd, y: yPos - 4 },
      thickness: BORDER_WIDTH,
      color: UNDERLINE_COLOR,
    });

    const sigLabelX = COL_MID - 90;
    const sigLineStart = sigLabelX + bold.widthOfTextAtSize(sigLabel, SUBTITLE_SIZE) + 10;
    const sigLineEnd = TABLE_RIGHT;

    page.drawText(sigLabel, { x: sigLabelX, y: yPos, size: SUBTITLE_SIZE, font: bold });
    page.drawLine({
      start: { x: sigLineStart, y: yPos - 4 },
      end: { x: sigLineEnd, y: yPos - 4 },
      thickness: BORDER_WIDTH,
      color: UNDERLINE_COLOR,
    });

    if (signatureBuffer) {
      const sigImg = await embedSignature(pdfDoc, signatureBuffer);
      const sigDims = sigImg.scale(Math.min(1, 100 / sigImg.width));
      page.drawImage(sigImg, { x: sigLineStart + 10, y: yPos, width: sigDims.width, height: sigDims.height });
    }
  };

  // ================= PAGE 1: Student Declaration =================
  const page1 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 50;

  page1.drawImage(logoImage, { x: 45, y: y - 40, width: logoDims.width, height: logoDims.height });

  centerText(page1, "NATIONAL INSTITUTE OF TECHNOLOGY GOA", y, TITLE_SIZE, bold);
  y -= 16;
  centerText(page1, "Cuncolim, South Goa District, Goa, PIN-403703", y, TEXT_SIZE, font);
  y -= 14;
  page1.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.5 });
  y -= 6;
  page1.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: BORDER_WIDTH });
  y -= 28;

  centerText(page1, "UNDERTAKING TO BE SUBMITTED FOR ROOM ALLOTMENT", y, SECTION_SIZE, bold);
  y -= 16;
  centerText(page1, "(By Student and Parent / Guardian)", y, SUBTITLE_SIZE, font);
  y -= 24;

  y = drawSectionHeader(page1, "DECLARATION BY STUDENT", y);

  const studentRows = [
    { left: "Name of student -", leftVal: data.studentName, right: null, rightVal: null },
    { left: "Degree -", leftVal: data.degree, right: "Branch -", rightVal: data.branch },
    { left: "Roll Number -", leftVal: data.rollNumber, right: "Semester to which registration is sought -", rightVal: data.semester },
    { left: "Hostel -", leftVal: data.hostel, right: "Room Number -", rightVal: data.roomNumber },
    { left: "Mobile Number -", leftVal: data.studentMobile, right: null, rightVal: null },
  ];
  y = drawTable(page1, studentRows, y);

  page1.drawText("I hereby confirm and declare that:", { x: TABLE_LEFT, y, size: SUBTITLE_SIZE, font: bold });
  y -= 20;

  const bullets = [
    { text: "I have read and understood all the Rules and Regulations / Code of Conduct of NIT Goa hostel issued on NIT", bullet: true },
    { text: "Goa Website. I will adhere to all the Rules and Regulations / Code of Conduct of NIT Goa hostel.", bullet: false },
    { text: "I will not involve in any case of violation of any of the hostel rules or take part in any unlawful activities.", bullet: true },
    { text: "I will not use or prompt anybody to use or store any type of items which are prohibited from the hostels and", bullet: true },
    { text: "will not smoke, use alcohol and narcotic drugs.", bullet: false },
    { text: "I will not interchange my room with any other student of NIT Goa.", bullet: true },
    { text: "I will not allow any other person to stay in my room.", bullet: true },
    { text: "I will not use any equipment or gadgets (heaters, cookers, coolers, fridges etc.) which are not permitted to", bullet: true },
    { text: "be used in NIT Goa hostel rooms.", bullet: false },
    { text: "I will not damage the furniture/electrical equipment in my room/hostel, will not disfigure the room/hostel", bullet: true },
    { text: "and will keep my room always clean.", bullet: false },
    { text: "I will not use any form of powered vehicles inside NIT Goa hostel premises.", bullet: true },
    { text: "I will pay the hostel fee on time.", bullet: true },
    { text: "I will not indulge in ragging of any sort and if found anybody doing so, I will report the same to the", bullet: true },
    { text: "authorities with the names of students involved.", bullet: false },
    { text: "I will not indulge in physical altercations of any sort with any other student/staff/faculty of NIT Goa.", bullet: true },
    { text: "I will fully abide by the hostel timings stipulated by the hostel officials. I will enter the details of my", bullet: true },
    { text: "movement outside the hostel in the movement register available in the hostel.", bullet: false },
  ];

  bullets.forEach(({ text, bullet }) => {
    if (bullet) page1.drawText("\u2022", { x: TABLE_LEFT, y, size: TEXT_SIZE, font });
    page1.drawText(text, { x: TABLE_LEFT + 14, y, size: BODY_SIZE, font });
    y -= BODY_LINE_HEIGHT;
  });

  y -= 12;
  const closing = [
    "I fully understand all the above mentioned statements in full confidence and undertake that I will abide by",
    "them completely. I know that I will be fined if I am found violating any of the above mentioned rules or any",
    "other NIT Goa Hostel rules or may be subjected to any punishments including expulsion from the hostel.",
  ];
  y = drawTextBox(page1, closing, y + 12); // reuse the same bordered-box style as page 2's declaration

  y -= 20;
  await drawDateAndSignature(page1, {
    dateVal: data.studentDate,
    sigLabel: "Signature of the Student:",
    yPos: y,
    signatureBuffer: studentSignatureBuffer,
  });

  // ================= PAGE 2: Parent Declaration =================
  const page2 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  y = PAGE_H - 55;

  y = drawSectionHeader(page2, "DECLARATION BY PARENT / GUARDIAN", y);

  const parentLines = [
    "I hereby confirm that my ward will adhere to all the rules and regulations of NIT Goa hostels. I",
    "know that he / she will be fined if he / she is found violating any of the above mentioned rules or",
    "any other NIT Goa Hostel rules or may be subjected to any punishments including expulsion from",
    "the hostel. I shall monitor his / her behavior throughout his / her stay at NIT Goa and also assure",
    "that the hostel fee will be paid on time. I hereby undertake that the Institute shall not be held liable in",
    "the event of any accident, injury, disappearance or unfortunate demise of my son / daughter during his",
    "/ her stay in the hostel. I solemnly declare that the above details are true to the best of my knowledge",
    "and belief.",
  ];
  y = drawTextBox(page2, parentLines, y);

  const parentRows = [
    { left: "Name of Parent / Guardian", leftVal: data.parentName },
    { left: "Address", leftVal: data.parentAddressLine1 },
    { left: "", leftVal: data.parentAddressLine2 },
    { left: "Mobile Number", leftVal: data.parentMobile },
  ];
  y = drawTable(page2, parentRows, y, { labelColWidth: 170 });

  y -= 20;
  await drawDateAndSignature(page2, {
    dateVal: data.parentDate,
    sigLabel: "Signature of the Parent / Guardian:",
    yPos: y,
    signatureBuffer: parentSignatureBuffer,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Cleans a signature image before embedding:
 * - Removes near-black backgrounds (photos/screenshots with dark backgrounds)
 *   by making dark pixels transparent, then flattening onto white.
 * - Always outputs PNG so embedding is consistent regardless of source format.
 */
async function embedSignature(pdfDoc, buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const threshold = 60; // pixels darker than this (near-black) are treated as background

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < threshold && g < threshold && b < threshold) {
      data[i + 3] = 0;
    }
  }

  const cleanedBuffer = await sharp(data, { raw: { width, height, channels } })
    .png()
    .flatten({ background: "#ffffff" })
    .toBuffer();

  return await pdfDoc.embedPng(cleanedBuffer);
}