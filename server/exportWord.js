const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  AlignmentType, WidthType, BorderStyle, ImageRun, PageOrientation 
} = require('docx');
const fs = require('fs');
const path = require('path');

// Encontrar o emblema oficial da República de Moçambique
function getEmblemaImageRun() {
  const possiblePaths = [
    path.join(__dirname, 'data', 'emblema.png'),
    path.join(__dirname, '..', 'public', 'emblema.png'),
    path.join(__dirname, '..', 'src', 'assets', 'emblema.png'),
    path.join(__dirname, '..', '..', 'Carga Horaria', 'emblema_republica.png')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const imgData = fs.readFileSync(p);
        return new ImageRun({
          data: imgData,
          transformation: {
            width: 60,
            height: 60
          }
        });
      } catch (e) {
        console.error('Erro ao carregar imagem do emblema:', e);
      }
    }
  }
  return null;
}

// Borda padrão nítida e fina oficial
const BORDA_OFICIAL = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
};

const BORDA_INVISIVEL = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE }
};

function celulaCabecalho(texto, widthDxa = null) {
  return new TableCell({
    width: widthDxa ? { size: widthDxa, type: WidthType.DXA } : undefined,
    shading: { fill: "D9E2F3" }, // Azul pastel institucional suave oficial
    borders: BORDA_OFICIAL,
    children: [
      new Paragraph({
        children: [new TextRun({ text: texto, bold: true, color: "000000", size: 18, font: "Arial" })],
        alignment: AlignmentType.CENTER
      })
    ]
  });
}

function celulaDados(texto, alinhamento = AlignmentType.LEFT, negrito = false, widthDxa = null, fill = null) {
  return new TableCell({
    width: widthDxa ? { size: widthDxa, type: WidthType.DXA } : undefined,
    shading: fill ? { fill } : { fill: "FFFFFF" },
    borders: BORDA_OFICIAL,
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(texto ?? ''), bold: negrito, color: "000000", size: 17, font: "Arial" })],
        alignment: alinhamento
      })
    ]
  });
}

