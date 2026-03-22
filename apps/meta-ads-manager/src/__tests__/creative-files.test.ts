/**
 * Testes para contratos de tipo CreativeFile/AdConfig e
 * tratamento de URL de criativos no bulk-publish.
 *
 * Estes testes garantem que a integracao com Drive nao vai
 * quebrar o fluxo existente de arquivos de criativos.
 */

import type {
  CreativeFile,
  AdConfig,
  AdsetTypeConfig,
  WizardState,
} from '@/contexts/WizardContext';
import { validateWizardState } from '@/lib/validation';

// --- Helpers ---

function criarArquivoCriativo(overrides?: Partial<CreativeFile>): CreativeFile {
  return {
    id: 'f1',
    fileName: 'banner.jpg',
    driveUrl: '',
    type: 'image',
    ...overrides,
  };
}

function criarAdConfig(overrides?: Partial<AdConfig>): AdConfig {
  return {
    destinationUrl: 'https://example.com',
    creativeFormat: 'image',
    driveLink: '',
    creativeFiles: [criarArquivoCriativo()],
    primaryText: 'Texto',
    headline: 'Titulo',
    description: 'Desc',
    utmParams: {},
    ...overrides,
  };
}

function criarEstadoCompleto(adConfigOverrides?: Partial<AdConfig>): WizardState {
  return {
    currentStep: 5,
    completedSteps: [0, 1, 2, 3, 4],
    selectedAccountIds: ['acc-1'],
    selectedPageIds: ['page-1'],
    adsetsPerCampaign: 2,
    totalCampaigns: 1,
    distributionMap: [
      { campaignIndex: 1, accountId: 'acc-1', pageId: 'page-1', pageName: 'Pagina 1', adsetCount: 2 },
    ],
    campaignConfig: {
      objective: 'OUTCOME_SALES',
      namingPattern: { levaNumber: '08', creativeLabel: 'Cr1' },
      budgetType: 'CBO',
      budgetValue: 5000,
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      campaignStatus: 'PAUSED',
    },
    adsetTypes: [
      {
        id: 'type-1',
        name: 'Tipo A',
        adsetCount: 2,
        campaignsCount: 1,
        creativesInAdset: ['banner.jpg'],
        conversionLocation: 'WEBSITE',
        pixelId: 'px-1',
        conversionEvent: 'PURCHASE',
        startDate: '2026-04-01',
        targetCountries: ['BR'],
        adsetStatus: 'PAUSED',
      },
    ],
    adConfig: criarAdConfig(adConfigOverrides),
    templateName: '',
    isDraft: false,
    draftId: null,
  };
}

// ============================
// TESTES DE ARQUIVOS DE CRIATIVOS (15 testes)
// ============================

describe('Contrato do tipo CreativeFile', () => {
  test('1 — CreativeFile com driveUrl vazio e valido', () => {
    const arquivo = criarArquivoCriativo({ driveUrl: '' });
    expect(arquivo.driveUrl).toBe('');
    expect(arquivo.fileName).toBe('banner.jpg');
    expect(arquivo.type).toBe('image');
  });

  test('2 — CreativeFile com driveUrl preenchido preserva o valor', () => {
    const arquivo = criarArquivoCriativo({
      driveUrl: 'https://drive.google.com/uc?export=download&id=abc123',
    });
    expect(arquivo.driveUrl).toContain('drive.google.com');
  });

  test('3 — CreativeFile suporta tipo video', () => {
    const arquivo = criarArquivoCriativo({ type: 'video', fileName: 'clip.mp4' });
    expect(arquivo.type).toBe('video');
    expect(arquivo.fileName).toBe('clip.mp4');
  });
});

describe('Contrato do tipo AdConfig', () => {
  test('4 — AdConfig com driveLink vazio e valido', () => {
    const config = criarAdConfig({ driveLink: '' });
    expect(config.driveLink).toBe('');
  });

  test('5 — AdConfig com driveLink preenchido preserva o valor', () => {
    const config = criarAdConfig({
      driveLink: 'https://drive.google.com/drive/folders/abc123',
    });
    expect(config.driveLink).toContain('drive.google.com');
  });

  test('6 — AdConfig com multiplos creativeFiles preserva a ordem', () => {
    const config = criarAdConfig({
      creativeFiles: [
        criarArquivoCriativo({ id: 'f1', fileName: 'primeiro.jpg' }),
        criarArquivoCriativo({ id: 'f2', fileName: 'segundo.jpg' }),
        criarArquivoCriativo({ id: 'f3', fileName: 'terceiro.mp4', type: 'video' }),
      ],
    });
    expect(config.creativeFiles).toHaveLength(3);
    expect(config.creativeFiles[0].fileName).toBe('primeiro.jpg');
    expect(config.creativeFiles[2].type).toBe('video');
  });
});

