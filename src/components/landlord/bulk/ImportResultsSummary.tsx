import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, AlertTriangle } from "lucide-react";
import { CSVError, downloadCSV } from "@/utils/csvParser";

interface ImportResultsSummaryProps {
  successCount: number;
  failedCount: number;
  errors: CSVError[];
  entityName: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ImportResultsSummary({
  successCount,
  failedCount,
  errors,
  entityName,
  onClose,
  onRetry,
}: ImportResultsSummaryProps) {
  const totalProcessed = successCount + failedCount;
  const hasErrors = failedCount > 0;
  
  const downloadErrorReport = () => {
    const errorRows = errors.map(e => `Row ${e.row + 1},${e.field},"${e.message}","${e.value || ''}"`);
    const csvContent = `Row,Field,Error,Value\n${errorRows.join('\n')}`;
    downloadCSV(csvContent, `import-errors-${Date.now()}.csv`);
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{totalProcessed}</div>
            <div className="text-sm text-muted-foreground">Total Processed</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{successCount}</span>
            </div>
            <div className="text-sm text-green-600/80">Imported</div>
          </CardContent>
        </Card>
        
        <Card className={hasErrors ? "border-destructive/30 bg-destructive/5" : "border-border/50"}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {hasErrors ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : (
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-3xl font-bold ${hasErrors ? 'text-destructive' : 'text-muted-foreground'}`}>
                {failedCount}
              </span>
            </div>
            <div className={`text-sm ${hasErrors ? 'text-destructive/80' : 'text-muted-foreground'}`}>
              Failed
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Message */}
      <div className={`p-4 rounded-lg flex items-start gap-3 ${
        hasErrors 
          ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' 
          : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
      }`}>
        {hasErrors ? (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Import completed with errors
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {successCount} {entityName} were imported successfully. {failedCount} {entityName} failed due to validation errors.
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Import completed successfully
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All {successCount} {entityName} were imported successfully.
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Error Details */}
      {hasErrors && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Failed Records
              </CardTitle>
              <Button variant="outline" size="sm" onClick={downloadErrorReport} className="gap-2">
                <Download className="w-4 h-4" />
                Download Error Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {errors.slice(0, 20).map((error, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-2 rounded bg-destructive/5 text-sm"
                >
                  <Badge variant="outline" className="shrink-0">
                    Row {error.row + 1}
                  </Badge>
                  <div>
                    <span className="font-medium capitalize">{error.field.replace(/_/g, ' ')}: </span>
                    <span className="text-muted-foreground">{error.message}</span>
                    {error.value && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (value: "{error.value}")
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {errors.length > 20 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ...and {errors.length - 20} more errors
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-end gap-3">
        {hasErrors && onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Upload New File
          </Button>
        )}
        <Button onClick={onClose}>
          {hasErrors ? 'Close' : 'Done'}
        </Button>
      </div>
    </div>
  );
}
