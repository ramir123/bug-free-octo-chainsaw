import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AssignHostForm } from '@/components/assign-host-form'
import { Users, Chrome as Home, DollarSign } from 'lucide-react'

export default async function StaffDashboardPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'STAFF' && profile.role !== 'OWNER')) {
    redirect('/dashboard')
  }

  const { data: hosts } = await supabase
    .from('profiles')
    .select(`
      *,
      host_profiles (*)
    `)
    .eq('role', 'HOST')
    .order('created_at', { ascending: false })

  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      *,
      profiles:assigned_by_user_id (
        name,
        email
      ),
      target_profiles:target_user_id (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  const myAssignments = assignments?.filter(a => a.assigned_by_user_id === user.id) || []

  const hostsStats = await Promise.all(
    (hosts || []).map(async (host) => {
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('host_id', host.id)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('total')
        .eq('host_id', host.id)

      const totalIncome = bookings?.reduce((sum, b) => sum + Number(b.total), 0) || 0

      return {
        ...host,
        listingsCount: listings?.length || 0,
        totalIncome,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Staff Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hosts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hosts?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myAssignments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{hostsStats.reduce((sum, h) => sum + h.totalIncome, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Assign Host Role</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignHostForm currentUserId={user.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              {myAssignments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {myAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="border-b pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assignment.assigned_email}</p>
                          <p className="text-sm text-slate-600">
                            Role: <Badge variant="secondary">{assignment.assigned_role}</Badge>
                          </p>
                          {assignment.target_profiles && (
                            <p className="text-xs text-slate-500 mt-1">
                              Applied to: {assignment.target_profiles.name || assignment.target_profiles.email}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">No assignments yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Host Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {hostsStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Total Income</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostsStats.map((host) => (
                    <TableRow key={host.id}>
                      <TableCell className="font-medium">{host.name || 'N/A'}</TableCell>
                      <TableCell>{host.email}</TableCell>
                      <TableCell>{host.listingsCount}</TableCell>
                      <TableCell>฿{host.totalIncome.toLocaleString()}</TableCell>
                      <TableCell>{new Date(host.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-600">No hosts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
