export interface IDatabase {
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    execute(sql: string, params?: any[]): Promise<{
        changes: number;
    }>;
    initSchema(): Promise<void>;
    seedDefaults(): Promise<void>;
}
export declare const db: IDatabase;
