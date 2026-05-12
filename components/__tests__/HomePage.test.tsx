import { render, screen } from '@testing-library/react';
import { statSync } from 'fs';
import { join } from 'path';
import Home from '../../app/page';

describe('Home page logo', () => {
  it('renders logo as WebP', () => {
    render(<Home />);
    const logo = screen.getByAltText('Mathemagic');
    expect(logo).toHaveAttribute('src', '/mathemagic-logo-bg.webp');
  });

  it('WebP logo file is ≤300KB', () => {
    const filePath = join(process.cwd(), 'public', 'mathemagic-logo-bg.webp');
    const stats = statSync(filePath);
    expect(stats.size).toBeLessThanOrEqual(300 * 1024);
  });
});
