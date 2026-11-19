import React, { useState, useEffect } from 'react';
import { BookOpen, Check, Edit2, Save, RotateCcw, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const MATRIZ_INICIAL_FALLBACK = [
  { disciplina: 'Português', c7: 5, c8: 5, c9: 5, c10: 5, c11L: 5, c11C: 3, c12L: 5, c12C: 3 },
  { disciplina: 'Matemática', c7: 5, c8: 5, c9: 5, c10: 5, c11L: 3, c11C: 5, c12L: 3, c12C: 5 },
  { disciplina: 'Inglês', c7: 5, c8: 3, c9: 3, c10: 3, c11L: 3, c11C: 2, c12L: 3, c12C: 2 },
  { disciplina: 'Francês', c7: 0, c8: 2, c9: 2, c10: 2, c11L: 4, c11C: 0, c12L: 4, c12C: 0 },
  { disciplina: 'História', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 4, c11C: 2, c12L: 4, c12C: 2 },
  { disciplina: 'Geografia', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 4, c11C: 2, c12L: 4, c12C: 2 },
  { disciplina: 'Filosofia', c7: 0, c8: 0, c9: 0, c10: 0, c11L: 3, c11C: 2, c12L: 3, c12C: 2 },
  { disciplina: 'Biologia', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 2, c11C: 4, c12L: 2, c12C: 4 },
  { disciplina: 'Física', c7: 0, c8: 2, c9: 2, c10: 2, c11L: 0, c11C: 4, c12L: 0, c12C: 4 },
  { disciplina: 'Química', c7: 0, c8: 2, c9: 2, c10: 2, c11L: 0, c11C: 4, c12L: 0, c12C: 4 },
  { disciplina: 'Ed. Visual', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 2, c11C: 3, c12L: 2, c12C: 3 },
  { disciplina: 'Ed. Física', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 2, c11C: 2, c12L: 2, c12C: 2 },
  { disciplina: 'TIC / Informática', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 2, c11C: 2, c12L: 2, c12C: 2 },
  { disciplina: 'Agropecuária', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 0, c11C: 0, c12L: 0, c12C: 0 },
  { disciplina: 'Empreendedorismo', c7: 2, c8: 2, c9: 2, c10: 2, c11L: 0, c11C: 0, c12L: 0, c12C: 0 },
  { disciplina: 'IPP (Introdução à Psicopedagogia)', c7: 0, c8: 0, c9: 0, c10: 0, c11L: 3, c11C: 2, c12L: 3, c12C: 2 }
];

export default function MatrizCurricularES({ ano = 2026, isSDEJT = true }) {
  const [matriz, setMatriz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Carregar dados da Matriz da BD
  useEffect(() => {
    loadMatriz();
  }, []);

  const loadMatriz = async () => {
    try {
      setLoading(true);
      const data = await api.getMatrizCurricular();
      if (Array.isArray(data) && data.length > 0) {
        setMatriz(data);
      } else {
        setMatriz(MATRIZ_INICIAL_FALLBACK);
      }
    } catch (err) {
      console.error('Erro ao carregar matriz curricular:', err);
      setMatriz(MATRIZ_INICIAL_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeValor = (index, campo, valor) => {
    const parsed = Math.max(0, parseInt(valor, 10) || 0);
    setMatriz(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: parsed };
      return copy;
    });
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      setMensagemSucesso('');
      setMensagemErro('');

      const res = await api.salvarMatrizCurricular(matriz, ano);
      setMensagemSucesso(res.message || 'Matriz curricular salva e fórmulas recalculadas!');
      setModoEdicao(false);
      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao guardar matriz curricular');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 text-xs">
        A carregar Plano Curricular Oficial e tempos semanais...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Banner Principal com Controles de Gestão */}
      <div className="card p-5 border-l-4 border-l-blue-800 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-blue">Normativo Curricular Oficial</span>
            <span className="badge badge-green">Recálculo Automático Activo</span>
            <span className="badge badge-slate">Ano Lectivo {ano}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-blue-800" size={22} />
            Plano Curricular e Matriz de Tempos Lectivos Semanais (MINEDH)
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Ao alterar a carga de qualquer disciplina, o sistema recalcula instantaneamente os horários e horas extras de todos os professores do distrito.
          </p>
        </div>

        {isSDEJT && (
          <div className="flex items-center gap-2">
            {!modoEdicao ? (
              <button
                type="button"
                onClick={() => setModoEdicao(true)}
                className="btn-primary text-xs flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Edit2 size={15} />
                Editar Carga Horária das Disciplinas
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setModoEdicao(false);
                    loadMatriz();
                  }}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSalvar}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Recalculando...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Salvar e Recalcular Fórmulas
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alertas de Sucesso / Erro */}
      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Tabela da Matriz Curricular */}
      <div className="card overflow-hidden shadow-sm border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Tempos Semanais por Turma ({matriz.length} Disciplinas Oficiais Mapeadas)
          </span>
          {modoEdicao && (
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1 animate-pulse">
              <Sparkles size={14} /> Modo de Edição Aberto — Altere os números nas caixas
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 min-w-[200px]">Disciplina</th>
                <th className="py-3 px-2 text-center w-20">7ª Classe</th>
                <th className="py-3 px-2 text-center w-20">8ª Classe</th>
                <th className="py-3 px-2 text-center w-20">9ª Classe</th>
                <th className="py-3 px-2 text-center w-20">10ª Classe</th>
                <th className="py-3 px-2 text-center w-24 bg-blue-50/70 text-blue-900 border-x border-blue-100">11ª Letras</th>
                <th className="py-3 px-2 text-center w-24 bg-emerald-50/70 text-emerald-900 border-r border-emerald-100">11ª Ciências</th>
                <th className="py-3 px-2 text-center w-24 bg-blue-50/70 text-blue-900 border-r border-blue-100">12ª Letras</th>
                <th className="py-3 px-2 text-center w-24 bg-emerald-50/70 text-emerald-900">12ª Ciências</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {matriz.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {m.disciplina}
                    {m.disciplina.includes('Psicopedagogia') && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Nova
                      </span>
                    )}
                  </td>

                  {/* 7ª a 10ª */}
                  {['c7', 'c8', 'c9', 'c10'].map(col => (
                    <td key={col} className="py-2 px-2 text-center">
                      {modoEdicao ? (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={m[col]}
                          onChange={(e) => handleChangeValor(idx, col, e.target.value)}
                          className="w-14 text-center font-bold text-xs py-1 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20"
                        />
                      ) : (
                        <span className={`font-semibold ${m[col] > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                          {m[col] > 0 ? `${m[col]}h` : '-'}
                        </span>
                      )}
                    </td>
                  ))}

                  {/* 11ª Letras */}
                  <td className="py-2 px-2 text-center bg-blue-50/30 border-x border-blue-100/50">
                    {modoEdicao ? (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={m.c11L}
                        onChange={(e) => handleChangeValor(idx, 'c11L', e.target.value)}
                        className="w-14 text-center font-bold text-xs py-1 border border-blue-300 rounded-lg bg-white text-blue-900 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <span className={`font-bold ${m.c11L > 0 ? 'text-blue-900' : 'text-slate-300'}`}>
                        {m.c11L > 0 ? `${m.c11L}h` : '-'}
                      </span>
                    )}
                  </td>

                  {/* 11ª Ciências */}
                  <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100/50">
                    {modoEdicao ? (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={m.c11C}
                        onChange={(e) => handleChangeValor(idx, 'c11C', e.target.value)}
                        className="w-14 text-center font-bold text-xs py-1 border border-emerald-300 rounded-lg bg-white text-emerald-900 focus:ring-1 focus:ring-emerald-500/20"
                      />
                    ) : (
                      <span className={`font-bold ${m.c11C > 0 ? 'text-emerald-900' : 'text-slate-300'}`}>
                        {m.c11C > 0 ? `${m.c11C}h` : '-'}
                      </span>
                    )}
                  </td>

                  {/* 12ª Letras */}
                  <td className="py-2 px-2 text-center bg-blue-50/30 border-r border-blue-100/50">
                    {modoEdicao ? (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={m.c12L}
                        onChange={(e) => handleChangeValor(idx, 'c12L', e.target.value)}
                        className="w-14 text-center font-bold text-xs py-1 border border-blue-300 rounded-lg bg-white text-blue-900 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <span className={`font-bold ${m.c12L > 0 ? 'text-blue-900' : 'text-slate-300'}`}>
                        {m.c12L > 0 ? `${m.c12L}h` : '-'}
                      </span>
                    )}
                  </td>

                  {/* 12ª Ciências */}
                  <td className="py-2 px-2 text-center bg-emerald-50/30">
                    {modoEdicao ? (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={m.c12C}
                        onChange={(e) => handleChangeValor(idx, 'c12C', e.target.value)}
                        className="w-14 text-center font-bold text-xs py-1 border border-emerald-300 rounded-lg bg-white text-emerald-900 focus:ring-1 focus:ring-emerald-500/20"
                      />
                    ) : (
                      <span className={`font-bold ${m.c12C > 0 ? 'text-emerald-900' : 'text-slate-300'}`}>
                        {m.c12C > 0 ? `${m.c12C}h` : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

