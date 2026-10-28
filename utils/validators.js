function parseId(value) {
  if (
    value === null ||
    typeof value === "boolean" ||
    String(value).trim() === ""
  ) {
    return null;
  }
  const parsedNumber = Number(value);
  return Number.isSafeInteger(parsedNumber) ? parsedNumber : null;
}

function validateString(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 255;
}
function validateMail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}


module.exports = { parseId, validateString, validateMail };
