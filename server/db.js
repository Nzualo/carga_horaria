const fs = require('fs');
const path = require('path');

// 1. Carregamento Seguro de Variáveis de Ambiente (.env)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (e) {
    // Parser nativo caso dotenv não esteja instalado
    try {
      const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of envLines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = match[2] || '';
          val = val.replace(/^['"](.*)['"]$/, '$1').trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    } catch (parseErr) {}
  }
}

const initSqlJs = require('sql.js');

// 2. Cliente Turso Opcional e Resiliente
let createClient = null;
try {
  createClient = require('@libsql/client').createClient;
} catch (e) {
  // @libsql/client não disponível; opera em modo local SQLite puro
}

const DB_PATH = path.join(__dirname, 'data', 'sdejt_inhassoro.db');
const SEED_PATH = path.join(__dirname, 'data', 'seed.json');

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://carga-horaria-nzualo.aws-eu-central-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTUxMDgxMzEsImlkIjoiMDFhMWVhM2EtMWEwMS03ZjYxLTk3NmEtM2Q5MDZkNTEzOGZhIiwia2lkIjoiTk1tSWVvU0V1Y3JhSmdMc0dsNFIxTW90Um4yMnJ0U1RCeEpCNzh6cUhzTSIsInJpZCI6ImFlNzNjMTQwLWI2MzUtNDU2Ny04YmYyLWQxMWVhMGU4YjMzOSJ9.lxR8Nk4k4mu0cU1i-pqJ4_ipUMzf2ELiS1kFBTKdTDaCPQkcdRt_7OGpM4cE53dfhffYrK7DF6QGmlvLiUl1Ag';

let db = null;
let tursoClient = null;

if (createClient && TURSO_URL && TURSO_TOKEN) {
  try {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN
    });
    console.log('[DB] ✅ Turso Client (libSQL) configurado para nuvem:', TURSO_URL);
  } catch (err) {
    console.warn('[DB] Aviso ao criar cliente Turso:', err.message);
  }
}

