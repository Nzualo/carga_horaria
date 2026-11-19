// Motor de Cálculo Curricular e Normativo - SDEJT Inhassoro 2026
// Conforme com os normativos do Ministério da Educação e Cultura (MEC)

const CARGOS_GESTAO_PADRAO = {
  'DIR': { nome: 'Director da Escola', hg: 16 },
  'DAP': { nome: 'Director Adjunto Pedagógico', hg: 10 },
  'DD': { nome: 'Delegado de Disciplina', hg: 4 },
  'DT': { nome: 'Director de Turma', hg: 2 },
  'CC': { nome: 'Coordenador de Ciclo', hg: 2 },
  'CAA': { nome: 'Coord. Apoio e Aprendizagem', hg: 2 },
  'DESP': { nome: 'Desporto Escolar / Cultura', hg: 2 }
};

// Tempos lectivos semanais padrão por disciplina e classe (Moçambique)
const MATRIZ_DISCIPLINAS = {
  'Português': { '7ª': 5, '8ª': 5, '9ª': 5, '10ª': 5, '11ª Letras': 5, '11ª Ciências': 3, '12ª Letras': 5, '12ª Ciências': 3 },
  'Matemática': { '7ª': 5, '8ª': 5, '9ª': 5, '10ª': 5, '11ª Letras': 3, '11ª Ciências': 5, '12ª Letras': 3, '12ª Ciências': 5 },
  'Inglês': { '7ª': 5, '8ª': 3, '9ª': 3, '10ª': 3, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 },
  'Francês': { '7ª': 0, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 4, '11ª Ciências': 0, '12ª Letras': 4, '12ª Ciências': 0 },
  'História': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 4, '11ª Ciências': 2, '12ª Letras': 4, '12ª Ciências': 2 },
  'Geografia': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 4, '11ª Ciências': 2, '12ª Letras': 4, '12ª Ciências': 2 },
  'Filosofia': { '7ª': 0, '8ª': 0, '9ª': 0, '10ª': 0, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 },
  'Biologia': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 4, '12ª Letras': 2, '12ª Ciências': 4 },
  'Física': { '7ª': 0, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 4, '12ª Letras': 0, '12ª Ciências': 4 },
  'Química': { '7ª': 0, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 4, '12ª Letras': 0, '12ª Ciências': 4 },
  'Ed. Visual': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 3, '12ª Letras': 2, '12ª Ciências': 3 },
  'Ed. Física': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 2, '12ª Letras': 2, '12ª Ciências': 2 },
  'TIC / Informática': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 2, '12ª Letras': 2, '12ª Ciências': 2 },
  'Agropecuária': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 0, '12ª Letras': 0, '12ª Ciências': 0 },
  'Empreendedorismo': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 0, '12ª Letras': 0, '12ª Ciências': 0 },
  'IPP (Introdução à Psicopedagogia)': { '7ª': 0, '8ª': 0, '9ª': 0, '10ª': 0, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 },
  'Psicopedagogia': { '7ª': 0, '8ª': 0, '9ª': 0, '10ª': 0, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 }
};

