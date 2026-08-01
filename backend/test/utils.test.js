import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail, emailToPathSlug } from "../src/utils/emailUtils.js";
import { normalizePhone } from "../src/utils/phoneUtils.js";

test("normalizeEmail trims and lowercases valid email addresses", () => {
  assert.equal(normalizeEmail("  Student.Name@Example.COM "), "student.name@example.com");
  assert.equal(normalizeEmail("not-an-email"), null);
});

test("emailToPathSlug creates a filesystem-safe email folder name", () => {
  assert.equal(emailToPathSlug("student.name@example.com"), "student_name_at_example_com");
});

test("normalizePhone converts valid Indian mobile numbers to E.164", () => {
  assert.equal(normalizePhone("9876543210"), "+919876543210");
  assert.equal(normalizePhone("123"), null);
});
