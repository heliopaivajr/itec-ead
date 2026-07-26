// Financeiro E5.1 — mensagens de cobrança PRONTAS (WhatsApp/Email), tom pastoral do ITEC.
// Puro (sem rede): monta os links wa.me/mailto preenchidos; NÃO envia — o staff revisa
// e manda (aprovação humana). A chave PIX vem da config_financeiro (077).

export type TipoCobranca = 'lembrete' | 'regularizacao';

export interface DadosCobranca {
  nome: string;
  telefone: string | null;
  email: string | null;
  totalDevido: number;
  maiorAtrasoDias: number;
}

export interface ConfigPixCobranca {
  chave_pix: string | null;
  beneficiario: string | null;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Escolhe o tom pelo atraso: até 59 dias = lembrete amigável; 60+ = aviso de regularização.
export function tipoCobrancaSugerido(maiorAtrasoDias: number): TipoCobranca {
  return maiorAtrasoDias >= 60 ? 'regularizacao' : 'lembrete';
}

function textoCobranca(tipo: TipoCobranca, d: DadosCobranca, pix: ConfigPixCobranca): string {
  const primeiro = d.nome.split(' ')[0] || d.nome;
  const valor = brl(d.totalDevido);
  const pixLinha = pix.chave_pix
    ? `\n\nPara facilitar, o pagamento pode ser feito via PIX:\nChave: ${pix.chave_pix}${pix.beneficiario ? `\nBeneficiário: ${pix.beneficiario}` : ''}`
    : '';
  const rodape = '\n\nApós o pagamento, envie o comprovante pelo sistema (Meu Financeiro) ou responda por aqui.\nSecretaria ITEC — WhatsApp (81) 99116-1448 · secretaria@itecedu.com';

  if (tipo === 'regularizacao') {
    return (
      `Paz do Senhor, ${primeiro}.\n\n` +
      `Identificamos uma pendência financeira em aberto no ITEC no valor de ${valor}` +
      (d.maiorAtrasoDias > 0 ? ` (${d.maiorAtrasoDias} dias de atraso)` : '') + `.\n\n` +
      `Pedimos, com carinho mas com urgência, que procure a secretaria para regularizar e evitar a ` +
      `suspensão do seu acesso às aulas e ao sistema. Estamos à disposição para ajudar no que for possível.` +
      pixLinha + rodape
    );
  }
  return (
    `Paz do Senhor, ${primeiro}! 🙏\n\n` +
    `Passando para lembrar, com todo cuidado, que sua mensalidade do ITEC está em aberto no valor de ${valor}. ` +
    `Se já efetuou o pagamento, por favor desconsidere esta mensagem.` +
    pixLinha + rodape
  );
}

function assuntoCobranca(tipo: TipoCobranca): string {
  return tipo === 'regularizacao'
    ? 'ITEC — Regularização da sua matrícula'
    : 'ITEC — Lembrete de mensalidade';
}

// Link WhatsApp preenchido (null se sem telefone).
export function linkWhatsAppCobranca(tipo: TipoCobranca, d: DadosCobranca, pix: ConfigPixCobranca): string | null {
  if (!d.telefone) return null;
  const fone = d.telefone.replace(/\D/g, '');
  const numero = fone.startsWith('55') ? fone : `55${fone}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(textoCobranca(tipo, d, pix))}`;
}

// Link mailto preenchido (null se sem e-mail).
export function linkEmailCobranca(tipo: TipoCobranca, d: DadosCobranca, pix: ConfigPixCobranca): string | null {
  if (!d.email) return null;
  const subject = encodeURIComponent(assuntoCobranca(tipo));
  const body = encodeURIComponent(textoCobranca(tipo, d, pix));
  return `mailto:${d.email}?subject=${subject}&body=${body}`;
}
