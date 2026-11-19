// Corretor Inteligente de Acentuação Portuguesa e Nomes Moçambicanos — SDEJT Inhassoro v2.0

const DICIONARIO_ACENTOS = {
  // Nomes próprios muito comuns em Moçambique e língua portuguesa
  'candido': 'Cândido', 'candida': 'Cândida', 'jose': 'José', 'joao': 'João',
  'antonio': 'António', 'antonia': 'Antónia', 'inacio': 'Inácio', 'inacia': 'Inácia',
  'lucia': 'Lúcia', 'lucio': 'Lúcio', 'mario': 'Mário', 'maria': 'Maria',
  'sergio': 'Sérgio', 'fabio': 'Fábio', 'flavio': 'Flávio', 'flavia': 'Flávia',
  'eusebio': 'Eusébio', 'emilia': 'Emília', 'emilio': 'Emílio', 'emicia': 'Emícia',
  'amelia': 'Amélia', 'cecilia': 'Cecília', 'sonia': 'Sónia', 'monica': 'Mónica',
  'veronica': 'Verónica', 'patricia': 'Patrícia', 'patricio': 'Patrício',
  'leticia': 'Letícia', 'vitoria': 'Vitória', 'gloria': 'Glória', 'cesar': 'César',
  'andre': 'André', 'ines': 'Inês', 'tome': 'Tomé', 'salome': 'Salomé',
  'noe': 'Noé', 'moises': 'Moisés', 'luis': 'Luís', 'luisa': 'Luísa',
  'eloisa': 'Eloísa', 'helio': 'Hélio', 'celio': 'Célio', 'celia': 'Célia',
  'delio': 'Délio', 'delia': 'Délia', 'zelia': 'Zélia', 'nelia': 'Nélia',
  'adelia': 'Adélia', 'valerio': 'Valério', 'rogerio': 'Rogério', 'tiberio': 'Tibério',
  'alvaro': 'Álvaro', 'angelo': 'Ângelo', 'angela': 'Ângela', 'angelica': 'Angélica',
  'otavio': 'Otávio', 'octavio': 'Octávio', 'claudio': 'Cláudio', 'claudia': 'Cláudia',
  'braulio': 'Bráulio', 'isaias': 'Isaías', 'simao': 'Simão', 'sebastiao': 'Sebastião',
  'cristovao': 'Cristóvão', 'estevao': 'Estêvão', 'damiao': 'Damião', 'romao': 'Romão',
  'adao': 'Adão', 'abraao': 'Abraão', 'conceicao': 'Conceição', 'assuncao': 'Assunção',
  'encarnacao': 'Encarnação', 'anunciacao': 'Anunciação', 'graca': 'Graça',
  'fatima': 'Fátima', 'barbara': 'Bárbara', 'debora': 'Débora', 'jessica': 'Jéssica',
  'erica': 'Érica', 'vania': 'Vânia', 'tania': 'Tânia', 'nadia': 'Nádia',
  'katia': 'Kátia', 'catia': 'Cátia', 'silvia': 'Sílvia', 'silvio': 'Sílvio',
  'cintia': 'Cíntia', 'lidia': 'Lídia', 'nidia': 'Nídia', 'julia': 'Júlia',
  'julio': 'Júlio', 'marcio': 'Márcio', 'marcia': 'Márcia', 'dario': 'Dário',
  'dalia': 'Dália', 'eulalia': 'Eulália', 'natalia': 'Natália', 'rosalia': 'Rosália',
  'amalia': 'Amália', 'ofelia': 'Ofélia', 'aurelia': 'Aurélia', 'aurelio': 'Aurélio',
  'cornelio': 'Cornélio', 'virgilio': 'Virgílio', 'basilio': 'Basílio', 'abilio': 'Abílio',
  'otilia': 'Otília', 'marilia': 'Marília', 'lucilia': 'Lucília', 'ercilia': 'Ercília',
  'noemia': 'Noémia', 'eugenia': 'Eugénia', 'eugenio': 'Eugénio', 'ifigenia': 'Ifigénia',
  'arsenio': 'Arsénio', 'herminio': 'Hermínio', 'herminia': 'Hermínia',
  'plinio': 'Plínio', 'alipio': 'Alípio', 'olimpio': 'Olímpio', 'olimpia': 'Olímpia',
  'fabricio': 'Fabrício', 'mauricio': 'Maurício', 'dionisio': 'Dionísio',
  'tarcisio': 'Tarcísio', 'vinicius': 'Vinícius', 'felix': 'Félix', 'ruben': 'Rúben',
  'vitor': 'Vítor', 'hector': 'Héctor', 'oscar': 'Óscar', 'jeremias': 'Jeremias',
  'beatriz': 'Beatriz', 'sofia': 'Sofia', 'francisco': 'Francisco', 'francisca': 'Francisca',
  'alberto': 'Alberto', 'albertina': 'Albertina', 'augusto': 'Augusto', 'augusta': 'Augusta',
  'raimundo': 'Raimundo', 'ernesto': 'Ernesto', 'eduardo': 'Eduardo', 'fernando': 'Fernando',
  'armando': 'Armando', 'orlando': 'Orlando', 'ricardo': 'Ricardo', 'henrique': 'Henrique',
  'domingos': 'Domingos', 'domingas': 'Domingas', 'joaquim': 'Joaquim', 'joaquina': 'Joaquina',
  'manuel': 'Manuel', 'manuela': 'Manuela', 'samuel': 'Samuel', 'gabriel': 'Gabriel',
  'rafael': 'Rafael', 'miguel': 'Miguel', 'daniel': 'Daniel', 'daniela': 'Daniela',
  'isabel': 'Isabel', 'raquel': 'Raquel', 'ester': 'Ester', 'rute': 'Rute',
  'elisa': 'Elisa', 'elisabete': 'Elisabete', 'teresa': 'Teresa', 'helena': 'Helena',
  'carolina': 'Carolina', 'catarina': 'Catarina', 'margarida': 'Margarida',
  'filomena': 'Filomena', 'madalena': 'Madalena', 'hortencia': 'Hortênsia',
  'hortensia': 'Hortênsia', 'prudencia': 'Prudência', 'inocencio': 'Inocêncio',
  'inocencia': 'Inocência', 'florencio': 'Florêncio', 'florencia': 'Florência',
  'vicencia': 'Vicência', 'clemencia': 'Clemência', 'emerenciana': 'Emerenciana',
  'venancio': 'Venâncio', 'amancio': 'Amâncio', 'constancio': 'Constâncio',
  'constancia': 'Constância', 'anastacio': 'Anastácio', 'anastacia': 'Anastácia',
  'bonifacio': 'Bonifácio', 'horacio': 'Horácio', 'acio': 'Ácio',
  'cassia': 'Cássia', 'cassio': 'Cássio', 'tacio': 'Tácio',
  'baptista': 'Baptista', 'xavier': 'Xavier', 'teofilo': 'Teófilo',
  'teodosio': 'Teodósio', 'ambrosio': 'Ambrósio', 'custodio': 'Custódio',
  'custodia': 'Custódia', 'clotilde': 'Clotilde', 'matilde': 'Matilde',
  'alcides': 'Alcides', 'aristides': 'Aristides', 'euclides': 'Euclides',
  'leonidas': 'Leónidas', 'socrates': 'Sócrates', 'hipolito': 'Hipólito',
  'expedito': 'Expedito', 'benedito': 'Benedito', 'belisario': 'Belisário',
  'cesario': 'Cesário', 'rosario': 'Rosário', 'nazario': 'Nazário',
  'macario': 'Macário', 'januario': 'Januário', 'romario': 'Romário',
  'eliseu': 'Eliseu', 'mateus': 'Mateus', 'tadeu': 'Tadeu', 'romeu': 'Romeu',
  'irineu': 'Irineu', 'bartolomeu': 'Bartolomeu', 'timoteo': 'Timóteo',
  'doroteia': 'Doroteia', 'filoteia': 'Filoteia', 'matilde': 'Matilde',
  'gerson': 'Gérson', 'nelson': 'Nélson', 'wilson': 'Wilson', 'edson': 'Édson',
  'ivan': 'Ivan', 'ivone': 'Ivone', 'yara': 'Yara', 'lara': 'Lara', 'sara': 'Sara',
  'clara': 'Clara', 'dora': 'Dora', 'nora': 'Nora', 'flora': 'Flora', 'laura': 'Laura',
  'paula': 'Paula', 'paulo': 'Paulo', 'saulo': 'Saulo', 'mauro': 'Mauro', 'maura': 'Maura',
  'tomas': 'Tomás', 'nicolau': 'Nicolau', 'stanislau': 'Estanislau', 'venceslau': 'Venceslau',
  'ladislau': 'Ladislau', 'jonas': 'Jonas', 'lucas': 'Lucas', 'marcos': 'Marcos',
  'matias': 'Matias', 'elias': 'Elias', 'tobias': 'Tobias', 'zacarias': 'Zacarias',
  'messias': 'Messias', 'osias': 'Osias', 'josias': 'Josias', 'ozias': 'Ozias',
  'neemias': 'Neemias', 'ananias': 'Ananias', 'uri': 'Uri', 'urias': 'Urias',
  'david': 'David', 'davi': 'Davi', 'levi': 'Levi', 'saul': 'Saul', 'raul': 'Raul',

  // Palavras institucionais, disciplinas, cargos e observações em português
  'educacao': 'educação', 'gestao': 'gestão', 'direccao': 'direcção', 'direcao': 'direcção',
  'administracao': 'administração', 'pedagogico': 'pedagógico', 'pedagogica': 'pedagógica',
  'tecnico': 'técnico', 'tecnica': 'técnica', 'basica': 'básica', 'basico': 'básico',
  'primaria': 'primária', 'primario': 'primário', 'secundaria': 'secundária', 'secundario': 'secundário',
  'matematica': 'matemática', 'portugues': 'português', 'ingles': 'inglês', 'frances': 'francês',
  'historia': 'história', 'fisica': 'física', 'quimica': 'química', 'informatica': 'informática',
  'agropecuaria': 'agropecuária', 'observacao': 'observação', 'observacoes': 'observações',
  'horario': 'horário', 'horaria': 'horária', 'continuo': 'contínuo', 'continua': 'contínua',
  'vigilancia': 'vigilância', 'servico': 'serviço', 'servicos': 'serviços',
  'funcionario': 'funcionário', 'funcionaria': 'funcionária', 'funcionarios': 'funcionários',
  'provincia': 'província', 'republica': 'república', 'mocambique': 'Moçambique',
  'numero': 'número', 'codigo': 'código', 'unico': 'único', 'unica': 'única',
  'area': 'área', 'medio': 'médio', 'media': 'média', 'nivel': 'nível',
  'vinculo': 'vínculo', 'obrigatorio': 'obrigatório', 'obrigatoria': 'obrigatória',
  'obrigatorias': 'obrigatórias', 'extraordinario': 'extraordinário',
  'transferencia': 'transferência', 'notificacao': 'notificação',
  'atribuicao': 'atribuição', 'distribuicao': 'distribuição', 'situacao': 'situação',
  'formacao': 'formação', 'coordenacao': 'coordenação', 'seccao': 'secção',
  'reparticao': 'repartição', 'substituicao': 'substituição', 'ferias': 'férias',
  'licenca': 'licença', 'doenca': 'doença', 'ausencia': 'ausência',
  'assistencia': 'assistência', 'conferencia': 'conferência', 'referencia': 'referência',
  'experiencia': 'experiência', 'ciencia': 'ciência', 'ciencias': 'ciências',
  'psicopedagogia': 'psicopedagogia', 'introducao': 'introdução',
  'monodocencia': 'monodocência', 'alfabetizacao': 'alfabetização',
  'instituicao': 'instituição', 'organica': 'orgânica', 'publica': 'pública', 'publico': 'público',
  'estagio': 'estágio', 'temporario': 'temporário', 'temporaria': 'temporária',
  'salario': 'salário', 'auxilio': 'auxílio', 'periodo': 'período',
  'trimestre': 'trimestre', 'semestre': 'semestre', 'exercicio': 'exercício',
  'avaliacao': 'avaliação', 'homologacao': 'homologação', 'confirmacao': 'confirmação',
  'verificacao': 'verificação', 'actualizacao': 'actualização', 'atualizacao': 'actualização',
  'informacao': 'informação', 'informacoes': 'informações', 'comunicacao': 'comunicação',
  'localizacao': 'localização', 'observacao': 'observação', 'justificacao': 'justificação',
  'nao': 'não', 'tambem': 'também', 'ja': 'já', 'ate': 'até', 'apos': 'após',
  'so': 'só', 'tres': 'três', 'mes': 'mês', 'sera': 'será', 'esta': 'está',
  'estao': 'estão', 'sao': 'são', 'entao': 'então', 'alem': 'além',
  'porem': 'porém', 'atraves': 'através', 'varios': 'vários', 'varias': 'várias',
  'proprio': 'próprio', 'propria': 'própria', 'proximo': 'próximo', 'proxima': 'próxima',
  'ultimo': 'último', 'ultima': 'última', 'minimo': 'mínimo', 'minima': 'mínima',
  'maximo': 'máximo', 'maxima': 'máxima', 'valido': 'válido', 'valida': 'válida',
  'invalido': 'inválido', 'invalida': 'inválida', 'disponivel': 'disponível',
  'responsavel': 'responsável', 'possivel': 'possível', 'impossivel': 'impossível',
  'necessario': 'necessário', 'necessaria': 'necessária', 'suplementar': 'suplementar',
  'defice': 'défice', 'deficit': 'défice', 'balanco': 'balanço', 'orcamento': 'orçamento',
  'relatorio': 'relatório', 'estatistica': 'estatística', 'estatisticas': 'estatísticas',
  'grafico': 'gráfico', 'graficos': 'gráficos', 'resumo': 'resumo', 'modulo': 'módulo',
  'capitulo': 'capítulo', 'titulo': 'título', 'subtitulo': 'subtítulo'
};

function aplicarCaixa(original, corrigida) {
  if (original === original.toUpperCase() && original.length > 1) {
    return corrigida.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return corrigida.charAt(0).toUpperCase() + corrigida.slice(1);
  }
  return corrigida.toLowerCase();
}

function corrigirAcentuacaoPT(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto.replace(/[A-Za-zÀ-ÿ]+/g, (palavra) => {
    // Se já tem acento, mantém intacta
    if (/[À-ÿ]/.test(palavra)) return palavra;
    const chave = palavra.toLowerCase();
    const match = DICIONARIO_ACENTOS[chave];
    if (!match) return palavra;
    return aplicarCaixa(palavra, match);
  });
}

module.exports = { corrigirAcentuacaoPT, DICIONARIO_ACENTOS };
