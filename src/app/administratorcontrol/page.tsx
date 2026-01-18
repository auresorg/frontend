'use client'

import { useEffect, useState } from 'react'
import { getWithTokenNextEndpoint, postWithTokenNextEndpoint } from '@/lib/utils'

type InviteUser = {
  username: string
  accept: boolean
}

type AppUser = {
  username: string
  plan: 'free' | 'pro'
}

export default function AdminPage() {
  const [invites, setInvites] = useState<InviteUser[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) return

    const fetchAdminData = async () => {
      const [invitesRes, usersRes] = await Promise.all([
        getWithTokenNextEndpoint('/admin/invites'),
        getWithTokenNextEndpoint('/admin/users'),
      ])

      if (invitesRes) setInvites(invitesRes.data.invites)
      if (usersRes) setUsers(usersRes.data.users)

      setLoadingInvites(false)
      setLoadingUsers(false)
    }

    fetchAdminData()
  }, [])

  const approveInvite = async (username: string) => {
    await postWithTokenNextEndpoint('/admin/invites', { username })

    setInvites(prev =>
      prev.map(i =>
        i.username === username ? { ...i, accept: true } : i
      )
    )
  }

  const updatePlan = async (username: string, plan: 'free' | 'pro') => {
    setUpdatingUser(username)

    try {
      const res = await postWithTokenNextEndpoint('/admin/users', {
        username,
        plan,
      })

      if (res?.data?.user) {
        setUsers(prev =>
          prev.map(u =>
            u.username === username ? { ...u, plan } : u
          )
        )
      }
    } finally {
      setUpdatingUser(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        Admin Panel
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-medium">Pending Invites</h2>

          {loadingInvites ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-2">
              {invites.map(i => (
                <li key={i.username} className="flex justify-between border p-2 rounded">
                  <span>{i.username}</span>
                  {!i.accept && (
                    <button
                      onClick={() => approveInvite(i.username)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-medium">Users</h2>

          {loadingUsers ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-2">
              {users.map(u => (
                <li key={u.username} className="flex justify-between border p-2 rounded">
                  <div className="flex gap-3 items-center">
                    <span>{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${u.plan === 'pro'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {u.plan}
                    </span>
                  </div>

                  <button
                    disabled={updatingUser === u.username}
                    onClick={() =>
                      updatePlan(u.username, u.plan === 'free' ? 'pro' : 'free')
                    }
                    className={`px-3 py-1 rounded text-white ${u.plan === 'free'
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                      }`}
                  >
                    {u.plan === 'free' ? 'Make Pro' : 'Make Free'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
