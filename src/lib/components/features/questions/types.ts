export interface AnswerData {
  id: string;
  text: string;
  stats?: number;
}

export interface QuestionData {
  id: string;
  title: string;
  qcomment?: string;
  answers: AnswerData[];
  footerLinks?: { text: string; href: string }[];
}
