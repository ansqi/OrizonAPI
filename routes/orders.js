// routes/ordini.js
const express = require("express");
const router = express.Router();
const { pool: db } = require("../db");
const {
  parseId,
} = require("../utils/validators");

router.get("/", async (req, res, next) => {
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
    const query = `SELECT
      ordini.id,
      ordini.data_creazione,
      COALESCE((
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', p.id,
          'nome', p.nome,
          'data_creazione', p.data_creazione
        ))
        FROM ordine_prodotto op
        INNER JOIN prodotti p ON p.id = op.prodotto_id
        WHERE op.ordine_id = ordini.id
      ), JSON_ARRAY()) AS prodotti,
      COALESCE((
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', u.id,
          'nome', u.nome,
          'cognome', u.cognome,
          'email', u.email,
          'data_creazione', u.data_creazione
        ))
        FROM ordine_utente ou
        INNER JOIN utenti u ON u.id = ou.utente_id
        WHERE ou.ordine_id = ordini.id
      ), JSON_ARRAY()) AS utenti
    FROM ordini${
      conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : ""
    }`;

    const [rows] = await db.execute(query, params);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
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
  let associazioneInInserimento;
  try {
    //utilizzo una transazione per inserire l'ordine e i prodotti associati
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "INSERT INTO ordini () VALUES ()",
    );
    let insertedID = result.insertId;
    associazioneInInserimento = "prodotto";
    for (const prodottoId of prodotti) {
      await connection.execute(
        "INSERT INTO ordine_prodotto (ordine_id, prodotto_id) VALUES (?, ?)",
        [insertedID, prodottoId],
      );
    }
    associazioneInInserimento = "utente";
    for (const utenteId of utenti) {
      await connection.execute(
        "INSERT INTO ordine_utente (ordine_id, utente_id) VALUES (?, ?)",
        [insertedID, utenteId],
      );
    }

    await connection.commit();
    return res.status(201).json({ id: insertedID, prodotti, utenti });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: "id non valido" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM ordine_utente WHERE ordine_id = ?", [
      id,
    ]);
    await connection.execute(
      "DELETE FROM ordine_prodotto WHERE ordine_id = ?",
      [id],
    );
    const [result] = await connection.execute(
      "DELETE FROM ordini WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Ordine non trovato" });
    }
    await connection.commit();
    return res.status(204).send();
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.put("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "id non valido" });
  }
  //verifico che nella request body ci siano prodotti e utenti e che siano array di interi validi
  const { prodotti, utenti } = req.body || {};
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

  const productList = Array.isArray(prodotti) ? prodotti : [prodotti];
  const userList = Array.isArray(utenti) ? utenti : [utenti];
  const connection = await db.getConnection();
  let associazioneInInserimento;
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute(
      "SELECT id FROM ordini WHERE id = ?",
      [id],
    );
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Ordine non trovato" });
    }

    //cancello i prodotti e gli utenti associati all'ordine
    await connection.execute("DELETE FROM ordine_utente WHERE ordine_id = ?", [
      id,
    ]);

    await connection.execute(
      "DELETE FROM ordine_prodotto WHERE ordine_id = ?",
      [id],
    );
    //inserisco i nuovi prodotti e utenti associati all'ordine
    associazioneInInserimento = "prodotto";
    for (const currentProduct of productList) {
      await connection.execute(
        "INSERT INTO ordine_prodotto (ordine_id, prodotto_id) VALUES (?, ?)",
        [id, currentProduct],
      );
    }
    associazioneInInserimento = "utente";
    for (const currentUser of userList) {
      await connection.execute(
        "INSERT INTO ordine_utente (ordine_id, utente_id) VALUES (?, ?)",
        [id, currentUser],
      );
    }

    await connection.commit();
    return res.status(200).json({ id, prodotti, utenti });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
