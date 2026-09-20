export type Child = {
  nickname: string;
  age_years: number | null;
  communication: string;
  sensory: string;
  interests: string;
  concerns: string;
};
export type Note = {
  id: string;
  text: string;
  created_at: string;
  include_in_ai?: boolean;
  source_thread_id?: string | null;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: string;
  citations?: Source[];
};
export type Thread = {
  id: string;
  title: string;
  created_at: string;
  use_saved_context: boolean;
  messages: Message[];
};
export type Source = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  text?: string;
};
export type Snapshot = {
  child: Child;
  memories: Note[];
  journal: Note[];
  threads: Thread[];
  email?: string;
  consent: boolean;
  isAdmin?: boolean;
  adminRole?: "owner" | "content_editor";
};
export const emptyChild: Child = {
  nickname: "",
  age_years: null,
  communication: "",
  sensory: "",
  interests: "",
  concerns: "",
};
export const emptySnapshot: Snapshot = {
  child: emptyChild,
  memories: [],
  journal: [],
  threads: [],
  consent: false,
};
