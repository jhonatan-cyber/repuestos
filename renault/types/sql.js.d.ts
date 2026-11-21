declare module "sql.js" {
  export interface SqlJsQueryResult {
    columns: string[]
    values: unknown[][]
  }

  export interface SqlJsDatabase {
    exec(sql: string): SqlJsQueryResult[]
    run(sql: string, params?: unknown[]): void
    export(): Uint8Array
    close(): void
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | null) => SqlJsDatabase
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}
