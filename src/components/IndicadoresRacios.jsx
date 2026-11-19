import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, School, Layers, CheckCircle, AlertTriangle, 
  TrendingUp, Clock, Award, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

export default function IndicadoresRacios({ escola, ano }) {
  const [docentes, setDocentes] = useState([]);
  const [naoDocentes, setNaoDocentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docs, naoDocs] = await Promise.all([
          api.getDocentes ? api.getDocentes(escola?.id, ano) : Promise.resolve([]),
          api.getFuncionariosNaoDocentes ? api.getFuncionariosNaoDocentes(escola?.id, ano) : Promise.resolve([])
        ]);
        setDocentes(docs || []);
        setNaoDocentes(naoDocs || []);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados pedagógicos:', err);
        setLoading(false);
      }
    };

    if (escola?.id) fetchData();
  }, [escola?.id, ano]);

  // Cálculos de Rácios e Indicadores Pedagógicos Oficiais MINEDH
  const totalAlunosH = Number(escola?.totalAlunosH) || Math.round((Number(escola?.totalAlunos || 600) * 0.52));
  const totalAlunosM = Number(escola?.totalAlunosM) || Math.round((Number(escola?.totalAlunos || 600) * 0.48));
  const totalAlunosGeral = Number(escola?.totalAlunos) || (totalAlunosH + totalAlunosM);

  const totalProfessores = docentes.length || Number(escola?.totalDocentes || 14);

  // Parse das turmas por classe
  let turmasObj = {};
  try {
    if (typeof escola?.turmasClassesJSON === 'string') turmasObj = JSON.parse(escola.turmasClassesJSON || '{}');
    else if (typeof escola?.turmasClassesJSON === 'object') turmasObj = escola.turmasClassesJSON || {};
  } catch (e) {
    turmasObj = {};
  }

  const totalTurmas = Object.values(turmasObj).reduce((a, b) => Number(a || 0) + Number(b || 0), 0) || Number(escola?.totalTurmas || 12);

  // 1. Rácio Aluno / Professor
  const racioAlunoProfessor = totalProfessores > 0 ? Math.round(totalAlunosGeral / totalProfessores) : 0;

  // 2. Rácio Aluno / Turma
  const racioAlunoTurma = totalTurmas > 0 ? Math.round(totalAlunosGeral / totalTurmas) : 0;

  // 3. Taxa de Cobertura Curricular (% turmas atendidas por docentes)
  let turmasComDocente = 0;
  if (escola?.tipo === 'EP') {
    docentes.forEach(d => {
      turmasComDocente += (d.regimeGeral === 'DUPLO_TURNO' || (d.turma_2 && d.turma_2 !== 'Nenhuma')) ? 2 : 1;
    });
  } else {
    // No secundário, calcula a partir das turmas lectivas alocadas
    docentes.forEach(d => {
      turmasComDocente += Number(d.horasLectivas || 0) > 0 ? 1 : 0;
    });
  }
  const taxaCobertura = totalTurmas > 0 ? Math.min(100, Math.round((turmasComDocente / totalTurmas) * 100)) : 100;

  // 4. Índice de Duplo Turno da Instituição
  let turmasDuploTurno = 0;
  docentes.forEach(d => {
    if (d.regimeGeral === 'DUPLO_TURNO' || (d.turma_2 && d.turma_2 !== 'Nenhuma') || Number(d.horasExtras || 0) > 0) {
      turmasDuploTurno++;
    }
  });
  const indiceDuploTurno = totalTurmas > 0 ? Math.min(100, Math.round((turmasDuploTurno / totalTurmas) * 100)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Principal da Escola com Identificação Oficial */}
      <div className="card p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl border-l-4 border-l-blue-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <BarChart3 size={32} className="text-blue-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-800/60 border border-blue-600/40 text-[11px] font-semibold text-blue-200 mb-1">
                MINEDH • GOVERNO DO DISTRITO DE INHASSORO • SDEJT
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Quadro de Indicadores Pedagógicos e Rácios Oficiais
              </h1>
              <p className="text-slate-300 text-xs mt-0.5">
                {escola?.nomeOficial} (COD: {escola?.codigoMEC}) • Ano Lectivo {ano}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 shrink-0">
            <School size={16} className="text-blue-300" />
            <span className="text-xs font-bold">{escola?.tipo || 'Ensino Regular'}</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-blue-200">ZIP n.º {escola?.idZip || 1}</span>
          </div>
        </div>
      </div>

      {/* Os 4 Grandes Indicadores Oficiais Pedagógicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Rácio Aluno / Professor */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                1. Rácio Aluno / Professor
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{racioAlunoProfessor}</span>
                <span className="text-sm font-bold text-slate-500">: 1</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Meta MINEDH: 45:1</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              racioAlunoProfessor <= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {racioAlunoProfessor <= 50 ? 'Equilibrado' : 'Sobrecarga'}
            </span>
          </div>
        </div>

        {/* 2. Rácio Aluno / Turma */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                2. Rácio Aluno / Turma
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{racioAlunoTurma}</span>
                <span className="text-xs font-semibold text-slate-500">alunos/turma</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Layers size={20} />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Capacidade: 48</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              racioAlunoTurma <= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {racioAlunoTurma <= 50 ? 'Conforme' : 'Turmas Cheias'}
            </span>
          </div>
        </div>

        {/* 3. Taxa de Cobertura Curricular */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                3. Cobertura Curricular
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{taxaCobertura}</span>
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Turmas Atendidas</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              taxaCobertura >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {taxaCobertura >= 95 ? 'Integral (100%)' : 'Défice Docente'}
            </span>
          </div>
        </div>

        {/* 4. Índice de Duplo Turno */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                4. Índice Duplo Turno
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{indiceDuploTurno}</span>
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Funcionamento 2º Turno</span>
            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {turmasDuploTurno} Turmas
            </span>
          </div>
        </div>
      </div>

      {/* Detalhamento das Bases de Alunos, Turmas e Docência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composição Discente e Género */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-blue-700" />
              Efectivo Discente por Género (Alunos)
            </h3>
            <span className="text-xs font-bold text-slate-500">Total: {totalAlunosGeral}</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Rapazes (Homens): {totalAlunosH}</span>
                <span className="font-bold text-blue-900">
                  {totalAlunosGeral > 0 ? Math.round((totalAlunosH / totalAlunosGeral) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-800 rounded-full" 
                  style={{ width: `${totalAlunosGeral > 0 ? (totalAlunosH / totalAlunosGeral) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Raparigas (Mulheres): {totalAlunosM}</span>
                <span className="font-bold text-emerald-800">
                  {totalAlunosGeral > 0 ? Math.round((totalAlunosM / totalAlunosGeral) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full" 
                  style={{ width: `${totalAlunosGeral > 0 ? (totalAlunosM / totalAlunosGeral) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
            💡 <strong>Rácio de Paridade de Género:</strong> {totalAlunosM > 0 && totalAlunosH > 0 ? (totalAlunosM / totalAlunosH).toFixed(2) : '1.00'} (Equilíbrio entre raparigas e rapazes matriculados).
          </div>
        </div>

        {/* Quadro Institucional e Recursos Humanos */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <School size={16} className="text-blue-700" />
              Recursos Humanos e Organização Lectiva
            </h3>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {totalProfessores + naoDocentes.length} Trabalhadores
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 block">Docentes no Quadro Activo</span>
              <strong className="text-lg font-black text-slate-900 block mt-0.5">{totalProfessores}</strong>
              <span className="text-[10px] text-emerald-800 font-semibold">100% Carga Distribuída</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 block">Corpo Não Docente (CTA)</span>
              <strong className="text-lg font-black text-slate-900 block mt-0.5">{naoDocentes.length}</strong>
              <span className="text-[10px] text-slate-500">Secretaria e apoio</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 block">Total de Turmas Existentes</span>
              <strong className="text-lg font-black text-slate-900 block mt-0.5">{totalTurmas}</strong>
              <span className="text-[10px] text-blue-800 font-semibold">Turnos Manhã e Tarde</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 block">Turmas sem Docente</span>
              <strong className={`text-lg font-black block mt-0.5 ${totalTurmas - turmasComDocente > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {Math.max(0, totalTurmas - turmasComDocente)}
              </strong>
              <span className="text-[10px] font-semibold text-slate-500">
                {totalTurmas - turmasComDocente > 0 ? 'Requer Contratação' : '0 Défice'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
