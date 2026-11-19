import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ExportadorOffice({ escola, ano }) {
  const isSDEJT = escola?.tipo === 'SDEJT';
  const [mapaTipo, setMapaTipo] = useState(isSDEJT ? '1.3' : (escola?.tipo === 'EP' ? '1.1' : '1.3'));
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (formato) => {
    setDownloading(true);
    const url = formato === 'word'
      ? api.getExportWordUrl(escola?.id, ano, mapaTipo)
      : api.getExportExcelUrl(escola?.id, ano, mapaTipo);

    // Disparar download direto
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="card p-6 border-l-4 border-l-blue-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl">
            <Printer size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Central de Exportação e Emissão de Documentos Oficiais
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Geração com 1 clique de ficheiros oficiais nos formatos Microsoft Word (.docx) e Microsoft Excel (.xlsx)
            </p>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          Instituição Selecionada: <strong>{escola?.nomeOficial}</strong> • Ano Lectivo: <strong>{ano}</strong>
        </div>
      </div>

      {/* Seleção do Mapa */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          1. Escolha o Tipo de Documento / Mapa a Emitir:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(!escola || escola.tipo !== 'EP') && (
            <div
              onClick={() => setMapaTipo('1.3')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mapaTipo === '1.3'
                  ? 'border-blue-700 bg-blue-50/60 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">Mapa 1.3 Oficial</span>
                {mapaTipo === '1.3' && <CheckCircle2 size={18} className="text-blue-700" />}
              </div>
              <p className="text-xs text-slate-500">
                Distribuição da Carga Horária e Efectivos Docentes (ESG / EB) com balanço de horas extras.
              </p>
            </div>
          )}

          {(!escola || escola.tipo !== 'ESG1 e 2' && escola.tipo !== 'ESG2') && (
            <div
              onClick={() => setMapaTipo('1.1')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mapaTipo === '1.1'
                  ? 'border-blue-700 bg-blue-50/60 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">Mapa 1.1 e 2.1 EP</span>
                {mapaTipo === '1.1' && <CheckCircle2 size={18} className="text-blue-700" />}
              </div>
              <p className="text-xs text-slate-500">
                Distribuição de Turmas e Professores do Ensino Primário (1ª à 6ª classe em Monodocência).
              </p>
            </div>
          )}

          <div
            onClick={() => setMapaTipo('2.3')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              mapaTipo === '2.3'
                ? 'border-blue-700 bg-blue-50/60 shadow-md'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">Mapa 2.3 Resumo</span>
              {mapaTipo === '2.3' && <CheckCircle2 size={18} className="text-blue-700" />}
            </div>
            <p className="text-xs text-slate-500">
              Carga Horária Consolidada por Disciplina e necessidade de novos professores.
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Descarga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exportar Word */}
        <div className="card p-6 flex flex-col justify-between hover:shadow-lg transition-all border-slate-200">
          <div>
            <div className="w-12 h-12 bg-blue-100 text-blue-900 rounded-xl flex items-center justify-center mb-4">
              <FileText size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Documento Oficial em Word (.docx)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gera documento oficial horizontal (paisagem) no Microsoft Word com o <strong>Emblema Oficial da República de Moçambique</strong>,
              cabeçalho ministerial do MINEDH / SDEJT de Inhassoro, tabela de docentes (com subdivisões CD e CN) e bloco de assinatura oficial da Direcção da Escola.
            </p>
          </div>

          <button
            onClick={() => handleDownload('word')}
            disabled={downloading}
            className="btn-primary w-full justify-center mt-6 text-sm py-3"
          >
            <Download size={18} />
            {downloading ? 'Gerando Documento...' : 'Descarregar Documento Word (.docx)'}
          </button>
        </div>

        {/* Exportar Excel */}
        <div className="card p-6 flex flex-col justify-between hover:shadow-lg transition-all border-slate-200">
          <div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Mapa Formatado em Excel (.xlsx)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gera a folha de cálculo oficial do Ministério da Educação (MINEDH) pronta a abrir no Microsoft Excel,
              com <strong>todas as colunas oficiais, grelhas azuis, fórmulas de SOMA e cálculo automático de horas extras</strong>.
            </p>
          </div>

          <button
            onClick={() => handleDownload('excel')}
            disabled={downloading}
            className="btn-success w-full justify-center mt-6 text-sm py-3"
          >
            <Download size={18} />
            {downloading ? 'Gerando Folha...' : 'Descarregar Folha Excel (.xlsx)'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900">
        <ShieldCheck size={20} className="text-blue-800 shrink-0" />
        <span>
          Os ficheiros gerados respeitam a estrutura formal de auditoria do Ministério da Educação e Desenvolvimento Humano (MINEDH) e da Direcção Provincial da Educação de Inhambane.
        </span>
      </div>
    </div>
  );
}

