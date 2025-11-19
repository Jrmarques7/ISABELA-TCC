const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurar conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Criar tabela se não existir
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS respostas (
        id SERIAL PRIMARY KEY,
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        q11 TEXT,
        q12 TEXT,
        q13 TEXT,
        q14_dialogo TEXT,
        q14_formato TEXT,
        q15 TEXT,
        q16_estrutura TEXT,
        q16_vinculo TEXT,
        q16_carga TEXT,
        q16_fluxo TEXT,
        q16_sistematizacao TEXT
      )
    `);
    console.log('Tabela criada/verificada com sucesso');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    client.release();
  }
}

// Rotas da API

// Salvar nova resposta
app.post('/api/respostas', async (req, res) => {
  try {
    const dados = req.body;

    const result = await pool.query(`
      INSERT INTO respostas (
        q11, q12, q13, q14_dialogo, q14_formato, q15,
        q16_estrutura, q16_vinculo, q16_carga, q16_fluxo, q16_sistematizacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      dados.q11 || null,
      JSON.stringify(dados.q12 || []),
      dados.q13 || null,
      dados.q14_dialogo || null,
      dados.q14_formato || null,
      JSON.stringify(dados.q15 || []),
      dados.q16?.estrutura || null,
      dados.q16?.vinculo || null,
      dados.q16?.carga || null,
      dados.q16?.fluxo || null,
      dados.q16?.sistematizacao || null
    ]);

    res.json({
      success: true,
      id: result.rows[0].id,
      message: 'Resposta salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar todas as respostas
app.get('/api/respostas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM respostas ORDER BY data_envio DESC');

    // Converter JSON strings de volta para arrays
    const respostasFormatadas = result.rows.map(r => ({
      id: r.id,
      dataEnvio: r.data_envio,
      q11: r.q11,
      q12: JSON.parse(r.q12 || '[]'),
      q13: r.q13,
      q14_dialogo: r.q14_dialogo,
      q14_formato: r.q14_formato,
      q15: JSON.parse(r.q15 || '[]'),
      q16: {
        estrutura: r.q16_estrutura,
        vinculo: r.q16_vinculo,
        carga: r.q16_carga,
        fluxo: r.q16_fluxo,
        sistematizacao: r.q16_sistematizacao
      }
    }));

    res.json(respostasFormatadas);
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas agregadas
app.get('/api/estatisticas', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as count FROM respostas');
    const ultima = await pool.query('SELECT data_envio FROM respostas ORDER BY data_envio DESC LIMIT 1');

    res.json({
      total: parseInt(total.rows[0].count),
      ultimaResposta: ultima.rows[0]?.data_envio || null
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar todas as respostas (protegido por confirmação)
app.delete('/api/respostas', async (req, res) => {
  try {
    await pool.query('DELETE FROM respostas');
    res.json({ success: true, message: 'Todas as respostas foram removidas' });
  } catch (error) {
    console.error('Erro ao limpar respostas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
});

// Fechar pool ao encerrar
process.on('SIGINT', () => {
  pool.end();
  process.exit();
});
