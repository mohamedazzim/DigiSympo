import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil } from 'lucide-react';
import type { User } from '@shared/schema';

export default function EventAdminsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const eventAdmins = users?.filter(user => user.role === 'event_admin') || [];

  const filteredAdmins = eventAdmins.filter(admin =>
    admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-event-admins">Event Admins</h1>
            <p className="text-gray-600 mt-1">Manage event administrator accounts</p>
          </div>
          <Button onClick={() => setLocation('/admin/event-admins/create')} data-testid="button-create-admin">
            <Plus className="mr-2 h-4 w-4" />
            Create Event Admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search event admins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8" data-testid="loading-admins">Loading event admins...</div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="no-admins">
                {searchTerm ? 'No event admins found matching your search' : 'No event admins created yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id} data-testid={`row-admin-${admin.id}`}>
                      <TableCell className="font-medium" data-testid={`text-admin-name-${admin.id}`}>
                        {admin.fullName}
                      </TableCell>
                      <TableCell>{admin.username}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/event-admins/${admin.id}/edit`)}
                          data-testid={`button-edit-${admin.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
