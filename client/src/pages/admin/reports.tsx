import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Plus } from 'lucide-react';
import type { Report } from '@shared/schema';

export default function ReportsPage() {
  const [, setLocation] = useLocation();

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-reports">Reports</h1>
            <p className="text-gray-600 mt-1">Generate and view event reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocation('/admin/reports/generate/event')} data-testid="button-generate-event">
              <Plus className="mr-2 h-4 w-4" />
              Generate Event Report
            </Button>
            <Button onClick={() => setLocation('/admin/reports/generate/symposium')} data-testid="button-generate-symposium">
              <Plus className="mr-2 h-4 w-4" />
              Generate Symposium Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8" data-testid="loading-reports">Loading reports...</div>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500" data-testid="no-reports">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No reports generated yet</p>
                <p className="mt-2">Click the buttons above to generate your first report</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell className="font-medium" data-testid={`text-report-title-${report.id}`}>
                        {report.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.reportType === 'symposium_wide' ? 'default' : 'secondary'}>
                          {report.reportType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!report.fileUrl}
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Event-wise Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Generate detailed reports for individual events including participant scores, question analysis, violation logs, and more.
              </p>
              <Button className="w-full" onClick={() => setLocation('/admin/reports/generate/event')} data-testid="button-event-report">
                Generate Event Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Symposium-wide Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Generate comprehensive reports aggregating data from all events, including overall statistics and cross-event analytics.
              </p>
              <Button className="w-full" onClick={() => setLocation('/admin/reports/generate/symposium')} data-testid="button-symposium-report">
                Generate Symposium Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
