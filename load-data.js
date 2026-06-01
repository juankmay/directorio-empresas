// Script para comprobar si hay datos y recordar cómo importarlos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando datos en la base de datos...\n');

db.get('SELECT COUNT(*) as count FROM empresas', [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  if (row.count >= 100) {
    console.log(`✅ La base de datos ya tiene ${row.count} empresas. No es necesario cargar más.\n`);
    db.close();
    return;
  }

  console.log(`⚠️  Solo hay ${row.count} empresas.\n`);
  console.log('📋 Para cargar tus 1.666 empresas desde el CSV:');
  console.log('\n1) Asegúrate de que tu CSV está en la raíz del proyecto:');
  console.log('   Copia-de-EMPRESAS-TODAS-CONECTA-FP-Fusion.csv');
  console.log('\n2) Ejecuta:');
  console.log('   node import-csv.js Copia-de-EMPRESAS-TODAS-CONECTA-FP-Fusion.csv\n');

  db.close();
});