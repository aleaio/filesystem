"use client"

import { useState, useEffect } from 'react'

interface Admin {
  id: string
  username: string
}

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('adminToken')
      const adminData = localStorage.getItem('adminData')
      
      if (token && adminData) {
        const parsedAdmin = JSON.parse(adminData)
        setAdmin(parsedAdmin)
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        setAdmin(null)
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      setIsAdmin(false)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, adminData: Admin) => {
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminData', JSON.stringify(adminData))
    setAdmin(adminData)
    setIsAdmin(true)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    setAdmin(null)
    setIsAdmin(false)
  }

  return {
    isAdmin,
    admin,
    loading,
    login,
    logout,
    checkAuthStatus
  }
}