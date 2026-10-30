import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '../src/pages/LoginPage'
import { AuthProvider } from '../src/context/AuthContext'
import { ToastProvider } from '../src/context/ToastContext'

vi.mock('../src/services/auth.service', () => ({
  authService: {
    login: vi.fn(async () => ({
      access_token: 'test-token',
      user: { user_id: 5, name: 'Asha Verma', email: 'asha@example.com', role: 'customer' },
    })),
    me: vi.fn(async () => ({
      user_id: 5,
      name: 'Asha Verma',
      email: 'asha@example.com',
      role: 'customer',
    })),
    register: vi.fn(),
    changePassword: vi.fn(),
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('shows validation messages instead of calling the API with empty fields', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('rejects malformed email addresses', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
  })

  it('signs in and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'asha@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    })
  })
})
