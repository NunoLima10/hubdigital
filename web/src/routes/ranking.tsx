import {
  LegalDocument,
  LegalLink,
  LegalList,
  type LegalSection,
} from "@/modules/legal/legal-document";
import { seo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";

const GITHUB_ROOT = "https://github.com/NunoLima10/hubdigital/blob/main";
const RANKING_UPDATED_AT = "15 de novembro de 2026";

export const Route = createFileRoute("/ranking")({
  head: () =>
    seo({
      title: "Como funciona o ranking",
      description:
        "Critérios, períodos, desempates e histórico de alterações do ranking do Hub Digital.",
      path: "/ranking",
    }),
  component: RankingPage,
});

const sections: LegalSection[] = [
  {
    id: "resumo",
    title: "1. A regra em poucas palavras",
    content: (
      <>
        <div className="rounded-lg border border-primary/25 bg-primary/5 px-5 py-4">
          <p className="font-semibold text-foreground">
            A posição é definida pelo total de apoios recebidos pelo projeto.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            A semana escolhe os projetos que participam. Comentários, visualizações, cliques,
            favoritos e outras interações não acrescentam pontos.
          </p>
        </div>
        <p>
          O ranking é um indicador de apoio da comunidade. Não é uma avaliação editorial, uma
          certificação de qualidade nem uma medição completa do impacto de um projeto.
        </p>
      </>
    ),
  },
  {
    id: "participacao",
    title: "2. Que projetos participam",
    content: (
      <>
        <p>
          Um projeto participa numa semana quando tem um anúncio publicado durante essa semana.
          Apenas projetos públicos e visíveis podem aparecer. Um projeto ocultado ou eliminado
          deixa de ser apresentado enquanto mantiver esse estado.
        </p>
        <p>
          As semanas seguem o calendário ISO: começam à segunda-feira às 00:00 e terminam no
          início da segunda-feira seguinte, usando a hora de Cabo Verde (UTC−1).
        </p>
        <p>
          A publicação da página permanente de um projeto e a sua entrada num ranking semanal são
          momentos diferentes. É o anúncio publicado que coloca o projeto na semana correspondente.
        </p>
      </>
    ),
  },
  {
    id: "votos",
    title: "3. O que conta para a posição",
    content: (
      <>
        <p>
          Cada conta pode manter um apoio por projeto. Premir o botão de apoio novamente remove o
          apoio existente. A base de dados impede que a mesma conta mantenha dois apoios no mesmo
          projeto.
        </p>
        <p>A posição não recebe pontos por:</p>
        <LegalList>
          <li>comentários ou respostas;</li>
          <li>visualizações da página;</li>
          <li>cliques em ligações externas;</li>
          <li>favoritos ou partilhas;</li>
          <li>quantidade de membros da equipa ou informação preenchida.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "periodo",
    title: "4. Como o tempo é considerado",
    content: (
      <>
        <p>
          Atualmente, a semana limita os projetos elegíveis, mas não limita a data dos apoios
          contabilizados. O ranking usa o total acumulado de apoios do projeto, incluindo apoios
          recebidos antes da semana em que o anúncio foi publicado.
        </p>
        <p>
          Por exemplo: se um projeto já tiver 100 apoios antes de entrar no ranking desta semana,
          começa a competir com esses 100 apoios. Outro projeto que receba 50 apoios durante a
          semana fica abaixo dele, caso nenhum dos totais mude.
        </p>
        <p>
          Os rankings de semanas anteriores também são calculados com os totais disponíveis no
          momento da consulta. Não existe ainda um resultado gravado e congelado no encerramento
          da semana. Por isso, um apoio dado ou removido mais tarde pode alterar a ordem apresentada
          numa semana passada.
        </p>
      </>
    ),
  },
  {
    id: "desempate-movimento",
    title: "5. Desempates e movimento diário",
    content: (
      <>
        <p>
          Quando dois projetos têm o mesmo total de apoios, aparece primeiro o projeto com data de
          criação mais recente. Se essa data também for igual, o identificador interno mais alto é
          usado como último desempate.
        </p>
        <p>
          Na página de um projeto lançado na semana atual, o indicador de movimento compara a sua
          posição atual com a posição calculada aproximadamente 24 horas antes. Esta comparação
          usa os apoios existentes até cada momento, mas continua a incluir o histórico anterior
          desses projetos.
        </p>
      </>
    ),
  },
  {
    id: "anuncios",
    title: "6. Ranking dos anúncios da comunidade",
    content: (
      <>
        <p>
          Os anúncios da comunidade têm votos próprios, separados dos apoios permanentes dados ao
          projeto. Nessa lista, a ordem é definida pelo total de votos do anúncio; em empate, o
          anúncio publicado mais recentemente aparece primeiro.
        </p>
        <p>
          Comentários e outras interações também não entram nesta classificação. Um voto num
          anúncio não aumenta automaticamente o total de apoios do projeto, nem o contrário.
          Tal como no ranking de projetos, a lista usa o total disponível no momento da consulta
          e não guarda um resultado final congelado no fim da semana.
        </p>
      </>
    ),
  },
  {
    id: "integridade",
    title: "7. Integridade e moderação",
    content: (
      <>
        <p>
          O serviço aplica limites aos pedidos de voto e regista informação técnica, como endereço
          IP e navegador, para permitir investigação posterior de abuso. Estes dados de auditoria
          não acrescentam nem retiram pontos automaticamente.
        </p>
        <p>
          Contas adicionais, automação e qualquer coordenação destinada a manipular votos ou
          rankings violam os{" "}
          <Link
            to="/termos"
            className="font-medium text-primary underline underline-offset-4"
          >
            Termos de utilização
          </Link>
          . Conteúdos ocultados deixam de aparecer nas listas públicas, mas os respetivos registos
          de voto não são apagados apenas por causa da ocultação.
        </p>
      </>
    ),
  },
  {
    id: "codigo",
    title: "8. Consultar a implementação",
    content: (
      <>
        <p>
          O Hub Digital é um projeto de código aberto. A descrição desta página pode ser confirmada
          diretamente nos ficheiros que implementam o ranking:
        </p>
        <LegalList>
          <li>
            <LegalLink href={GITHUB_ROOT + "/api/src/modules/projects/projects-services.ts"}>
              seleção, ordenação, desempate e movimento semanal
            </LegalLink>
          </li>
          <li>
            <LegalLink href={GITHUB_ROOT + "/api/src/utils/project-visibility.ts"}>
              contagem de apoios e comentários
            </LegalLink>
          </li>
          <li>
            <LegalLink href={GITHUB_ROOT + "/api/src/utils/week.ts"}>
              calendário semanal de Cabo Verde
            </LegalLink>
          </li>
          <li>
            <LegalLink href={GITHUB_ROOT + "/api/src/db/schemas/project-upvotes.ts"}>
              registo e unicidade dos apoios por conta
            </LegalLink>
          </li>
          <li>
            <LegalLink href={GITHUB_ROOT + "/api/src/modules/projects/projects-routes.ts"}>
              autenticação e limite de pedidos de apoio
            </LegalLink>
          </li>
          <li>
            <LegalLink href={GITHUB_ROOT + "/api/src/modules/community/community-services.ts"}>
              votos e ordenação dos anúncios da comunidade
            </LegalLink>
          </li>
        </LegalList>
        <p>
          Também é possível consultar o{" "}
          <LegalLink href="https://github.com/NunoLima10/hubdigital">
            repositório completo no GitHub
          </LegalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "9. Histórico de alterações",
    content: (
      <>
        <p>
          Esta secção será atualizada sempre que uma alteração material mudar quem participa, o
          que é contado, o período de contagem, a ordem, os desempates ou o tratamento de votos.
          Correções apenas editoriais ou refatorações sem efeito no resultado podem não receber uma
          entrada própria.
        </p>
        <div className="border-l-2 border-primary/35 pl-5">
          <p className="font-semibold text-foreground">15 de novembro de 2026 — versão 1.0</p>
          <p className="mt-1">
            Publicação inicial da documentação. Regista o ranking por total acumulado de apoios,
            a elegibilidade semanal através de anúncios, os desempates, o movimento de 24 horas,
            o ranking separado de anúncios e o comportamento não congelado das semanas anteriores.
          </p>
        </div>
      </>
    ),
  },
];

function RankingPage() {
  return (
    <LegalDocument
      title="Como funciona o ranking"
      updatedAt={RANKING_UPDATED_AT}
      sections={sections}
    />
  );
}
