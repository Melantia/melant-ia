const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Crear el archivo de base de datos
const db = new sqlite3.Database('./sistema_agro.db');

// Leer tu archivo de estructura
const sql = fs.readFileSync('./agro_melant_ia.sql').toString();

// Ejecutar la creación de tablas
db.exec(sql, (err) => {
  if (err) {
    console.error('Error al crear las tablas:', err.message);
  } else {
    console.log(
      "¡Éxito! Base de Datos 'sistema_agro.db' creada y lista para 20,000 usuarios."
    );
  }
  db.close();
});
