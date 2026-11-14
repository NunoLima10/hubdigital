import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@hubdigital/shared";

export const PG_ERR_UNIQUE_VIOLATION = "23505";

type Reponse = {
  display: string;
  value: string;
};

type Question = {
  title: string;
  reponses: Reponse[];
};

export {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@hubdigital/shared";

export {
  abroadCountryValues as diasporaCountryValues,
  countryLabels as diasporaCountryLabels,
} from "@hubdigital/shared";

// Where most of the diaspora lives; listed first in the country picker.
export const featuredDiasporaCountries = ["pt", "us", "fr", "nl", "lu", "sn", "br", "es", "it"] as const;

export const onBoardingQuestions: Question[] = [
  {
    title: "Com que perfil mais te identificas?",
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
    title: "Qual é o teu principal objetivo na plataforma?",
    reponses: [
      {
        display: "Descobrir novos produtos",
        value: objectiveQuestionValues[0],
      },
      {
        display: "Lançar o meu próprio produto",
        value: objectiveQuestionValues[1],
      },
      {
        display: "Conhecer outros inovadores",
        value: objectiveQuestionValues[2],
      },
      {
        display: "Apenas explorar",
        value: objectiveQuestionValues[3],
      },
    ],
  },
  {
    title: "Onde vives atualmente?",
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
    title: "Como conheceste o Hub Digital?",
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
