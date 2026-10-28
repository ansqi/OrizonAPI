const express = require("express");
const router = express.Router();
const { pool: db } = require("../db");
const { parseId, validateString } = require("../utils/validators");



router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, nome, data_creazione FROM prodotti",
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { nome } = req.body || {};

  if (!validateString(nome)) {
    return res
      .status(400)
      .json({
        error:
          "Il campo nome è obbligatorio",
      });
  }

  try {
    const [result] = await db.execute("INSERT INTO prodotti (nome) VALUES (?)", [
      nome.trim(),
    ]);

    return res
      .status(201)
      .json({ id: result.insertId, nome: nome.trim() });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  const { nome } = req.body || {};

  if (id === null) {
    return res.status(400).json({ error: "id non valido" });
  }

  if (!validateString(nome)) {
    return res
      .status(400)
      .json({
        error:
          "Il campo nome è obbligatorio e deve contenere al massimo 255 caratteri",
      });
  }

  try {
    const [result] = await db.execute(
      "UPDATE prodotti SET nome = ? WHERE id = ?",
      [nome.trim(), id],
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.execute("SELECT id FROM prodotti WHERE id = ?", [id]);
      if (rows.length === 0) {
        return res.status(400).json({ error: "Prodotto non trovato" });
      }
    }

    return res.json({ id, nome: nome.trim() });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: "id non valido" });
  }

  try {
    const [result] = await db.execute(
      "DELETE FROM prodotti WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Prodotto non trovato" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
