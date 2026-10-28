# OrizonAPI

API REST realizzata con Node.js, Express e MySQL per gestire clienti, prodotti e ordini.
Progetto relativo al mio master AI e Agenti AI per il business esame Node.js
## Requisiti e avvio

- Node.js
- MySQL

Installa le dipendenze e avvia il server:

```bash
npm install
node app.js
```

Il server ascolta sulla porta `5000` (`http://127.0.0.1:5000`). La connessione MySQL è configurata in `db.js`; le credenziali vengono recuperate da un file .env. si può prendere spunto dal file .env.example.
Crea il database importando lo script SQL:

```bash
mysql -u root -p < migrations.sql
```

Lo script crea e seleziona il database `Orizon_db`. Prima di avviare l'applicazione, verifica che la configurazione utilizzata in in `db.js` corrisponda alle credenziali e all'istanza MySQL locali.

Le richieste con un body devono inviare JSON e impostare `Content-Type: application/json`.

## Endpoint

Base URL: `http://127.0.0.1:5000`

### Clienti

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/customers` | Restituisce l'elenco dei clienti. |
| `POST` | `/customers` | Crea un cliente. Richiede `nome`, `cognome` ed `email`. |
| `PUT` | `/customers/:id` | Aggiorna nome, cognome ed email del cliente indicato. |
| `DELETE` | `/customers/:id` | Elimina il cliente indicato. |

Esempio di body per `POST` e `PUT` pre orders:

```json
{
  "prodotti": [id1,id2,id3],
  "utenti": [id1,id2,id3]
}
```

### Prodotti

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/products` | Restituisce l'elenco dei prodotti. |
| `POST` | `/products` | Crea un prodotto. Richiede `nome`. |
| `PUT` | `/products/:id` | Aggiorna il nome del prodotto indicato. |
| `DELETE` | `/products/:id` | Elimina il prodotto indicato. |

Esempio di body per `POST` e `PUT`:

```json
{
  "nome": "Trasferimento"
}
```

### Ordini

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/orders` | Restituisce gli ordini; supporta i parametri query `from`, `to` e `products`. |
| `POST` | `/orders` | Crea un ordine collegandolo a prodotti e clienti esistenti. |
| `PUT` | `/orders/:id` | Sostituisce le associazioni dell'ordine con prodotti e clienti indicati. |
| `DELETE` | `/orders/:id` | Elimina l'ordine e le relative associazioni. |

Esempio di filtro:

```text
GET /orders?from=2026-01-01&to=2026-01-31&products=Quaderno
```

Il parametro `products` può essere ripetuto per filtrare più nomi, ad esempio `?products=Trasferimento&products=Soggiorno`.

`POST /orders` riceve array di ID numerici:

```json
{
  "prodotti": [1, 2],
  "utenti": [3]
}
```

`PUT /orders/:id` riceve prodotti come ID o oggetti con `id` e utenti come oggetti con `id`, `nome`, `cognome` ed `email`. Entrambi i campi possono essere passati come array o come singolo elemento:

```json
{
  "prodotti": [
    {
      "id": 1,
      "nome": "Quaderno"
    }
  ],
  "utenti": [
    {
      "id": 3,
      "nome": "Anna",
      "cognome": "Rossi",
      "email": "anna.rossi@example.com"
    }
  ]
}
```

## Struttura del database

Lo schema è definito in [`migrations.sql`](./migrations.sql) e contiene il database `Orizon_db` con queste tabelle:

| Tabella | Contenuto |
|---|---|
| `utenti` | Clienti: ID, nome, cognome, email e data di creazione. Nome ed email sono univoci. |
| `prodotti` | Prodotti: ID, nome univoco e data di creazione. |
| `ordini` | Ordini: ID e data di creazione. |
| `ordine_utente` | Tabella di associazione tra ordini e clienti. |
| `ordine_prodotto` | Tabella di associazione tra ordini e prodotti. |

Un ordine può essere associato a più clienti e a più prodotti tramite le tabelle `ordine_utente` e `ordine_prodotto`. Le associazioni hanno chiavi composte e vincoli di chiave esterna; l'eliminazione di un ordine, cliente o prodotto elimina anche le rispettive associazioni (`ON DELETE CASCADE`).

## Risposte ed errori

- Le richieste di creazione restituiscono `201 Created`.
- Gli aggiornamenti restituiscono `200 OK`; le cancellazioni riuscite restituiscono `204 No Content`.
- Dati non validi restituiscono `400 Bad Request`; risorse non trovate `404 Not Found`.
- Duplicati o record ancora referenziati possono restituire `409 Conflict`.
- Gli errori interni del database restituiscono `500 Internal Server Error`.

Per importare ed eseguire i test in Postman, utilizza l'apposita collection nella folder postman.
