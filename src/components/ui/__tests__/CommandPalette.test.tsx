import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../CommandPalette';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}));

describe('CommandPalette Component', () => {
  it('should not render if isOpen is false', () => {
    render(<CommandPalette isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/Que cherchez-vous/i)).toBeNull();
  });

  it('should render and filter options if isOpen is true', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Que cherchez-vous/i);
    expect(input).toBeDefined();

    // Typique d'une recherche (ex: Audit)
    fireEvent.change(input, { target: { value: 'Audit' } });
    
    // Le lien vers /admin/audit devrait être visible (ou 'Sécurité')
    const auditBtn = screen.getByText(/Journaux d'Audit/i);
    expect(auditBtn).toBeDefined();
    
    // Cliquer sur le résultat ferme la modale et navigue
    fireEvent.click(auditBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/audit');
  });
});
