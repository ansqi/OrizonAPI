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

function validateProdotti(prodotti) {
  const productList = Array.isArray(prodotti) ? prodotti : [prodotti];
  return (
    productList.every((prodotto) => {
      const id =
        typeof prodotto === "object" && prodotto !== null
          ? prodotto.id
          : prodotto;
      return parseId(id) !== null;
    })
  );
}
function validateUtenti(utenti) {
  const userList = Array.isArray(utenti) ? utenti : [utenti];
  return (
    userList.every(
      (utente) =>
        utente !== null &&
        typeof utente === "object" &&
        parseId(utente.id) !== null &&
        validateString(utente.nome) &&
        validateString(utente.cognome) &&
        validateMail(utente.email),
    )
  );
}

module.exports = { parseId, validateString, validateMail, validateProdotti, validateUtenti };
