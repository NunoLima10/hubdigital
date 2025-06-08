export const PG_ERR_UNIQUE_VIOLATION = "23505";

type Reponse = {
  display: string;
  value: string;
};

type Question = {
  title: string;
  reponses: Reponse[];
};

export const profileQuestionValues = [
  "student",
  "technology-professional",
  "founder",
  "investor",
] as const;

export const objectiveQuestionValues = [
  "discover-products",
  "launch-product",
  "networking",
  "explore",
] as const;

export const locationQuestionValues = [
  "CV1",
  "CV2",
  "CV3",
  "CV4",
  "CV5",
  "CV6",
  "CV7",
  "CV8",
  "CV9",
  "diaspora",
] as const;

export const foundUsByQuestionValues = [
  "social-media",
  "friends",
  "event",
  "online-search",
] as const;

export const onBoardingQuestions: Question[] = [
  {
    title: "Com qual perfil você mais se identifica?",
    reponses: [
      {
        display: "Estudante",
        value: profileQuestionValues[0],
      },
      {
        display: "Profissional de tecnologia",
        value: profileQuestionValues[1],
      },
      {
        display: "Fundador ou empreendedor",
        value: profileQuestionValues[2],
      },
      {
        display: "Investidor ou mentor",
        value: profileQuestionValues[3],
      },
    ],
  },
  {
    title: "Qual é o seu principal objetivo na plataforma?",
    reponses: [
      {
        display: "Descobrir novos produtos",
        value: objectiveQuestionValues[0],
      },
      {
        display: "Lançar meu próprio produto",
        value: objectiveQuestionValues[1],
      },
      {
        display: "Conectar-se com inovadores",
        value: objectiveQuestionValues[2],
      },
      {
        display: "Apenas explorar",
        value: objectiveQuestionValues[3],
      },
    ],
  },
  {
    title: "Atualmente, onde você vive?",
    reponses: [
      {
        display: "Santo Antão",
        value: locationQuestionValues[0],
      },
      {
        display: "São Vicente",
        value: locationQuestionValues[1],
      },
      {
        display: "São Nicolau",
        value: locationQuestionValues[2],
      },
      {
        display: "Sal",
        value: locationQuestionValues[3],
      },
      {
        display: "Boa Vista",
        value: locationQuestionValues[4],
      },
      {
        display: "Maio",
        value: locationQuestionValues[5],
      },
      {
        display: "Santiago",
        value: locationQuestionValues[6],
      },
      {
        display: "Fogo",
        value: locationQuestionValues[7],
      },
      {
        display: "Brava",
        value: locationQuestionValues[8],
      },
      {
        display: "Na diáspora",
        value: locationQuestionValues[9],
      },
    ],
  },
  {
    title: "Como você conheceu nossa plataforma?",
    reponses: [
      {
        display: "Redes sociais",
        value: foundUsByQuestionValues[0],
      },
      {
        display: "Amigos/colegas",
        value: foundUsByQuestionValues[1],
      },
      {
        display: "Evento ou conferência",
        value: foundUsByQuestionValues[2],
      },
      {
        display: "Pesquisa online",
        value: foundUsByQuestionValues[3],
      },
    ],
  },
] as const;
