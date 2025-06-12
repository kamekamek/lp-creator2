import { StructureConfirmationClient } from './StructureConfirmationClient';

interface LPSection {
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'footer';
  title: string;
  description: string;
}

interface LPStructure {
  title: string;
  sections: LPSection[];
}

interface StructureConfirmationProps {
  structure: LPStructure;
}

export function StructureConfirmation({ structure }: StructureConfirmationProps) {
  return <StructureConfirmationClient structure={structure} />;
}