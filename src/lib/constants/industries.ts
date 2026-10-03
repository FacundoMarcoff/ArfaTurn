import { Organization } from '../../types/database.types';

export interface IndustryMetadata {
  id: Organization['industry'];
  name: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  clientLabel: string; // e.g. "Clientes" vs "Pacientes"
  serviceLabel: string; // e.g. "Servicios" vs "Tratamientos" vs "Consultas"
  resourceLabel: string; // e.g. "Sillones" vs "Cabinas" vs "Consultorios"
  description: string;
  typicalServices: Array<{ name: string; category: string; duration: number; price: number }>;
}

export const INDUSTRIES_METADATA: Record<Organization['industry'], IndustryMetadata> = {
  barbershop: {
    id: 'barbershop',
    name: 'Barbería & Estilo Masculino',
    emoji: '💈',
    badgeBg: 'bg-[#FAF4ED] dark:bg-[#28221D]',
    badgeText: 'text-[#8C5D45] dark:text-[#E2A688] border-[#ECDCCF] dark:border-[#3D3027]',
    clientLabel: 'Clientes',
    serviceLabel: 'Servicios de Barbería',
    resourceLabel: 'Sillones Clásicos',
    description: 'Cortes clásicos, degrade fade, perfilado de barba, toallas calientes y venta de pomadas.',
    typicalServices: [
      { name: 'Corte Clásico & Fade', category: 'Corte', duration: 45, price: 9500 },
      { name: 'Perfilado de Barba & Toalla Caliente', category: 'Barba', duration: 30, price: 6500 },
      { name: 'Combo Corte + Barba Completo', category: 'Combos', duration: 60, price: 14000 },
    ],
  },
  salon: {
    id: 'salon',
    name: 'Peluquería & Salón de Belleza',
    emoji: '💇',
    badgeBg: 'bg-[#FAF2F5] dark:bg-[#2A2025]',
    badgeText: 'text-[#A45873] dark:text-[#E499AF] border-[#EBD4DE] dark:border-[#422C37]',
    clientLabel: 'Clientes',
    serviceLabel: 'Servicios de Peluquería',
    resourceLabel: 'Puestos de Peinado',
    description: 'Lavado, brushing, colorimetría, mechas balayage, nutrición y corte unisex.',
    typicalServices: [
      { name: 'Corte & Brushing Premium', category: 'Peluquería', duration: 50, price: 12000 },
      { name: 'Balayage & Nutrición Capilar', category: 'Color', duration: 120, price: 32000 },
      { name: 'Tratamiento de Keratina', category: 'Nutrición', duration: 90, price: 22000 },
    ],
  },
  spa: {
    id: 'spa',
    name: 'Estética & Spa',
    emoji: '🧖',
    badgeBg: 'bg-[#FAF2F4] dark:bg-[#291D23]',
    badgeText: 'text-[#9E5266] dark:text-[#E69BAE] border-[#EAD0D8] dark:border-[#402733]',
    clientLabel: 'Clientes',
    serviceLabel: 'Tratamientos & Terapias',
    resourceLabel: 'Cabinas & Camillas',
    description: 'Masajes descontracturantes, limpieza facial profunda, drenaje linfático y aparatología.',
    typicalServices: [
      { name: 'Limpieza Facial Profunda con Punta de Diamante', category: 'Facial', duration: 60, price: 18000 },
      { name: 'Masaje Descontracturante & Piedras Calientes', category: 'Corporal', duration: 50, price: 21000 },
      { name: 'Drenaje Linfático Manual', category: 'Corporal', duration: 45, price: 16500 },
    ],
  },
  clinic: {
    id: 'clinic',
    name: 'Clínica & Salud',
    emoji: '🩺',
    badgeBg: 'bg-[#F2F7F5] dark:bg-[#1D2622]',
    badgeText: 'text-[#3E7059] dark:text-[#9DC6B2] border-[#D4E4DC] dark:border-[#2C4237]',
    clientLabel: 'Pacientes',
    serviceLabel: 'Consultas Médicas',
    resourceLabel: 'Consultorios Médicos',
    description: 'Atención médica general, kinesiología, dermatología y turnos programados.',
    typicalServices: [
      { name: 'Consulta Médica de Especialidad', category: 'Consultas', duration: 30, price: 25000 },
      { name: 'Sesión de Fisioterapia & Rehabilitación', category: 'Kinesiología', duration: 45, price: 16000 },
    ],
  },
  consultorio: {
    id: 'consultorio',
    name: 'Consultorio Odontológico / Especialistas',
    emoji: '🦷',
    badgeBg: 'bg-[#F3F7F5] dark:bg-[#1C2521]',
    badgeText: 'text-[#366854] dark:text-[#97C5B0] border-[#D1E3D9] dark:border-[#2A3F34]',
    clientLabel: 'Pacientes',
    serviceLabel: 'Prácticas Odontológicas',
    resourceLabel: 'Sillones Odontológicos',
    description: 'Odontología integral, ortodoncia, profilaxis, blanqueamientos e historia clínica.',
    typicalServices: [
      { name: 'Limpieza & Profilaxis con Ultrasonido', category: 'Prevención', duration: 40, price: 19000 },
      { name: 'Evaluación y Diagnóstico Odontológico', category: 'Diagnóstico', duration: 30, price: 14000 },
      { name: 'Blanqueamiento Dental LED', category: 'Estética Dental', duration: 60, price: 42000 },
    ],
  },
  general: {
    id: 'general',
    name: 'Servicios Profesionales Generales',
    emoji: '✨',
    badgeBg: 'bg-[#FAF7F2] dark:bg-[#23201D]',
    badgeText: 'text-stone-700 dark:text-stone-300 border-[#E8E2D8] dark:border-[#38332F]',
    clientLabel: 'Clientes',
    serviceLabel: 'Servicios & Sesiones',
    resourceLabel: 'Espacios / Salas',
    description: 'Estudios de fotografía, consultoría, coaching, estudios contables y reservas profesionales.',
    typicalServices: [
      { name: 'Sesión Profesional Personalizada', category: 'General', duration: 60, price: 15000 },
    ],
  },
};

export function getIndustryInfo(industry?: Organization['industry']): IndustryMetadata {
  if (!industry || !INDUSTRIES_METADATA[industry]) {
    return INDUSTRIES_METADATA.general;
  }
  return INDUSTRIES_METADATA[industry];
}
