import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createServerClient } from '@/lib/supabase/server'
import { MapPin, Users, Star } from 'lucide-react'

export default async function Home() {
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

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .limit(6)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar user={profile} />

      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-teal-50 opacity-60" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Discover Your Perfect Stay in Thailand
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Find unique homes, apartments, and condos across Thailand's most beautiful destinations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/listings">
                <Button size="lg" className="text-lg px-8">
                  Browse Listings
                </Button>
              </Link>
              {!profile && (
                <Link href="/register">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Sign Up Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Amazing Locations</h3>
                  <p className="text-slate-600">
                    From Bangkok to Phuket, find properties in Thailand's best destinations
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Trusted Hosts</h3>
                  <p className="text-slate-600">
                    Connect with verified hosts who provide exceptional hospitality
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Premium Experience</h3>
                  <p className="text-slate-600">
                    Carefully curated properties to ensure quality and comfort
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {listings && listings.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
                Featured Properties
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {listing.bedrooms} beds • {listing.bathrooms} baths
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
              <div className="text-center mt-8">
                <Link href="/listings">
                  <Button size="lg" variant="outline">
                    View All Listings
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 px-4 mt-20">
        <div className="container mx-auto text-center">
          <p className="text-slate-400">© 2024 StaySiam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
