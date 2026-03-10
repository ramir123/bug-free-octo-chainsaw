'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { format, differenceInDays, parseISO } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase/client'

interface BookingFormProps {
  listingId: string
  hostId: string
  pricePerNight: number
  maxGuests: number
  existingBookings: Array<{ check_in: string; check_out: string }>
  user: any
}

export function BookingForm({
  listingId,
  hostId,
  pricePerNight,
  maxGuests,
  existingBookings,
  user,
}: BookingFormProps) {
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guestCount, setGuestCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const isDateBlocked = (date: Date) => {
    return existingBookings.some((booking) => {
      const start = parseISO(booking.check_in)
      const end = parseISO(booking.check_out)
      return date >= start && date <= end
    })
  }

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0
    const nights = differenceInDays(checkOut, checkIn)
    return nights * pricePerNight
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to book')
      router.push('/login')
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates')
      return
    }

    if (checkOut <= checkIn) {
      toast.error('Check-out must be after check-in')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          listing_id: listingId,
          guest_id: user.id,
          host_id: hostId,
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd'),
          total: calculateTotal(),
          status: 'pending',
          guest_count: guestCount,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Booking created successfully')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const total = calculateTotal()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Check-in</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date() || isDateBlocked(date)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Check-out</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) =>
                  date < new Date() ||
                  (checkIn ? date <= checkIn : false) ||
                  isDateBlocked(date)
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="guests">Number of guests</Label>
          <Input
            id="guests"
            type="number"
            min={1}
            max={maxGuests}
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value))}
          />
        </div>
      </div>

      {nights > 0 && (
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>฿{pricePerNight.toLocaleString()} × {nights} nights</span>
            <span>฿{(pricePerNight * nights).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>฿{total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Processing...' : 'Book Now'}
      </Button>
    </form>
  )
}