// Initialize or load SQLite Database with Turso Cloud Sync
async function initDB() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
    console.log('[DB] Base de dados SQLite carregada de:', DB_PATH);
    upgradeSchema();
  } else {
    db = new SQL.Database();
    console.log('[DB] Criando nova base de dados SQLite limpa...');
    createSchema();
    seedInitialData();
    saveDB();
  }

  // Se o Turso estiver ativo, verificar conectividade e sincronizar dados da nuvem
  if (tursoClient) {
    try {
      const test = await tursoClient.execute('SELECT 1 as test');
      console.log('[DB] ✅ Conexão online activa com o Turso Cloud Database!');
      // Sincronizar docentes da nuvem para o cache local
      try {
        const cloudDocs = await tursoClient.execute('SELECT * FROM tblDocentes');
        if (cloudDocs.rows && cloudDocs.rows.length > 0) {
          const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO tblDocentes (
              id, nuit, celular, nomeCompleto, sexo, codCarreira, vinculo, idEscola,
              anoLectivo, tipoEnsinoDocente, disciplinas, codCargoGestao, turmasTexto,
              turmasJSON, ehTurmaMista, turma1Tipo, turma1Classes, turma2Tipo, turma2Classes,
              horasLectivas, horasGestao, totalHoras, horasExtras, observacoes, criadoEm, atualizadoEm
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const d of cloudDocs.rows) {
            insertStmt.run([
              d.id, d.nuit, d.celular, d.nomeCompleto, d.sexo || 'M', d.codCarreira, d.vinculo, d.idEscola,
              d.anoLectivo, d.tipoEnsinoDocente, d.disciplinas, d.codCargoGestao, d.turmasTexto,
              d.turmasJSON, d.ehTurmaMista || 0, d.turma1Tipo, d.turma1Classes, d.turma2Tipo, d.turma2Classes,
              d.horasLectivas || 0, d.horasGestao || 0, d.totalHoras || 0, d.horasExtras || 0,
              d.observacoes, d.criadoEm, d.atualizadoEm
            ]);
          }
          insertStmt.free();
          saveDB();
          console.log(`[DB] ☁️ Sincronizados ${cloudDocs.rows.length} docentes do Turso Cloud para o cache local!`);
        }
      } catch (eDoc) {
        console.warn('[DB] Aviso ao sincronizar docentes da nuvem:', eDoc.message);
      }
    } catch (eTurso) {
      console.warn('[DB] Turso Cloud inacessível de momento (modo offline ativo):', eTurso.message);
    }
  }
  
  return db;
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tblZIPs (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      sedeOficial TEXT,
      sedeAbreviada TEXT
    );

    CREATE TABLE IF NOT EXISTS tblEscolas (
      id INTEGER PRIMARY KEY,
      codigoMEC INTEGER,
      nomeOficial TEXT NOT NULL,
      nomeAbreviado TEXT NOT NULL,
      tipo TEXT NOT NULL,
      idZip INTEGER REFERENCES tblZIPs(id),
      nomeDirector TEXT,
      contactoDirector TEXT,
      nomeDAP TEXT,
      contactoDAP TEXT,
      nomeChefeSecretaria TEXT,
      contactoChefeSecretaria TEXT,
      totalAlunosH INTEGER DEFAULT 0,
      totalAlunosM INTEGER DEFAULT 0,
      totalAlunos INTEGER DEFAULT 0,
      turmasClassesJSON TEXT,
      localizacao TEXT,
      fotoUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS tblCarreiras (
      cod TEXT PRIMARY KEY,
      designacao TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tblCargosGestao (
      cod TEXT PRIMARY KEY,
      designacao TEXT NOT NULL,
      horasBonificacao INTEGER NOT NULL,
      horasExcepcaoEB INTEGER
    );

    CREATE TABLE IF NOT EXISTS tblDocentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nuit TEXT,
      celular TEXT,
      nomeCompleto TEXT NOT NULL,
      sexo TEXT DEFAULT 'M',
      codCarreira TEXT,
      vinculo TEXT NOT NULL,
      idEscola INTEGER NOT NULL REFERENCES tblEscolas(id),
      anoLectivo INTEGER NOT NULL,
      tipoEnsinoDocente TEXT NOT NULL,
      disciplinas TEXT,
      codCargoGestao TEXT,
      turmasTexto TEXT,
      turmasJSON TEXT,
      ehTurmaMista INTEGER DEFAULT 0,
      turma1Tipo TEXT,
      turma1Classes TEXT,
      turma2Tipo TEXT,
      turma2Classes TEXT,
      horasLectivas REAL DEFAULT 0,
      horasGestao REAL DEFAULT 0,
      totalHoras REAL DEFAULT 0,
      horasExtras REAL DEFAULT 0,
      observacoes TEXT,
      criadoEm TEXT,
      atualizadoEm TEXT
    );

    CREATE TABLE IF NOT EXISTS tblFuncionariosNaoDocentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idEscola INTEGER NOT NULL REFERENCES tblEscolas(id),
      anoLectivo INTEGER NOT NULL,
      nomeCompleto TEXT NOT NULL,
      sexo TEXT DEFAULT 'M',
      contacto TEXT,
      nuit TEXT,
      cargoFuncao TEXT NOT NULL,
      vinculo TEXT NOT NULL DEFAULT 'Quadro',
      observacoes TEXT,
      criadoEm TEXT,
      atualizadoEm TEXT
    );

    CREATE TABLE IF NOT EXISTS tblAuditLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataHora TEXT,
      acao TEXT,
      usuario TEXT,
      detalhes TEXT
    );
  `);
  console.log('[DB] Tabelas criadas com sucesso!');
}

function upgradeSchema() {
  try {
    const colsEscola = ['nomeDirector', 'carreiraDirector', 'contactoDirector', 'nomeDAP', 'contactoDAP', 'nomeChefeSecretaria', 'contactoChefeSecretaria', 'totalAlunosH', 'totalAlunosM', 'totalAlunos', 'turmasClassesJSON', 'localizacao', 'fotoUrl'];
    for (const c of colsEscola) {
      try { db.run(`ALTER TABLE tblEscolas ADD COLUMN ${c} TEXT;`); } catch (e) {}
    }

    const colsTransf = ['turmasAnteriores', 'disciplinaAnterior', 'substitutoNome', 'notaSubstituicao', 'origemReportadaPor', 'confirmadoEm', 'notaConfirmacao'];
    for (const c of colsTransf) {
      try { db.run(`ALTER TABLE tblTransferenciasFAE ADD COLUMN ${c} TEXT;`); } catch (e) {}
    }

    const colsDocente = [
      'celular', 'ehTurmaMista', 'turma1Tipo', 'turma1Classes', 'turma2Tipo', 'turma2Classes',
      'regimeEB', 'temposObrigatorios', 'turmasObrigatoriasJSON', 'turmasExtrasJSON', 'ehAEA', 'anoAEA'
    ];
    for (const c of colsDocente) {
      try { db.run(`ALTER TABLE tblDocentes ADD COLUMN ${c} TEXT;`); } catch (e) {}
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS tblFuncionariosNaoDocentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idEscola INTEGER NOT NULL REFERENCES tblEscolas(id),
        anoLectivo INTEGER NOT NULL,
        nomeCompleto TEXT NOT NULL,
        sexo TEXT DEFAULT 'M',
        contacto TEXT,
        nuit TEXT,
        cargoFuncao TEXT NOT NULL,
        vinculo TEXT NOT NULL DEFAULT 'Quadro',
        observacoes TEXT,
        criadoEm TEXT,
        atualizadoEm TEXT
      );

      CREATE TABLE IF NOT EXISTS tblConfiguracoesSistema (
        chave TEXT PRIMARY KEY,
        valor TEXT,
        descricao TEXT,
        atualizadoEm TEXT
      );

      CREATE TABLE IF NOT EXISTS tblMatrizCurricular (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        disciplina TEXT UNIQUE NOT NULL,
        c7 INT DEFAULT 0,
        c8 INT DEFAULT 0,
        c9 INT DEFAULT 0,
        c10 INT DEFAULT 0,
        c11L INT DEFAULT 0,
        c11C INT DEFAULT 0,
        c12L INT DEFAULT 0,
        c12C INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS tblTransferenciasFAE (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipoFAE TEXT NOT NULL,
        idRegistroFAE INTEGER,
        nomeFAE TEXT NOT NULL,
        nuit TEXT,
        idEscolaOrigem INTEGER,
        idEscolaDestino INTEGER,
        anoLectivo INTEGER NOT NULL,
        dataTransferencia TEXT,
        despacho TEXT,
        estado TEXT DEFAULT 'CONCLUIDA',
        criadoEm TEXT
      );

      CREATE TABLE IF NOT EXISTS tblNotificacoesEscola (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idEscola INTEGER NOT NULL,
        anoLectivo INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        lida INTEGER DEFAULT 0,
        linkAcao TEXT,
        criadoEm TEXT
      );
    `);

    // Inicializar Configurações Padrão de Segurança e Prazos do SDEJT
    const defaultConfigs = [
      ['senha_admin_sdejt', 'SDEJT012345', 'Senha de acesso do Administrador do SDEJT'],
      ['senha_mestre', 'Nzualoc2911@$', 'Chave Mestre de Segurança para troca de senhas'],
      ['periodo_cadastro_estado', 'ABERTO', 'Estado atual do período de registo (ABERTO, PRORROGADO, ENCERRADO)'],
      ['periodo_cadastro_inicio', '2026-01-05', 'Data de início oficial para registo de carga horária'],
      ['periodo_cadastro_fim', '2026-03-31', 'Data limite oficial para submissão pelas escolas'],
      ['titulos_personalizados_json', '{}', 'Títulos de colunas e abas editados pelo gestor'],
      ['estrutura_sdejt_json', JSON.stringify({
        directorDistrital: { cargo: 'Director dos Serviços Distritais de Educação, Juventude e Tecnologia', nome: 'Director Distrital de Educação', contacto: '840000000' },
        chefeRRH: { cargo: 'Chefe da Repartição de Recursos Humanos (RRH)', nome: 'Chefe da Repartição RRH', contacto: '840000001' },
        chefeREG: { cargo: 'Chefe da Repartição de Educação Geral (REG)', nome: 'Chefe da Repartição REG', contacto: '840000002' },
        chefeRAP: { cargo: 'Chefe da Repartição de Administração e Planeamento (RAP)', nome: 'Chefe da Repartição RAP', contacto: '840000003' },
        chefeRETP: { cargo: 'Chefe da Repartição de Educação Técnico-Profissional (RETP)', nome: 'Chefe da Repartição RETP', contacto: '840000004' }
      }), 'Estrutura oficial de Chefias do SDEJT']
    ];

    const now = new Date().toISOString();
    for (const [k, v, desc] of defaultConfigs) {
      try {
        db.run(`INSERT OR IGNORE INTO tblConfiguracoesSistema (chave, valor, descricao, atualizadoEm) VALUES (?, ?, ?, ?)`, [k, v, desc, now]);
      } catch (e) {}
    }

    // Inicializar Matriz Curricular (com IPP e tempos oficiais)
    const matrizPadrao = [
      ['Português', 5, 5, 5, 5, 5, 3, 5, 3],
      ['Matemática', 5, 5, 5, 5, 3, 5, 3, 5],
      ['Inglês', 5, 3, 3, 3, 3, 2, 3, 2],
      ['Francês', 0, 2, 2, 2, 4, 0, 4, 0],
      ['História', 2, 2, 2, 2, 4, 2, 4, 2],
      ['Geografia', 2, 2, 2, 2, 4, 2, 4, 2],
      ['Filosofia', 0, 0, 0, 0, 3, 2, 3, 2],
      ['Biologia', 2, 2, 2, 2, 2, 4, 2, 4],
      ['Física', 0, 2, 2, 2, 0, 4, 0, 4],
      ['Química', 0, 2, 2, 2, 0, 4, 0, 4],
      ['Ed. Visual', 2, 2, 2, 2, 2, 3, 2, 3],
      ['Ed. Física', 2, 2, 2, 2, 2, 2, 2, 2],
      ['TIC / Informática', 2, 2, 2, 2, 2, 2, 2, 2],
      ['Agropecuária', 2, 2, 2, 2, 0, 0, 0, 0],
      ['Empreendedorismo', 2, 2, 2, 2, 0, 0, 0, 0],
      ['IPP (Introdução à Psicopedagogia)', 0, 0, 0, 0, 3, 2, 3, 2]
    ];

    for (const [disc, c7, c8, c9, c10, c11L, c11C, c12L, c12C] of matrizPadrao) {
      try {
        db.run(`INSERT OR IGNORE INTO tblMatrizCurricular (disciplina, c7, c8, c9, c10, c11L, c11C, c12L, c12C) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [disc, c7, c8, c9, c10, c11L, c11C, c12L, c12C]);
      } catch (e) {}
    }

    saveDB();
  } catch (err) {
    console.error('[DB Upgrade] Erro ao atualizar esquema:', err.message);
  }
}

function seedInitialData() {
  if (!fs.existsSync(SEED_PATH)) return;
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

  // Seed ZIPs
  const stmtZip = db.prepare(`INSERT OR REPLACE INTO tblZIPs (id, nome, sedeOficial, sedeAbreviada) VALUES (?, ?, ?, ?)`);
  for (const z of seed.zips) {
    stmtZip.run([z.id, z.nome, z.sedeOficial, z.sedeAbreviada]);
  }
  stmtZip.free();

  // Seed Escolas
  const stmtEscola = db.prepare(`INSERT OR REPLACE INTO tblEscolas (id, codigoMEC, nomeOficial, nomeAbreviado, tipo, idZip, totalAlunosH, totalAlunosM, totalAlunos) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0)`);
  for (const e of seed.escolas) {
    stmtEscola.run([e.id, e.codigoMEC, e.nomeOficial, e.nomeAbreviado, e.tipo, e.idZip]);
  }
  stmtEscola.free();

  // Seed Cargos
  const stmtCargo = db.prepare(`INSERT OR REPLACE INTO tblCargosGestao (cod, designacao, horasBonificacao, horasExcepcaoEB) VALUES (?, ?, ?, ?)`);
  for (const c of seed.cargosGestao) {
    stmtCargo.run([c.cod, c.designacao, c.horasBonificacao, c.horasExcepcaoEB]);
  }
  stmtCargo.free();

  // Seed Carreiras
  const stmtCarreira = db.prepare(`INSERT OR REPLACE INTO tblCarreiras (cod, designacao) VALUES (?, ?)`);
  for (const k of seed.carreiras) {
    stmtCarreira.run([k.cod, k.designacao]);
  }
  stmtCarreira.free();

  console.log('[DB] 16 ZIPs e 56 Escolas Oficiais carregadas com sucesso!');
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

// Helpers for queries
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();

  // Sincronização em nuvem com o Turso Cloud se estiver conectado
  if (tursoClient) {
    tursoClient.execute({ sql, args: params }).catch(err => {
      console.warn('[Turso Sync Warning] Falha ao sincronizar na nuvem:', err.message);
    });
  }
}

module.exports = {
  initDB,
  saveDB,
  queryAll,
  queryOne,
  run,
  getTursoClient: () => tursoClient,
  getDB: () => db
};
