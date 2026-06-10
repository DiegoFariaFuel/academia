export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  links?: { label: string; href: string }[];
}

export interface LegalDocument {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: LegalSection[];
}
