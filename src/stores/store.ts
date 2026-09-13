export interface Store {
  get<T>(key: string): Promise<T | undefined>;

  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;

  delete(key: string): Promise<void>;
}
