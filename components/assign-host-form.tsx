'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase/client'

interface AssignHostFormProps {
  currentUserId: string
}

export function AssignHostForm({ currentUserId }: AssignHostFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'HOST',
            assigned_by: currentUserId,
          })
          .eq('id', existingUser.id)

        if (updateError) throw updateError

        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            assigned_email: email,
            assigned_role: 'HOST',
            assigned_by_user_id: currentUserId,
            target_user_id: existingUser.id,
          })

        if (assignmentError) throw assignmentError

        toast.success('User role updated to HOST')
      } else {
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            assigned_email: email,
            assigned_role: 'HOST',
            assigned_by_user_id: currentUserId,
          })

        if (assignmentError) throw assignmentError

        toast.success('Assignment created. Role will be applied when user registers.')
      }

      setEmail('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="host@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="text-sm text-slate-600">
          Enter the email of the user you want to assign as HOST.
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Assigning...' : 'Assign HOST Role'}
      </Button>
    </form>
  )
}
