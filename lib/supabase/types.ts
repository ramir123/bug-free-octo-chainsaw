export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'GUEST' | 'HOST' | 'STAFF' | 'OWNER'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type ListingStatus = 'draft' | 'published' | 'archived'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: UserRole
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: UserRole
          assigned_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: UserRole
          assigned_by?: string | null
          created_at?: string
        }
      }
      host_profiles: {
        Row: {
          user_id: string
          display_name: string | null
          phone: string | null
          verification_status: VerificationStatus
          created_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          phone?: string | null
          verification_status?: VerificationStatus
          created_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          phone?: string | null
          verification_status?: VerificationStatus
          created_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string | null
          city: string
          price_per_night: number
          bedrooms: number
          bathrooms: number
          max_guests: number
          images: string[]
          amenities: string[]
          status: ListingStatus
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description?: string | null
          city: string
          price_per_night: number
          bedrooms?: number
          bathrooms?: number
          max_guests?: number
          images?: string[]
          amenities?: string[]
          status?: ListingStatus
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string | null
          city?: string
          price_per_night?: number
          bedrooms?: number
          bathrooms?: number
          max_guests?: number
          images?: string[]
          amenities?: string[]
          status?: ListingStatus
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          listing_id: string
          guest_id: string
          host_id: string
          check_in: string
          check_out: string
          total: number
          status: BookingStatus
          guest_count: number
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          guest_id: string
          host_id: string
          check_in: string
          check_out: string
          total: number
          status?: BookingStatus
          guest_count?: number
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          guest_id?: string
          host_id?: string
          check_in?: string
          check_out?: string
          total?: number
          status?: BookingStatus
          guest_count?: number
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          assigned_email: string
          assigned_role: UserRole
          assigned_by_user_id: string
          target_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assigned_email: string
          assigned_role: UserRole
          assigned_by_user_id: string
          target_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assigned_email?: string
          assigned_role?: UserRole
          assigned_by_user_id?: string
          target_user_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
