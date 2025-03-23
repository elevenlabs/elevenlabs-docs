// Rust-style types - improves error handling best-practices
export type Ok<T> = T extends void ? { ok: true } : { ok: true; value: T };

export type Err<E> = {
  ok: false;
  error: E;
};

export type Result<T, E = string> = Ok<T> | Err<E>;

export const Ok = <T>(value?: T extends void ? void : T): Ok<T> => {
  return (typeof value === 'undefined' ? { ok: true } : { ok: true, value }) as Ok<T>;
};
export const Err = <E>(error: E): Err<E> => ({ ok: false, error });
