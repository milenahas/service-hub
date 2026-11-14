import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('renderiza o título do projeto', () => {
    render(<App />)

    expect(screen.getByText('Service Hub')).toBeInTheDocument()
  })
})