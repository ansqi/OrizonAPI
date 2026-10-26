require('dotenv').config()
let express = require('express');
let app = express();
app.use(express.json()); 
const ordiniRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const utentiRouter = require('./routes/customers');
const port = process.env.PORT || 5000;
app.use('/customers', utentiRouter);
app.use('/orders', ordiniRouter);
app.use('/products', productsRouter);
app.use((req, res, next) => {
  const errore404 = new Error(`Impossibile trovare la risorsa per ${req.originalUrl}`);
  errore404.status = 404;
  next(errore404); 
});
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.status === 404) {
    return res.status(404).json({ errore: err.message });
  }

  res.status(500).json({ errore: 'Qualcosa è andato storto!' });
});

app.listen(port, function () {
   console.log(`Express server running at http://127.0.0.1:${port}`);
   
});