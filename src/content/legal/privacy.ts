import { legalConfig as c } from '../../config/legal';
import type { AppLocale } from '../../i18n';
import type { LegalDocument } from './types';

const docs: Record<AppLocale, () => LegalDocument> = {
  pt: () => ({
    title: 'Política de Privacidade',
    subtitle: `Controlador: ${c.companyName} — ${c.productName}`,
    lastUpdated: `Última atualização: ${c.lastUpdated}`,
    sections: [
      {
        id: 'intro',
        title: 'Introdução',
        paragraphs: [
          `Esta Política de Privacidade descreve como ${c.companyName} ("nós", "nosso") coleta, usa, armazena e compartilha dados pessoais ao operar o software ${c.productName}, site ${c.website} e serviços relacionados.`,
          'Esta política atende à Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e, quando aplicável, ao Regulamento Geral de Proteção de Dados da UE (GDPR).',
          'Ao utilizar nossos serviços, você declara ter lido e compreendido esta política.',
        ],
      },
      {
        id: 'controller',
        title: 'Controlador e contato',
        paragraphs: [
          `Controlador dos dados: ${c.companyName}${c.cnpj ? `, CNPJ ${c.cnpj}` : ''}.`,
          `Endereço: ${c.address}.`,
          `Encarregado de dados (DPO): ${c.dpoEmail}.`,
          `Privacidade: ${c.emailPrivacy} | Suporte: ${c.emailSupport}.`,
        ],
      },
      {
        id: 'collected',
        title: 'Dados que coletamos',
        list: [
          'Conta (staff/gestor): nome, e-mail, senha (hash via Supabase Auth), plano contratado, logs de acesso.',
          'Alunos (cadastrados pela academia): nome, e-mail, telefone, CPF, data de nascimento, foto (opcional), plano, status financeiro.',
          'Biometria: apenas hash criptográfico do template — não armazenamos imagem bruta de rosto ou digital.',
          'Pagamentos: valores, status, IDs Stripe (não armazenamos número completo de cartão).',
          'Check-in/catraca: data/hora, dispositivo, confiança biométrica, IP quando disponível.',
          'Comunicações: histórico de mensagens enviadas pela plataforma (e-mail, etc.).',
          'Site e marketing: cookies, identificadores de dispositivo, páginas visitadas, origem da campanha (UTM), dados de conversão de anúncios.',
        ],
      },
      {
        id: 'purposes',
        title: 'Finalidades do tratamento',
        list: [
          'Prestação do software SaaS contratado (gestão de alunos, pagamentos, acessos).',
          'Cobrança, faturamento e prevenção a fraudes (Stripe).',
          'Autenticação, segurança e suporte técnico.',
          'Comunicações transacionais e, com consentimento, marketing.',
          'Mensuração de audiência, campanhas publicitárias (Google Ads) e melhoria do site.',
          'Cumprimento de obrigações legais e exercício de direitos em processos.',
        ],
      },
      {
        id: 'legal-basis',
        title: 'Bases legais (LGPD)',
        list: [
          'Execução de contrato: prestação do serviço ao gestor da academia.',
          'Legítimo interesse: segurança, melhoria do produto, analytics agregados.',
          'Consentimento: cookies não essenciais, marketing, biometria de alunos (responsabilidade do cliente academia).',
          'Obrigação legal: retenção fiscal e resposta a autoridades.',
        ],
      },
      {
        id: 'cookies-ads',
        title: 'Cookies, Google Ads e publicidade',
        paragraphs: [
          'Utilizamos cookies e tecnologias similares. Cookies essenciais são necessários para login e segurança. Cookies de analytics e publicidade só são ativados após seu consentimento no banner do site.',
          'Podemos utilizar Google Ads (incluindo remarketing e medição de conversões) e Google Analytics (GA4), que podem definir cookies como _ga, _gid, _gcl_au e identificadores de campanha.',
          'Esses dados ajudam a entender o desempenho de anúncios e a exibir anúncios relevantes em sites da rede Google e parceiros, conforme suas preferências de anúncios.',
        ],
        list: [
          'Gerenciar preferências de anúncios Google: https://adssettings.google.com',
          'Desativar cookies no navegador (pode limitar funcionalidades).',
          'Revogar consentimento: limpe cookies do site ou use "Recusar" no banner.',
        ],
        links: [
          { label: 'Política de Cookies completa', href: '/cookies' },
          { label: 'Configurações de anúncios Google', href: 'https://adssettings.google.com' },
        ],
      },
      {
        id: 'sharing',
        title: 'Compartilhamento com terceiros',
        paragraphs: ['Não vendemos dados pessoais. Compartilhamos apenas com operadores necessários:'],
        list: [
          'Supabase (hospedagem, banco de dados, autenticação) — EUA/outros, com cláusulas contratuais.',
          'Stripe (pagamentos) — conforme política Stripe.',
          'Google (Ads, Analytics, Tag Manager, se habilitados) — EUA, Privacy Shield / SCCs.',
          'Resend ou similar (envio de e-mail transacional, se configurado).',
          'Provedores de SMS/WhatsApp configurados pelo cliente.',
        ],
      },
      {
        id: 'transfers',
        title: 'Transferência internacional',
        paragraphs: [
          'Dados podem ser processados fora do Brasil. Adotamos medidas como cláusulas-padrão contratuais e avaliação de fornecedores para garantir nível adequado de proteção.',
        ],
      },
      {
        id: 'retention',
        title: 'Retenção',
        list: [
          'Conta ativa: enquanto durar a relação contratual.',
          'Após cancelamento: até 90 dias para exportação; depois exclusão ou anonimização, salvo obrigação legal.',
          'Logs e backups: até 12 meses, salvo incidente de segurança.',
          'Dados fiscais/pagamentos: prazos legais aplicáveis (em geral 5 anos).',
        ],
      },
      {
        id: 'rights',
        title: 'Seus direitos',
        paragraphs: [
          'Titulares podem solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento e revogação de consentimento.',
          `Envie pedidos para ${c.emailPrivacy} ou ${c.dpoEmail}. Responderemos em até 15 dias (LGPD), prorrogáveis conforme lei.`,
          'Você pode reclamar à ANPD (Brasil) ou autoridade local de proteção de dados.',
        ],
      },
      {
        id: 'children',
        title: 'Crianças e adolescentes',
        paragraphs: [
          'O serviço é destinado a gestores de academias (maiores de 18 anos). Dados de menores alunos são tratados sob responsabilidade da academia contratante, que deve obter consentimento dos responsáveis quando exigido.',
        ],
      },
      {
        id: 'security',
        title: 'Segurança',
        paragraphs: [
          'HTTPS, Row Level Security (RLS), autenticação segura, hashes biométricos e controle de acesso por perfil. Nenhum sistema é 100% seguro; notificaremos incidentes relevantes conforme a lei.',
        ],
      },
      {
        id: 'changes',
        title: 'Alterações',
        paragraphs: [
          'Podemos atualizar esta política. A data no topo indica a versão vigente. Mudanças relevantes serão comunicadas por e-mail ou aviso no painel.',
        ],
      },
      {
        id: 'contact',
        title: 'Contato',
        paragraphs: [
          `Dúvidas: ${c.emailPrivacy} | ${c.emailSupport}.`,
          `Jurídico: ${c.emailLegal}.`,
        ],
        links: [{ label: 'Página de contato', href: '/contato' }],
      },
    ],
  }),

  en: () => ({
    title: 'Privacy Policy',
    subtitle: `Controller: ${c.companyName} — ${c.productName}`,
    lastUpdated: `Last updated: ${c.lastUpdatedEn}`,
    sections: [
      {
        id: 'intro',
        title: 'Introduction',
        paragraphs: [
          `This Privacy Policy explains how ${c.companyName} ("we", "us") collects, uses, stores, and shares personal data when operating ${c.productName}, ${c.website}, and related services.`,
          'We comply with applicable data protection laws including the Brazilian LGPD and, where applicable, the EU GDPR.',
        ],
      },
      {
        id: 'controller',
        title: 'Data controller & contact',
        paragraphs: [
          `Controller: ${c.companyName}. Address: ${c.address}.`,
          `Privacy: ${c.emailPrivacy} | DPO: ${c.dpoEmail} | Support: ${c.emailSupport}.`,
        ],
      },
      {
        id: 'collected',
        title: 'Data we collect',
        list: [
          'Account data: name, email, password hash, subscription plan.',
          'Member data (entered by gyms): name, email, phone, ID, membership status.',
          'Biometrics: cryptographic hashes only — no raw facial or fingerprint images.',
          'Payments: amounts, status, Stripe IDs (no full card numbers).',
          'Access logs: check-ins, device, IP when available.',
          'Website/marketing: cookies, device IDs, pages viewed, UTM parameters, ad conversion data.',
        ],
      },
      {
        id: 'purposes',
        title: 'How we use data',
        list: [
          'Provide the SaaS platform.',
          'Billing and fraud prevention.',
          'Security, authentication, and support.',
          'Advertising measurement (Google Ads) and analytics with consent.',
          'Legal compliance.',
        ],
      },
      {
        id: 'cookies-ads',
        title: 'Cookies & Google Ads',
        paragraphs: [
          'We use essential cookies for login. Analytics and advertising cookies are enabled only after you accept our cookie banner.',
          'We may use Google Ads (remarketing, conversion tracking) and Google Analytics (GA4), which may set cookies such as _ga, _gid, _gcl_au.',
        ],
        links: [
          { label: 'Cookie Policy', href: '/cookies' },
          { label: 'Google Ads Settings', href: 'https://adssettings.google.com' },
        ],
      },
      {
        id: 'sharing',
        title: 'Third parties',
        list: [
          'Supabase (hosting/auth), Stripe (payments), Google (Ads/Analytics if enabled), email providers.',
          'We do not sell personal data.',
        ],
      },
      {
        id: 'rights',
        title: 'Your rights',
        paragraphs: [
          `You may request access, correction, deletion, portability, or withdraw consent by contacting ${c.emailPrivacy}.`,
        ],
      },
      {
        id: 'contact',
        title: 'Contact',
        links: [{ label: 'Contact page', href: '/contato' }],
      },
    ],
  }),

  es: () => ({
    title: 'Política de Privacidad',
    subtitle: `Responsable: ${c.companyName} — ${c.productName}`,
    lastUpdated: `Última actualización: ${c.lastUpdatedEs}`,
    sections: [
      {
        id: 'intro',
        title: 'Introducción',
        paragraphs: [
          `Esta Política describe cómo ${c.companyName} trata datos personales al operar ${c.productName} y ${c.website}.`,
          'Cumplimos con la LGPD brasileña y, cuando corresponda, el RGPD de la UE.',
        ],
      },
      {
        id: 'controller',
        title: 'Responsable y contacto',
        paragraphs: [
          `${c.companyName}. ${c.address}.`,
          `Privacidad: ${c.emailPrivacy} | DPO: ${c.dpoEmail}.`,
        ],
      },
      {
        id: 'collected',
        title: 'Datos recopilados',
        list: [
          'Cuenta, alumnos, biometría (solo hash), pagos, check-ins, cookies y datos de campañas publicitarias.',
        ],
      },
      {
        id: 'cookies-ads',
        title: 'Cookies y Google Ads',
        paragraphs: [
          'Usamos cookies esenciales y, con su consentimiento, cookies de Google Ads y Analytics para medición y remarketing.',
        ],
        links: [
          { label: 'Política de Cookies', href: '/cookies' },
          { label: 'Configuración de anuncios de Google', href: 'https://adssettings.google.com' },
        ],
      },
      {
        id: 'rights',
        title: 'Sus derechos',
        paragraphs: [`Contacto: ${c.emailPrivacy} para ejercer derechos de acceso, rectificación o supresión.`],
      },
      {
        id: 'contact',
        title: 'Contacto',
        links: [{ label: 'Página de contacto', href: '/contato' }],
      },
    ],
  }),
};

export function getPrivacyDocument(locale: AppLocale): LegalDocument {
  return docs[locale]();
}
