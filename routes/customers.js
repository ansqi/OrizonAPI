const express = require('express');
const router = express.Router();
const { pool: db} = require('../db');
const { parseId, validateMail,validateString } = require('../utils/validators');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, nome, cognome, email, data_creazione FROM utenti'
    );
    res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { nome, cognome, email } = req.body || {};

  if (!nome || !cognome || !email) {
    return res.status(400).json({ error: 'Campi mancanti' });
  }
 if(!validateString(nome) || !validateString(cognome) || !validateMail(email)){
    return res.status(400).json({ error: 'Nome, cognome o email non validi' });
  }
  try {
    const query = 'INSERT INTO utenti (nome, cognome, email) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [nome, cognome, email]);

    return res.status(201).json({ id: result.insertId, nome, cognome, email });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  const { nome, cognome, email } = req.body || {};

  if (id === null) {
    return res.status(400).json({ error: 'id non valido' });
  }

  if (!nome || !cognome || !email) {
    return res.status(400).json({ error: 'Nome, cognome o email sono obbligatori' });
  }

  if(!validateString(nome) || !validateString(cognome) || !validateMail(email)){
    return res.status(400).json({ error: 'Nome, cognome o email non validi' });
  }

  try {
    await db.execute(
      'UPDATE utenti SET nome = ?, cognome = ?, email = ? WHERE id = ?',
      [nome, cognome, email, id]
    );

    const [rows] = await db.execute(
      'SELECT id, nome, cognome, email, data_creazione FROM utenti WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Utente non trovato' });
    }

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'id non valido' });
  }

  try {
    const [result] = await db.execute(
      'DELETE FROM utenti WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Utente non trovato' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
