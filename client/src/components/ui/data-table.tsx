import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface TableColumn<T> {
  title: React.ReactNode;
  dataIndex?: keyof T | string;
  key?: string;
  width?: number;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

export type TableColumnsType<T> = TableColumn<T>[];

interface PaginationConfig {
  pageSize?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showTotal?: (total: number) => React.ReactNode;
  current?: number;
  onChange?: (page: number, pageSize: number) => void;
  total?: number;
}

interface DataTableProps<T> {
  columns: TableColumnsType<T>;
  dataSource: T[];
  rowKey: keyof T | string | ((record: T) => string);
  loading?: boolean;
  bordered?: boolean;
  pagination?: PaginationConfig | false;
  scroll?: { x?: number | string; y?: number | string };
  className?: string;
}

function getValue<T>(record: T, dataIndex?: keyof T | string): unknown {
  if (dataIndex === undefined) return undefined;
  return (record as Record<string, unknown>)[String(dataIndex)];
}

function getRowKey<T>(record: T, rowKey: DataTableProps<T>['rowKey'], index: number): string {
  if (typeof rowKey === 'function') return rowKey(record);
  return String(getValue(record, rowKey) ?? index);
}

export function Table<T>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  bordered = false,
  pagination,
  scroll,
  className,
}: DataTableProps<T>) {
  const paginated = pagination !== false && pagination !== undefined;
  const config = pagination === false ? undefined : pagination;
  const initialPageSize = config?.pageSize ?? 10;
  const [page, setPage] = React.useState(config?.current ?? 1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const total = config?.total ?? dataSource.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(config?.current ?? page, pageCount);
  const externallyPaginated = config?.total !== undefined;
  const rows = paginated && !externallyPaginated ? dataSource.slice((safePage - 1) * pageSize, safePage * pageSize) : dataSource;

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const changePage = (nextPage: number, nextPageSize = pageSize) => {
    setPage(nextPage);
    config?.onChange?.(nextPage, nextPageSize);
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="w-full overflow-x-auto" style={{ maxHeight: scroll?.y }}>
        <table className={cn('w-full caption-bottom text-sm', bordered && 'border border-border')}>
          <thead className="sticky top-0 z-[1] bg-muted/80 backdrop-blur-sm">
            <tr className="border-b">
              {columns.map((column, index) => (
                <th
                  key={column.key ?? String(column.dataIndex ?? index)}
                  className={cn('h-10 px-3 text-left align-middle font-medium whitespace-nowrap', bordered && 'border-r border-border last:border-r-0')}
                  style={{ width: column.width, minWidth: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIndex) => (
                <tr key={`loading-${rowIndex}`} className="border-b last:border-0">
                  {columns.map((column, columnIndex) => (
                    <td key={`${rowIndex}-${column.key ?? columnIndex}`} className="p-3">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((record, rowIndex) => (
                <tr key={getRowKey(record, rowKey, rowIndex)} className="border-b transition-colors hover:bg-muted/40 last:border-0">
                  {columns.map((column, columnIndex) => {
                    const value = getValue(record, column.dataIndex);
                    return (
                      <td
                        key={column.key ?? String(column.dataIndex ?? columnIndex)}
                        className={cn('p-3 align-middle', bordered && 'border-r border-border last:border-r-0', column.ellipsis && 'max-w-64 truncate')}
                        style={{ width: column.width, minWidth: column.width }}
                      >
                        {column.render ? column.render(value, record, rowIndex) : String(value ?? '--')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {paginated ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{config?.showTotal?.(total) ?? `共 ${total} 条`}</span>
          <div className="flex items-center gap-2">
            {config?.showSizeChanger ? (
              <label className="flex items-center gap-2">
                <span className="sr-only">每页条数</span>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    changePage(1, nextSize);
                  }}
                >
                  {(config.pageSizeOptions ?? [10, 20, 50]).map((size) => <option key={size} value={size}>{size} 条/页</option>)}
                </select>
              </label>
            ) : null}
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => changePage(safePage - 1)}>上一页</Button>
            <span className="min-w-16 text-center tabular-nums">{safePage} / {pageCount}</span>
            <Button variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => changePage(safePage + 1)}>下一页</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { Table as DataTable };
