const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser'); // Para manejar JSON y datos de formularios
const FTPClient = require('ftp'); // Usa basic-ftp en lugar de ftp
const app = express();
const port = 3000;

// Configurar el pool de conexiones
const pool = mysql.createPool({
  host: '190.228.29.61',
  user: 'kalel2016',
  password: 'Kalel2016',
  database: 'ausol',
  connectionLimit: 10 // Número máximo de conexiones en el pool
});

// Obtener una conexión del pool
const promisePool = pool.promise();

// Middleware
app.use(cors()); // Para permitir solicitudes de otros dominios (requerido para desarrollo)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de autenticación
app.post('/login', async (req, res) => {
  const { id, password } = req.body;

  try {
    const [results] = await promisePool.query(
      'SELECT * FROM aus_cli WHERE id = ? AND password = ?',
      [id, password]
    );
    
    if (results.length > 0) {
      res.send({ success: true });
    } else {
      res.send({ success: false, message: 'ID o contraseña incorrectos' });
    }
  } catch (err) {
    console.error('Error al consultar la base de datos:', err.stack);
    res.status(500).send({ success: false, message: 'Error interno del servidor' });
  }
});

// Ruta para obtener datos de aus_art
app.get('/copiar-aus-art', async (req, res) => {
  try {
    const [results] = await promisePool.query(`
      SELECT id, denom, precio, prove, codbar, porofe, codiva, stock, stkcor, cerapio
      FROM aus_art
    `);
    res.json(results); // Enviar los datos como JSON al cliente
  } catch (err) {
    console.error('Error al copiar los datos:', err.stack);
    res.status(500).send('Error al copiar los datos');
  }
});

// Endpoint para obtener datos de aus_faeqv
app.get('/copiar-aus-faeqv', async (req, res) => {
  try {
    const [results] = await promisePool.query('SELECT * FROM aus_faeqv');
    res.json(results);
  } catch (error) {
    console.error('Error al ejecutar la consulta', error);
    res.status(500).send('Error al obtener datos.');
  }
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

// Manejo de cierre de servidor y cierre del pool de conexiones
process.on('SIGINT', () => {
  pool.end((err) => {
    if (err) {
      console.error('Error al cerrar el pool de conexiones:', err.stack);
    }
    console.log('Pool de conexiones cerrado');
    process.exit(0);
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
