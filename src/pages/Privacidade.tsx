import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';

const VIGENCIA = '25 de maio de 2026';
const CONTATO_EMAIL = 'secretaria@itecedu.com';
const CONTATO_WHATSAPP = '(81) 99116-1448';

export default function Privacidade() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero compacto */}
      <section className="py-14 bg-muted/30 border-b border-border">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            Conformidade LGPD
          </div>
          <h1 className="font-merriweather font-bold text-3xl md:text-4xl text-foreground mb-3">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Instituto de Teologia Cristã — ITEC EAD<br />
            Em vigor desde: <strong>{VIGENCIA}</strong>
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-14 bg-background">
        <div className="container-custom max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">

          {/* 1 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">1. Quem somos</h2>
            <p>
              O <strong className="text-foreground">Instituto de Teologia Cristã — ITEC</strong> é uma instituição de ensino teológico
              localizada na Unidade Janga, Paulista-PE, Brasil. Operamos a plataforma digital
              ITEC EAD (<strong className="text-foreground">itecedu.com</strong>) para oferecer cursos e informações sobre formação
              teológica. Para fins desta política, o ITEC é o <strong className="text-foreground">controlador dos seus dados pessoais</strong>.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">2. Quais dados coletamos</h2>
            <p className="mb-3">Coletamos apenas os dados necessários para as finalidades descritas abaixo:</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Dado</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Finalidade</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Nome completo', 'Identificar o interessado e personalizar o contato', 'Legítimo interesse / Consentimento'],
                    ['E-mail', 'Enviar confirmação de pré-inscrição e comunicações sobre o curso', 'Consentimento'],
                    ['Telefone (WhatsApp)', 'Contato direto pela secretaria para confirmar interesse', 'Consentimento'],
                    ['Cidade / Estado', 'Identificar região de origem para planejamento de turmas', 'Legítimo interesse'],
                    ['Curso de interesse', 'Direcionar atendimento ao curso correto', 'Execução de contrato pré-contratual'],
                    ['Como conheceu o ITEC', 'Melhoria dos canais de comunicação (uso interno)', 'Legítimo interesse'],
                    ['Mensagem opcional', 'Personalizar o atendimento da secretaria', 'Consentimento'],
                  ].map(([dado, finalidade, base]) => (
                    <tr key={dado}>
                      <td className="px-4 py-3 font-medium text-foreground">{dado}</td>
                      <td className="px-4 py-3">{finalidade}</td>
                      <td className="px-4 py-3 text-xs">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">3. Como usamos seus dados</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Entrar em contato para confirmar sua pré-inscrição nos cursos do ITEC</li>
              <li>Enviar informações sobre datas de matrícula, início das aulas e comunicados do instituto</li>
              <li>Registrar o interesse no banco de dados interno da secretaria para gestão de turmas</li>
              <li>Melhorar nossos canais de captação com base em respostas agregadas</li>
            </ul>
            <p className="mt-3">
              <strong className="text-foreground">Não vendemos, alugamos nem compartilhamos seus dados</strong> com terceiros para fins
              comerciais. Seus dados não são usados para publicidade ou rastreamento.
            </p>
          </div>

          {/* 4 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">4. Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados em servidores seguros providos pelo{' '}
              <strong className="text-foreground">Supabase</strong> (infraestrutura na nuvem com criptografia em trânsito e em repouso,
              certificação SOC 2). O acesso é restrito à equipe da secretaria e da diretoria do ITEC,
              autenticados com credenciais individuais. Aplicamos Row Level Security (RLS) em nosso
              banco de dados para garantir isolamento de acesso.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">5. Seus direitos (Lei 13.709/2018 — LGPD)</h2>
            <p className="mb-3">Como titular dos seus dados, você tem o direito de:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['Acesso', 'Saber quais dados temos sobre você'],
                ['Correção', 'Corrigir dados incorretos ou desatualizados'],
                ['Exclusão', 'Solicitar a exclusão dos seus dados (direito ao esquecimento)'],
                ['Portabilidade', 'Receber seus dados em formato estruturado (JSON/CSV)'],
                ['Revogação', 'Revogar o consentimento dado a qualquer momento'],
                ['Oposição', 'Opor-se ao tratamento baseado em legítimo interesse'],
              ].map(([direito, desc]) => (
                <div key={direito} className="bg-card border border-border rounded-lg p-4">
                  <p className="font-semibold text-foreground text-sm mb-1">{direito}</p>
                  <p className="text-xs">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
              <a href={`mailto:${CONTATO_EMAIL}`} className="text-primary hover:underline font-medium">{CONTATO_EMAIL}</a>{' '}
              ou pelo WhatsApp <strong className="text-foreground">{CONTATO_WHATSAPP}</strong>.
              Responderemos em até <strong className="text-foreground">15 dias úteis</strong>.
            </p>
          </div>

          {/* 6 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">6. Cookies</h2>
            <p>
              Nosso site utiliza apenas <strong className="text-foreground">cookies funcionais</strong> necessários para o
              funcionamento da plataforma (autenticação de usuários, preferências de tema).
              Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">7. Retenção de dados</h2>
            <p>
              Dados de pré-inscrição são mantidos enquanto o relacionamento com o ITEC estiver ativo
              ou até que você solicite a exclusão. Dados de alunos matriculados são mantidos pelo
              prazo legal exigido para documentação acadêmica (mínimo 5 anos após a conclusão do curso).
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">8. Alterações nesta política</h2>
            <p>
              Esta política pode ser atualizada a qualquer momento. Mudanças relevantes serão
              comunicadas por e-mail ou pelo mural de avisos da plataforma. A data de vigência
              no topo desta página sempre indica a versão em vigor.
            </p>
          </div>

          {/* 9 — Contato */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h2 className="font-merriweather font-bold text-xl text-foreground mb-3">9. Contato — Encarregado de Dados</h2>
            <p className="mb-4">
              Para dúvidas, solicitações ou reclamações relacionadas ao tratamento dos seus dados:
            </p>
            <div className="space-y-2">
              <p><span className="text-foreground font-medium">Instituição:</span> Instituto de Teologia Cristã — ITEC</p>
              <p><span className="text-foreground font-medium">Endereço:</span> Unidade Janga, Paulista-PE, Brasil</p>
              <p>
                <span className="text-foreground font-medium">E-mail: </span>
                <a href={`mailto:${CONTATO_EMAIL}`} className="text-primary hover:underline">{CONTATO_EMAIL}</a>
              </p>
              <p><span className="text-foreground font-medium">WhatsApp:</span> {CONTATO_WHATSAPP}</p>
            </div>
            <p className="mt-4 text-xs border-t border-border pt-4">
              Você também pode registrar reclamações junto à{' '}
              <strong className="text-foreground">Autoridade Nacional de Proteção de Dados (ANPD)</strong> em{' '}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                gov.br/anpd
              </a>.
            </p>
          </div>

          <div className="text-center pt-4 border-t border-border">
            <Link to="/" className="text-primary hover:underline text-sm">← Voltar para o início</Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
