import { describe, it, expect } from 'vitest';
import { generateSVGCard, StudentCardData } from './cardGenerator';

describe('cardGenerator', () => {
  it('should generate a valid SVG string containing student information', () => {
    const mockStudent: StudentCardData = {
      id: '1',
      studentNumber: 'MAT-2024-001',
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: '2010-05-15',
      gender: 'M',
      classroom: { name: '3ème A' }
    };
    
    const mockQr = 'data:image/png;base64,mockqrdata';
    
    const svg = generateSVGCard(mockStudent, mockQr);
    
    // Vérifier que c'est un SVG
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    
    // Vérifier les données injectées (nom complet en majuscules)
    expect(svg).toContain('JEAN DUPONT');
    expect(svg).toContain('MAT-2024-001');
    expect(svg).toContain('3ème A');
    
    // Date formatée
    expect(svg).toContain('15/05/2010');
    
    // QR Code
    expect(svg).toContain('href="data:image/png;base64,mockqrdata"');
  });
});
