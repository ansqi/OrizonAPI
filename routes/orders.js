// routes/ordini.js
const express = require("express");
const router = express.Router();
const { pool: db, handleDatabaseError } = require("../db");
const {
  parseId,
  validateProdotti,
  validateUtenti,
} = require("../utils/validators");

router.get("/", async (req, res) => {
  const { from, to, products } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (from) {
      conditions.push("ordini.data_creazione >= ?");
      params.push(from);
    }

    if (to) {
      conditions.push("ordini.data_creazione < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(to);
    }

    if (products) {
      const productNames = Array.isArray(products) ? products : [products];

      if (productNames.length > 0) {
        conditions.push(`EXISTS (
          SELECT 1
          FROM ordine_prodotto op
          LEFT JOIN prodotti p ON p.id = op.prodotto_id
          WHERE op.ordine_id = ordini.id
            AND p.nome IN (${productNames.map(() => "?").join(", ")})
        )`);
        params.push(...productNames);
      }
    }
    const query = `SELECT ordini.id, ordini.data_creazione FROM ordini${
      conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : ""
    }`;

    const [rows] = await db.execute(query, params);
    return res.json(rows);
  } catch (error) {
    return handleDatabaseError(error, res);
  }
});

router.post("/", async (req, res) => {
  const { prodotti, utenti } = req.body || {};

  // verifico che gli id passati siano validi sia per i prodotti che per gli utenti usando parseId e che siano array di interi
  if (
    !Array.isArray(prodotti) ||
    !prodotti.every((prodotto) => parseId(prodotto) !== null)
  ) {
    return res.status(400).json({ error: "Prodotti non validi" });
  }
  if (
    !Array.isArray(utenti) ||
    !utenti.every((utente) => parseId(utente) !== null)
  ) {
    return res.status(400).json({ error: "Utenti non validi" });
  }
  const connection = await db.getConnection();
  try {
    //utilizzo una transazione per inserire l'ordine e i prodotti associati
    await connection.beginTransaction();
    const [result] = await db.execute("INSERT INTO ordini () VALUES ()");
    let insertedID = result.insertId;
    for (const prodottoId of prodotti) {
      await db.execute(
        "INSERT INTO ordine_prodotto (ordine_id, prodotto_id) VALUES (?, ?)",
        [insertedID, prodottoId],
      );
    }
    for (const utenteId of utenti) {
      await db.execute(
        "INSERT INTO ordine_utente (ordine_id, utente_id) VALUES (?, ?)",
        [insertedID, utenteId],
      );
    }

    await connection.commit();
    return res.status(201).json({ id: insertedID, prodotti, utenti });
  } catch (error) {
    return handleDatabaseError(error, res);
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: "id non valido" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await db.execute("DELETE FROM ordine_utente WHERE ordine_id = ?", [id]);
    await db.execute("DELETE FROM ordine_prodotto WHERE ordine_id = ?", [id]);
    await db.execute("DELETE FROM ordini WHERE id = ?", [id]);
    await connection.commit();
    return res.status(204).send();
  } catch (error) {
    await connection.rollback();
    return handleDatabaseError(error, res);
  } finally {
    connection.release();
  }
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: "id non valido" });
  }
  //verifico che nella request body ci siano prodotti e utenti e che siano array di interi validi
  const { prodotti, utenti } = req.body || {};
  if (!validateProdotti(prodotti) || !validateUtenti(utenti)) {
    return res.status(400).json({ error: "Prodotti o utenti non validi" });
  }

  const productList = Array.isArray(prodotti) ? prodotti : [prodotti];
  const userList = Array.isArray(utenti) ? utenti : [utenti];

  try{
    const connection = await db.getConnection();
    await connection.beginTransaction();
    //cancello i prodotti e gli utenti associati all'ordine
    await db.execute("DELETE FROM ordine_utente WHERE ordine_id = ?", [id]);
    await db.execute("DELETE FROM ordine_prodotto WHERE ordine_id = ?", [id]);
    //inserisco i nuovi prodotti e utenti associati all'ordine
    for (const currentProduct of productList) {
      await db.execute(
        "INSERT INTO ordine_prodotto (ordine_id, prodotto_id) VALUES (?, ?)",
        [id, typeof currentProduct === "object" ? currentProduct.id : currentProduct],
      );
    }
    for (const currentUser of userList) {
      await db.execute(
        "INSERT INTO ordine_utente (ordine_id, utente_id) VALUES (?, ?)",
        [id, currentUser.id],
      );
    }

    await connection.commit();
    return res.status(200).json({ id, prodotti, utenti });

  }catch(error){
    return handleDatabaseError(error, res);
  }
});

module.exports = router;
