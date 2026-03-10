'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase/client'

interface AssignRoleFormProps {
  currentUserId: string
}

export function AssignRoleForm({ currentUserId }: AssignRoleFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'HOST' | 'STAFF'>('HOST')
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
            role: role,
            assigned_by: currentUserId,
          })
          .eq('id', existingUser.id)

        if (updateError) throw updateError

        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            assigned_email: email,
            assigned_role: role,
            assigned_by_user_id: currentUserId,
            target_user_id: existingUser.id,
          })

        if (assignmentError) throw assignmentError

        toast.success(`User role updated to ${role}`)
      } else {
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            assigned_email: email,
            assigned_role: role,
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
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={(value: 'HOST' | 'STAFF') => setRole(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOST">HOST</SelectItem>
            <SelectItem value="STAFF">STAFF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Assigning...' : 'Assign Role'}
      </Button>
    </form>
  )
}
