import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { createServerClient } from '@/lib/supabase/server'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { city?: string; minPrice?: string; maxPrice?: string }
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

  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')

  if (searchParams.city) {
    query = query.ilike('city', `%${searchParams.city}%`)
  }

  if (searchParams.minPrice) {
    query = query.gte('price_per_night', parseFloat(searchParams.minPrice))
  }

  if (searchParams.maxPrice) {
    query = query.lte('price_per_night', parseFloat(searchParams.maxPrice))
  }

  const { data: listings } = await query.order('created_at', { ascending: false })

  const { data: cities } = await supabase
    .from('listings')
    .select('city')
    .eq('status', 'published')

  const uniqueCities = Array.from(new Set(cities?.map((c: any) => c.city) || []))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Browse Listings</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Filter by City</h3>
                <div className="space-y-2">
                  <Link
                    href="/listings"
                    className="block text-sm text-slate-600 hover:text-blue-600"
                  >
                    All Cities
                  </Link>
                  {uniqueCities.map((city) => (
                    <Link
                      key={city}
                      href={`/listings?city=${encodeURIComponent(city)}`}
                      className="block text-sm text-slate-600 hover:text-blue-600"
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            {listings && listings.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <div className="aspect-video bg-slate-200 relative">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-12 w-12 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                        <p className="text-slate-600 text-sm mb-2">{listing.city}</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-500">
                            {listing.bedrooms} beds • {listing.bathrooms} baths
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            Up to {listing.max_guests} guests
                          </span>
                          <span className="font-bold text-blue-600">
                            ฿{listing.price_per_night.toLocaleString()}/night
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">No listings found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
