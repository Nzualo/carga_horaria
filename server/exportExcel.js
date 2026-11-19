const ExcelJS = require('exceljs');

async function gerarPlanilhaExcelOficial({ escola, anoLectivo = 2026, docentes = [], tipoMapa = '1.3' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SDEJT Inhassoro - MINEDH';
  workbook.created = new Date();

  const isEP = tipoMapa === '1.1' || escola?.tipo === 'EP';
  const nomeAba = isEP ? 'Mapas_1.1_e_2.1_EP' : (tipoMapa === '2.3' ? 'Mapa_2.3_Disciplinas' : 'Mapa_1.3_ESG_EB');

  const sheet = workbook.addWorksheet(nomeAba, {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  if (isEP) {
    // -------------------------------------------------------------
    // EXCEL OFICIAL EP: DUAL-TABLE (MAPA 1.1 + MAPA 2.1)
    // -------------------------------------------------------------
    // Linha 1: Título Governamental
    sheet.mergeCells('A1:H1');
    const c1 = sheet.getCell('A1');
    c1.value = 'REPÚBLICA DE MOÇAMBIQUE • PROVÍNCIA DE INHAMBANE • GOVERNO DO DISTRITO DE INHASSORO';
    c1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2942' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 24;

    // Linha 2: SDEJT
    sheet.mergeCells('A2:H2');
    const c2 = sheet.getCell('A2');
    c2.value = 'SERVIÇO DISTRITAL DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA (SDEJT)';
    c2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // Linha 3: Título do Mapa
    sheet.mergeCells('A3:H3');
    const c3 = sheet.getCell('A3');
    c3.value = `MAPAS 1.1 E 2.1 — DISTRIBUIÇÃO DE DOCENTES E TURMAS NO ENSINO PRIMÁRIO E AEA (${anoLectivo})`;
    c3.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 22;

    // Linha 4: Metadados da Escola
    sheet.mergeCells('A4:H4');
    const c4 = sheet.getCell('A4');
    c4.value = `Escola: ${escola?.nomeOficial || "Escola Primária de Inhassoro"}   |   COD: ${escola?.codigoMEC || "30607"}   |   ZIP n.º ${escola?.idZip || 1} - ${escola?.nomeZIP || "Inhassoro"}`;
    c4.font = { name: 'Arial', size: 10, italic: true };
    c4.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(4).height = 18;

    sheet.addRow([]); // Linha 5 em branco

    // Título da Tabela 1.1
    sheet.mergeCells('A6:H6');
    const c6 = sheet.getCell('A6');
    c6.value = '1.1 MAPA DE DISTRIBUIÇÃO DOS DOCENTES POR TURMAS DO ENSINO PRIMÁRIO E AEA';
    c6.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D7B' } };
    c6.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sheet.getRow(6).height = 22;

    // Cabeçalho da Tabela 1.1 (Linha 7)
    const headerRow1 = sheet.addRow([
      'N.º',
      'Nome do Funcionário / Docente',
      'Carreira',
      'Vínculo',
      '1.ª Turma (Classe / AEA e Turma)',
      '2.ª Turma / Duplo Turno',
      'Total de Turmas',
      'Observação'
    ]);
    headerRow1.height = 26;
    headerRow1.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2942' } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    let currentRow = 8;
    if (Array.isArray(docentes) && docentes.length > 0) {
      docentes.forEach((d, idx) => {
        let t1 = '-';
        let t2 = '-';
        let totalTurmas = 1;
        const tt = d.turmasTexto || '';

        if (tt.includes('+')) {
          const parts = tt.split('+');
          t1 = parts[0]?.trim() || '-';
          t2 = parts[1]?.trim() || '-';
          totalTurmas = 2;
        } else if (Number(d.totalHoras) > 24) {
          t1 = tt || '1ª Turma';
          t2 = '2ª Turma (2º Turno)';
          totalTurmas = 2;
        } else {
          t1 = tt || 'Turma Regular';
          t2 = '-';
          totalTurmas = 1;
        }

        let obs = '';
        if (d.codCargoGestao) {
          obs = `[${d.codCargoGestao}] ${totalTurmas > 1 ? 'Duplo turno (2 turmas)' : 'Turno normal (1 turma)'}`;
        } else {
          obs = totalTurmas > 1 ? 'Duplo turno (2 turmas)' : 'Turno normal (1 turma)';
        }

        const row = sheet.addRow([
          idx + 1,
          d.nomeCompleto || '',
          d.codCarreira || 'DN3',
          d.vinculo || 'Quadro',
          t1,
          t2,
          totalTurmas,
          obs
        ]);

        row.height = 20;
        row.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 9.5 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };
          if (colNum === 1 || colNum === 3 || colNum === 4 || colNum === 7) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
          if (colNum === 2) cell.font = { name: 'Arial', size: 9.5, bold: true };
          if (colNum === 7) {
            cell.font = { name: 'Arial', size: 9.5, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totalTurmas > 1 ? 'FFFEF3C7' : 'FFDBEAFE' } };
          }
        });
        currentRow++;
      });
    }

    sheet.addRow([]); // Espaço entre tabelas
    currentRow++;

    // Título da Tabela 2.1
    sheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const c21 = sheet.getCell(`A${currentRow}`);
    c21.value = '2.1 MAPA DE DISTRIBUIÇÃO DE TURMAS POR CLASSES NO ENSINO PRIMÁRIO E CENTRO DE AEA';
    c21.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c21.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    c21.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sheet.getRow(currentRow).height = 22;
    currentRow++;

    // Cabeçalho da Tabela 2.1
    const headerRow2 = sheet.addRow([
      'Classe / Ano AEA',
      'N.º de Alunos',
      'Número de Turmas',
      'Docentes Necessários',
      'Docentes Existentes (1.ª T)',
      'Turmas em 2.º Turno',
      'Turmas sem Docente',
      'Docentes c/ 2 Turmas',
      'Observação'
    ]);
    headerRow2.height = 26;
    headerRow2.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2942' } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    currentRow++;

    // Dados da Tabela 2.1
    let turmasMap = {};
    try {
      if (typeof escola?.turmasClassesJSON === 'string') turmasMap = JSON.parse(escola.turmasClassesJSON || '{}');
      else if (typeof escola?.turmasClassesJSON === 'object') turmasMap = escola.turmasClassesJSON || {};
    } catch (e) {
      turmasMap = {};
    }

    const classesPadrao = [
      { id: '1ª', nome: '1ª Classe', alunos: Math.round((Number(escola?.totalAlunos || 600) * 0.22)) },
      { id: '2ª', nome: '2ª Classe', alunos: Math.round((Number(escola?.totalAlunos || 600) * 0.20)) },
      { id: '3ª', nome: '3ª Classe', alunos: Math.round((Number(escola?.totalAlunos || 600) * 0.18)) },
      { id: '4ª', nome: '4ª Classe', alunos: Math.round((Number(escola?.totalAlunos || 600) * 0.16)) },
      { id: '5ª', nome: '5ª Classe', alunos: Math.round((Number(escola?.totalAlunos || 600) * 0.13)) },
      { id: '6ª', nome: '6ª Classe', alunos: Math.round((Number(escola?.totalAlunos || 600) * 0.11)) },
      { id: '1º AEA', nome: '1.º Ano AEA', alunos: 32 },
      { id: '2º AEA', nome: '2.º Ano AEA', alunos: 28 },
      { id: '3º AEA', nome: '3.º Ano AEA', alunos: 25 },
      { id: '4º AEA', nome: '4.º Ano AEA', alunos: 0 }
    ];

    let totAlunos = 0;
    let totTurmas = 0;
    let totDocNecess = 0;
    let totDocExist = 0;
    let totTurmas2T = 0;
    let totSemDoc = 0;
    let totDoc2T = 0;

    classesPadrao.forEach((item) => {
      const nTurmas = Number(turmasMap[item.id] || turmasMap[item.nome] || (item.alunos > 0 ? Math.ceil(item.alunos / 45) : 0));
      const docNecess = nTurmas;

      let doc1T = 0;
      let doc2T = 0;
      docentes.forEach(d => {
        const tt = d.turmasTexto || '';
        if (tt.includes(item.id) || tt.includes(item.nome)) {
          if (tt.includes('+') || Number(d.totalHoras) > 24) doc2T++;
          else doc1T++;
        }
      });

      const turmasAtendidas = doc1T + doc2T;
      const turmasSemDoc = Math.max(0, nTurmas - turmasAtendidas);
      const obsClasse = turmasSemDoc > 0 ? "Défice de Docentes" : (doc2T > 0 ? "Duplo Turno Ativo" : "Cobertura Completa");

      totAlunos += item.alunos;
      totTurmas += nTurmas;
      totDocNecess += docNecess;
      totDocExist += doc1T;
      totTurmas2T += doc2T;
      totSemDoc += turmasSemDoc;
      totDoc2T += doc2T;

      const r2 = sheet.addRow([
        item.nome,
        item.alunos,
        nTurmas,
        docNecess,
        doc1T,
        doc2T,
        turmasSemDoc,
        doc2T,
        obsClasse
      ]);

      r2.height = 20;
      r2.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 9.5 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        if (colNum === 1 || colNum === 9) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        if (colNum === 7 && turmasSemDoc > 0) {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF991B1B' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      });
      currentRow++;
    });

    // Totalizador Consolidado
    const rowTot = sheet.addRow([
      'TOTAL GERAL',
      totAlunos,
      totTurmas,
      totDocNecess,
      totDocExist,
      totTurmas2T,
      totSemDoc,
      totDoc2T,
      'Consolidado'
    ]);
    rowTot.height = 22;
    rowTot.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9.5, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'medium' }, bottom: { style: 'double' } };
      if (colNum === 1 || colNum === 9) cell.alignment = { horizontal: 'left', vertical: 'middle' };
      else cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    sheet.columns = [
      { width: 22 }, // Col 1
      { width: 34 }, // Col 2
      { width: 14 }, // Col 3
      { width: 16 }, // Col 4
      { width: 28 }, // Col 5
      { width: 28 }, // Col 6
      { width: 18 }, // Col 7
      { width: 32 }, // Col 8
      { width: 20 }  // Col 9
    ];

  } else {
    // -------------------------------------------------------------
    // EXCEL OFICIAL ESG / EB: MAPA 1.3 (ESTRUTURA OFICIAL MINEDH COM CD / CN)
    // -------------------------------------------------------------
    sheet.mergeCells('A1:Q1');
    const c1 = sheet.getCell('A1');
    c1.value = 'REPÚBLICA DE MOÇAMBIQUE • PROVÍNCIA DE INHAMBANE • GOVERNO DO DISTRITO DE INHASSORO';
    c1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2942' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 24;

    sheet.mergeCells('A2:Q2');
    const c2 = sheet.getCell('A2');
    c2.value = 'SERVIÇO DISTRITAL DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA (SDEJT)';
    c2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    sheet.mergeCells('A3:Q3');
    const c3 = sheet.getCell('A3');
    c3.value = `MAPA 1.3 — DISTRIBUIÇÃO DA CARGA HORÁRIA DOS DOCENTES (ESG / EB) — ANO LECTIVO ${anoLectivo}`;
    c3.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 22;

    sheet.mergeCells('A4:Q4');
    const c4 = sheet.getCell('A4');
    c4.value = `Escola: ${escola?.nomeOficial || "Escola Secundária de Inhassoro"}   |   Código da Escola (COD): ${escola?.codigoMEC || "30608"}   |   Tipo: ${escola?.tipo || "ESG"}`;
    c4.font = { name: 'Arial', size: 10, italic: true };
    c4.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(4).height = 18;

    sheet.addRow([]); // Linha 5 em branco

    // Linha 6: Cabeçalho Nível 1
    const r6 = sheet.addRow([
      '(2) Nº',
      '(3) Nome do Docente',
      '(4) Carreira',
      '(5) Vínculo (Quadro/Contratado)',
      '(6) Disciplina',
      '(7) Funções de gestão (Dir, DAP, DT, DD, CC, CAA)',
      '',
      '(8) Classe (7ª a 12ª)',
      '',
      '(9) HL = Horas Lectivas',
      '',
      '(10) HG = Horas de Gestão',
      '',
      '(11) Total de Horas = THL+THG',
      '(12) Horas Factor 1.5',
      '(13) Horas Extraordinárias (HE)',
      '(14) Observações'
    ]);
    r6.height = 28;

    // Linha 7: Cabeçalho Nível 2 (CD / CN)
    const r7 = sheet.addRow([
      '', '', '', '', '',
      'CD', 'CN',
      'CD', 'CN',
      'CD', 'CN',
      'CD', 'CN',
      '', '', '', ''
    ]);
    r7.height = 20;

    // Mesclar verticais e horizontais do cabeçalho oficial
    sheet.mergeCells('A6:A7');
    sheet.mergeCells('B6:B7');
    sheet.mergeCells('C6:C7');
    sheet.mergeCells('D6:D7');
    sheet.mergeCells('E6:E7');
    sheet.mergeCells('F6:G6');
    sheet.mergeCells('H6:I6');
    sheet.mergeCells('J6:K6');
    sheet.mergeCells('L6:M6');
    sheet.mergeCells('N6:N7');
    sheet.mergeCells('O6:O7');
    sheet.mergeCells('P6:P7');
    sheet.mergeCells('Q6:Q7');

    // Estilizar linhas 6 e 7
    [r6, r7].forEach(r => {
      r.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2942' } };
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Sub-colunas CD/CN estilizadas com azul intermediário
    ['F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7'].forEach(pos => {
      const c = sheet.getCell(pos);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D7B' } };
      c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let startDataRow = 8;
    let currentRow = startDataRow;

    let totHL_CD = 0;
    let totHL_CN = 0;
    let totHG_CD = 0;
    let totHG_CN = 0;
    let totGeral = 0;
    let totHE = 0;

    if (Array.isArray(docentes) && docentes.length > 0) {
      docentes.forEach((d, idx) => {
        const isCN = (d.vinculo || '').toLowerCase().includes('contratado') || (d.turno || '').toLowerCase().includes('noite');
        const isEpEmHe = (d.regimeEB === 'EP_EM_HE') || ((d.regime || '').includes('Efectivo no EP')) || (d.observacoes || '').includes('Efectivo no EP');
        const vinculoTexto = isCN ? 'Contratado' : (d.vinculo || 'Quadro');
        const carreiraTexto = d.codCarreira || d.carreira || 'DN1';
        const discTexto = d.disciplinaPrincipal || d.disciplinas || d.disc1 || '-';
        const fgTexto = d.funcoesGestaoTexto || d.codCargoGestao || '-';
        const clTexto = d.turmasTexto || d.classes || '-';

        const hl = Number(d.horasLectivas) || 0;
        const hg = Number(d.horasGestao) || 0;
        const tot = Number(d.totalHoras) || (hl + hg);
        const he = Number(d.horasExtras) || 0;

        const hlCD = isCN ? 0 : hl;
        const hlCN = isCN ? hl : 0;
        const hgCD = !isCN && hg > 0 ? hg : '';
        const hgCN = isCN && hg > 0 ? hg : '';

        totHL_CD += hlCD;
        totHL_CN += hlCN;
        totHG_CD += Number(hgCD || 0);
        totHG_CN += Number(hgCN || 0);
        totGeral += tot;
        totHE += he;

        let obs = d.observacoes || '';
        if (isEpEmHe && !obs.includes('Efectivo no EP')) {
          obs = `[Efectivo no EP — HE no ES] ${obs}`.trim();
        }

        const row = sheet.addRow([
          idx + 1,
          d.nomeCompleto || d.nome_docente || '',
          carreiraTexto,
          vinculoTexto,
          discTexto,
          !isCN && fgTexto !== '-' ? fgTexto : '',
          isCN && fgTexto !== '-' ? fgTexto : '',
          !isCN ? clTexto : '',
          isCN ? clTexto : '',
          hlCD || '',
          hlCN || '',
          hgCD,
          hgCN,
          tot,
          '',
          he || '',
          obs
        ]);

        row.height = 20;
        row.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 9.5 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };
          if (colNum === 2 || colNum === 17) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          if (colNum === 2) cell.font = { name: 'Arial', size: 9.5, bold: true };
          if (colNum === 14) {
            cell.font = { name: 'Arial', size: 9.5, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
          }
          if (colNum === 16 && he > 0) {
            cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF991B1B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          }
        });
        currentRow++;
      });
    }

    const totalRow = sheet.addRow([
      '',
      'TOTAL GERAL DA INSTITUIÇÃO',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totHL_CD,
      totHL_CN,
      totHG_CD,
      totHG_CN,
      totGeral,
      '',
      totHE,
      'Consolidado ESG/EB'
    ]);
    totalRow.height = 24;
    sheet.mergeCells(`B${currentRow}:I${currentRow}`);
    totalRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'medium' }, bottom: { style: 'double' } };
    });

    sheet.columns = [
      { width: 8 },  // (2) Nº
      { width: 34 }, // (3) Nome
      { width: 12 }, // (4) Carreira
      { width: 16 }, // (5) Vínculo
      { width: 18 }, // (6) Disciplina
      { width: 16 }, // (7) Gestão CD
      { width: 16 }, // (7) Gestão CN
      { width: 20 }, // (8) Classe CD
      { width: 20 }, // (8) Classe CN
      { width: 10 }, // (9) HL CD
      { width: 10 }, // (9) HL CN
      { width: 10 }, // (10) HG CD
      { width: 10 }, // (10) HG CN
      { width: 12 }, // (11) Total
      { width: 12 }, // (12) Factor 1.5
      { width: 12 }, // (13) HE
      { width: 30 }  // (14) Observações
    ];

    // Bloco de Assinatura Oficial (Sem parecer técnico)
    const signRowIdx = currentRow + 2;
    sheet.mergeCells(`L${signRowIdx}:Q${signRowIdx}`);
    const cellData = sheet.getCell(`L${signRowIdx}`);
    cellData.value = `Inhassoro, aos ____ de ________________ de ${anoLectivo}`;
    cellData.font = { name: 'Arial', size: 10, italic: true };
    cellData.alignment = { horizontal: 'right' };

    const signCargoIdx = signRowIdx + 2;
    sheet.mergeCells(`F${signCargoIdx}:L${signCargoIdx}`);
    const cellCargo = sheet.getCell(`F${signCargoIdx}`);
    cellCargo.value = (escola?.directorSexo === 'F' ? 'A Directora' : 'O Director') + ' da Escola';
    cellCargo.font = { name: 'Arial', size: 10.5, bold: true };
    cellCargo.alignment = { horizontal: 'center' };

    const signLinhaIdx = signCargoIdx + 2;
    sheet.mergeCells(`F${signLinhaIdx}:L${signLinhaIdx}`);
    const cellLinha = sheet.getCell(`F${signLinhaIdx}`);
    cellLinha.value = '___________________________________________________';
    cellLinha.alignment = { horizontal: 'center' };

    const signNomeIdx = signLinhaIdx + 1;
    sheet.mergeCells(`F${signNomeIdx}:L${signNomeIdx}`);
    const cellNome = sheet.getCell(`F${signNomeIdx}`);
    cellNome.value = escola?.nomeDirector || '';
    cellNome.font = { name: 'Arial', size: 10, bold: true };
    cellNome.alignment = { horizontal: 'center' };

    const signCarrIdx = signNomeIdx + 1;
    sheet.mergeCells(`F${signCarrIdx}:L${signCarrIdx}`);
    const cellCarr = sheet.getCell(`F${signCarrIdx}`);
    cellCarr.value = `/${escola?.carreiraDirector || 'DN1'}/`;
    cellCarr.font = { name: 'Arial', size: 9.5, italic: true };
    cellCarr.alignment = { horizontal: 'center' };
  }

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  gerarPlanilhaExcelOficial
};