// Calcula HG (Horas de Gestão)
function calcularHG(codCargo) {
  if (!codCargo) return 0;
  const tokens = String(codCargo).split(/[,;+\/]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
  let total = 0;
  const counted = new Set();
  for (const tok of tokens) {
    if (CARGOS_GESTAO_PADRAO[tok] && !counted.has(tok)) {
      total += CARGOS_GESTAO_PADRAO[tok].hg;
      counted.add(tok);
    } else if ((tok.includes('DIRECTOR DA ESCOLA') || tok === 'DIRETOR') && !counted.has('DIR')) {
      total += 16; counted.add('DIR');
    } else if (tok.includes('ADJUNTO') && !counted.has('DAP')) {
      total += 10; counted.add('DAP');
    } else if (tok.includes('DELEGADO') && !counted.has('DD')) {
      total += 4; counted.add('DD');
    } else if (tok.includes('TURMA') && !counted.has('DT')) {
      total += 2; counted.add('DT');
    } else if (tok.includes('CICLO') && !counted.has('CC')) {
      total += 2; counted.add('CC');
    } else if (tok.includes('APOIO') && !counted.has('CAA')) {
      total += 2; counted.add('CAA');
    } else if (tok.includes('DESP') && !counted.has('DESP')) {
      total += 2; counted.add('DESP');
    }
  }
  return total;
}

// Calcula Carga do Docente Completa
function calcularCargaDocente({ tipoEnsino, turmas, codCargo, codCargoGestao, horasLectivasManual, regimeEB, temposObrigatorios, matrizCustom }) {
  codCargo = codCargo || codCargoGestao || '';
  let hl = 0;
  let hg = 0;

  if (tipoEnsino === 'EP') {
    // No primário (EP): Director e DAP lecionam os 24 tempos normais.
    // 1 turma (regular, mista ou AEA) = 24h lectivas integrais
    // 2ª turma (duplo turno, incluindo turma de AEA) = +24h (horas extras bonificadas)
    const baseHorasPorTurma = 24;
    
    if (typeof horasLectivasManual === 'number' && horasLectivasManual > 0) {
      hl = horasLectivasManual;
    } else {
      hl = baseHorasPorTurma;
    }
    
    // Cargos no EP não reduzem a carga letiva obrigatória de 24h
    hg = 0;
  } else {
    // No Secundário ou EB_ES:
    hg = calcularHG(codCargo);
    const matrixToUse = matrizCustom || MATRIZ_DISCIPLINAS;
    if (Array.isArray(turmas) && turmas.length > 0) {
      for (const t of turmas) {
        const disc = t.disciplina;
        const classe = t.classe;
        const qtd = t.qtdTurmas || 1;
        let tempos = 2; // fallback padrão
        if (matrixToUse[disc] && matrixToUse[disc][classe] !== undefined) {
          tempos = matrixToUse[disc][classe];
        } else if (MATRIZ_DISCIPLINAS[disc] && MATRIZ_DISCIPLINAS[disc][classe] !== undefined) {
          tempos = MATRIZ_DISCIPLINAS[disc][classe];
        }
        hl += tempos * qtd;
      }
    } else if (typeof horasLectivasManual === 'number' && horasLectivasManual > 0) {
      hl = horasLectivasManual;
    }
  }

  const total = hl + hg;
  let he = 0;
  let statusSemaforo = 'VERDE';
  let mensagemSemaforo = 'Carga Horária Conforme';

  // REGRA ESPECIAL DAS ESCOLAS EB:
  // Se o professor é efectivo do EP e leciona no ES em regime de Horas Extras:
  if (regimeEB === 'EP_EM_HE') {
    he = total; // 100% das horas atribuídas no Secundário são Horas Extras
    statusSemaforo = 'VERDE';
    mensagemSemaforo = `Docente do EP em Regime de Horas Extras no Secundário (+${he}h HE)`;
  } else {
    const CARGA_OBRIGATORIA = Number(temposObrigatorios) || (tipoEnsino === 'EP' ? 24 : 20);
    he = total > CARGA_OBRIGATORIA ? total - CARGA_OBRIGATORIA : 0;

    if (total === 0) {
      statusSemaforo = 'VERMELHO';
      mensagemSemaforo = 'Sem Carga Horária';
    } else if (he > 0) {
      statusSemaforo = total > CARGA_OBRIGATORIA + 15 ? 'VERMELHO' : 'VERDE';
      mensagemSemaforo = `Sobrecarga (+${he}h HE)`;
    } else if (total < CARGA_OBRIGATORIA) {
      statusSemaforo = 'AMARELO';
      mensagemSemaforo = 'Não Completa';
    } else {
      statusSemaforo = 'VERDE';
      mensagemSemaforo = 'Carga Completa';
    }
  }

  return {
    horasLectivas: hl,
    horasGestao: hg,
    totalHoras: total,
    horasExtras: he,
    statusSemaforo,
    mensagemSemaforo
  };
}

module.exports = {
  CARGOS_GESTAO_PADRAO,
  MATRIZ_DISCIPLINAS,
  calcularHG,
  calcularCargaDocente
};

