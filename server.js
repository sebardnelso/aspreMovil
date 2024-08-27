const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser'); // Para manejar JSON y datos de formularios
const ftp = require('basic-ftp'); // Usa basic-ftp en lugar de ftp
const path = require('path');
const app = express();
const port = 3000;
const FTPClient = require('ftp');
// Middleware
app.use(cors()); // Para permitir solicitudes de otros dominios (requerido para desarrollo)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar conexión a MySQL
const db = mysql.createConnection({
  host: '190.228.29.61',
  user: 'kalel2016',
  password: 'Kalel2016',
  database: 'ausol',
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectarse a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Ruta de autenticación
app.post('/login', (req, res) => {
  const { id, password } = req.body;

  const query = 'SELECT * FROM aus_cli WHERE id = ? AND password = ?';
  db.query(query, [id, password], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.stack);
      res.status(500).send({ success: false, message: 'Error interno del servidor' });
      return;
    }

    if (results.length > 0) {
      res.send({ success: true });
    } else {
      res.send({ success: false, message: 'ID o contraseña incorrectos' });
    }
  });
});

// Ruta para obtener datos de aus_art
app.get('/copiar-aus-art', (req, res) => {
  const copyDataQuery = `
    SELECT id, denom, precio, prove, codbar, porofe, codiva, stock, stkcor, cerapio
    FROM aus_art
  `;

  db.query(copyDataQuery, (err, results) => {
    if (err) {
      console.error('Error al copiar los datos:', err.stack);
      res.status(500).send('Error al copiar los datos');
      return;
    }

    res.json(results); // Enviar los datos como JSON al cliente
  });
});

// Endpoint para obtener datos de aus_faeqv
app.get('/copiar-aus-faeqv', (req, res) => {
  const query = 'SELECT * FROM aus_faeqv';
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta', error);
      res.status(500).send('Error al obtener datos.');
    } else {
      res.json(results);
    }
  });
});


// Ruta para listar las imágenes en el servidor FTP
app.get('/list-images', (req, res) => {
  const client = new FTPClient();

  client.on('ready', function() {
    client.list('/imagenes', function(err, list) {
      if (err) {
        res.status(500).send('Error al listar las imágenes');
        client.end();
        return;
      }

      const images = list
        .filter(item => item.type === '-')
        .map(item => item.name);

      res.json({ images });
      client.end();
    });
  });

  client.connect({
    host: 'ftp.spowerinfo.com.ar', // Cambia esto por tu servidor FTP
    port: 21,
    user: 'ausolpub.spowerinfo.com.ar',
    password: 'ausol',
  });
});

// Ruta para descargar una imagen específica del servidor FTP
app.get('/download-image', (req, res) => {
  const client = new FTPClient();
  const fileName = req.query.fileName;

  client.on('ready', function() {
    client.get(`/imagenes/${fileName}`, function(err, stream) {
      if (err) {
        res.status(500).send('Error al descargar la imagen');
        client.end();
        return;
      }
      stream.once('close', function() { client.end(); });
      stream.pipe(res);
    });
  });

  client.connect({
    host: 'ftp.spowerinfo.com.ar', // Cambia esto por tu servidor FTP
    port: 21,
    user: 'ausolpub.spowerinfo.com.ar',
    password: 'ausol',
  });
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
