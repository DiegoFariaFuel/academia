import { legalConfig as c } from '../../config/legal';
import type { AppLocale } from '../../i18n';
import type { LegalDocument } from './types';

const docs: Record<AppLocale, () => LegalDocument> = {
  pt: () => ({
    title: 'Política de Cookies',
    subtitle: c.productName,
    lastUpdated: `Última atualização: ${c.lastUpdated}`,
    sections: [
      {
        id: 'what',
        title: 'O que são cookies',
        paragraphs: [
          'Cookies são pequenos arquivos armazenados no seu navegador. Usamos cookies e tecnologias similares (localStorage, pixels) para operar o site, medir audiência e, com seu consentimento, publicidade.',
        ],
      },
      {
        id: 'types',
        title: 'Tipos que utilizamos',
        list: [
          'Essenciais: sessão, autenticação, preferência de idioma, consentimento de cookies (academia_cookie_consent).',
          'Analytics (opcional): Google Analytics 4 (_ga, _ga_*, _gid) — estatísticas agregadas de uso.',
          'Publicidade (opcional): Google Ads (_gcl_au, conversion linker) — medição de campanhas e remarketing.',
          'Funcionais: lembrar configurações do painel quando aplicável.',
        ],
      },
      {
        id: 'consent',
        title: 'Consentimento',
        paragraphs: [
          'Ao clicar em "Aceitar" no banner, você autoriza cookies não essenciais. "Recusar" mantém apenas cookies essenciais.',
          'Você pode alterar sua escolha limpando cookies do navegador ou revogando no banner na próxima visita.',
        ],
      },
      {
        id: 'third',
        title: 'Cookies de terceiros',
        paragraphs: [
          'Google (Analytics, Ads, Tag Manager) pode definir cookies conforme suas políticas:',
        ],
        links: [
          { label: 'Política de privacidade Google', href: 'https://policies.google.com/privacy' },
          { label: 'Como o Google usa cookies', href: 'https://policies.google.com/technologies/cookies' },
        ],
      },
      {
        id: 'manage',
        title: 'Como gerenciar',
        list: [
          'Chrome: Configurações → Privacidade → Cookies',
          'Firefox: Opções → Privacidade',
          'Safari: Preferências → Privacidade',
          'Google Ads: https://adssettings.google.com',
        ],
      },
      {
        id: 'more',
        title: 'Mais informações',
        links: [{ label: 'Política de Privacidade', href: '/privacidade' }],
      },
    ],
  }),

  en: () => ({
    title: 'Cookie Policy',
    lastUpdated: `Last updated: ${c.lastUpdatedEn}`,
    sections: [
      {
        id: 'what',
        title: 'What are cookies',
        paragraphs: ['We use essential cookies for the app and, with consent, analytics and Google Ads cookies.'],
      },
      {
        id: 'types',
        title: 'Cookie types',
        list: [
          'Essential: login, language, consent storage.',
          'Analytics: Google Analytics (_ga, _gid).',
          'Advertising: Google Ads conversion and remarketing cookies.',
        ],
      },
      {
        id: 'manage',
        title: 'Manage cookies',
        links: [
          { label: 'Google Ads Settings', href: 'https://adssettings.google.com' },
          { label: 'Privacy Policy', href: '/privacidade' },
        ],
      },
    ],
  }),

  es: () => ({
    title: 'Política de Cookies',
    lastUpdated: `Última actualización: ${c.lastUpdatedEs}`,
    sections: [
      {
        id: 'what',
        title: 'Qué son las cookies',
        paragraphs: ['Usamos cookies esenciales y, con consentimiento, cookies de Google Analytics y Google Ads.'],
      },
      {
        id: 'more',
        title: 'Más información',
        links: [{ label: 'Política de Privacidad', href: '/privacidade' }],
      },
    ],
  }),
};

export function getCookiesDocument(locale: AppLocale): LegalDocument {
  return docs[locale]();
}
