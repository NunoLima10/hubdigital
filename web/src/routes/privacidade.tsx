import {
  LegalDocument,
  LegalLink,
  LegalList,
  type LegalSection,
} from "@/modules/legal/legal-document";
import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () =>
    seo({
      title: "Política de privacidade",
      description: "Como o Hub Digital recolhe, utiliza, protege e conserva dados pessoais.",
      path: "/privacidade",
      noIndex: true,
    }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    id: "responsavel",
    title: "1. Responsável pelo tratamento",
    content: (
      <>
        <p>
          O responsável pelo tratamento dos dados pessoais é <strong>Nuno Lima</strong>, de
          Mindelo, Cabo Verde, criador e principal responsável pela manutenção do Hub Digital.
          Pode contactar o responsável através de{" "}
          <a href="mailto:codeisland1460@gmail.com" className="font-medium text-primary underline underline-offset-4">codeisland1460@gmail.com</a>.
        </p>
        <p>
          O Hub Digital é um projeto de código aberto. O código pode receber contribuições da
          comunidade, mas essas contribuições não tornam os respetivos autores responsáveis pelo
          tratamento de dados efetuado através do serviço. O perfil público do responsável está
          disponível no <LegalLink href="https://github.com/NunoLima10">GitHub</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "dados",
    title: "2. Dados que recolhemos",
    content: (
      <>
        <p>Consoante a utilização do serviço, podemos tratar:</p>
        <LegalList>
          <li>nome, email, palavra-passe protegida, imagem e dados da conta;</li>
          <li>estado e data da confirmação de idade ou autorização do representante legal;</li>
          <li>identificadores e credenciais técnicas de autenticação Google;</li>
          <li>handle, biografia, localização, país da diáspora e preferências;</li>
          <li>websites e perfis de GitHub, LinkedIn e Instagram;</li>
          <li>descrições, imagens, vídeos, categorias, localização e equipa dos projetos;</li>
          <li>comentários, votos, favoritos, convites, anúncios e participações em equipas;</li>
          <li>denúncias, justificações, reclamações e decisões de moderação;</li>
          <li>IP, navegador, sessão, datas, pedidos, visualizações e cliques;</li>
          <li>mensagens e informações enviadas ao suporte.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "3. Finalidades e fundamentos",
    content: (
      <>
        <p>Utilizamos os dados para:</p>
        <LegalList>
          <li>criar, autenticar e proteger contas;</li>
          <li>gerir a elegibilidade da conta e registar a declaração do utilizador;</li>
          <li>publicar perfis, projetos e conteúdos escolhidos pelo utilizador;</li>
          <li>fornecer comentários, votos, favoritos, equipas e estatísticas;</li>
          <li>moderar conteúdos e resolver denúncias e reclamações;</li>
          <li>prevenir fraude, abuso, acessos indevidos e manipulação de rankings;</li>
          <li>manter, diagnosticar e melhorar o serviço;</li>
          <li>cumprir obrigações legais e responder a autoridades competentes.</li>
        </LegalList>
        <p>
          Conforme a operação, o tratamento baseia-se na execução do serviço solicitado, no
          consentimento, no cumprimento de obrigações legais ou em interesses legítimos como a
          segurança, prevenção de abuso e melhoria do produto. Quando o tratamento depender do
          consentimento, este pode ser retirado sem afetar o tratamento já realizado licitamente.
        </p>
      </>
    ),
  },
  {
    id: "publicos",
    title: "4. Dados tornados públicos",
    content: (
      <>
        <p>
          Perfis, projetos, imagens, membros públicos da equipa, anúncios e comentários podem ser
          apresentados publicamente. Podem ser vistos fora de Cabo Verde, indexados por motores
          de pesquisa e partilhados por terceiros.
        </p>
        <p>
          Depois da eliminação no Hub Digital, cópias podem permanecer temporariamente em caches,
          arquivos de pesquisa ou publicações feitas por terceiros. Email, palavra-passe,
          denúncias, métricas privadas e dados de segurança não são apresentados publicamente.
        </p>
      </>
    ),
  },
  {
    id: "tecnicos",
    title: "5. Dados técnicos e métricas",
    content: (
      <>
        <p>
          Registamos dados técnicos necessários para autenticação, segurança, limites de pedidos
          e deteção de abuso. Os votos podem guardar temporariamente IP e navegador para investigar
          manipulação.
        </p>
        <p>
          As visualizações utilizam um identificador pseudónimo diário derivado da conta ou, para
          visitantes, do IP e navegador. Esse identificador muda diariamente, não é reversível sem
          o segredo do serviço e é removido após deixar de ser necessário para evitar duplicações.
          Os totais agregados podem permanecer sem o identificador do visitante.
        </p>
      </>
    ),
  },
  {
    id: "armazenamento-local",
    title: "6. Cookies e armazenamento local",
    content: (
      <>
        <p>Utilizamos:</p>
        <LegalList>
          <li>cookies essenciais para autenticação e segurança da sessão;</li>
          <li>armazenamento local para o tema e recuperação de rascunhos;</li>
          <li>armazenamento de sessão para estado do mapa e evitar eventos repetidos;</li>
          <li>analytics Umami quando configurado no ambiente de produção.</li>
        </LegalList>
        <p>
          Cookies estritamente necessários não podem ser desligados sem impedir funcionalidades
          essenciais. Qualquer ferramenta analítica não essencial será configurada de acordo com
          o fundamento aplicável e, quando necessário, dependerá da escolha do visitante.
        </p>
      </>
    ),
  },
  {
    id: "partilha",
    title: "7. Prestadores e destinatários",
    content: (
      <>
        <p>Os dados podem ser tratados por:</p>
        <LegalList>
          <li>Cloudflare, para entrega do website, segurança e armazenamento de imagens em R2;</li>
          <li>fornecedores de alojamento da API e da base de dados;</li>
          <li>Google, quando é utilizado o início de sessão ou recursos externos da Google;</li>
          <li>Umami ou o respetivo alojamento, se a análise de utilização estiver ativa;</li>
          <li>fornecedores de mapas solicitados pelo navegador;</li>
          <li>prestadores de email, suporte e segurança que venham a ser contratados;</li>
          <li>consultores e autoridades quando a comunicação for legalmente necessária.</li>
        </LegalList>
        <p>
          A lista definitiva de fornecedores, regiões de alojamento e funções de cada entidade
          será confirmada antes da publicação final desta Política. Não vendemos dados pessoais.
        </p>
      </>
    ),
  },
  {
    id: "transferencias",
    title: "8. Transferências internacionais",
    content: (
      <p>
        Alguns prestadores podem tratar dados fora de Cabo Verde. Nesses casos, utilizamos os
        mecanismos permitidos pela legislação cabo-verdiana, incluindo decisões de adequação,
        autorizações aplicáveis e garantias contratuais suficientes. Pode pedir informação sobre
        o destino e as garantias utilizadas através do contacto de privacidade.
      </p>
    ),
  },
  {
    id: "conservacao",
    title: "9. Conservação",
    content: (
      <>
        <p>A política técnica a implementar antes da publicação definitiva prevê:</p>
        <LegalList>
          <li>conta e perfil enquanto a conta estiver ativa;</li>
          <li>eliminação ou anonimização em até 30 dias após encerramento, salvo exceção;</li>
          <li>cópias de segurança removidas por rotação em até 90 dias;</li>
          <li>sessões até expiração, revogação ou término de sessão;</li>
          <li>identificadores diários de visitantes durante aproximadamente dois dias;</li>
          <li>conteúdo eliminado recuperável por um período máximo de 90 dias;</li>
          <li>IP e navegador associados a votos durante um período máximo inicial de 12 meses;</li>
          <li>denúncias e moderação enquanto necessários para segurança ou defesa de direitos.</li>
        </LegalList>
        <p>
          Dados podem ser conservados por mais tempo quando exista obrigação legal, litígio,
          investigação de fraude ou necessidade de proteger direitos. Os prazos só entram em
          vigor na versão definitiva depois de existirem rotinas técnicas que os cumpram.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "10. Os seus direitos",
    content: (
      <>
        <p>Nos termos aplicáveis, pode pedir:</p>
        <LegalList>
          <li>confirmação e acesso aos dados;</li>
          <li>uma cópia dos dados pessoais;</li>
          <li>retificação de dados inexatos ou incompletos;</li>
          <li>apagamento ou limitação do tratamento;</li>
          <li>oposição baseada na sua situação particular;</li>
          <li>portabilidade em formato estruturado, quando aplicável;</li>
          <li>retirada do consentimento;</li>
          <li>informação sobre destinatários e transferências.</li>
        </LegalList>
        <p>
          Os pedidos são enviados para{" "}
          <a href="mailto:codeisland1460@gmail.com" className="font-medium text-primary underline underline-offset-4">codeisland1460@gmail.com</a>. Podemos solicitar
          informação necessária para confirmar a identidade. Também pode apresentar reclamação à
          <LegalLink href="https://www.cnpd.cv/"> Comissão Nacional de Proteção de Dados</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "11. Segurança",
    content: (
      <>
        <p>
          Aplicamos medidas técnicas e organizativas proporcionais ao risco, incluindo controlo de
          acesso, proteção de credenciais, limitação de pedidos, validação de ficheiros e registos
          de segurança. Nenhum sistema ligado à Internet pode garantir segurança absoluta.
        </p>
        <p>
          Quando uma violação de dados representar risco relevante, será documentada e comunicada
          à CNPD, em regra, no prazo legal de 72 horas. As pessoas afetadas serão informadas sem
          demora injustificada quando existir risco elevado para os seus direitos.
        </p>
      </>
    ),
  },
  {
    id: "menores",
    title: "12. Menores",
    content: (
      <>
        <p>
          No perfil, o utilizador confirma que tem pelo menos 16 anos ou autorização do seu
          representante legal. Guardamos a data dessa confirmação para gerir a elegibilidade da
          conta; não recolhemos a data de nascimento nem documentos de identificação nesta etapa.
        </p>
        <p>
          Se soubermos que uma pessoa abaixo dessa idade utiliza o serviço sem autorização válida,
          tomaremos medidas para limitar ou eliminar os dados. O representante legal pode exercer
          os direitos da pessoa menor através do contacto de privacidade.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes-contacto",
    title: "13. Alterações e contacto",
    content: (
      <>
        <p>
          Podemos atualizar esta Política para refletir mudanças legais, técnicas ou funcionais.
          Alterações materiais serão comunicadas antes de entrarem em vigor e a data da versão será
          atualizada no início do documento.
        </p>
        <p>
          Contacto de privacidade:{" "}
          <a href="mailto:codeisland1460@gmail.com" className="font-medium text-primary underline underline-offset-4">codeisland1460@gmail.com</a>. Consulte também os
          nossos <a href="/termos" className="font-medium text-primary underline underline-offset-4">Termos de utilização</a> e a
          <LegalLink href="https://www.cnpd.cv/legislacao/"> legislação publicada pela CNPD</LegalLink>.
        </p>
      </>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de privacidade"
      sections={sections}
    />
  );
}
