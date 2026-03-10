import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServerClient } from '@/lib/supabase/server'
import { MapPin, Users, Bed, Bath } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BookingForm } from '@/components/booking-form'

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      profiles:host_id (
        name,
        email
      )
    `)
    .eq('id', params.id)
    .eq('status', 'published')
    .maybeSingle()

  if (!listing) {
    notFound()
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('listing_id', listing.id)
    .in('status', ['pending', 'confirmed'])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {listing.images && listing.images.length > 0 ? (
                listing.images.slice(0, 4).map((image: string, index: number) => (
                  <div
                    key={index}
                    className={`${
                      index === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                    } bg-slate-200 rounded-lg overflow-hidden`}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 aspect-video bg-slate-200 rounded-lg flex items-center justify-center">
                  <MapPin className="h-16 w-16 text-slate-400" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{listing.title}</h1>
              <div className="flex items-center space-x-4 text-slate-600 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-1" />
                  {listing.city}
                </div>
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-1" />
                  {listing.bedrooms} beds
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-1" />
                  {listing.bathrooms} baths
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-1" />
                  Up to {listing.max_guests} guests
                </div>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-3">About this place</h2>
                <p className="text-slate-700">{listing.description}</p>
              </div>
            </div>

            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-slate-900 mb-6">
                  ฿{listing.price_per_night.toLocaleString()}
                  <span className="text-lg font-normal text-slate-600"> / night</span>
                </div>

                <BookingForm
                  listingId={listing.id}
                  hostId={listing.host_id}
                  pricePerNight={listing.price_per_night}
                  maxGuests={listing.max_guests}
                  existingBookings={bookings || []}
                  user={profile}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
