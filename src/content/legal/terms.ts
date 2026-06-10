import { legalConfig as c } from '../../config/legal';
import type { AppLocale } from '../../i18n';
import type { LegalDocument } from './types';

const docs: Record<AppLocale, () => LegalDocument> = {
  pt: () => ({
    title: 'Termos de Uso e Serviço',
    subtitle: `Contrato entre você e ${c.companyName}`,
    lastUpdated: `Última atualização: ${c.lastUpdated}`,
    sections: [
      {
        id: 'acceptance',
        title: 'Aceitação',
        paragraphs: [
          `Ao acessar ${c.website}, criar conta ou utilizar ${c.productName}, você concorda integralmente com estes Termos e com nossa Política de Privacidade.`,
          'Se não concordar, não utilize o serviço.',
        ],
        links: [{ label: 'Política de Privacidade', href: '/privacidade' }],
      },
      {
        id: 'service',
        title: 'Descrição do serviço',
        paragraphs: [
          `${c.productName} é software SaaS (Software como Serviço) para gestão de academias: cadastro de alunos, pagamentos, integração com Stripe, biometria, API de check-in, mensagens e relatórios, conforme o plano contratado.`,
        ],
      },
      {
        id: 'account',
        title: 'Cadastro e conta',
        list: [
          'Você deve fornecer informações verdadeiras e manter seus dados atualizados.',
          'É proibido compartilhar credenciais; você é responsável por atividades na sua conta.',
          'Podemos suspender contas em caso de violação destes termos ou atividade fraudulenta.',
        ],
      },
      {
        id: 'billing',
        title: 'Planos, trial e pagamentos',
        list: [
          'Preços vigentes estão em /precos. Cobrança recorrente via Stripe (mensal ou anual).',
          'Trial gratuito de 14 dias pode ser oferecido; após o período, a cobrança inicia automaticamente salvo cancelamento prévio.',
          'Reembolsos: em até 7 dias após a primeira cobrança pós-trial, mediante solicitação a suporte, salvo uso substancial do serviço.',
          'Inadimplência pode resultar em suspensão do acesso até regularização.',
        ],
      },
      {
        id: 'acceptable-use',
        title: 'Uso aceitável',
        list: [
          'Não utilizar o sistema para fins ilegais, spam, malware ou violação de direitos de terceiros.',
          'A academia contratante é responsável pelo tratamento de dados de seus alunos (LGPD), incluindo consentimento para biometria.',
          'Não fazer engenharia reversa, sobrecarga intencional ou acesso não autorizado.',
        ],
      },
      {
        id: 'ip',
        title: 'Propriedade intelectual',
        paragraphs: [
          'O software, marca, layout e documentação pertencem ao controlador ou licenciantes. Concedemos licença limitada, não exclusiva e revogável de uso durante a assinatura.',
          'Dados inseridos por você permanecem seus; você nos concede licença para processá-los para prestar o serviço.',
        ],
      },
      {
        id: 'availability',
        title: 'Disponibilidade e suporte',
        paragraphs: [
          'Buscamos alta disponibilidade. Manutenções podem ocorrer com aviso prévio quando possível.',
          'SLA de 99,5% aplica-se apenas ao plano Premium, conforme contrato específico.',
          `Suporte: ${c.emailSupport}.`,
        ],
      },
      {
        id: 'liability',
        title: 'Limitação de responsabilidade',
        paragraphs: [
          'O serviço é fornecido "como está", na extensão permitida pela lei. Não garantimos resultados comerciais específicos da sua academia.',
          'Não nos responsabilizamos por danos indiretos, lucros cessantes ou perda de dados por fatores fora de nosso controle razoável.',
          'Nossa responsabilidade total limita-se ao valor pago nos últimos 12 meses pelo plano contratado.',
        ],
      },
      {
        id: 'indemnity',
        title: 'Indenização',
        paragraphs: [
          'Você concorda em indenizar-nos por reclamações decorrentes do uso indevido do serviço ou violação destes termos por você ou seus usuários.',
        ],
      },
      {
        id: 'termination',
        title: 'Cancelamento e rescisão',
        list: [
          'Você pode cancelar a qualquer momento em Configurações ou via Stripe Customer Portal.',
          'Podemos encerrar o serviço com aviso de 30 dias ou imediatamente em caso de violação grave.',
          'Após encerramento, você pode exportar dados por período limitado; depois poderão ser excluídos conforme a Política de Privacidade.',
        ],
      },
      {
        id: 'law',
        title: 'Lei aplicável e foro',
        paragraphs: [
          `Estes termos regem-se pelas leis da República Federativa do Brasil.`,
          `Foro: comarca de Goiânia/GO, salvo disposição legal imperativa em favor do consumidor.`,
        ],
      },
      {
        id: 'contact',
        title: 'Contato',
        paragraphs: [`Questões sobre estes termos: ${c.emailLegal} | ${c.emailSupport}.`],
        links: [{ label: 'Fale conosco', href: '/contato' }],
      },
    ],
  }),

  en: () => ({
    title: 'Terms of Use',
    subtitle: `Agreement with ${c.companyName}`,
    lastUpdated: `Last updated: ${c.lastUpdatedEn}`,
    sections: [
      {
        id: 'acceptance',
        title: 'Acceptance',
        paragraphs: [
          'By using our website or creating an account, you agree to these Terms and our Privacy Policy.',
        ],
        links: [{ label: 'Privacy Policy', href: '/privacidade' }],
      },
      {
        id: 'service',
        title: 'Service',
        paragraphs: [
          'We provide gym management SaaS including members, billing, Stripe, biometrics, and check-in API per your plan.',
        ],
      },
      {
        id: 'billing',
        title: 'Billing',
        list: [
          'Recurring billing via Stripe. 14-day trial may apply.',
          'Refunds within 7 days of first paid charge upon request, unless substantial use occurred.',
        ],
      },
      {
        id: 'liability',
        title: 'Limitation of liability',
        paragraphs: ['Liability capped at fees paid in the last 12 months. Service provided "as is" to the extent permitted by law.'],
      },
      {
        id: 'law',
        title: 'Governing law',
        paragraphs: ['Brazilian law. Courts of Goiânia/GO, Brazil, unless mandatory consumer law provides otherwise.'],
      },
      {
        id: 'contact',
        title: 'Contact',
        links: [{ label: 'Contact us', href: '/contato' }],
      },
    ],
  }),

  es: () => ({
    title: 'Términos de Uso',
    subtitle: c.companyName,
    lastUpdated: `Última actualización: ${c.lastUpdatedEs}`,
    sections: [
      {
        id: 'acceptance',
        title: 'Aceptación',
        paragraphs: ['Al usar el servicio, acepta estos Términos y la Política de Privacidad.'],
        links: [{ label: 'Política de Privacidad', href: '/privacidade' }],
      },
      {
        id: 'service',
        title: 'Servicio',
        paragraphs: ['Software SaaS para gestión de gimnasios según el plan contratado.'],
      },
      {
        id: 'billing',
        title: 'Pagos',
        list: ['Facturación recurrente vía Stripe. Prueba de 14 días puede aplicarse.'],
      },
      {
        id: 'contact',
        title: 'Contacto',
        links: [{ label: 'Contacto', href: '/contato' }],
      },
    ],
  }),
};

export function getTermsDocument(locale: AppLocale): LegalDocument {
  return docs[locale]();
}
