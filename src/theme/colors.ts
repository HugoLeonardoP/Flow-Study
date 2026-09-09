// Paleta do FlowStudy.
// A ideia central: "papel" quente e neutro como base (uma folha de caderno),
// verde-sálvia como cor de marca (constância, estudo, crescimento),
// âmbar como energia do ciclo de foco (o "tomate" do Pomodoro sem ser literal)
// e azul-céu como o momento de descanso. Terracota/creme-genérico foram
// propositalmente evitados.

export const colors = {
  // Base
  ink: '#1C2321',
  inkSoft: '#5B655F',
  inkFaint: '#8B948D',
  paper: '#F7F4EC',
  paperRaised: '#FFFFFF',
  border: '#E4DECE',
  borderStrong: '#CFC6AE',

  // Marca
  sage: '#3F5B4E',
  sageDark: '#2B4038',
  sageLight: '#DCE6DC',

  // Foco (Pomodoro ativo)
  amber: '#DE9438',
  amberDark: '#B57322',
  amberSoft: '#FAEAD2',

  // Descanso
  sky: '#5F8CA6',
  skySoft: '#E2ECF1',

  // Estados de revisão
  rust: '#B85440',
  rustSoft: '#F2DFD8',
  gold: '#C79A2E',
  goldSoft: '#F5EDD3',
  leaf: '#4C7A5E',
  leafSoft: '#DDEBE1',

  // Utilidade
  overlay: 'rgba(28, 35, 33, 0.55)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

// Paleta de cores selecionáveis ao cadastrar uma matéria.
export const materiaColorOptions: string[] = [
  '#3F5B4E', // sálvia
  '#B85440', // terracota-ferrugem
  '#5F8CA6', // azul-céu
  '#C79A2E', // ouro
  '#8B5FA6', // ameixa
  '#4C7A5E', // folha
  '#A65F82', // vinho-rosado
  '#6E6259', // grafite quente
];

export type ColorTheme = typeof colors;
