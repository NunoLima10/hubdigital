import {
  LegalDocument,
  LegalLink,
  LegalList,
  type LegalSection,
} from "@/modules/legal/legal-document";
import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () =>
    seo({
      title: "Termos de utilização",
      description: "Regras de utilização, publicação e participação na comunidade Hub Digital.",
      path: "/termos",
      noIndex: true,
    }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    id: "responsavel",
    title: "1. Responsável e âmbito",
    content: (
      <>
        <p>
          Estes Termos regulam o acesso e a utilização do Hub Digital, uma plataforma de
          descoberta, divulgação e apoio a projetos e produtos digitais ligados a Cabo Verde.
          Ao criar uma conta ou utilizar funcionalidades reservadas, o utilizador aceita estes
          Termos e a Política de Privacidade.
        </p>
        <p>
          O Hub Digital é um projeto de código aberto criado e mantido principalmente por
          <strong> Nuno Lima</strong>, de Mindelo, Cabo Verde. O código e a atividade pública do
          projeto podem ser consultados no
          <LegalLink href="https://github.com/NunoLima10/hubdigital"> repositório do Hub Digital no GitHub</LegalLink>.
        </p>
        <p>
          Para assuntos relacionados com o serviço, suporte, denúncias ou questões jurídicas,
          contacte <a href="mailto:codeisland1460@gmail.com" className="font-medium text-primary underline underline-offset-4">codeisland1460@gmail.com</a>.
          As contribuições de código feitas por terceiros não tornam esses contribuidores
          responsáveis pela operação da plataforma ou pelo conteúdo publicado pelos utilizadores.
        </p>
      </>
    ),
  },
  {
    id: "servico",
    title: "2. O serviço",
    content: (
      <>
        <p>
          O Hub Digital permite descobrir projetos, criar perfis profissionais, publicar páginas
          de projetos, carregar imagens, identificar membros de equipa, comentar, votar, guardar
          favoritos, publicar anúncios e consultar estatísticas.
        </p>
        <p>
          A presença de um projeto na plataforma não constitui certificação, recomendação ou
          garantia do Hub Digital. Cada responsável continua a ser responsável pelo seu projeto,
          pelas informações publicadas e pelos serviços ou produtos que disponibiliza.
        </p>
      </>
    ),
  },
  {
    id: "elegibilidade",
    title: "3. Idade e elegibilidade",
    content: (
      <>
        <p>
          No perfil, o utilizador declara que tem pelo menos 16 anos ou que possui autorização
          do respetivo representante legal. O Hub Digital regista a data dessa declaração e
          presume que a informação fornecida é verdadeira, sem pedir data de nascimento ou
          documento nesta etapa.
        </p>
        <p>
          Se existirem motivos razoáveis para duvidar da declaração, o Hub Digital pode solicitar
          confirmação adicional ou limitar a conta até a situação ser esclarecida.
        </p>
        <p>
          Quem utiliza o serviço em nome de uma organização declara ter poderes para vincular
          essa organização relativamente aos conteúdos e projetos publicados.
        </p>
      </>
    ),
  },
  {
    id: "contas",
    title: "4. Contas e segurança",
    content: (
      <>
        <p>O utilizador compromete-se a:</p>
        <LegalList>
          <li>fornecer informações verdadeiras, completas e atualizadas;</li>
          <li>proteger as suas credenciais e não partilhar a conta;</li>
          <li>informar o Hub Digital sobre acessos não autorizados;</li>
          <li>não personificar outra pessoa, projeto ou organização;</li>
          <li>não criar contas adicionais para manipular votos, métricas ou rankings.</li>
        </LegalList>
        <p>
          O Hub Digital pode solicitar elementos razoáveis para resolver suspeitas de fraude,
          personificação ou disputas sobre a titularidade de um projeto.
        </p>
      </>
    ),
  },
  {
    id: "conteudos",
    title: "5. Conteúdos e direitos",
    content: (
      <>
        <p>
          O utilizador mantém a titularidade dos conteúdos que publica. Ao publicá-los, concede
          ao Hub Digital uma licença não exclusiva, mundial e gratuita para alojar, guardar,
          reproduzir, redimensionar, formatar e apresentar esses conteúdos apenas na medida
          necessária para operar, proteger, divulgar e melhorar o serviço.
        </p>
        <p>
          A licença termina com a eliminação do conteúdo, sem prejuízo de cópias de segurança
          temporárias, partilhas já realizadas licitamente, obrigações legais e preservação
          necessária para reclamações ou defesa de direitos.
        </p>
        <p>Ao publicar, o utilizador declara que:</p>
        <LegalList>
          <li>é titular do conteúdo ou possui autorização suficiente;</li>
          <li>as informações sobre o projeto, autoria e equipa são verdadeiras;</li>
          <li>tem autorização para utilizar nomes, imagens, vídeos, logótipos e marcas;</li>
          <li>não divulga dados pessoais de terceiros sem fundamento legítimo;</li>
          <li>o conteúdo não viola direitos de autor, marcas, privacidade ou outros direitos.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "conduta",
    title: "6. Conduta proibida",
    content: (
      <>
        <p>Não é permitido utilizar o Hub Digital para:</p>
        <LegalList>
          <li>publicar conteúdos ilegais, fraudulentos, ameaçadores ou discriminatórios;</li>
          <li>assediar pessoas ou divulgar informação privada sem autorização;</li>
          <li>explorar sexualmente menores ou divulgar material abusivo;</li>
          <li>distribuir malware, phishing, spam ou ligações deliberadamente perigosas;</li>
          <li>infringir propriedade intelectual ou personificar terceiros;</li>
          <li>contornar segurança, limites de pedidos ou controlos de acesso;</li>
          <li>recolher em massa dados pessoais ou conteúdos sem autorização;</li>
          <li>manipular votos, visualizações, comentários, denúncias ou rankings;</li>
          <li>apresentar denúncias repetidamente falsas ou manifestamente infundadas.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "moderacao",
    title: "7. Moderação",
    content: (
      <>
        <p>
          O Hub Digital pode rever, solicitar correções, rejeitar, ocultar, despromover ou
          remover conteúdos e pode limitar, suspender ou encerrar contas quando exista violação
          da lei, destes Termos, de direitos de terceiros ou risco para a segurança do serviço.
        </p>
        <p>
          Sempre que legalmente possível, a pessoa afetada recebe os factos considerados, a
          regra aplicada, a duração da medida temporária e informação sobre como reclamar. A
          análise de uma reclamação inclui intervenção humana e não depende exclusivamente de
          uma decisão automatizada.
        </p>
      </>
    ),
  },
  {
    id: "denuncias",
    title: "8. Denúncias e reclamações",
    content: (
      <>
        <p>
          Qualquer pessoa pode denunciar conteúdo alegadamente ilegal indicando a localização
          exata, os motivos, os elementos de prova disponíveis, um contacto e uma declaração de
          boa-fé, salvo as exceções legais relativas à identificação do denunciante.
        </p>
        <p>
          O Hub Digital procura confirmar a receção no prazo de cinco dias e comunicar a decisão
          no prazo de dez dias. A pessoa afetada pode apresentar reclamação eletrónica e gratuita
          durante 30 dias após a notificação; a reclamação é analisada, em regra, no prazo de dez
          dias. Estes prazos podem ser ajustados quando uma ordem legal ou a complexidade do caso
          imponha tratamento diferente.
        </p>
      </>
    ),
  },
  {
    id: "metricas",
    title: "9. Votos, rankings e métricas",
    content: (
      <>
        <p>
          Votos, rankings, visualizações e cliques são indicadores comunitários e não constituem
          uma avaliação auditada da qualidade ou popularidade de um projeto. O Hub Digital pode
          excluir bots, duplicações, atividade do próprio responsável, fraude e tráfego inválido.
        </p>
        <p>
          Os resultados podem ser corrigidos após deteção de manipulação ou erro técnico. A
          publicação de um projeto não garante uma posição, quantidade de tráfego ou resultado
          comercial.
        </p>
      </>
    ),
  },
  {
    id: "terceiros",
    title: "10. Serviços externos",
    content: (
      <p>
        Websites, lojas, aplicações, repositórios e outros destinos apresentados nos projetos
        são operados por terceiros. O Hub Digital não controla a disponibilidade, segurança,
        políticas ou transações desses serviços e não é parte nos contratos celebrados fora da
        plataforma.
      </p>
    ),
  },
  {
    id: "encerramento",
    title: "11. Suspensão e encerramento",
    content: (
      <>
        <p>
          O utilizador pode pedir o encerramento da conta através do contacto indicado neste
          documento. O Hub Digital pode suspender ou encerrar uma conta quando tal seja necessário
          para aplicar estes Termos, cumprir a lei, proteger terceiros ou responder a riscos de
          segurança.
        </p>
        <p>
          Após o encerramento, os dados são eliminados ou anonimizados de acordo com a Política
          de Privacidade. Alguns registos podem ser preservados quando necessários para cumprir
          obrigações legais, resolver reclamações, prevenir abuso ou defender direitos.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidade",
    title: "12. Disponibilidade e responsabilidade",
    content: (
      <>
        <p>
          O serviço é disponibilizado de acordo com a sua disponibilidade e pode ser alterado,
          interrompido ou descontinuado. O utilizador deve conservar cópias dos conteúdos que não
          possa perder.
        </p>
        <p>
          Na medida permitida pela lei, o Hub Digital não responde pela qualidade ou atuação de
          projetos e serviços externos, nem por perdas exclusivamente resultantes das decisões de
          terceiros. Nada nestes Termos exclui responsabilidades ou direitos que não possam ser
          legalmente limitados.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "13. Alterações",
    content: (
      <p>
        Alterações materiais a estes Termos são comunicadas com, pelo menos, 30 dias de
        antecedência e não são aplicadas retroativamente. Se não concordar, o utilizador pode
        deixar de utilizar o serviço e pedir o encerramento da conta antes da entrada em vigor da
        nova versão.
      </p>
    ),
  },
  {
    id: "lei-contacto",
    title: "14. Lei aplicável e contacto",
    content: (
      <>
        <p>
          Estes Termos são regidos pela legislação de Cabo Verde, sem prejuízo das normas
          obrigatórias aplicáveis ao utilizador. Os litígios podem ser submetidos aos tribunais
          competentes ou a mecanismos legalmente disponíveis de resolução extrajudicial.
        </p>
        <p>
          Contacto para suporte, denúncias e reclamações:{" "}
          <a href="mailto:codeisland1460@gmail.com" className="font-medium text-primary underline underline-offset-4">codeisland1460@gmail.com</a>.
          Consulte também a nossa <a href="/privacidade" className="font-medium text-primary underline underline-offset-4">Política de Privacidade</a> e a
          <LegalLink href="https://boe.incv.cv/Bulletins/Download/5909"> legislação cabo-verdiana sobre serviços digitais</LegalLink>.
        </p>
      </>
    ),
  },
];

function TermsPage() {
  return (
    <LegalDocument
      title="Termos de utilização"
      sections={sections}
    />
  );
}
