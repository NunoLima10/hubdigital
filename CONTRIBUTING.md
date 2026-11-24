# Contribuir para o Hub Digital

Podes contribuir com código, documentação, testes, acessibilidade e relatos de
bugs. Issues e pull requests podem ser escritos em português ou inglês.

## Primeira contribuição

1. Consulta as issues e o [backlog](PROJECT_BACKLOG.md). Comenta na issue que
   queres resolver; para mudanças maiores, descreve primeiro a proposta.
2. Faz fork, clona o teu fork e cria uma branch descritiva:

   ```sh
   git clone https://github.com/SEU-UTILIZADOR/hubdigital.git
   cd hubdigital
   git switch -c fix/descricao-curta
   ```

3. Segue o [arranque local](README.md#arranque-local) e lê a
   [arquitetura](docs/architecture.md).
4. Implementa uma alteração focada. Evita misturar reformatações ou refactors
   sem relação com o problema.
5. Antes de entregar alterações de código, usa `pnpm check` com Docker em
   execução. Para iteração sem Docker, usa `pnpm test:unit`; isso não substitui
   os testes de integração. Sem Node no host, o equivalente a `pnpm check` é
   `docker compose --profile test run --rm tests pnpm check`.
6. Cria um commit descritivo, envia a branch para o teu fork e abre um PR.

Usa Conventional Commits, por exemplo `fix: corrigir filtros de projetos` ou
`docs: esclarecer configuração local`.

## Convenções

- Mantém a organização por funcionalidade existente. Schemas e contratos usados
  por várias apps pertencem a `packages/shared`.
- Usa TypeScript e nomes descritivos. Evita `any` e duplicar regras de negócio.
- Para bugs, acrescenta um teste de regressão quando ele conseguir demonstrar
  o comportamento. Mudanças apenas de texto não precisam de testes artificiais.
- Usa o logger da API em vez de deixar `console.log` de depuração.
- Para UI, verifica navegação por teclado, labels, estados de erro e layouts
  pequenos. Inclui capturas de ecrã no PR quando houver mudanças visuais.
- Documenta novas variáveis em `.env.example` sem incluir segredos reais.
- Não incluas `.env`, credenciais, dados pessoais, builds ou `node_modules`.

## Alterações à base de dados

1. Edita os schemas em `api/src/db/schemas`.
2. Executa `pnpm api:db:gen` e revê o SQL gerado em `api/src/db/migrations`.
3. Aplica com `pnpm api:db:migrate` na base de dados local.
4. Inclui a migração e os metadados gerados no PR. Não reescrevas migrações já
   aplicadas; cria uma nova migração.
5. Executa os testes da API e descreve qualquer migração de dados ou impacto
   incompatível. Atualiza o diagrama com `pnpm api:dbml` quando necessário.

Não uses `db:push` como substituto de uma migração versionada no PR.
`pnpm api:setup` aplica migrações e seeds sem apagar o volume existente.

## O que incluir no PR

- Problema resolvido, comportamento resultante e issue relacionada.
- Comandos de validação executados e respetivos resultados.
- Capturas de ecrã para alterações visuais.
- Novas variáveis, migrações e impactos incompatíveis, se existirem.

Se algum check não puder ser executado, explica a limitação. O CI executa lint,
testes e builds. Revê links e comandos quando alterares a documentação.

## Reportar problemas

Usa os templates de issue para bugs e propostas. Inclui passos de reprodução,
resultado esperado, versões de Node/pnpm e sistema operativo. Remove segredos
dos logs. Consulta também as notas de configuração em [SECURITY.md](SECURITY.md).

## Licença das contribuições

Ao enviar uma contribuição, confirma que tem o direito de a submeter e aceita
que ela seja disponibilizada sob a GNU Affero General Public License v3.0 only
(`AGPL-3.0-only`), a mesma licença do projeto. Não inclua código, dados, imagens
ou outros materiais incompatíveis com essa licença.

A licença do código não autoriza o uso do nome, dos logótipos ou da identidade
visual do Hub Digital em forks ou serviços modificados. Consulte
`LICENSING.md` e `TRADEMARKS.md` antes de redistribuir o projeto.
