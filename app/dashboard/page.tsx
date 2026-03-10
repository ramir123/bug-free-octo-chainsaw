import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default async function DashboardPage() {
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

  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'HOST') {
    redirect('/dashboard/host')
  } else if (profile.role === 'STAFF') {
    redirect('/dashboard/staff')
  } else if (profile.role === 'OWNER') {
    redirect('/dashboard/owner')
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      listings (
        id,
        title,
        city,
        price_per_night,
        images
      )
    `)
    .eq('guest_id', user.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const currentStays = bookings?.filter(
    (b) => b.check_in <= today && b.check_out >= today && b.status === 'confirmed'
  ) || []
  const pastStays = bookings?.filter(
    (b) => b.check_out < today || b.status === 'completed'
  ) || []
  const upcomingStays = bookings?.filter(
    (b) => b.check_in > today && b.status === 'confirmed'
  ) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">My Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Stays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{currentStays.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Stays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{upcomingStays.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Past Stays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-600">{pastStays.length}</div>
            </CardContent>
          </Card>
        </div>

        {currentStays.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Stays</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStays.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.listings?.title || 'N/A'}
                      </TableCell>
                      <TableCell>{booking.listings?.city || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(booking.check_in), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{booking.guest_count}</TableCell>
                      <TableCell>฿{booking.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {upcomingStays.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upcoming Stays</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingStays.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.listings?.title || 'N/A'}
                      </TableCell>
                      <TableCell>{booking.listings?.city || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(booking.check_in), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{booking.guest_count}</TableCell>
                      <TableCell>฿{booking.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.listings?.title || 'N/A'}
                      </TableCell>
                      <TableCell>{booking.listings?.city || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(booking.check_in), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{booking.guest_count}</TableCell>
                      <TableCell>฿{booking.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-600">No bookings yet. Start exploring properties!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
