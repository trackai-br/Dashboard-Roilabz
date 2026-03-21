/**
 * Catalogo de erros da Meta Graph API.
 * Mapeia error_code + error_subcode para mensagens em PT-BR com acoes sugeridas.
 *
 * Referencia: https://developers.facebook.com/docs/marketing-api/error-reference
 */

export interface CatalogedError {
  title: string;
  description: string;
  action: string;
  severity: 'warning' | 'error' | 'critical';
}

interface ErrorPattern {
  code?: number;
  subcode?: number;
  messagePattern?: RegExp;
  catalog: CatalogedError;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // ---- Auth / Token ----
  {
    code: 190,
    catalog: {
      title: 'Token expirado ou invalido',
      description: 'O token de acesso ao Meta expirou ou foi revogado.',
      action: 'Va em Conexoes e reconecte sua conta do Facebook/Meta.',
      severity: 'critical',
    },
  },
  {
    code: 190,
    subcode: 463,
    catalog: {
      title: 'Token expirado',
      description: 'O token de acesso expirou. Tokens duram ~60 dias.',
      action: 'Va em Conexoes e reconecte sua conta do Facebook/Meta.',
      severity: 'critical',
    },
  },
  {
    code: 190,
    subcode: 467,
    catalog: {
      title: 'Token invalido',
      description: 'O token foi invalidado porque o usuario mudou a senha ou removeu o app.',
      action: 'Va em Conexoes e reconecte sua conta do Facebook/Meta.',
      severity: 'critical',
    },
  },

  // ---- Permissoes ----
  {
    code: 10,
    catalog: {
      title: 'Permissao insuficiente',
      description: 'O app nao tem permissao para executar esta acao nesta conta.',
      action: 'Verifique se sua conta tem acesso de anunciante a esta conta de anuncios e se as permissoes do app estao corretas.',
      severity: 'critical',
    },
  },
  {
    code: 200,
    catalog: {
      title: 'Permissao negada',
      description: 'Voce nao tem permissao para criar campanhas nesta conta de anuncios.',
      action: 'Verifique no Business Manager se voce tem papel de Anunciante ou Admin na conta.',
      severity: 'critical',
    },
  },
  {
    code: 294,
    catalog: {
      title: 'Conta nao gerenciada',
      description: 'Esta conta de anuncios nao esta vinculada ao seu Business Manager.',
      action: 'Adicione a conta de anuncios ao seu Business Manager antes de criar campanhas.',
      severity: 'error',
    },
  },

  // ---- Rate Limiting ----
  {
    code: 17,
    catalog: {
      title: 'Limite de requisicoes atingido',
      description: 'A Meta bloqueou temporariamente as chamadas por excesso de requisicoes.',
      action: 'Aguarde alguns minutos e tente novamente. O sistema ja tenta retry automatico.',
      severity: 'warning',
    },
  },
  {
    code: 32,
    catalog: {
      title: 'Limite de chamadas da API',
      description: 'Excedeu o limite de chamadas por hora para esta conta.',
      action: 'Aguarde 1 hora ou reduza o numero de campanhas por leva.',
      severity: 'warning',
    },
  },
  {
    code: 4,
    catalog: {
      title: 'Muitas chamadas simultaneas',
      description: 'O volume de requisicoes excedeu o limite do app.',
      action: 'Aguarde alguns minutos e tente novamente com menos campanhas.',
      severity: 'warning',
    },
  },

  // ---- Conta de Anuncios ----
  {
    code: 1487930,
    catalog: {
      title: 'Conta de anuncios desativada',
      description: 'Esta conta de anuncios esta desativada ou bloqueada pela Meta.',
      action: 'Verifique o status da conta no Meta Business Suite. Pode ser necessario apelar a revisao.',
      severity: 'critical',
    },
  },
  {
    code: 100,
    subcode: 1487171,
    catalog: {
      title: 'Conta sem metodo de pagamento',
      description: 'A conta de anuncios nao tem um metodo de pagamento configurado.',
      action: 'Adicione um cartao de credito ou metodo de pagamento na conta antes de criar campanhas.',
      severity: 'error',
    },
  },

  // ---- Campanha ----
  {
    code: 100,
    subcode: 1885024,
    catalog: {
      title: 'Objetivo de campanha invalido',
      description: 'O objetivo escolhido nao e valido para esta conta ou tipo de campanha.',
      action: 'Tente outro objetivo (ex: OUTCOME_SALES, OUTCOME_TRAFFIC).',
      severity: 'error',
    },
  },
  {
    code: 100,
    subcode: 1487851,
    catalog: {
      title: 'Limite de campanhas atingido',
      description: 'Esta conta atingiu o limite maximo de campanhas permitidas.',
      action: 'Exclua ou archive campanhas antigas antes de criar novas.',
      severity: 'error',
    },
  },

  // ---- Adset ----
  {
    code: 100,
    subcode: 1487366,
    catalog: {
      title: 'Orcamento muito baixo',
      description: 'O orcamento diario e menor que o minimo exigido pela Meta.',
      action: 'Aumente o orcamento diario. O minimo geralmente e R$ 5,00/dia por adset.',
      severity: 'error',
    },
  },
  {
    code: 100,
    subcode: 1487620,
    catalog: {
      title: 'Pixel nao encontrado',
      description: 'O pixel informado nao existe ou nao pertence a esta conta.',
      action: 'Sincronize suas contas novamente e selecione um pixel valido no passo de Conjuntos.',
      severity: 'error',
    },
  },
  {
    code: 100,
    subcode: 1815684,
    catalog: {
      title: 'Evento de conversao invalido',
      description: 'O evento de conversao escolhido nao e compativel com o objetivo da campanha.',
      action: 'Troque o evento de conversao (ex: PURCHASE, LEAD) ou altere o objetivo.',
      severity: 'error',
    },
  },
  {
    code: 100,
    subcode: 1487564,
    catalog: {
      title: 'Segmentacao invalida',
      description: 'A segmentacao geografica ou demografica esta incorreta.',
      action: 'Verifique os paises selecionados nos Conjuntos de Anuncios.',
      severity: 'error',
    },
  },

