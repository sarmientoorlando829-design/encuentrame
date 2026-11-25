import { AnimalType } from '../core/models';

export interface ColorOption {
  label: string;
  css: string;
}

const BLACK = '#1d1d1f';
const WHITE = '#ffffff';

export const COLORS: Record<AnimalType, ColorOption[]> = {
  Gato: [
    { label: 'Negro', css: BLACK },
    { label: 'Blanco', css: WHITE },
    { label: 'Gris', css: '#9aa0a6' },
    { label: 'Naranja', css: '#f08a24' },
    { label: 'Café', css: '#7b4a2d' },
    { label: 'Crema', css: '#f3dfb7' },
    { label: 'Atigrado', css: 'repeating-linear-gradient(45deg,#8b5e3c 0 6px,#3a2a20 6px 10px)' },
    { label: 'Calicó', css: `conic-gradient(${WHITE} 0 33%, #f08a24 0 66%, ${BLACK} 0)` },
    { label: 'Carey', css: `conic-gradient(${BLACK} 0 25%, #f08a24 0 50%, ${BLACK} 0 75%, #b5651d 0)` },
    { label: 'Esmoquin', css: `linear-gradient(90deg, ${BLACK} 50%, ${WHITE} 50%)` },
    { label: 'Siamés', css: 'radial-gradient(circle, #3b2a22 0 30%, #f3dfb7 32%)' },
  ],
  Perro: [
    { label: 'Negro', css: BLACK },
    { label: 'Blanco', css: WHITE },
    { label: 'Café', css: '#7b4a2d' },
    { label: 'Dorado', css: '#d9a441' },
    { label: 'Crema', css: '#f3dfb7' },
    { label: 'Gris', css: '#9aa0a6' },
    { label: 'Canela y negro', css: `linear-gradient(135deg, #b5651d 50%, ${BLACK} 50%)` },
    { label: 'Blanco y negro', css: `linear-gradient(135deg, ${WHITE} 50%, ${BLACK} 50%)` },
    { label: 'Blanco y café', css: `linear-gradient(135deg, ${WHITE} 50%, #7b4a2d 50%)` },
    { label: 'Atigrado', css: 'repeating-linear-gradient(45deg,#8b5e3c 0 6px,#2d2118 6px 10px)' },
    { label: 'Tricolor', css: `conic-gradient(${WHITE} 0 33%, #b5651d 0 66%, ${BLACK} 0)` },
  ],
  Otro: [
    { label: 'Negro', css: BLACK },
    { label: 'Blanco', css: WHITE },
    { label: 'Café', css: '#7b4a2d' },
    { label: 'Gris', css: '#9aa0a6' },
    { label: 'Dorado', css: '#d9a441' },
    { label: 'Verde', css: '#3fa34d' },
    { label: 'Multicolor', css: 'conic-gradient(#e5484d, #f5c542, #3fa34d, #3880ff, #e5484d)' },
  ],
};

export const BREEDS: Record<'Perro' | 'Gato', string[]> = {
  Perro: [
    'Criollo / Mestizo', 'Labrador', 'Golden Retriever', 'Pastor Alemán', 'Bulldog Francés', 'Bulldog Inglés', 'Beagle',
    'Chihuahua', 'Poodle', 'Schnauzer', 'Pug', 'Husky Siberiano', 'Rottweiler', 'Shih Tzu', 'Yorkshire Terrier',
    'Pinscher', 'Border Collie', 'Dálmata', 'Boxer', 'Cocker Spaniel', 'Salchicha (Dachshund)', 'Pitbull', 'Samoyedo',
    'Maltés', 'Akita', 'Doberman', 'Gran Danés', 'San Bernardo', 'Jack Russell', 'Pomerania',
  ],
  Gato: [
    'Criollo / Doméstico', 'Siamés', 'Persa', 'Angora', 'Maine Coon', 'Bengalí', 'Ragdoll', 'Británico de pelo corto',
    'Azul ruso', 'Esfinge (Sphynx)', 'Abisinio', 'Scottish Fold', 'Birmano', 'Himalayo', 'Bosque de Noruega',
  ],
};

export const typeIcon = (t: AnimalType): string => (t === 'Perro' ? '🐶' : t === 'Gato' ? '🐱' : '🐾');

export const normalize = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
