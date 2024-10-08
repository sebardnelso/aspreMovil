const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser'); // Para manejar JSON y datos de formularios
const FTPClient = require('ftp'); // Usa basic-ftp en lugar de ftp
const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());


// Configurar la conexión a la base de datos MySQL con reconexión automática
const dbConfig = {
  host: '190.228.29.61',
  user: 'kalel2016',
  password: 'Kalel2016',
  database: 'ausol'
};

let db;

function handleDisconnect() {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Connected to the MySQL database');
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// Mantener la conexión activa
setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Error keeping the connection alive:', err);
    }
  });
}, 5000);

// Endpoint de autenticación
app.post('/login', (req, res) => {
  const { nombre, password } = req.body;
  const query = 'SELECT * FROM aus_usuario WHERE nombre = ? AND password = ?';

  db.query(query, [nombre, password], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error en el servidor' });
      return;
    }

    if (results.length > 0) {
      res.status(200).json({ message: 'Autenticación exitosa' });
    } else {
      res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
    }
  });
});

// Ruta para obtener los pedidos pendientes
app.get('/pedidos', (req, res) => {
  const query = `
    SELECT aus_pepend.codpro, aus_pro.razon 
    FROM aus_pepend 
    INNER JOIN aus_pro ON aus_pepend.codpro = aus_pro.codigo
    GROUP BY aus_pepend.codpro;
  `;

  db.query(query, (error, results) => {
    if (error) {
      res.status(500).json({ error });
    } else {
      res.json(results);
    }
  });
});

// Ruta para obtener las líneas de un proveedor específico
app.get('/lineas/:codpro', (req, res) => {
  const { codpro } = req.params;
  const query = `
    SELECT codbar, canped, cantrec 
    FROM aus_pepend 
    WHERE codpro = ?;
  `;

  db.query(query, [codpro], (error, results) => {
    if (error) {
      res.status(500).json({ error });
    } else {
      res.json(results);
    }
  });
});

// Ruta para actualizar la cantidad recibida
app.post('/actualizar-cantrec', (req, res) => {
  const { codbar, cantrec } = req.body;
  const query = `
    UPDATE aus_pepend 
    SET cantrec = ? 
    WHERE codbar = ?;
  `;

  db.query(query, [cantrec, codbar], (error, results) => {
    if (error) {
      res.status(500).json({ error });
    } else {
      res.json({ success: true });
    }
  });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
