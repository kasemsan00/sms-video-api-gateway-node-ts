/**
 * SQL Query Builder
 * Prevents SQL injection by using parameterized queries
 */

export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value?: unknown;
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  table: string;
  on: string;
}

export interface OrderByClause {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Query Builder for MySQL
 */
export class QueryBuilder {
  private selectClause: string = '';
  private fromClause: string = '';
  private joinClauses: string[] = [];
  private whereConditions: string[] = [];
  private orderByClauses: string[] = [];
  private limitClause: string = '';
  private offsetClause: string = '';
  private params: unknown[] = [];

  /**
   * SELECT clause
   */
  public select(columns: string[] = ['*']): this {
    const escapedColumns = columns.map((col) => this.escapeIdentifier(col));
    this.selectClause = `SELECT ${escapedColumns.join(', ')}`;
    return this;
  }

  /**
   * FROM clause
   */
  public from(table: string, alias?: string): this {
    const tableName = this.escapeIdentifier(table);
    this.fromClause = alias
      ? `FROM ${tableName} AS ${this.escapeIdentifier(alias)}`
      : `FROM ${tableName}`;
    return this;
  }

  /**
   * JOIN clause
   */
  public join(join: JoinClause): this {
    const table = this.escapeIdentifier(join.table);
    this.joinClauses.push(`${join.type} JOIN ${table} ON ${join.on}`);
    return this;
  }

  /**
   * WHERE clause with conditions
   */
  public where(conditions: WhereCondition[]): this {
    for (const condition of conditions) {
      const field = this.escapeIdentifier(condition.field);

      if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
        this.whereConditions.push(`${field} ${condition.operator}`);
      } else if (condition.operator === 'IN') {
        const values = condition.value as unknown[];
        const placeholders = values.map(() => '?').join(', ');
        this.whereConditions.push(`${field} IN (${placeholders})`);
        this.params.push(...values);
      } else {
        this.whereConditions.push(`${field} ${condition.operator} ?`);
        this.params.push(condition.value);
      }
    }
    return this;
  }

  /**
   * Simple WHERE clause with object
   */
  public whereEqual(data: Record<string, unknown>): this {
    const conditions: WhereCondition[] = Object.entries(data).map(([field, value]) => ({
      field,
      operator: '=',
      value,
    }));
    return this.where(conditions);
  }

  /**
   * ORDER BY clause
   */
  public orderBy(clauses: OrderByClause[]): this {
    this.orderByClauses = clauses.map((clause) => {
      const field = this.escapeIdentifier(clause.field);
      return `${field} ${clause.direction}`;
    });
    return this;
  }

  /**
   * LIMIT clause
   */
  public limit(count: number): this {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  /**
   * OFFSET clause
   */
  public offset(count: number): this {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  /**
   * Build INSERT query
   */
  public insert(table: string, data: Record<string, unknown>): { sql: string; params: unknown[] } {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const escapedColumns = columns.map((col) => this.escapeIdentifier(col));
    const tableName = this.escapeIdentifier(table);

    const sql = `INSERT INTO ${tableName} (${escapedColumns.join(', ')}) VALUES (${placeholders})`;

    return { sql, params: values };
  }

  /**
   * Build UPDATE query
   */
  public update(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): { sql: string; params: unknown[] } {
    const setClauses = Object.keys(data).map((key) => `${this.escapeIdentifier(key)} = ?`);
    const whereClauses = Object.keys(where).map((key) => `${this.escapeIdentifier(key)} = ?`);

    const tableName = this.escapeIdentifier(table);
    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;

    const params = [...Object.values(data), ...Object.values(where)];

    return { sql, params };
  }

  /**
   * Build DELETE query
   */
  public delete(table: string, where: Record<string, unknown>): { sql: string; params: unknown[] } {
    const whereClauses = Object.keys(where).map((key) => `${this.escapeIdentifier(key)} = ?`);

    const tableName = this.escapeIdentifier(table);
    const sql = `DELETE FROM ${tableName} WHERE ${whereClauses.join(' AND ')}`;

    const params = Object.values(where);

    return { sql, params };
  }

  /**
   * Build SELECT query
   */
  public build(): { sql: string; params: unknown[] } {
    const parts = [this.selectClause, this.fromClause];

    if (this.joinClauses.length > 0) {
      parts.push(this.joinClauses.join(' '));
    }

    if (this.whereConditions.length > 0) {
      parts.push(`WHERE ${this.whereConditions.join(' AND ')}`);
    }

    if (this.orderByClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderByClauses.join(', ')}`);
    }

    if (this.limitClause) {
      parts.push(this.limitClause);
    }

    if (this.offsetClause) {
      parts.push(this.offsetClause);
    }

    const sql = parts.join(' ');
    return { sql, params: this.params };
  }

  /**
   * Escape identifier (table/column names)
   */
  private escapeIdentifier(identifier: string): string {
    // Handle aliases like "table.column" or "table AS alias"
    if (identifier.includes('.')) {
      return identifier
        .split('.')
        .map((part) => `\`${part.replace(/`/g, '``')}\``)
        .join('.');
    }

    if (identifier === '*') {
      return '*';
    }

    return `\`${identifier.replace(/`/g, '``')}\``;
  }

  /**
   * Reset builder state
   */
  public reset(): this {
    this.selectClause = '';
    this.fromClause = '';
    this.joinClauses = [];
    this.whereConditions = [];
    this.orderByClauses = [];
    this.limitClause = '';
    this.offsetClause = '';
    this.params = [];
    return this;
  }
}
