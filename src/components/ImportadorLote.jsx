import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, FolderOpen, ArrowRight } from 'lucide-react';

export default function ImportadorLote({ ano }) {
  const [importing, setImporting] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSimularImportacao = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setResultado({
        arquivosDetectados: 3,
        escolasProcessadas: [
          { nome: 'Escola Secundária de Inhassoro', docentes: 24, status: 'SUCESSO' },
          { nome: 'Escola Básica 20 de Junho de Petane 2', docentes: 18, status: 'SUCESSO' },
          { nome: 'Escola Primária de Inhassoro', docentes: 15, status: 'SUCESSO' }
        ],
        totalDocentesCarregados: 57,
        pendencias: 0
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6 border-l-4 border-l-blue-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl">
            <UploadCloud size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Importador Automático em Lote (SDEJT Sede Distrital)
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Consolidação de ficheiros preenchidos enviados pelas escolas por PenDrive, WhatsApp ou Correio Electrónico
            </p>
          </div>
        </div>
      </div>

      {/* Zona de Drop e Instruções */}
      <div className="card p-8 text-center border-2 border-dashed border-slate-300 hover:border-blue-700 transition-all bg-slate-50/50">
        <div className="w-16 h-16 bg-blue-50 text-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <FolderOpen size={32} />
        </div>
        <h3 className="font-bold text-slate-900 text-base mb-1">
          Pasta de Recolha: <code className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs">Carga Horaria/Ficheiros_Recebidos_Escolas</code>
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6">
          Coloque os ficheiros enviados pelas escolas na pasta de recolha e clique no botão abaixo para processar e atualizar o banco SQLite distrital de forma segura.
        </p>

        <button
          onClick={handleSimularImportacao}
          disabled={importing}
          className="btn-primary text-sm py-3 px-6 shadow-md shadow-blue-900/20"
        >
          <UploadCloud size={18} />
          {importing ? 'Processando e Validando Ficheiros...' : 'Verificar e Importar Ficheiros da Pasta'}
        </button>
      </div>

      {/* Resultado da Importação */}
      {resultado && (
        <div className="card p-6 border-l-4 border-l-emerald-600 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 size={18} />
              Processamento Concluído com Sucesso!
            </div>
            <span className="badge badge-green">
              {resultado.totalDocentesCarregados} Docentes Validados
            </span>
          </div>

          <div className="space-y-2">
            {resultado.escolasProcessadas.map((e, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet size={15} className="text-blue-700" />
                  {e.nome}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{e.docentes} professores</span>
                  <span className="badge badge-green">Integrado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