  // ---- Ad / Creative ----
  {
    code: 100,
    subcode: 1487204,
    catalog: {
      title: 'Pagina nao autorizada',
      description: 'Voce nao tem permissao para criar anuncios usando esta Pagina do Facebook.',
      action: 'Verifique se a Pagina esta conectada a conta de anuncios no Business Manager.',
      severity: 'error',
    },
  },
  {
    code: 100,
    subcode: 1487289,
    catalog: {
      title: 'Criativo invalido',
      description: 'O criativo do anuncio esta incompleto ou invalido.',
      action: 'Verifique se a URL de destino, textos e midia estao preenchidos corretamente.',
      severity: 'error',
    },
  },
  {
    code: 100,
    subcode: 1487346,
    catalog: {
      title: 'URL de destino invalida',
      description: 'A URL de destino do anuncio nao e valida ou esta bloqueada.',
      action: 'Verifique se a URL comeca com https:// e se o site esta acessivel.',
      severity: 'error',
    },
  },

  // ---- Bid Strategy ----
  {
    code: 100,
    subcode: 1487479,
    catalog: {
      title: 'Bid cap muito baixo',
      description: 'O valor do bid cap esta abaixo do minimo permitido.',
      action: 'Aumente o valor do bid cap ou mude para a estrategia Volume Mais Alto.',
      severity: 'error',
    },
  },

  // ---- Generic / Fallbacks ----
  {
    code: 100,
    catalog: {
      title: 'Parametro invalido',
      description: 'Um dos parametros enviados para a Meta API esta incorreto.',
      action: 'Revise a configuracao da campanha. Detalhes do erro abaixo.',
      severity: 'error',
    },
  },
  {
    code: 2,
    catalog: {
      title: 'Erro temporario da Meta',
      description: 'A Meta retornou um erro de servidor. Isso geralmente e temporario.',
      action: 'Aguarde alguns minutos e tente novamente.',
      severity: 'warning',
    },
  },
  {
    code: 1,
    catalog: {
      title: 'Erro desconhecido da Meta',
      description: 'A Meta retornou um erro generico sem detalhes.',
      action: 'Tente novamente. Se persistir, verifique o status da sua conta no Meta Business Suite.',
      severity: 'warning',
    },
  },

  // ---- Message pattern fallbacks ----
  {
    messagePattern: /token/i,
    catalog: {
      title: 'Problema com token de acesso',
      description: 'Ocorreu um erro relacionado ao token de autenticacao.',
      action: 'Va em Conexoes e reconecte sua conta do Facebook/Meta.',
      severity: 'critical',
    },
  },
  {
    messagePattern: /rate limit/i,
    catalog: {
      title: 'Limite de requisicoes',
      description: 'A Meta bloqueou as chamadas temporariamente.',
      action: 'Aguarde alguns minutos e tente novamente.',
      severity: 'warning',
    },
  },
  {
    messagePattern: /permission/i,
    catalog: {
      title: 'Sem permissao',
      description: 'Voce nao tem permissao para esta acao.',
      action: 'Verifique suas permissoes na conta de anuncios no Business Manager.',
      severity: 'critical',
    },
  },
  {
    messagePattern: /disabled/i,
    catalog: {
      title: 'Conta desativada',
      description: 'A conta de anuncios esta desativada.',
      action: 'Verifique o status da conta no Meta Business Suite.',
      severity: 'critical',
    },
  },
];

/**
 * Structured error from Meta Graph API.
 */
export interface MetaGraphError {
  message: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
  step?: 'campaign' | 'adset' | 'ad';
}

/**
 * Busca no catalogo o erro mais especifico que corresponde ao erro da Meta.
 * Prioridade: code+subcode > code > messagePattern > fallback generico.
 */
export function lookupError(error: MetaGraphError): CatalogedError {
  // 1. Match by code + subcode (most specific)
  if (error.code !== undefined && error.error_subcode !== undefined) {
    const match = ERROR_PATTERNS.find(
      (p) => p.code === error.code && p.subcode === error.error_subcode
    );
    if (match) return match.catalog;
  }

  // 2. Match by code only
  if (error.code !== undefined) {
    const match = ERROR_PATTERNS.find(
      (p) => p.code === error.code && p.subcode === undefined && !p.messagePattern
    );
    if (match) return match.catalog;
  }

  // 3. Match by message pattern
  if (error.message) {
    const match = ERROR_PATTERNS.find(
      (p) => p.messagePattern && p.messagePattern.test(error.message)
    );
    if (match) return match.catalog;
  }

  // 4. Fallback
  return {
    title: 'Erro na publicacao',
    description: error.message || 'Ocorreu um erro desconhecido.',
    action: 'Tente novamente. Se persistir, entre em contato com o suporte.',
    severity: 'error',
  };
}

/**
 * Formata o erro para exibicao, combinando o catalogo com a mensagem original da Meta.
 */
export function formatPublishError(error: MetaGraphError): CatalogedError & { rawMessage: string; step?: string } {
  const cataloged = lookupError(error);
  const stepLabels: Record<string, string> = {
    campaign: 'Criacao da Campanha',
    adset: 'Criacao do Conjunto de Anuncios',
    ad: 'Criacao do Anuncio',
  };

  return {
    ...cataloged,
    rawMessage: error.message,
    step: error.step ? stepLabels[error.step] : undefined,
  };
}
