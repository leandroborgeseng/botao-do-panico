'use client';

import Link from 'next/link';

export default function PoliticaDeUsoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        maxWidth: 720,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--color-link)', fontSize: 14 }}>
          ← Voltar
        </Link>
      </div>

      <h1 style={{ fontSize: 28, marginBottom: 8, color: 'var(--color-primary)' }}>
        Política de uso da aplicação
      </h1>
      <p style={{ color: 'var(--color-gray)', marginBottom: 32, fontSize: 14 }}>
        Última atualização: março de 2026
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>1. Aceitação dos termos</h2>
        <p style={{ marginBottom: 12 }}>
          Ao utilizar o aplicativo Botão do Pânico e os serviços associados (painel web e API),
          o usuário declara ter lido, compreendido e aceito esta Política de Uso. O uso continuado
          da aplicação constitui aceitação das condições aqui descritas.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>2. Finalidade do serviço</h2>
        <p style={{ marginBottom: 12 }}>
          O Botão do Pânico é uma ferramenta de segurança que permite ao usuário, em situação de
          emergência, acionar um alerta enviando sua localização e dados de contato a pessoas
          previamente cadastradas. O serviço visa auxiliar na proteção do usuário e na rápida
          comunicação com seus contatos de confiança.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>3. Cadastro e uso responsável</h2>
        <p style={{ marginBottom: 12 }}>
          O usuário deve informar dados verdadeiros no cadastro (nome, e-mail, CPF quando
          aplicável e contatos de emergência). É de responsabilidade do usuário manter esses
          dados atualizados e utilizar o aplicativo de forma ética, sem acionamentos indevidos
          que possam prejudicar o serviço ou terceiros.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>4. Privacidade e dados pessoais</h2>
        <p style={{ marginBottom: 12 }}>
          O tratamento de dados pessoais segue a Lei Geral de Proteção de Dados (LGPD) e nossa
          política de privacidade. Dados como localização e informações de contato são utilizados
          exclusivamente para o funcionamento do alerta e da plataforma. O usuário pode solicitar
          o descadastramento e a exclusão dos seus dados a qualquer momento, por meio da página
          de solicitação de descadastramento disponível neste site.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>5. Padrões contra abuso e exploração sexual infantil (CSAE)</h2>
        <p style={{ marginBottom: 12 }}>
          O aplicativo está comprometido com a proteção de crianças e adolescentes e adere aos
          padrões publicados externamente contra abuso e exploração sexual infantil (CSAE).
        </p>
        <p>
          <Link href="/padroes-csae" style={{ color: 'var(--color-link)' }}>
            Acessar padrões CSAE e links externos →
          </Link>
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>6. Descadastramento e exclusão de dados</h2>
        <p style={{ marginBottom: 12 }}>
          O usuário tem direito a solicitar o descadastramento total da plataforma e a exclusão
          dos seus dados pessoais. Para isso, deve acessar a página &quot;Solicitar descadastramento&quot;,
          informar CPF e e-mail cadastrado e confirmar a solicitação pelo link enviado ao e-mail.
          Após a confirmação, a conta e os dados vinculados serão excluídos de forma permanente,
          salvo quando a retenção for necessária por obrigação legal.
        </p>
        <p>
          <Link href="/descadastramento" style={{ color: 'var(--color-link)' }}>
            Acessar página de solicitação de descadastramento →
          </Link>
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>7. Limitação de responsabilidade</h2>
        <p style={{ marginBottom: 12 }}>
          O Botão do Pânico é um meio de comunicação de emergência e não substitui o acionamento
          de órgãos de segurança (Polícia, Bombeiros, SAMU) quando necessário. A disponibilidade
          do serviço depende de conexão à internet e de dispositivos compatíveis. A responsabilidade
          pela veracidade dos dados e pelo uso adequado do aplicativo é do usuário.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>8. Alterações</h2>
        <p style={{ marginBottom: 12 }}>
          Esta política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas
          por meio do aplicativo ou do e-mail cadastrado. O uso continuado após as alterações
          constitui aceitação da nova versão.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>9. Contato</h2>
        <p style={{ marginBottom: 12 }}>
          Para dúvidas sobre esta política, descadastramento ou tratamento de dados, entre em
          contato pelo canal disponibilizado no aplicativo ou no site da instituição responsável
          pela oferta do serviço.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '32px 0' }} />
      <p style={{ fontSize: 13, color: 'var(--color-gray)' }}>
        <Link href="/" style={{ color: 'var(--color-link)' }}>Voltar ao início</Link>
        {' · '}
        <Link href="/padroes-csae" style={{ color: 'var(--color-link)' }}>Padrões CSAE</Link>
        {' · '}
        <Link href="/descadastramento" style={{ color: 'var(--color-link)' }}>Solicitar descadastramento</Link>
      </p>
    </div>
  );
}
