let express = require('express');
let app = express();
app.use(express.json()); 
const ordiniRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const utentiRouter = require('./routes/customers');

app.use('/customers', utentiRouter);
app.use('/orders', ordiniRouter);
app.use('/products', productsRouter);


app.listen(5000, function () {
   console.log("Express server running at http://127.0.0.1:5000/");
   
});