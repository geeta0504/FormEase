// Converts every string value in an object to uppercase.
// Leaves non-string values (numbers, undefined) untouched.
export function uppercaseFields(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = typeof obj[key] === "string" ? obj[key].toUpperCase() : obj[key];
  }
  return result;
}