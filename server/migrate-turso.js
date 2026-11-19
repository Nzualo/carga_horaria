require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://carga-horaria-nzualo.aws-eu-central-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTUxMDgxMzEsImlkIjoiMDFhMWVhM2EtMWEwMS03ZjYxLTk3NmEtM2Q5MDZkNTEzOGZhIiwia2lkIjoiTk1tSWVvU0V1Y3JhSmdMc0dsNFIxTW90Um4yMnJ0U1RCeEpCNzh6cUhzTSIsInJpZCI6ImFlNzNjMTQwLWI2MzUtNDU2Ny04YmYyLWQxMWVhMGU4YjMzOSJ9.lxR8Nk4k4mu0cU1i-pqJ4_ipUMzf2ELiS1kFBTKdTDaCPQkcdRt_7OGpM4cE53dfhffYrK7DF6QGmlvLiUl1Ag';

console.log('[Turso] Conectando a:', TURSO_URL);

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

async function runMigration() {
  try {
    // 1. Teste de Conexão
    const test = await client.execute('SELECT 1 as teste');
    console.log('[Turso] ✅ Conexão estabelecida com sucesso:', test.rows);

    // 2. Criar Tabelas
    console.log('[Turso] Criando tabelas do esquema oficial...');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblZIPs (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        sedeOficial TEXT,
        sedeAbreviada TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblEscolas (
        id INTEGER PRIMARY KEY,
        codigoMEC INTEGER,
        nomeOficial TEXT NOT NULL,
        nomeAbreviado TEXT NOT NULL,
        tipo TEXT NOT NULL,
        idZip INTEGER,
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
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblCarreiras (
        cod TEXT PRIMARY KEY,
        designacao TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblCargosGestao (
        cod TEXT PRIMARY KEY,
        designacao TEXT NOT NULL,
        horasBonificacao INTEGER NOT NULL,
        horasExcepcaoEB INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblDocentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nuit TEXT,
        celular TEXT,
        nomeCompleto TEXT NOT NULL,
        sexo TEXT DEFAULT 'M',
        codCarreira TEXT,
        vinculo TEXT NOT NULL,
        idEscola INTEGER NOT NULL,
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
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblFuncionariosNaoDocentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idEscola INTEGER NOT NULL,
        anoLectivo INTEGER NOT NULL,
        nomeCompleto TEXT NOT NULL,
        celular TEXT,
        nuit TEXT,
        sexo TEXT DEFAULT 'M',
        carreiraFuncao TEXT NOT NULL,
        vinculo TEXT DEFAULT 'Quadro',
        observacoes TEXT,
        criadoEm TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblNotificacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idEscolaDestino INTEGER,
        anoLectivo INTEGER,
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        lida INTEGER DEFAULT 0,
        linkAcao TEXT,
        criadoEm TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblConfiguracoesSistema (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        descricao TEXT,
        atualizadoEm TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS tblMatrizCurricular (
        disciplina TEXT PRIMARY KEY,
        c7 INTEGER DEFAULT 0,
        c8 INTEGER DEFAULT 0,
        c9 INTEGER DEFAULT 0,
        c10 INTEGER DEFAULT 0,
        c11L INTEGER DEFAULT 0,
        c11C INTEGER DEFAULT 0,
        c12L INTEGER DEFAULT 0,
        c12C INTEGER DEFAULT 0
      );
    `);

    console.log('[Turso] ✅ Tabelas criadas com sucesso!');

    // 3. Povoar Dados Iniciais se vazios
    const countZips = await client.execute('SELECT COUNT(*) as total FROM tblZIPs');
    if (Number(countZips.rows[0].total) === 0) {
      console.log('[Turso] Povoando 16 ZIPs e 56 Escolas a partir de seed.json...');
      const seedPath = path.join(__dirname, 'data', 'seed.json');
      if (fs.existsSync(seedPath)) {
        const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

        for (const z of seed.zips) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO tblZIPs (id, nome, sedeOficial, sedeAbreviada) VALUES (?, ?, ?, ?)',
            args: [z.id, z.nome, z.sedeOficial, z.sedeAbreviada]
          });
        }

        for (const e of seed.escolas) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO tblEscolas (id, codigoMEC, nomeOficial, nomeAbreviado, tipo, idZip, totalAlunosH, totalAlunosM, totalAlunos) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0)',
            args: [e.id, e.codigoMEC, e.nomeOficial, e.nomeAbreviado, e.tipo, e.idZip]
          });
        }

        for (const c of seed.cargosGestao) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO tblCargosGestao (cod, designacao, horasBonificacao, horasExcepcaoEB) VALUES (?, ?, ?, ?)',
            args: [c.cod, c.designacao, c.horasBonificacao, c.horasExcepcaoEB]
          });
        }

        for (const k of seed.carreiras) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO tblCarreiras (cod, designacao) VALUES (?, ?)',
            args: [k.cod, k.designacao]
          });
        }
        console.log('[Turso] ✅ 16 ZIPs e 56 Escolas inseridos no Turso!');
      }
    } else {
      console.log(`[Turso] ℹ️ tblZIPs já possui ${countZips.rows[0].total} registos.`);
    }

    // 4. Configurações Padrão de Segurança e Prazos do SDEJT
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
      await client.execute({
        sql: 'INSERT OR IGNORE INTO tblConfiguracoesSistema (chave, valor, descricao, atualizadoEm) VALUES (?, ?, ?, ?)',
        args: [k, v, desc, now]
      });
    }

    // 5. Matriz Curricular
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
      await client.execute({
        sql: 'INSERT OR IGNORE INTO tblMatrizCurricular (disciplina, c7, c8, c9, c10, c11L, c11C, c12L, c12C) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [disc, c7, c8, c9, c10, c11L, c11C, c12L, c12C]
      });
    }

    console.log('[Turso] ✅ Matriz curricular e configurações garantidas!');

    // 6. Migrar docentes já cadastrados na base SQLite local se existirem
    const dbPath = path.join(__dirname, 'data', 'sdejt_inhassoro.db');
    if (fs.existsSync(dbPath)) {
      try {
        const initSqlJs = require('sql.js');
        const SQL = await initSqlJs();
        const filebuffer = fs.readFileSync(dbPath);
        const localDb = new SQL.Database(filebuffer);

        const stmt = localDb.prepare('SELECT * FROM tblDocentes');
        let migrados = 0;
        while (stmt.step()) {
          const d = stmt.getAsObject();
          // Inserir no Turso se ainda não existir
          const checkDoc = await client.execute({
            sql: 'SELECT id FROM tblDocentes WHERE id = ?',
            args: [d.id]
          });
          if (checkDoc.rows.length === 0) {
            await client.execute({
              sql: `INSERT INTO tblDocentes (
                id, nuit, celular, nomeCompleto, sexo, codCarreira, vinculo, idEscola,
                anoLectivo, tipoEnsinoDocente, disciplinas, codCargoGestao, turmasTexto,
                turmasJSON, ehTurmaMista, turma1Tipo, turma1Classes, turma2Tipo, turma2Classes,
                horasLectivas, horasGestao, totalHoras, horasExtras, observacoes, criadoEm, atualizadoEm
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                d.id, d.nuit, d.celular, d.nomeCompleto, d.sexo || 'M', d.codCarreira, d.vinculo, d.idEscola,
                d.anoLectivo, d.tipoEnsinoDocente, d.disciplinas, d.codCargoGestao, d.turmasTexto,
                d.turmasJSON, d.ehTurmaMista || 0, d.turma1Tipo, d.turma1Classes, d.turma2Tipo, d.turma2Classes,
                d.horasLectivas || 0, d.horasGestao || 0, d.totalHoras || 0, d.horasExtras || 0,
                d.observacoes, d.criadoEm, d.atualizadoEm
              ]
            });
            migrados++;
          }
        }
        stmt.free();
        console.log(`[Turso] ✅ Migrados ${migrados} docentes locais para o Turso!`);
      } catch (errLocal) {
        console.log('[Turso] Aviso ao ler dados locais:', errLocal.message);
      }
    }

    console.log('[Turso] 🏁 MIGRACAO CONCLUIDA COM SUCESSO NO TURSO CLOUD!');
  } catch (err) {
    console.error('[Turso] ❌ Erro durante a migração:', err);
    process.exit(1);
  }
}

runMigration();
