import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import RegistrationCommitteeLayout from "@/components/layouts/RegistrationCommitteeLayout";
import type { Registration } from "@shared/schema";

export default function RegistrationCommitteeDashboard() {
  const { data: registrations } = useQuery<Registration[]>({
    queryKey: ['/api/registrations'],
  });

  const totalRegistrations = registrations?.length || 0;
  const pendingRegistrations = registrations?.filter(r => r.paymentStatus === 'pending').length || 0;
  const approvedRegistrations = registrations?.filter(r => r.paymentStatus === 'paid').length || 0;

  return (
    <RegistrationCommitteeLayout>
      <div className="container mx-auto p-6 max-w-6xl" data-testid="page-reg-committee-dashboard">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">Dashboard</h1>
          <p className="text-muted-foreground">Registration Committee Overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card data-testid="card-total">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">{totalRegistrations}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">{pendingRegistrations}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-approved">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-approved">{approvedRegistrations}</div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage registration approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/registration-committee/registrations">
              <Button data-testid="button-view-registrations">
                <ClipboardList className="h-4 w-4 mr-2" />
                View All Registrations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </RegistrationCommitteeLayout>
  );
}
