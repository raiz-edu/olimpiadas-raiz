export type ItemAvaliacao = {
  item: string;
  status: "correto" | "parcial" | "incorreto" | "nao_respondido";
  comentario: string;
};

export type FeedbackIA = {
  itens: ItemAvaliacao[];
  resumo: string;
};
