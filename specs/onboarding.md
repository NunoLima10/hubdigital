# Decisões de produto do onboarding

O onboarding do Hub Digital recolhe informação sobre quem entra na comunidade, o que procura, onde vive e como conheceu a plataforma. Estas decisões aplicam-se ao primeiro acesso e à edição das preferências no painel.

## Perfis e objetivos

| Pergunta | Regra |
| --- | --- |
| Com que perfis te identificas? | Escolher um ou dois perfis. |
| Quais são os teus objetivos na plataforma? | Escolher um ou dois objetivos. |

O limite é independente para cada pergunta. Por exemplo, uma pessoa pode identificar-se como estudante e fundadora, e querer lançar um produto e conhecer outros inovadores. Duas escolhas permitem representar essa combinação e ainda pedir à pessoa que indique o que lhe interessa mais.

Com a pergunta em branco, «Próximo» fica desativado. Ao selecionar duas opções, as restantes ficam desativadas. Desmarcar uma permite escolher outra. A API também valida a quantidade e rejeita duplicados.

As respostas anteriores continuam disponíveis nas preferências. Quem já tinha três ou quatro escolhas pode revê-las e decide quais manter ao guardar a próxima alteração.

## Residência e ilha de origem

Quem reside em Cabo Verde escolhe a ilha onde vive. Quem seleciona «Na diáspora» pode indicar o país de residência e, se quiser, a sua ilha de origem ou a da família. Uma pessoa nascida fora de Cabo Verde pode concluir este passo deixando ambos os campos em branco.

A lista apresenta as ilhas diretamente. Depois de escolher uma, «Limpar seleção» permite voltar a deixar o campo em branco. Ao mudar da diáspora para uma ilha de residência em Cabo Verde, o formulário limpa os dados específicos da diáspora.

## Como as respostas afetam as boas-vindas

A mensagem usa o primeiro perfil selecionado segundo a ordem apresentada na pergunta. Se «Lançar o meu próprio produto» estiver entre os objetivos, a ação em destaque é «Publicar o meu primeiro projeto». Para as outras combinações, é «Explorar projetos». As duas ações ficam disponíveis.

## Verificação

- No browser, o formulário foi exercitado a 375 × 667 e 1440 × 900. Foram verificados o bloqueio de perguntas vazias, a tentativa de uma terceira escolha, a substituição de opções e a revisão das respostas.
- Em mobile, o percurso terminou com «Na diáspora» e sem país ou ilha de origem. Em desktop, a mudança de «Na diáspora» para Santo Antão ficou refletida na revisão e nos dados enviados.
- Os 12 testes de onboarding da API passaram, incluindo a criação de um registo da diáspora sem ilha de origem.
- O teste de browser usou o formulário real com resposta de gravação simulada. Continua por verificar, numa sessão autenticada, a passagem da gravação real ao ecrã de boas-vindas.