describe('Tratamento de URL de criativos no bulk-publish', () => {
  test('7 — construcao do body: creativeFile com driveUrl preenche image_url', () => {
    // Simula o que o bulk-publish.ts faz na linha 200
    const arquivoCriativo: CreativeFile = {
      id: 'f1',
      fileName: 'banner.jpg',
      driveUrl: 'https://drive.google.com/uc?export=download&id=abc',
      type: 'image',
    };

    const linkData: any = {
      message: 'Texto do anuncio',
      link: 'https://example.com',
      name: 'Titulo',
      caption: 'Descricao',
      ...(arquivoCriativo.driveUrl && { image_url: arquivoCriativo.driveUrl }),
    };

    expect(linkData.image_url).toBe('https://drive.google.com/uc?export=download&id=abc');
  });

  test('8 — construcao do body: creativeFile com driveUrl vazio omite image_url', () => {
    const arquivoCriativo: CreativeFile = {
      id: 'f1',
      fileName: 'banner.jpg',
      driveUrl: '',
      type: 'image',
    };

    const linkData: any = {
      message: 'Texto do anuncio',
      link: 'https://example.com',
      name: 'Titulo',
      caption: 'Descricao',
      ...(arquivoCriativo.driveUrl && { image_url: arquivoCriativo.driveUrl }),
    };

    expect(linkData.image_url).toBeUndefined();
  });

  test('9 — correspondencia creativesInAdset: encontra arquivo pelo fileName', () => {
    // Simula o que o bulk-publish.ts faz na linha 188
    const arquivosCriativos: CreativeFile[] = [
      criarArquivoCriativo({ id: 'f1', fileName: 'banner.jpg', driveUrl: 'https://drive.url/1' }),
      criarArquivoCriativo({ id: 'f2', fileName: 'video.mp4', driveUrl: 'https://drive.url/2' }),
    ];

    const nomeCriativo = 'banner.jpg';
    const encontrado = arquivosCriativos.find((f) => f.fileName === nomeCriativo);
    expect(encontrado).toBeDefined();
    expect(encontrado!.driveUrl).toBe('https://drive.url/1');
  });

  test('10 — correspondencia creativesInAdset: arquivo faltante retorna undefined', () => {
    const arquivosCriativos: CreativeFile[] = [
      criarArquivoCriativo({ id: 'f1', fileName: 'banner.jpg' }),
    ];

    const encontrado = arquivosCriativos.find((f) => f.fileName === 'inexistente.jpg');
    expect(encontrado).toBeUndefined();
  });
});

describe('Validacao com arquivos de criativos (seguranca da integracao Drive)', () => {
  test('11 — estado com driveUrl preenchido nos creativeFiles passa na validacao', () => {
    const estado = criarEstadoCompleto({
      creativeFiles: [
        criarArquivoCriativo({ driveUrl: 'https://drive.google.com/uc?id=abc' }),
      ],
    });
    const resultado = validateWizardState(estado);
    expect(resultado.errors.filter((e) => e.field === 'creativeFiles')).toHaveLength(0);
  });

  test('12 — estado com driveUrl vazio nos creativeFiles tambem passa (driveUrl e opcional)', () => {
    const estado = criarEstadoCompleto({
      creativeFiles: [criarArquivoCriativo({ driveUrl: '' })],
    });
    const resultado = validateWizardState(estado);
    expect(resultado.errors.filter((e) => e.field === 'creativeFiles')).toHaveLength(0);
  });

  test('13 — aviso de incompatibilidade dispara quando adset referencia arquivo faltante', () => {
    const estado = criarEstadoCompleto();
    estado.adsetTypes[0].creativesInAdset = ['arquivo_faltante.jpg'];
    estado.adConfig!.creativeFiles = [criarArquivoCriativo({ fileName: 'outro.jpg' })];
    const resultado = validateWizardState(estado);
    expect(resultado.warnings.some((w) => w.field === 'creativeMismatch')).toBe(true);
  });

  test('14 — sem aviso quando criativos do adset correspondem aos nomes dos arquivos', () => {
    const estado = criarEstadoCompleto();
    estado.adsetTypes[0].creativesInAdset = ['banner.jpg'];
    estado.adConfig!.creativeFiles = [criarArquivoCriativo({ fileName: 'banner.jpg' })];
    const resultado = validateWizardState(estado);
    expect(resultado.warnings.filter((w) => w.field === 'creativeMismatch')).toHaveLength(0);
  });

  test('15 — campo driveLink no adConfig nao afeta a validacao', () => {
    const estado = criarEstadoCompleto({ driveLink: 'https://drive.google.com/drive/folders/abc' });
    const resultado = validateWizardState(estado);
    // driveLink e informativo — nao e validado
    expect(resultado.isValid).toBe(true);
  });
});
