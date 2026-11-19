process.on('uncaughtException', (err) => console.error('[SERVER ERROR]', err));
process.on('unhandledRejection', (err) => console.error('[PROMISE ERROR]', err));

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDB, queryAll, queryOne, run, saveDB } = require('./db');
const { calcularCargaDocente } = require('./calculation');
const { corrigirAcentuacaoPT } = require('./accentFix');
const { gerarDocumentoWordOficial, gerarFichaIndividualDocenteWord, gerarMapaTransferenciasWord } = require('./exportWord');
const { gerarPlanilhaExcelOficial, gerarMapaTransferenciasExcel } = require('./exportExcel');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir frontend compilado se existir
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ---------------------- ROTAS DA API ---------------------- //

// 1. Status do Servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'SDEJT Inhassoro - Sistema de Gestão Curricular e Carga Horária',
    versao: '2.0.0-PRO',
    anoLectivoPadrao: 2026
  });
});

// 2. Listar ZIPs (16 Zonas)
app.get('/api/zips', (req, res) => {
  try {
    const zips = queryAll('SELECT * FROM tblZIPs ORDER BY id ASC');
    res.json(zips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Listar Escolas (56 Escolas)
app.get('/api/escolas', (req, res) => {
  try {
    const { tipo, zip } = req.query;
    let sql = `
      SELECT e.*, z.nome as nomeZIP, z.sedeAbreviada as sedeZIP
      FROM tblEscolas e
      LEFT JOIN tblZIPs z ON e.idZip = z.id
      WHERE 1=1
    `;
    const params = [];
    if (tipo && tipo !== 'TODOS') {
      sql += ` AND e.tipo LIKE ?`;
      params.push(`%${tipo}%`);
    }
    if (zip) {
      sql += ` AND e.idZip = ?`;
      params.push(Number(zip));
    }
    sql += ` ORDER BY e.id ASC`;
    const escolas = queryAll(sql, params);
    res.json(escolas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Detalhe de uma Escola
app.get('/api/escolas/:id', (req, res) => {
  try {
    const id = req.params.id;
    if (id === 'sdejt') {
      const cfgEstrutura = queryOne("SELECT valor FROM tblConfiguracoesSistema WHERE chave = 'estrutura_sdejt_json'");
      let estrutura = {};
      try {
        if (cfgEstrutura?.valor) estrutura = JSON.parse(cfgEstrutura.valor);
      } catch (e) {}

      return res.json({
        id: 'sdejt',
        nomeOficial: 'Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro',
        nomeAbreviado: 'SDEJT Inhassoro (Sede Distrital)',
        codigoMEC: 'SEDE-01',
        tipo: 'SDEJT',
        nomeZIP: 'Sede Distrital',
        ehSedeZip: false,
        estruturaSDEJT: estrutura
      });
    }
    const escola = queryOne(`
      SELECT e.*, z.nome as nomeZIP, z.sedeAbreviada as sedeZIP, z.escolaSedeOficial as zipSedeOficial
      FROM tblEscolas e
      LEFT JOIN tblZIPs z ON e.idZip = z.id
      WHERE e.id = ?
    `, [Number(id)]);
    if (!escola) return res.status(404).json({ error: 'Escola não encontrada' });

    // Verificar se é sede de ZIP
    const ehSedeZip = escola.zipSedeOficial && escola.nomeOficial.trim().toLowerCase() === escola.zipSedeOficial.trim().toLowerCase();
    
    // Contagem de Não Docentes e Docentes Únicos (em escolas EB, professores no EP e ES são contados apenas 1 vez)
    const countND = queryOne('SELECT COUNT(*) as count FROM tblFuncionariosNaoDocentes WHERE idEscola = ?', [Number(id)])?.count || 0;
    const countDoc = queryOne(`
      SELECT COUNT(DISTINCT CASE 
        WHEN nuit IS NOT NULL AND TRIM(nuit) != '' THEN nuit 
        ELSE LOWER(TRIM(nomeCompleto)) 
      END) as count 
      FROM tblDocentes WHERE idEscola = ?
    `, [Number(id)])?.count || 0;

    res.json({
      ...escola,
      ehSedeZip: !!ehSedeZip,
      totalNaoDocentes: countND,
      totalDocentesCadastrados: countDoc,
      totalPessoalGeral: countDoc + countND
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.1 Atualizar Dados Gerais da Escola
app.put('/api/escolas/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      nomeDirector = '',
      carreiraDirector = '',
      contactoDirector = '',
      nomeDAP = '',
      contactoDAP = '',
      nomeChefeSecretaria = '',
      contactoChefeSecretaria = '',
      totalAlunosH = 0,
      totalAlunosM = 0,
      totalAlunos = 0,
      turmasClassesJSON = '',
      localizacao = '',
      fotoUrl = ''
    } = req.body;

    run(`
      UPDATE tblEscolas SET
        nomeDirector = ?, carreiraDirector = ?, contactoDirector = ?,
        nomeDAP = ?, contactoDAP = ?,
        nomeChefeSecretaria = ?, contactoChefeSecretaria = ?,
        totalAlunosH = ?, totalAlunosM = ?, totalAlunos = ?,
        turmasClassesJSON = ?, localizacao = ?, fotoUrl = ?
      WHERE id = ?
    `, [
      corrigirAcentuacaoPT(nomeDirector), carreiraDirector, contactoDirector, corrigirAcentuacaoPT(nomeDAP), contactoDAP,
      corrigirAcentuacaoPT(nomeChefeSecretaria), contactoChefeSecretaria,
      Number(totalAlunosH), Number(totalAlunosM), Number(totalAlunos),
      typeof turmasClassesJSON === 'object' ? JSON.stringify(turmasClassesJSON) : turmasClassesJSON,
      localizacao, fotoUrl, id
    ]);

    res.json({ success: true, message: 'Dados da escola atualizados com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- ROTAS DE FUNCIONÁRIOS NÃO DOCENTES ---------------------- //
app.get('/api/funcionarios', (req, res) => {
  try {
    const { idEscola, ano = 2026 } = req.query;
    let sql = `
      SELECT f.*, e.nomeOficial as nomeEscola, e.nomeAbreviado as abrevEscola
      FROM tblFuncionariosNaoDocentes f
      LEFT JOIN tblEscolas e ON f.idEscola = e.id
      WHERE f.anoLectivo = ?
    `;
    const params = [Number(ano)];
    if (idEscola && idEscola !== 'sdejt' && idEscola !== 'all') {
      sql += ' AND f.idEscola = ?';
      params.push(Number(idEscola));
    }
    sql += ' ORDER BY f.nomeCompleto ASC';
    const list = queryAll(sql, params);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/funcionarios', (req, res) => {
  try {
    const {
      id,
      idEscola,
      anoLectivo = 2026,
      nomeCompleto,
      sexo = 'M',
      contacto = '',
      nuit = '',
      cargoFuncao,
      vinculo = 'Quadro',
      observacoes = ''
    } = req.body;

    const nomeFuncCorrigido = corrigirAcentuacaoPT(nomeCompleto);
    const cargoFuncCorrigido = corrigirAcentuacaoPT(cargoFuncao);
    const obsFuncCorrigida = corrigirAcentuacaoPT(observacoes);
    if (!nomeFuncCorrigido || !idEscola || !cargoFuncCorrigido) {
      return res.status(400).json({ error: 'Nome, Escola e Função são obrigatórios!' });
    }

    const now = new Date().toISOString();
    if (id) {
      run(`
        UPDATE tblFuncionariosNaoDocentes SET
          nomeCompleto = ?, sexo = ?, contacto = ?, nuit = ?,
          cargoFuncao = ?, vinculo = ?, observacoes = ?, atualizadoEm = ?
        WHERE id = ?
      `, [nomeCompleto, sexo, contacto, nuit, cargoFuncao, vinculo, observacoes, now, Number(id)]);
      res.json({ success: true, message: 'Funcionário atualizado com sucesso!' });
    } else {
      run(`
        INSERT INTO tblFuncionariosNaoDocentes (
          idEscola, anoLectivo, nomeCompleto, sexo, contacto, nuit, cargoFuncao, vinculo, observacoes, criadoEm, atualizadoEm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [Number(idEscola), Number(anoLectivo), nomeCompleto, sexo, contacto, nuit, cargoFuncao, vinculo, observacoes, now, now]);
      res.json({ success: true, message: 'Funcionário registado com sucesso!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/funcionarios/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    run('DELETE FROM tblFuncionariosNaoDocentes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Funcionário removido com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Listar Docentes (Filtrado por Escola ou Global para o SDEJT)
app.get('/api/docentes', (req, res) => {
  try {
    const { idEscola, ano = 2026, search } = req.query;
    let sql = `
      SELECT d.*, e.nomeOficial as nomeEscola, e.nomeAbreviado as abrevEscola, e.tipo as tipoEscola
      FROM tblDocentes d
      JOIN tblEscolas e ON d.idEscola = e.id
      WHERE d.anoLectivo = ?
    `;
    const params = [Number(ano)];

    if (idEscola && idEscola !== 'sdejt' && idEscola !== 'all') {
      sql += ` AND d.idEscola = ?`;
      params.push(Number(idEscola));
    }

    if (search) {
      sql += ` AND (d.nomeCompleto LIKE ? OR d.nuit LIKE ? OR d.disciplinas LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY d.nomeCompleto ASC`;
    const docentes = queryAll(sql, params);
    res.json(docentes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Cadastrar ou Atualizar Docente (com cálculo automático)
app.post('/api/docentes', (req, res) => {
  try {
    const {
      id,
      nuit = '',
      celular = '',
      nomeCompleto,
      sexo = 'M',
      codCarreira = 'DN1',
      vinculo = 'Quadro',
      idEscola,
      anoLectivo = 2026,
      tipoEnsinoDocente = 'ES',
      disciplinas = '',
      codCargoGestao = '',
      turmasTexto = '',
      turmas = [],
      ehTurmaMista = 0,
      turma1Tipo = 'REGULAR',
      turma1Classes = '',
      turma2Tipo = '',
      turma2Classes = '',
      horasLectivasManual,
      regimeEB = 'REGULAR',
      temposObrigatorios = 20,
      turmasObrigatorias = [],
      turmasExtras = [],
      ehAEA = 0,
      anoAEA = '',
      observacoes = ''
    } = req.body;

    const nomeCorrigido = corrigirAcentuacaoPT(nomeCompleto);
    const obsCorrigida = corrigirAcentuacaoPT(observacoes);
    if (!nomeCorrigido || !idEscola) {
      return res.status(400).json({ error: 'Nome do docente e Escola são obrigatórios!' });
    }

    // Executa o motor de cálculo oficial com regras especiais do EB e AEA
    const calculo = calcularCargaDocente({
      tipoEnsino: tipoEnsinoDocente,
      turmas: turmas,
      codCargo: codCargoGestao,
      horasLectivasManual: Number(horasLectivasManual),
      regimeEB,
      temposObrigatorios: Number(temposObrigatorios)
    });

    const now = new Date().toISOString();
    const turmasJSON = JSON.stringify(turmas || []);
    const turmasObrigatoriasJSON = JSON.stringify(turmasObrigatorias || []);
    const turmasExtrasJSON = JSON.stringify(turmasExtras || []);

    if (id) {
      // Atualizar existente
      run(`
        UPDATE tblDocentes SET
          nuit = ?, celular = ?, nomeCompleto = ?, sexo = ?, codCarreira = ?, vinculo = ?,
          idEscola = ?, anoLectivo = ?, tipoEnsinoDocente = ?, disciplinas = ?,
          codCargoGestao = ?, turmasTexto = ?, turmasJSON = ?, ehTurmaMista = ?,
          turma1Tipo = ?, turma1Classes = ?, turma2Tipo = ?, turma2Classes = ?,
          regimeEB = ?, temposObrigatorios = ?, turmasObrigatoriasJSON = ?, turmasExtrasJSON = ?,
          ehAEA = ?, anoAEA = ?,
          horasLectivas = ?, horasGestao = ?, totalHoras = ?, horasExtras = ?,
          observacoes = ?, atualizadoEm = ?
        WHERE id = ?
      `, [
        nuit, celular, nomeCorrigido, sexo, codCarreira, vinculo,
        Number(idEscola), Number(anoLectivo), tipoEnsinoDocente, disciplinas,
        codCargoGestao, turmasTexto, turmasJSON, Number(ehTurmaMista),
        turma1Tipo, turma1Classes, turma2Tipo, turma2Classes,
        regimeEB, Number(temposObrigatorios), turmasObrigatoriasJSON, turmasExtrasJSON,
        Number(ehAEA), anoAEA,
        calculo.horasLectivas, calculo.horasGestao, calculo.totalHoras, calculo.horasExtras,
        obsCorrigida, now, Number(id)
      ]);
      res.json({ success: true, id, calculo, message: 'Docente atualizado com sucesso!' });
    } else {
      // Inserir novo
      run(`
        INSERT INTO tblDocentes (
          nuit, celular, nomeCompleto, sexo, codCarreira, vinculo, idEscola, anoLectivo,
          tipoEnsinoDocente, disciplinas, codCargoGestao, turmasTexto, turmasJSON,
          ehTurmaMista, turma1Tipo, turma1Classes, turma2Tipo, turma2Classes,
          regimeEB, temposObrigatorios, turmasObrigatoriasJSON, turmasExtrasJSON,
          ehAEA, anoAEA,
          horasLectivas, horasGestao, totalHoras, horasExtras, observacoes, criadoEm, atualizadoEm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        nuit, celular, nomeCorrigido, sexo, codCarreira, vinculo, Number(idEscola), Number(anoLectivo),
        tipoEnsinoDocente, disciplinas, codCargoGestao, turmasTexto, turmasJSON,
        Number(ehTurmaMista), turma1Tipo, turma1Classes, turma2Tipo, turma2Classes,
        regimeEB, Number(temposObrigatorios), turmasObrigatoriasJSON, turmasExtrasJSON,
        Number(ehAEA), anoAEA,
        calculo.horasLectivas, calculo.horasGestao, calculo.totalHoras, calculo.horasExtras,
        obsCorrigida, now, now
      ]);
      res.json({ success: true, calculo, message: 'Docente registado com sucesso!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Excluir Docente
app.delete('/api/docentes/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    run('DELETE FROM tblDocentes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Docente removido com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Resumo e Painel Distrital Consolidado (16 ZIPs e Balanço Geral)
app.get('/api/distrito/resumo', (req, res) => {
  try {
    const ano = Number(req.query.ano || 2026);

    const totalEscolas = queryOne('SELECT COUNT(*) as count FROM tblEscolas')?.count || 56;
    const statsDocentes = queryOne(`
      SELECT 
        COUNT(DISTINCT CASE WHEN nuit IS NOT NULL AND TRIM(nuit) != '' THEN idEscola || '-' || TRIM(nuit) ELSE idEscola || '-' || LOWER(TRIM(nomeCompleto)) END) as totalDocentes,
        SUM(horasLectivas) as somaHL,
        SUM(horasGestao) as somaHG,
        SUM(totalHoras) as somaTotalHoras,
        SUM(horasExtras) as somaHE
      FROM tblDocentes
      WHERE anoLectivo = ?
    `, [ano]);

    // Resumo por ZIP
    const zips = queryAll('SELECT * FROM tblZIPs ORDER BY id ASC');
    const resumoZIPs = zips.map(z => {
      const statsZip = queryOne(`
        SELECT 
          COUNT(DISTINCT e.id) as totalEscolasZip,
          COUNT(DISTINCT CASE WHEN d.nuit IS NOT NULL AND TRIM(d.nuit) != '' THEN d.idEscola || '-' || TRIM(d.nuit) ELSE d.idEscola || '-' || LOWER(TRIM(d.nomeCompleto)) END) as totalDocentesZip,
          COALESCE(SUM(d.totalHoras), 0) as totalHorasZip,
          COALESCE(SUM(d.horasExtras), 0) as totalHEZip
        FROM tblEscolas e
        LEFT JOIN tblDocentes d ON d.idEscola = e.id AND d.anoLectivo = ?
        WHERE e.idZip = ?
      `, [ano, z.id]);

      return {
        idZip: z.id,
        nomeZIP: z.nome,
        sedeAbreviada: z.sedeAbreviada,
        escolas: statsZip?.totalEscolasZip || 0,
        docentes: statsZip?.totalDocentesZip || 0,
        horas: statsZip?.totalHorasZip || 0,
        horasExtras: statsZip?.totalHEZip || 0
      };
    });

    res.json({
      ano,
      totalEscolas,
      totalDocentes: statsDocentes?.totalDocentes || 0,
      totalHL: statsDocentes?.somaHL || 0,
      totalHG: statsDocentes?.somaHG || 0,
      totalHoras: statsDocentes?.somaTotalHoras || 0,
      totalHE: statsDocentes?.somaHE || 0,
      resumoZIPs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


function resolverDiretorEFiltrarMapa(escola, todosDocentes, mapa) {
  const esc = { ...escola };
  const dirDoc = (todosDocentes || []).find(d => {
    const cg = String(d.codCargoGestao || '').toUpperCase();
    return cg.includes('DIR') || cg.includes('DIRECTOR');
  });
  if (!esc.nomeDirector && dirDoc) esc.nomeDirector = dirDoc.nomeCompleto;
  if (!esc.carreiraDirector && dirDoc) esc.carreiraDirector = dirDoc.codCarreira;
  if (esc.nomeDirector) esc.nomeDirector = corrigirAcentuacaoPT(esc.nomeDirector);

  const m = String(mapa || '1.3');
  let filtrados = todosDocentes || [];
  if (m === '1.1' || m === '2.1') {
    filtrados = filtrados.filter(d => d.tipoEnsinoDocente === 'EP');
  } else if (m === '1.3' || m === '2.3') {
    // No Mapa 1.3 / 2.3 entram APENAS docentes do Secundário (incluindo docentes do EP registados no ES em regime de HE)
    // Nunca entram linhas de monodocência do EP!
    filtrados = filtrados.filter(d => d.tipoEnsinoDocente === 'ES');
  }
  return { escolaResolvida: esc, docentesFiltrados: filtrados };
}

// 9. Exportar para Word (.docx)
app.get('/api/exportar/word', async (req, res) => {
  try {
    const { idEscola, ano = 2026, mapa = '1.3' } = req.query;
    let escola = null;
    let docentes = [];

    if (!idEscola || idEscola === 'sdejt') {
      escola = {
        nomeOficial: 'Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro',
        codigoMEC: 'SDEJT-SEDE',
        tipo: 'Distrital',
        nomeZIP: 'Sede Distrital'
      };
      docentes = queryAll('SELECT * FROM tblDocentes WHERE anoLectivo = ?', [Number(ano)]);
    } else {
      escola = queryOne('SELECT e.*, z.nome as nomeZIP FROM tblEscolas e LEFT JOIN tblZIPs z ON e.idZip = z.id WHERE e.id = ?', [Number(idEscola)]);
      docentes = queryAll('SELECT * FROM tblDocentes WHERE idEscola = ? AND anoLectivo = ?', [Number(idEscola), Number(ano)]);
    }
    const matrizCurricular = queryAll('SELECT * FROM tblMatrizCurricular ORDER BY disciplina ASC');

    const { escolaResolvida, docentesFiltrados } = resolverDiretorEFiltrarMapa(escola, docentes, mapa);
    const buffer = await gerarDocumentoWordOficial({
      escola: escolaResolvida,
      anoLectivo: Number(ano),
      docentes: docentesFiltrados,
      tipoMapa: mapa,
      matrizCurricular
    });

    const filename = `Mapa_${mapa}_${(escola.nomeAbreviado || 'SDEJT').replace(/\s+/g, '_')}_${ano}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Exportar para Excel (.xlsx)
app.get('/api/exportar/excel', async (req, res) => {
  try {
    const { idEscola, ano = 2026, mapa = '1.3' } = req.query;
    let escola = null;
    let docentes = [];

    if (!idEscola || idEscola === 'sdejt') {
      escola = {
        nomeOficial: 'Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro',
        codigoMEC: 'SDEJT-SEDE',
        tipo: 'Distrital',
        nomeZIP: 'Sede Distrital'
      };
      docentes = queryAll('SELECT * FROM tblDocentes WHERE anoLectivo = ?', [Number(ano)]);
    } else {
      escola = queryOne('SELECT e.*, z.nome as nomeZIP FROM tblEscolas e LEFT JOIN tblZIPs z ON e.idZip = z.id WHERE e.id = ?', [Number(idEscola)]);
      docentes = queryAll('SELECT * FROM tblDocentes WHERE idEscola = ? AND anoLectivo = ?', [Number(idEscola), Number(ano)]);
    }
    const matrizCurricular = queryAll('SELECT * FROM tblMatrizCurricular ORDER BY disciplina ASC');

    const { escolaResolvida, docentesFiltrados } = resolverDiretorEFiltrarMapa(escola, docentes, mapa);
    const buffer = await gerarPlanilhaExcelOficial({
      escola: escolaResolvida,
      anoLectivo: Number(ano),
      docentes: docentesFiltrados,
      tipoMapa: mapa,
      matrizCurricular
    });

    const filename = `Mapa_${mapa}_${(escola.nomeAbreviado || 'SDEJT').replace(/\s+/g, '_')}_${ano}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- ROTAS DE GESTÃO EXECUTIVA DO SDEJT ---------------------- //

// Helper para converter Matriz Curricular da BD para objeto de consulta
function getMatrizAsObject() {
  const rows = queryAll('SELECT * FROM tblMatrizCurricular');
  const mat = {};
  for (const r of rows) {
    mat[r.disciplina] = {
      '7ª': r.c7,
      '8ª': r.c8,
      '9ª': r.c9,
      '10ª': r.c10,
      '11ª Letras': r.c11L,
      '11ª Ciências': r.c11C,
      '12ª Letras': r.c12L,
      '12ª Ciências': r.c12C
    };
  }
  return mat;
}

// Helper para recalcular automaticamente as fórmulas de carga horária em lote
function recalcularCargasDistrito(ano = 2026) {
  const matriz = getMatrizAsObject();
  const docentes = queryAll('SELECT * FROM tblDocentes WHERE anoLectivo = ?', [Number(ano)]);
  let count = 0;
  for (const doc of docentes) {
    if (doc.tipoEnsinoDocente === 'EP') continue; // No EP carga base é 24h
    let turmas = [];
    try {
      if (doc.turmasJSON) turmas = JSON.parse(doc.turmasJSON);
    } catch (e) {}

    const calculo = calcularCargaDocente({
      tipoEnsino: doc.tipoEnsinoDocente,
      turmas: turmas,
      codCargo: doc.codCargoGestao,
      horasLectivasManual: doc.horasLectivas,
      regimeEB: doc.regimeEB,
      temposObrigatorios: doc.temposObrigatorios || 20,
      matrizCustom: matriz
    });

    run(`
      UPDATE tblDocentes SET
        horasLectivas = ?, horasGestao = ?, totalHoras = ?, horasExtras = ?, atualizadoEm = ?
      WHERE id = ?
    `, [calculo.horasLectivas, calculo.horasGestao, calculo.totalHoras, calculo.horasExtras, new Date().toISOString(), doc.id]);
    count++;
  }
  return count;
}

// 11. Autenticação do Administrador SDEJT
app.post('/api/auth/sdejt', (req, res) => {
  try {
    const { senha } = req.body;
    const configSenha = queryOne("SELECT valor FROM tblConfiguracoesSistema WHERE chave = 'senha_admin_sdejt'");
    const senhaCorreta = configSenha?.valor || 'SDEJT012345';
    if (senha === senhaCorreta) {
      res.json({ autenticado: true, message: 'Acesso autorizado ao painel distrital do SDEJT' });
    } else {
      res.status(401).json({ autenticado: false, error: 'Senha de Administrador incorreta!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Alteração de Senha do Administrador (com validação estrita da Senha Mestre)
app.post('/api/auth/sdejt/alterar-senha', (req, res) => {
  try {
    const { novaSenha, senhaMestre } = req.body;
    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres!' });
    }
    const configMestre = queryOne("SELECT valor FROM tblConfiguracoesSistema WHERE chave = 'senha_mestre'");
    const mestreEsperada = configMestre?.valor || 'Nzualoc2911@$';
    if (senhaMestre !== mestreEsperada) {
      return res.status(403).json({ error: 'Chave Mestre de Segurança inválida! Operação não autorizada.' });
    }
    const now = new Date().toISOString();
    run(`UPDATE tblConfiguracoesSistema SET valor = ?, atualizadoEm = ? WHERE chave = 'senha_admin_sdejt'`, [novaSenha, now]);
    res.json({ success: true, message: 'Senha do Administrador do SDEJT alterada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Configurações Globais (Período de Submissão, Prazos, Estrutura do SDEJT e Títulos)
app.get('/api/configuracoes', (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM tblConfiguracoesSistema');
    const configs = {};
    rows.forEach(r => {
      configs[r.chave] = r.valor;
    });

    let estrutura = {};
    try {
      if (configs.estrutura_sdejt_json) estrutura = JSON.parse(configs.estrutura_sdejt_json);
    } catch (e) {}

    let titulos = {};
    try {
      if (configs.titulos_personalizados_json) titulos = JSON.parse(configs.titulos_personalizados_json);
    } catch (e) {}

    res.json({
      periodo: {
        estado: configs.periodo_cadastro_estado || 'ABERTO',
        inicio: configs.periodo_cadastro_inicio || '2026-01-05',
        fim: configs.periodo_cadastro_fim || '2026-03-31'
      },
      titulos,
      estruturaSDEJT: estrutura
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/configuracoes', (req, res) => {
  try {
    const { periodo, titulos, estruturaSDEJT } = req.body;
    const now = new Date().toISOString();

    if (periodo) {
      if (periodo.estado) {
        run(`UPDATE tblConfiguracoesSistema SET valor = ?, atualizadoEm = ? WHERE chave = 'periodo_cadastro_estado'`, [periodo.estado, now]);
      }
      if (periodo.inicio) {
        run(`UPDATE tblConfiguracoesSistema SET valor = ?, atualizadoEm = ? WHERE chave = 'periodo_cadastro_inicio'`, [periodo.inicio, now]);
      }
      if (periodo.fim) {
        run(`UPDATE tblConfiguracoesSistema SET valor = ?, atualizadoEm = ? WHERE chave = 'periodo_cadastro_fim'`, [periodo.fim, now]);
      }
    }

    if (titulos) {
      run(`UPDATE tblConfiguracoesSistema SET valor = ?, atualizadoEm = ? WHERE chave = 'titulos_personalizados_json'`, [JSON.stringify(titulos), now]);
    }

    if (estruturaSDEJT) {
      run(`UPDATE tblConfiguracoesSistema SET valor = ?, atualizadoEm = ? WHERE chave = 'estrutura_sdejt_json'`, [JSON.stringify(estruturaSDEJT), now]);
    }

    res.json({ success: true, message: 'Configurações do sistema salvas com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Matriz Curricular (Obter e Atualizar com Recálculo Dinâmico Automático)
app.get('/api/matriz-curricular', (req, res) => {
  try {
    const matriz = queryAll('SELECT * FROM tblMatrizCurricular ORDER BY disciplina ASC');
    res.json(matriz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/matriz-curricular', (req, res) => {
  try {
    const { disciplinas, ano = 2026 } = req.body;
    if (!Array.isArray(disciplinas)) {
      return res.status(400).json({ error: 'Lista de disciplinas inválida' });
    }

    for (const d of disciplinas) {
      run(`
        UPDATE tblMatrizCurricular SET
          c7 = ?, c8 = ?, c9 = ?, c10 = ?, c11L = ?, c11C = ?, c12L = ?, c12C = ?
        WHERE disciplina = ?
      `, [Number(d.c7 || 0), Number(d.c8 || 0), Number(d.c9 || 0), Number(d.c10 || 0),
          Number(d.c11L || 0), Number(d.c11C || 0), Number(d.c12L || 0), Number(d.c12C || 0),
          d.disciplina]);
    }

    // Recalcular automaticamente as fórmulas de carga horária para todos os professores
    const totalRecalculados = recalcularCargasDistrito(ano);

    res.json({
      success: true,
      totalRecalculados,
      message: `Matriz curricular salva! Cargas horárias de ${totalRecalculados} docentes foram recalculadas automaticamente.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Transição Inteligente de Ano Lectivo (Roll-over de Docentes e FAEs com carga zerada)
app.post('/api/ano-lectivo/transicao', (req, res) => {
  try {
    const { anoOrigem = 2026, anoDestino = 2027 } = req.body;
    if (Number(anoOrigem) === Number(anoDestino)) {
      return res.status(400).json({ error: 'O ano de destino deve ser diferente do ano de origem!' });
    }

    // 1. Docentes
    const docentesOrigem = queryAll('SELECT * FROM tblDocentes WHERE anoLectivo = ?', [Number(anoOrigem)]);
    let countDoc = 0;
    const now = new Date().toISOString();

    for (const d of docentesOrigem) {
      const jaExiste = queryOne(`
        SELECT id FROM tblDocentes
        WHERE anoLectivo = ? AND idEscola = ? AND (
          (nuit IS NOT NULL AND nuit != '' AND nuit = ?) OR
          LOWER(TRIM(nomeCompleto)) = LOWER(TRIM(?))
        )
      `, [Number(anoDestino), d.idEscola, d.nuit || '', d.nomeCompleto]);

      if (!jaExiste) {
        run(`
          INSERT INTO tblDocentes (
            nuit, celular, nomeCorrigido, sexo, codCarreira, vinculo, idEscola, anoLectivo,
            tipoEnsinoDocente, disciplinas, codCargoGestao, turmasTexto, turmasJSON,
            ehTurmaMista, turma1Tipo, turma1Classes, turma2Tipo, turma2Classes,
            regimeEB, temposObrigatorios, turmasObrigatoriasJSON, turmasExtrasJSON,
            ehAEA, anoAEA, horasLectivas, horasGestao, totalHoras, horasExtras,
            observacoes, criadoEm, atualizadoEm
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '[]', 0, 'REGULAR', '', '', '', ?, ?, '[]', '[]', 0, '', 0, 0, 0, 0, ?, ?, ?)
        `, [
          d.nuit, d.celular, d.nomeCompleto, d.sexo, d.codCarreira, d.vinculo, d.idEscola, Number(anoDestino),
          d.tipoEnsinoDocente, d.disciplinas, d.codCargoGestao,
          d.regimeEB, d.temposObrigatorios || 20,
          `Transitado do Ano Lectivo ${anoOrigem}`, now, now
        ]);
        countDoc++;
      }
    }

    // 2. Não Docentes
    const ndOrigem = queryAll('SELECT * FROM tblFuncionariosNaoDocentes WHERE anoLectivo = ?', [Number(anoOrigem)]);
    let countND = 0;
    for (const nd of ndOrigem) {
      const jaExiste = queryOne(`
        SELECT id FROM tblFuncionariosNaoDocentes
        WHERE anoLectivo = ? AND idEscola = ? AND (
          (nuit IS NOT NULL AND nuit != '' AND nuit = ?) OR
          LOWER(TRIM(nomeCompleto)) = LOWER(TRIM(?))
        )
      `, [Number(anoDestino), nd.idEscola, nd.nuit || '', nd.nomeCompleto]);

      if (!jaExiste) {
        run(`
          INSERT INTO tblFuncionariosNaoDocentes (
            idEscola, anoLectivo, nomeCompleto, sexo, contacto, nuit, cargoFuncao, vinculo, observacoes, criadoEm, atualizadoEm
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nd.idEscola, Number(anoDestino), nd.nomeCompleto, nd.sexo, nd.contacto, nd.nuit, nd.cargoFuncao, nd.vinculo, `Transitado do Ano Lectivo ${anoOrigem}`, now, now]);
        countND++;
      }
    }

    res.json({
      success: true,
      docentesCopiados: countDoc,
      naoDocentesCopiados: countND,
      message: `Transição concluída! Importados ${countDoc} professores (cargas zeradas para nova atribuição) e ${countND} não docentes para o ano ${anoDestino}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Módulo Inteligente de Transferência de FAEs (Escola ↔ Escola ↔ SDEJT)
app.post('/api/transferencias', (req, res) => {
  try {
    const {
      tipoFAE,
      idRegistroFAE,
      idEscolaOrigem,
      idEscolaDestino,
      anoLectivo = 2026,
      despacho = '',
      substitutoNome = '',
      notaSubstituicao = '',
      origemReportadaPor = 'SDEJT'
    } = req.body;

    const destIsSdejt = idEscolaDestino === 'sdejt' || String(idEscolaDestino) === '0';
    const destId = destIsSdejt ? 0 : Number(idEscolaDestino);
    const origIsSdejt = idEscolaOrigem === 'sdejt' || String(idEscolaOrigem) === '0' || !idEscolaOrigem;
    const origId = origIsSdejt ? 0 : Number(idEscolaOrigem);

    if (!tipoFAE || !idRegistroFAE || (!destIsSdejt && !destId)) {
      return res.status(400).json({ error: 'Dados incompletos para a transferência.' });
    }
    if (origId === destId) {
      return res.status(400).json({ error: 'O local de destino deve ser diferente do local de origem.' });
    }

    let nomeFAE = '';
    let nuitFAE = '';
    let turmasAnteriores = '';
    let disciplinaAnterior = '';
    const now = new Date().toISOString();
    const despachoCorrigido = corrigirAcentuacaoPT(despacho || '');
    const substitutoCorrigido = corrigirAcentuacaoPT(substitutoNome || '');
    const notaSubstCorrigida = corrigirAcentuacaoPT(notaSubstituicao || '');

    const escOrigem = origId > 0 ? queryOne('SELECT nomeAbreviado, nomeOficial FROM tblEscolas WHERE id = ?', [origId]) : null;
    const escDestino = destId > 0 ? queryOne('SELECT nomeAbreviado, nomeOficial FROM tblEscolas WHERE id = ?', [destId]) : null;
    const origemNome = origId === 0 ? 'SDEJT — Sede Distrital' : (escOrigem?.nomeAbreviado || `Escola #${origId}`);
    const destinoNome = destId === 0 ? 'SDEJT — Sede Distrital' : (escDestino?.nomeAbreviado || `Escola #${destId}`);

    if (tipoFAE === 'DOCENTE') {
      const doc = queryOne('SELECT * FROM tblDocentes WHERE id = ?', [Number(idRegistroFAE)]);
      if (!doc) return res.status(404).json({ error: 'Docente não encontrado' });
      nomeFAE = doc.nomeCompleto;
      nuitFAE = doc.nuit || '';
      turmasAnteriores = doc.turmasTexto || '';
      disciplinaAnterior = doc.disciplinas || (doc.tipoEnsinoDocente === 'EP' ? 'Monodocência EP' : '');

      run(`
        UPDATE tblDocentes SET
          idEscola = ?,
          turmasTexto = '',
          turmasJSON = '[]',
          turmasObrigatoriasJSON = '[]',
          turmasExtrasJSON = '[]',
          horasLectivas = 0,
          horasGestao = 0,
          totalHoras = 0,
          horasExtras = 0,
          observacoes = ?,
          atualizadoEm = ?
        WHERE id = ?
      `, [
        destId,
        `Transferido(a) de ${origemNome} para ${destinoNome} (aguardando atribuição de carga horária). ${despachoCorrigido ? 'Despacho: ' + despachoCorrigido : ''}`.trim(),
        now,
        Number(idRegistroFAE)
      ]);
    } else {
      const nd = queryOne('SELECT * FROM tblFuncionariosNaoDocentes WHERE id = ?', [Number(idRegistroFAE)]);
      if (!nd) return res.status(404).json({ error: 'Funcionário não docente não encontrado' });
      nomeFAE = nd.nomeCompleto;
      nuitFAE = nd.nuit || '';
      disciplinaAnterior = nd.cargoFuncao || 'Não Docente';
      turmasAnteriores = nd.cargoFuncao || '';

      run(`
        UPDATE tblFuncionariosNaoDocentes SET
          idEscola = ?,
          observacoes = ?,
          atualizadoEm = ?
        WHERE id = ?
      `, [
        destId,
        `Transferido(a) de ${origemNome} para ${destinoNome}. ${despachoCorrigido ? 'Despacho: ' + despachoCorrigido : ''}`.trim(),
        now,
        Number(idRegistroFAE)
      ]);
    }

    run(`
      INSERT INTO tblTransferenciasFAE (
        tipoFAE, idRegistroFAE, nomeFAE, nuit, idEscolaOrigem, idEscolaDestino, anoLectivo,
        dataTransferencia, despacho, estado, turmasAnteriores, disciplinaAnterior,
        substitutoNome, notaSubstituicao, origemReportadaPor, criadoEm
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE_CONFIRMACAO', ?, ?, ?, ?, ?, ?)
    `, [
      tipoFAE, Number(idRegistroFAE), nomeFAE, nuitFAE, origId, destId, Number(anoLectivo),
      now.split('T')[0], despachoCorrigido, turmasAnteriores, disciplinaAnterior,
      substitutoCorrigido, notaSubstCorrigida, origemReportadaPor, now
    ]);

    // Notificação automática para o DESTINO (Escola ou SDEJT = 0)
    run(`
      INSERT INTO tblNotificacoesEscola (
        idEscola, anoLectivo, tipo, titulo, mensagem, lida, linkAcao, criadoEm
      ) VALUES (?, ?, 'TRANSFERENCIA_CHEGADA', ?, ?, 0, ?, ?)
    `, [
      destId,
      Number(anoLectivo),
      'Novo FAE Transferido — Aguarda Confirmação',
      `Chegou transferido(a) de ${origemNome} o(a) ${tipoFAE === 'DOCENTE' ? 'docente' : 'FAE não docente'} ${nomeFAE}. Confirme a recepção na aba Transferências e atribua a nova carga horária ou função.`,
      'transferencias_fae',
      now
    ]);

    // Nota automática de SAÍDA para a Escola de Origem
    if (origId > 0) {
      const notaSubTxt = substitutoCorrigido || notaSubstCorrigida
        ? ` Substituição/Cobertura: ${[substitutoCorrigido, notaSubstCorrigida].filter(Boolean).join(' — ')}.`
        : ' Pode registar o(a) docente substituto(a) das turmas na aba Transferências.';
      run(`
        INSERT INTO tblNotificacoesEscola (
          idEscola, anoLectivo, tipo, titulo, mensagem, lida, linkAcao, criadoEm
        ) VALUES (?, ?, 'TRANSFERENCIA_SAIDA', ?, ?, 0, ?, ?)
      `, [
        origId,
        Number(anoLectivo),
        'Nota de Saída por Transferência de FAE',
        `Registada a transferência de ${nomeFAE} para ${destinoNome}.${notaSubTxt}`,
        'transferencias_fae',
        now
      ]);
    }

    res.json({
      success: true,
      message: `Transferência de ${nomeFAE} para ${destinoNome} registada com sucesso! O destino foi notificado para confirmação e atribuição de carga horária.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16.1 Confirmar Chegada de FAE Transferido no Destino (Escola ou SDEJT)
app.put('/api/transferencias/:id/confirmar', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { notaConfirmacao = '' } = req.body || {};
    const tr = queryOne('SELECT * FROM tblTransferenciasFAE WHERE id = ?', [id]);
    if (!tr) return res.status(404).json({ error: 'Registo de transferência não encontrado.' });

    const now = new Date().toISOString();
    const notaCorrigida = corrigirAcentuacaoPT(notaConfirmacao || 'Chegada confirmada e encaminhada para atribuição de carga horária/função.');

    run(`
      UPDATE tblTransferenciasFAE SET
        estado = 'CONFIRMADA',
        confirmadoEm = ?,
        notaConfirmacao = ?
      WHERE id = ?
    `, [now, notaCorrigida, id]);

    // Marcar notificações pendentes desta chegada como lidas
    run(`
      UPDATE tblNotificacoesEscola SET lida = 1
      WHERE idEscola = ? AND tipo = 'TRANSFERENCIA_CHEGADA' AND mensagem LIKE ?
    `, [Number(tr.idEscolaDestino || 0), `%${tr.nomeFAE}%`]);

    // Avisar a escola de origem que o destino confirmou recepção
    if (Number(tr.idEscolaOrigem) > 0) {
      const escDest = Number(tr.idEscolaDestino) > 0
        ? queryOne('SELECT nomeAbreviado FROM tblEscolas WHERE id = ?', [Number(tr.idEscolaDestino)])
        : null;
      const destNome = Number(tr.idEscolaDestino) === 0 ? 'SDEJT — Sede Distrital' : (escDest?.nomeAbreviado || 'Escola de Destino');
      run(`
        INSERT INTO tblNotificacoesEscola (
          idEscola, anoLectivo, tipo, titulo, mensagem, lida, linkAcao, criadoEm
        ) VALUES (?, ?, 'TRANSFERENCIA_CONFIRMADA', ?, ?, 0, 'transferencias_fae', ?)
      `, [
        Number(tr.idEscolaOrigem),
        Number(tr.anoLectivo || 2026),
        'Transferência Confirmada no Destino',
        `${destNome} confirmou a recepção do(a) FAE ${tr.nomeFAE}.`,
        now
      ]);
    }

    res.json({ success: true, message: `Chegada de ${tr.nomeFAE} confirmada com sucesso!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16.2 Registar / Actualizar Substituto e Nota de Cobertura de Turmas na Escola de Origem
app.put('/api/transferencias/:id/substituicao', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { substitutoNome = '', notaSubstituicao = '' } = req.body || {};
    const tr = queryOne('SELECT * FROM tblTransferenciasFAE WHERE id = ?', [id]);
    if (!tr) return res.status(404).json({ error: 'Registo de transferência não encontrado.' });

    run(`
      UPDATE tblTransferenciasFAE SET
        substitutoNome = ?,
        notaSubstituicao = ?
      WHERE id = ?
    `, [corrigirAcentuacaoPT(substitutoNome), corrigirAcentuacaoPT(notaSubstituicao), id]);

    res.json({ success: true, message: 'Nota de substituição / cobertura de turmas actualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 17. Notificações da Escola / SDEJT
app.get('/api/notificacoes', (req, res) => {
  try {
    const { idEscola, ano = 2026 } = req.query;
    if (!idEscola || idEscola === 'sdejt') {
      const notifs = queryAll('SELECT * FROM tblNotificacoesEscola WHERE anoLectivo = ? ORDER BY lida ASC, id DESC LIMIT 30', [Number(ano)]);
      return res.json(notifs);
    }
    const notifs = queryAll('SELECT * FROM tblNotificacoesEscola WHERE idEscola = ? AND anoLectivo = ? ORDER BY lida ASC, id DESC', [Number(idEscola), Number(ano)]);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notificacoes/:id/lida', (req, res) => {
  try {
    const id = Number(req.params.id);
    run('UPDATE tblNotificacoesEscola SET lida = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 18. Histórico / Mapa Inteligente de Transferências (Distrital ou por Escola)
app.get('/api/transferencias', (req, res) => {
  try {
    const { ano = 2026, idEscola } = req.query;
    let sql = `
      SELECT t.*,
        CASE WHEN t.idEscolaOrigem = 0 THEN 'SDEJT — Sede Distrital' ELSE COALESCE(eOrigem.nomeAbreviado, 'SDEJT') END as nomeEscolaOrigem,
        CASE WHEN t.idEscolaDestino = 0 THEN 'SDEJT — Sede Distrital' ELSE COALESCE(eDestino.nomeAbreviado, 'SDEJT') END as nomeEscolaDestino
      FROM tblTransferenciasFAE t
      LEFT JOIN tblEscolas eOrigem ON t.idEscolaOrigem = eOrigem.id
      LEFT JOIN tblEscolas eDestino ON t.idEscolaDestino = eDestino.id
      WHERE t.anoLectivo = ?
    `;
    const params = [Number(ano)];
    if (idEscola && idEscola !== 'sdejt' && idEscola !== 'all') {
      sql += ' AND (t.idEscolaOrigem = ? OR t.idEscolaDestino = ?)';
      params.push(Number(idEscola), Number(idEscola));
    }
    sql += ' ORDER BY t.id DESC';
    const transfers = queryAll(sql, params);
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 18.1 Exportar Mapa de Transferências em Word (.docx) e Excel (.xlsx)
app.get('/api/exportar/transferencias/word', async (req, res) => {
  try {
    const { ano = 2026, idEscola } = req.query;
    let escola = {
      id: 'sdejt',
      nomeOficial: 'Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro',
      nomeAbreviado: 'SDEJT',
      codigoMEC: 'SDEJT-SEDE',
      tipo: 'Distrital'
    };
    let sql = `
      SELECT t.*,
        CASE WHEN t.idEscolaOrigem = 0 THEN 'SDEJT — Sede Distrital' ELSE COALESCE(eOrigem.nomeAbreviado, 'SDEJT') END as nomeEscolaOrigem,
        CASE WHEN t.idEscolaDestino = 0 THEN 'SDEJT — Sede Distrital' ELSE COALESCE(eDestino.nomeAbreviado, 'SDEJT') END as nomeEscolaDestino
      FROM tblTransferenciasFAE t
      LEFT JOIN tblEscolas eOrigem ON t.idEscolaOrigem = eOrigem.id
      LEFT JOIN tblEscolas eDestino ON t.idEscolaDestino = eDestino.id
      WHERE t.anoLectivo = ?
    `;
    const params = [Number(ano)];
    if (idEscola && idEscola !== 'sdejt' && idEscola !== 'all') {
      const esc = queryOne('SELECT e.*, z.nome as nomeZIP FROM tblEscolas e LEFT JOIN tblZIPs z ON e.idZip = z.id WHERE e.id = ?', [Number(idEscola)]);
      if (esc) escola = esc;
      sql += ' AND (t.idEscolaOrigem = ? OR t.idEscolaDestino = ?)';
      params.push(Number(idEscola), Number(idEscola));
    }
    sql += ' ORDER BY t.id DESC';
    const transferencias = queryAll(sql, params);
    const buf = await gerarMapaTransferenciasWord({ escola, anoLectivo: Number(ano), transferencias });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Mapa_Transferencias_FAEs_${(escola.nomeAbreviado || 'SDEJT').replace(/\s+/g, '_')}_${ano}.docx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exportar/transferencias/excel', async (req, res) => {
  try {
    const { ano = 2026, idEscola } = req.query;
    let escola = {
      id: 'sdejt',
      nomeOficial: 'Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro',
      nomeAbreviado: 'SDEJT',
      codigoMEC: 'SDEJT-SEDE',
      tipo: 'Distrital'
    };
    let sql = `
      SELECT t.*,
        CASE WHEN t.idEscolaOrigem = 0 THEN 'SDEJT — Sede Distrital' ELSE COALESCE(eOrigem.nomeAbreviado, 'SDEJT') END as nomeEscolaOrigem,
        CASE WHEN t.idEscolaDestino = 0 THEN 'SDEJT — Sede Distrital' ELSE COALESCE(eDestino.nomeAbreviado, 'SDEJT') END as nomeEscolaDestino
      FROM tblTransferenciasFAE t
      LEFT JOIN tblEscolas eOrigem ON t.idEscolaOrigem = eOrigem.id
      LEFT JOIN tblEscolas eDestino ON t.idEscolaDestino = eDestino.id
      WHERE t.anoLectivo = ?
    `;
    const params = [Number(ano)];
    if (idEscola && idEscola !== 'sdejt' && idEscola !== 'all') {
      const esc = queryOne('SELECT e.*, z.nome as nomeZIP FROM tblEscolas e LEFT JOIN tblZIPs z ON e.idZip = z.id WHERE e.id = ?', [Number(idEscola)]);
      if (esc) escola = esc;
      sql += ' AND (t.idEscolaOrigem = ? OR t.idEscolaDestino = ?)';
      params.push(Number(idEscola), Number(idEscola));
    }
    sql += ' ORDER BY t.id DESC';
    const transferencias = queryAll(sql, params);
    const buf = await gerarMapaTransferenciasExcel({ escola, anoLectivo: Number(ano), transferencias });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Mapa_Transferencias_FAEs_${(escola.nomeAbreviado || 'SDEJT').replace(/\s+/g, '_')}_${ano}.xlsx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 19. Edição Cadastral de Escolas pelo Gestor SDEJT (Correção de Nomes, Códigos, Tipos e ZIPs)
app.put('/api/escolas/:id/cadastro', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nomeOficial, nomeAbreviado, codigoMEC, tipo, idZip } = req.body;
    run(`
      UPDATE tblEscolas SET
        nomeOficial = ?, nomeAbreviado = ?, codigoMEC = ?, tipo = ?, idZip = ?
      WHERE id = ?
    `, [nomeOficial, nomeAbreviado, codigoMEC, tipo, Number(idZip), id]);
    res.json({ success: true, message: 'Dados cadastrais da escola atualizados com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 20. [V2.0] Ficha Individual de Carga Horária do Docente em Word (.docx)
app.get('/api/exportar/word-docente/:id', async (req, res) => {
  try {
    const idDoc = Number(req.params.id);
    const docente = queryOne('SELECT * FROM tblDocentes WHERE id = ?', [idDoc]);
    if (!docente) return res.status(404).json({ error: 'Docente não encontrado' });
    const escola = queryOne('SELECT e.*, z.nome as nomeZIP FROM tblEscolas e LEFT JOIN tblZIPs z ON e.idZip = z.id WHERE e.id = ?', [docente.idEscola]);
    const buffer = await gerarFichaIndividualDocenteWord({ escola, docente, anoLectivo: docente.anoLectivo || 2026 });
    const safeName = (docente.nomeCompleto || 'Docente').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Ficha_Individual_${safeName}_${docente.anoLectivo || 2026}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 21. [V2.0] Auditoria Automática de Conflitos (NUIT duplicado, 0h atribuídas, >15h HE)
app.get('/api/auditoria/conflitos', (req, res) => {
  try {
    const { idEscola, ano = 2026 } = req.query;
    const docs = (!idEscola || idEscola === 'sdejt')
      ? queryAll('SELECT d.*, e.nomeAbreviado as escolaNome FROM tblDocentes d LEFT JOIN tblEscolas e ON d.idEscola = e.id WHERE d.anoLectivo = ?', [Number(ano)])
      : queryAll('SELECT d.*, e.nomeAbreviado as escolaNome FROM tblDocentes d LEFT JOIN tblEscolas e ON d.idEscola = e.id WHERE d.idEscola = ? AND d.anoLectivo = ?', [Number(idEscola), Number(ano)]);

    const alertas = [];
    const nuitMap = {};
    for (const d of docs) {
      if (Number(d.totalHoras || 0) === 0) {
        alertas.push({ tipo: 'SEM_CARGA', docente: d.nomeCompleto, escola: d.escolaNome, detalhe: '0h atribuídas (aguarda distribuição)' });
      }
      if (d.tipoEnsinoDocente !== 'EP' && Number(d.horasExtras || 0) > 15) {
        alertas.push({ tipo: 'TECTO_HE', docente: d.nomeCompleto, escola: d.escolaNome, detalhe: `${d.horasExtras}h Extras (excede tecto de 15h)` });
      }
      if (d.nuit && String(d.nuit).trim().length >= 6) {
        const nk = String(d.nuit).trim();
        if (nuitMap[nk] && nuitMap[nk] !== d.nomeCompleto) {
          alertas.push({ tipo: 'NUIT_DUPLICADO', docente: d.nomeCompleto, escola: d.escolaNome, detalhe: `NUIT ${nk} duplicado com ${nuitMap[nk]}` });
        }
        nuitMap[nk] = d.nomeCompleto;
      }
    }
    res.json({ ano: Number(ano), totalAnalisados: docs.length, totalAlertas: alertas.length, alertas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 22. [V2.0] Exportação de Backup Completo em JSON
app.get('/api/backup/exportar', (req, res) => {
  try {
    const payload = {
      versao: '2.0.0',
      exportadoEm: new Date().toISOString(),
      zips: queryAll('SELECT * FROM tblZIPs'),
      escolas: queryAll('SELECT * FROM tblEscolas'),
      docentes: queryAll('SELECT * FROM tblDocentes'),
      naoDocentes: queryAll('SELECT * FROM tblFuncionariosNaoDocentes'),
      matrizCurricular: queryAll('SELECT * FROM tblMatrizCurricular'),
      configuracoes: queryAll('SELECT * FROM tblConfiguracoesSistema'),
      transferencias: queryAll('SELECT * FROM tblTransferenciasFAE')
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Backup_SDEJT_Inhassoro_v2.0_${new Date().toISOString().slice(0,10)}.json"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar Banco de Dados e Servidor
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SDEJT Inhassoro — Servidor Backend Online!`);
    console.log(`📡 URL API: http://localhost:${PORT}/api/status`);
    console.log(`======================================================\n`);
  });
}).catch(err => {
  console.error('[ERRO FATAL] Não foi possível iniciar o banco SQLite:', err);
});

