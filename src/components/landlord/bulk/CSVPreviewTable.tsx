import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { CSVError } from "@/utils/csvParser";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CSVPreviewTableProps<T> {
  headers: string[];
  rows: T[];
  errors: CSVError[];
  maxPreviewRows?: number;
}

export function CSVPreviewTable<T extends Record<string, any>>({
  headers,
  rows,
  errors,
  maxPreviewRows = 10,
}: CSVPreviewTableProps<T>) {
  const [showAll, setShowAll] = useState(false);
  
  const displayRows = showAll ? rows : rows.slice(0, maxPreviewRows);
  const hasMore = rows.length > maxPreviewRows;
  
  const getRowErrors = (rowIndex: number) => 
    errors.filter(e => e.row === rowIndex);
  
  const hasFieldError = (rowIndex: number, field: string) =>
    errors.some(e => e.row === rowIndex && e.field === field);
  
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to preview
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{rows.length} rows found</span>
          {errors.length > 0 ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.length} errors
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle className="w-3 h-3" />
              All valid
            </Badge>
          )}
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-16">Status</TableHead>
                {headers.map(header => (
                  <TableHead key={header} className="capitalize">
                    {header.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, index) => {
                const rowErrors = getRowErrors(index);
                const hasErrors = rowErrors.length > 0;
                
                return (
                  <TableRow 
                    key={index}
                    className={cn(hasErrors && "bg-destructive/5")}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      {hasErrors ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertCircle className="w-3 h-3" />
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 text-xs bg-green-600">
                          <CheckCircle className="w-3 h-3" />
                        </Badge>
                      )}
                    </TableCell>
                    {headers.map(header => (
                      <TableCell 
                        key={header}
                        className={cn(
                          hasFieldError(index, header) && "text-destructive font-medium"
                        )}
                      >
                        {row[header] || '-'}
                        {hasFieldError(index, header) && (
                          <div className="text-xs text-destructive mt-1">
                            {rowErrors.find(e => e.field === header)?.message}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {hasMore && !showAll && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            Show all {rows.length} rows
          </Button>
        </div>
      )}
      
      {showAll && hasMore && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>
            Show less
          </Button>
        </div>
      )}
    </div>
  );
}