async function gerarDocumentoWordOficial({ escola, anoLectivo = 2026, docentes = [], tipoMapa = '1.3' }) {
  const imageRun = getEmblemaImageRun();
  const isEP = tipoMapa === '1.1' || escola?.tipo === 'EP';

  // Cabeçalho Oficial rigorosamente estruturado conforme Cabecalho.docx
  const childrenSections = [
    // 1. Emblema Centralizado
    new Paragraph({
      children: imageRun ? [imageRun] : [],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 }
    }),

    // 2. Título Institucional da República
    new Paragraph({
      children: [new TextRun({ text: "REPÚBLICA DE MOÇAMBIQUE", bold: true, size: 24, font: "Arial", color: "000000" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "PROVÍNCIA DE INHAMBANE", bold: true, size: 22, font: "Arial", color: "000000" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "GOVERNO DO DISTRITO DE INHASSORO", bold: true, size: 22, font: "Arial", color: "000000" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "SERVIÇO DISTRITAL DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA", bold: true, size: 22, font: "Arial", color: "000000" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 140 }
    })
  ];

  if (isEP) {
    // -------------------------------------------------------------
    // MODELO OFICIAL EP: MAPAS 1.1 E 2.1 (ENSINO PRIMÁRIO & AEA)
    // -------------------------------------------------------------
    childrenSections.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `MAPAS 1.1 E 2.1: DISTRIBUIÇÃO DE DOCENTES E TURMAS — ENSINO PRIMÁRIO E AEA (${anoLectivo})`, 
            bold: true, 
            size: 24, 
            underline: {}, 
            font: "Arial", 
            color: "000000" 
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `NOME DA ESCOLA: `, bold: true, size: 19, font: "Arial" }),
          new TextRun({ text: `${escola?.nomeOficial || "Escola Primária de Inhassoro"}   |   `, size: 19, font: "Arial" }),
          new TextRun({ text: `COD: `, bold: true, size: 19, font: "Arial" }),
          new TextRun({ text: `${escola?.codigoMEC || "30607"}   |   `, size: 19, font: "Arial" }),
          new TextRun({ text: `ZIP n.º `, bold: true, size: 19, font: "Arial" }),
          new TextRun({ text: `${escola?.idZip || 1} - ${escola?.nomeZIP || "Inhassoro"}`, size: 19, font: "Arial" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 }
      })
    );

    // TABELA 1: MAPA 1.1 (Distribuição de Docentes por Turmas) - Total 15838 dxa em Paisagem
    const rowsTabela1 = [
      new TableRow({
        tableHeader: true,
        children: [
          celulaCabecalho("N.º", 700),
          celulaCabecalho("Nome do Funcionário / Docente", 3800),
          celulaCabecalho("Carreira", 1200),
          celulaCabecalho("Vínculo", 1400),
          celulaCabecalho("1.ª Turma (Classe / AEA e Turma)", 2800),
          celulaCabecalho("2.ª Turma / Duplo Turno", 2800),
          celulaCabecalho("Total de Turmas", 1100),
          celulaCabecalho("Observação", 2038)
        ]
      })
    ];

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

        rowsTabela1.push(
          new TableRow({
            children: [
              celulaDados(String(idx + 1), AlignmentType.CENTER, false, 700),
              celulaDados(d.nomeCompleto || '', AlignmentType.LEFT, true, 3800),
              celulaDados(d.codCarreira || 'DN3', AlignmentType.CENTER, false, 1200),
              celulaDados(d.vinculo || 'Quadro', AlignmentType.CENTER, false, 1400),
              celulaDados(t1, AlignmentType.CENTER, false, 2800),
              celulaDados(t2, AlignmentType.CENTER, false, 2800),
              celulaDados(String(totalTurmas), AlignmentType.CENTER, true, 1100),
              celulaDados(obs, AlignmentType.LEFT, false, 2038)
            ]
          })
        );
      });
    } else {
      rowsTabela1.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 8,
              borders: BORDA_OFICIAL,
              children: [
                new Paragraph({
                  text: "Nenhum docente cadastrado nesta escola até o momento.",
                  alignment: AlignmentType.CENTER
                })
              ]
            })
          ]
        })
      );
    }

    childrenSections.push(
      new Table({
        rows: rowsTabela1,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }),
      new Paragraph({ text: "", spacing: { after: 250 } })
    );

    // TABELA 2: MAPA 2.1 (Distribuição de Turmas por Classes e Centro AEA)
    childrenSections.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `MAPA 2.1: DISTRIBUIÇÃO DE TURMAS POR CLASSES NO ENSINO PRIMÁRIO E CENTRO DE AEA (${anoLectivo})`, 
            bold: true, 
            size: 22, 
            underline: {}, 
            font: "Arial", 
            color: "000000" 
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 150, after: 120 }
      })
    );

    const rowsTabela2 = [
      new TableRow({
        tableHeader: true,
        children: [
          celulaCabecalho("Classe / Ano AEA", 2200),
          celulaCabecalho("N.º de Alunos", 1400),
          celulaCabecalho("Número de Turmas", 1500),
          celulaCabecalho("Docentes Necessários", 1600),
          celulaCabecalho("Docentes Existentes (1.ª T)", 1800),
          celulaCabecalho("Turmas em 2.º Turno", 1600),
          celulaCabecalho("Turmas sem Docente", 1600),
          celulaCabecalho("Docentes c/ 2 Turmas", 1600),
          celulaCabecalho("Observação", 2538)
        ]
      })
    ];

    let turmasMap = {};
    try {
      if (typeof escola?.turmasClassesJSON === 'string') {
        turmasMap = JSON.parse(escola.turmasClassesJSON || '{}');
      } else if (typeof escola?.turmasClassesJSON === 'object') {
        turmasMap = escola.turmasClassesJSON || {};
      }
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
          if (tt.includes('+') || Number(d.totalHoras) > 24) {
            doc2T++;
          } else {
            doc1T++;
          }
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

      rowsTabela2.push(
        new TableRow({
          children: [
            celulaDados(item.nome, AlignmentType.LEFT, true, 2200),
            celulaDados(String(item.alunos), AlignmentType.CENTER, false, 1400),
            celulaDados(String(nTurmas), AlignmentType.CENTER, false, 1500),
            celulaDados(String(docNecess), AlignmentType.CENTER, false, 1600),
            celulaDados(String(doc1T), AlignmentType.CENTER, false, 1800),
            celulaDados(String(doc2T), AlignmentType.CENTER, false, 1600),
            celulaDados(String(turmasSemDoc), AlignmentType.CENTER, turmasSemDoc > 0, 1600, turmasSemDoc > 0 ? "FEE2E2" : null),
            celulaDados(String(doc2T), AlignmentType.CENTER, false, 1600),
            celulaDados(obsClasse, AlignmentType.LEFT, false, 2538)
          ]
        })
      );
    });

    // Linha de Total Geral Tabela 2
    rowsTabela2.push(
      new TableRow({
        children: [
          celulaDados("TOTAL GERAL", AlignmentType.CENTER, true, 2200, "D9E2F3"),
          celulaDados(String(totAlunos), AlignmentType.CENTER, true, 1400, "D9E2F3"),
          celulaDados(String(totTurmas), AlignmentType.CENTER, true, 1500, "D9E2F3"),
          celulaDados(String(totDocNecess), AlignmentType.CENTER, true, 1600, "D9E2F3"),
          celulaDados(String(totDocExist), AlignmentType.CENTER, true, 1800, "D9E2F3"),
          celulaDados(String(totTurmas2T), AlignmentType.CENTER, true, 1600, "D9E2F3"),
          celulaDados(String(totSemDoc), AlignmentType.CENTER, true, 1600, "D9E2F3"),
          celulaDados(String(totDoc2T), AlignmentType.CENTER, true, 1600, "D9E2F3"),
          celulaDados("Consolidado", AlignmentType.CENTER, true, 2538, "D9E2F3")
        ]
      })
    );

    childrenSections.push(
      new Table({
        rows: rowsTabela2,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }),
      new Paragraph({ text: "", spacing: { after: 250 } })
    );

    // Bloco de Assinaturas EP (Horizontal / Paisagem)
    childrenSections.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Inhassoro, aos ______ de ____________________ de ${anoLectivo}`, 
            font: "Arial", 
            size: 20 
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 180 }
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `A Directora / O Director da Escola e Coordenador(a) da ZIP n.º ${escola?.idZip || 1}`, 
            bold: true, 
            font: "Arial", 
            size: 20 
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 260 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "_________________________________________________________\n", bold: true, font: "Arial" }),
          new TextRun({ text: `${escola?.nomeDirector || "Dra. Albertina Mondlane"}\n`, bold: true, font: "Arial", size: 20 }),
          new TextRun({ text: `/${escola?.carreiraDirector || "DN3"}/`, italic: true, font: "Arial", size: 18 })
        ],
        alignment: AlignmentType.CENTER
      })
    );

  } else {
    // -------------------------------------------------------------
    // MODELO OFICIAL ESG / EB: MAPA 1.3 (DISTRIBUIÇÃO DA CARGA HORÁRIA)
    // -------------------------------------------------------------
    childrenSections.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `MAPA 1.3 — DISTRIBUIÇÃO DA CARGA HORÁRIA LECTIVA DOS DOCENTES (${anoLectivo})`, 
            bold: true, 
            size: 24, 
            underline: {}, 
            font: "Arial", 
            color: "000000" 
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Instituição / Escola: `, bold: true, size: 19, font: "Arial" }),
          new TextRun({ text: `${escola?.nomeOficial || "Escola Secundária de Inhassoro"}   |   `, size: 19, font: "Arial" }),
          new TextRun({ text: `Código da Escola (COD): `, bold: true, size: 19, font: "Arial" }),
          new TextRun({ text: `${escola?.codigoMEC || "30607"}   |   `, size: 19, font: "Arial" }),
          new TextRun({ text: `Ano Lectivo: `, bold: true, size: 19, font: "Arial" }),
          new TextRun({ text: `${anoLectivo}`, bold: true, size: 19, font: "Arial" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 }
      })
    );

    // Linhas da Tabela 1.3 em Paisagem com Cabeçalho Oficial Duplo (CD / CN)
    const tableRowsESG = [
      // Linha 1 do Cabeçalho Oficial MINEDH
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            rowSpan: 2,
            width: { size: 550, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(2) Nº", alignment: AlignmentType.CENTER, style: { bold: true } })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 2800, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(3) Nome do Docente", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 950, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(4) Carreira", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 1200, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(5) Vínculo (Quadro / Contratado)", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 1400, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(6) Disciplina", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            columnSpan: 2,
            width: { size: 1500, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(7) Funções de gestão (Dir, DAP, DT, DD, CC, CAA)", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            columnSpan: 2,
            width: { size: 1500, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(8) Classe (7ª a 12ª)", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            columnSpan: 2,
            width: { size: 1400, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(9) HL=Horas Lectivas (Presenciais+PESD)", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            columnSpan: 2,
            width: { size: 1300, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(10) HG=Horas de Gestão", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 900, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(11) Total Horas (THL+THG)", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 800, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(12) Factor 1.5", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 900, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(13) Horas Extras (HE)", alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 1538, type: WidthType.DXA },
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [new Paragraph({ text: "(14) Observações", alignment: AlignmentType.CENTER })]
          })
        ]
      }),
      // Linha 2 do Cabeçalho Oficial: Sub-colunas CD (Curso Diurno) e CN (Curso Nocturno)
      new TableRow({
        tableHeader: true,
        children: [
          celulaCabecalho("CD", 750, "1E4D7B"),
          celulaCabecalho("CN", 750, "1E4D7B"),
          celulaCabecalho("CD", 750, "1E4D7B"),
          celulaCabecalho("CN", 750, "1E4D7B"),
          celulaCabecalho("CD", 700, "1E4D7B"),
          celulaCabecalho("CN", 700, "1E4D7B"),
          celulaCabecalho("CD", 650, "1E4D7B"),
          celulaCabecalho("CN", 650, "1E4D7B")
        ]
      })
    ];

    let totalHL_CD = 0;
    let totalHL_CN = 0;
    let totalHG_CD = 0;
    let totalHG_CN = 0;
    let totalHoras = 0;
    let totalHE = 0;

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
        const hgCD = !isCN && hg > 0 ? hg : 0;
        const hgCN = isCN && hg > 0 ? hg : 0;

        totalHL_CD += hlCD;
        totalHL_CN += hlCN;
        totalHG_CD += hgCD;
        totalHG_CN += hgCN;
        totalHoras += tot;
        totalHE += he;

        let obs = d.observacoes || '';
        if (isEpEmHe && !obs.includes('Efectivo no EP')) {
          obs = `[Efectivo no EP — HE no ES] ${obs}`.trim();
        }

        tableRowsESG.push(
          new TableRow({
            children: [
              celulaDados(String(idx + 1), AlignmentType.CENTER, false, 550),
              celulaDados(d.nomeCompleto || d.nome_docente || '', AlignmentType.LEFT, true, 2800),
              celulaDados(carreiraTexto, AlignmentType.CENTER, false, 950),
              celulaDados(vinculoTexto, AlignmentType.CENTER, false, 1200),
              celulaDados(discTexto, AlignmentType.CENTER, false, 1400),
              celulaDados(!isCN && fgTexto !== '-' ? fgTexto : '-', AlignmentType.CENTER, false, 750),
              celulaDados(isCN && fgTexto !== '-' ? fgTexto : '-', AlignmentType.CENTER, false, 750),
              celulaDados(!isCN ? clTexto : '-', AlignmentType.CENTER, false, 750),
              celulaDados(isCN ? clTexto : '-', AlignmentType.CENTER, false, 750),
              celulaDados(String(hlCD), AlignmentType.CENTER, hlCD > 0, 700, hlCD > 0 ? "EFF6FF" : null),
              celulaDados(String(hlCN), AlignmentType.CENTER, hlCN > 0, 700, hlCN > 0 ? "EFF6FF" : null),
              celulaDados(hgCD > 0 ? String(hgCD) : '-', AlignmentType.CENTER, false, 650),
              celulaDados(hgCN > 0 ? String(hgCN) : '-', AlignmentType.CENTER, false, 650),
              celulaDados(String(tot), AlignmentType.CENTER, true, 900, "EFF6FF"),
              celulaDados('-', AlignmentType.CENTER, false, 800),
              celulaDados(String(he), AlignmentType.CENTER, he > 0, 900, he > 0 ? "FEF3C7" : null),
              celulaDados(obs, AlignmentType.LEFT, false, 1538)
            ]
          })
        );
      });
    } else {
      tableRowsESG.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 17,
              borders: BORDA_OFICIAL,
              children: [
                new Paragraph({
                  text: "Nenhum docente cadastrado nesta instituição até o momento.",
                  alignment: AlignmentType.CENTER
                })
              ]
            })
          ]
        })
      );
    }

    // Linha de Totais da Instituição ESG (17 colunas)
    tableRowsESG.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 9,
            shading: { fill: "D9E2F3" },
            borders: BORDA_OFICIAL,
            children: [
              new Paragraph({
                children: [new TextRun({ text: "TOTAL GERAL DA INSTITUIÇÃO:", bold: true, size: 18, font: "Arial" })],
                alignment: AlignmentType.RIGHT
              })
            ]
          }),
          celulaDados(String(totalHL_CD), AlignmentType.CENTER, true, 700, "D9E2F3"),
          celulaDados(String(totalHL_CN), AlignmentType.CENTER, true, 700, "D9E2F3"),
          celulaDados(String(totalHG_CD), AlignmentType.CENTER, true, 650, "D9E2F3"),
          celulaDados(String(totalHG_CN), AlignmentType.CENTER, true, 650, "D9E2F3"),
          celulaDados(String(totalHoras), AlignmentType.CENTER, true, 900, "D9E2F3"),
          celulaDados('-', AlignmentType.CENTER, true, 800, "D9E2F3"),
          celulaDados(String(totalHE), AlignmentType.CENTER, true, 900, "D9E2F3"),
          celulaDados("Consolidado ESG/EB", AlignmentType.CENTER, true, 1538, "D9E2F3")
        ]
      })
    );

    childrenSections.push(
      new Table({
        rows: tableRowsESG,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }),

      // Assinatura Oficial do Director da Escola (SEM Parecer Técnico e SEM Administrador do Distrito)
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Inhassoro, aos ______ de ____________________ de ${anoLectivo}`, 
            font: "Arial", 
            size: 20 
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200, after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `${(escola?.directorSexo === 'F' ? 'A Directora' : 'O Director')} da Escola` +
                  (escola?.isSedeZip ? ` e Coordenador(a) da ZIP n.º ${escola?.idZip || ''}` : ''), 
            bold: true, 
            font: "Arial", 
            size: 20 
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "_________________________________________________________\n", bold: true, font: "Arial" }),
          new TextRun({ text: `${escola?.nomeDirector || ""}\n`, bold: true, font: "Arial", size: 20 }),
          new TextRun({ text: `/${escola?.carreiraDirector || "DN1"}/`, italic: true, font: "Arial", size: 18 })
        ],
        alignment: AlignmentType.CENTER
      })
    );
  }

  // Criar Documento Word em ORIENTAÇÃO HORIZONTAL (LANDSCAPE) com Fundo BRANCO (#FFFFFF)
  const doc = new Document({
    background: {
      color: "FFFFFF"
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 16838, // A4 Paisagem / Landscape (297 mm)
              height: 11906, // A4 Paisagem / Landscape (210 mm)
              orientation: PageOrientation.LANDSCAPE
            },
            margin: {
              top: 400,
              bottom: 400,
              left: 500,
              right: 500
            }
          }
        },
        children: childrenSections
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  gerarDocumentoWordOficial
};
