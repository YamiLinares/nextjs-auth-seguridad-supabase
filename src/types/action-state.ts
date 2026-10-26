/** Resultado tipado de las Server Actions. Nunca contiene tokens ni contraseñas. */
export type FieldErrors = Partial<Record<string, string[]>>;

export type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; fields?: Record<string, string> }
  | { status: "success"; message: string };

export const IDLE_STATE: ActionState = { status: "idle" };
