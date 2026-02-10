'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  const handleCreateSingleUser = async () => {
    setLoading(true);
    setOutput('Creating single user...');
    try {
      const response = await fetch('/api/prisma/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user${Date.now()}@example.com`,
          name: 'John Doe',
        }),
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
      await fetchAllUsers();
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMany = async () => {
    setLoading(true);
    setOutput('Creating multiple users...');
    try {
      const response = await fetch('/api/prisma/user/create-many', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: [
            { email: `alice${Date.now()}@example.com`, name: 'Alice' },
            { email: `bob${Date.now()}@example.com`, name: 'Bob' },
            { email: `charlie${Date.now()}@example.com`, name: 'Charlie' },
          ],
        }),
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
      await fetchAllUsers();
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (users.length === 0) {
      setOutput('No users to delete');
      return;
    }
    setLoading(true);
    setOutput('Deleting single user...');
    try {
      const response = await fetch('/api/prisma/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: users[0].id }),
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
      await fetchAllUsers();
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMany = async () => {
    setLoading(true);
    setOutput('Deleting all users...');
    try {
      const response = await fetch('/api/prisma/user/delete-many', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
      await fetchAllUsers();
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/prisma/user/get-all');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-20">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
            <div className="flex items-center font-semibold">Skolaroid</div>
          </div>
        </nav>

        <div className="flex max-w-4xl flex-1 flex-col gap-8 p-5">
          <h1 className="text-4xl font-bold">Prisma Demo</h1>

          <div className="grid gap-4 md:grid-cols-2">
            <Button onClick={handleCreateSingleUser} disabled={loading}>
              Create Single User
            </Button>
            <Button onClick={handleCreateMany} disabled={loading}>
              Create Multiple Users
            </Button>
            <Button onClick={handleDeleteSingle} disabled={loading}>
              Delete Single User
            </Button>
            <Button
              onClick={handleDeleteMany}
              disabled={loading}
              variant="destructive"
            >
              Delete All Users
            </Button>
            <Button
              onClick={fetchAllUsers}
              disabled={loading}
              variant="outline"
            >
              Fetch All Users
            </Button>
          </div>

          {output && (
            <Card className="p-4">
              <h2 className="mb-2 font-semibold">Output:</h2>
              <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
                {output}
              </pre>
            </Card>
          )}

          {users.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-4 font-semibold">
                Users in Database ({users.length})
              </h2>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="rounded border p-3">
                    <p className="text-sm">
                      <strong>ID:</strong> {user.id}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p className="text-sm">
                      <strong>Name:</strong> {user.name || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <footer className="mx-auto flex w-full items-center justify-center border-t py-16 text-center text-xs">
          <p>Skolaroid</p>
        </footer>
      </div>
    </main>
  );
}
