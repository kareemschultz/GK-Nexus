/**
 * Guyana Administrative Data
 * Official 10 Administrative Regions with capitals
 */

export interface GuyanaRegion {
  id: string;
  number: number;
  name: string;
  capital: string;
  label: string;
}

export const GUYANA_REGIONS: GuyanaRegion[] = [
  {
    id: "region-1",
    number: 1,
    name: "Barima-Waini",
    capital: "Mabaruma",
    label: "Region 1 - Barima-Waini",
  },
  {
    id: "region-2",
    number: 2,
    name: "Pomeroon-Supenaam",
    capital: "Anna Regina",
    label: "Region 2 - Pomeroon-Supenaam",
  },
  {
    id: "region-3",
    number: 3,
    name: "Essequibo Islands-West Demerara",
    capital: "Vreed-en-Hoop",
    label: "Region 3 - Essequibo Islands-West Demerara",
  },
  {
    id: "region-4",
    number: 4,
    name: "Demerara-Mahaica",
    capital: "Georgetown",
    label: "Region 4 - Demerara-Mahaica",
  },
  {
    id: "region-5",
    number: 5,
    name: "Mahaica-Berbice",
    capital: "Fort Wellington",
    label: "Region 5 - Mahaica-Berbice",
  },
  {
    id: "region-6",
    number: 6,
    name: "East Berbice-Corentyne",
    capital: "New Amsterdam",
    label: "Region 6 - East Berbice-Corentyne",
  },
  {
    id: "region-7",
    number: 7,
    name: "Cuyuni-Mazaruni",
    capital: "Bartica",
    label: "Region 7 - Cuyuni-Mazaruni",
  },
  {
    id: "region-8",
    number: 8,
    name: "Potaro-Siparuni",
    capital: "Mahdia",
    label: "Region 8 - Potaro-Siparuni",
  },
  {
    id: "region-9",
    number: 9,
    name: "Upper Takutu-Upper Essequibo",
    capital: "Lethem",
    label: "Region 9 - Upper Takutu-Upper Essequibo",
  },
  {
    id: "region-10",
    number: 10,
    name: "Upper Demerara-Berbice",
    capital: "Linden",
    label: "Region 10 - Upper Demerara-Berbice",
  },
];

// Common cities in Guyana by region
export const GUYANA_CITIES: Record<string, string[]> = {
  "region-1": ["Mabaruma", "Matthews Ridge", "Port Kaituma", "Morawhanna"],
  "region-2": ["Anna Regina", "Charity", "Suddie", "Adventure"],
  "region-3": ["Vreed-en-Hoop", "Parika", "Leonora", "Tuschen"],
  "region-4": [
    "Georgetown",
    "Enmore",
    "Mahaica",
    "Buxton",
    "Beterverwagting",
    "Plaisance",
  ],
  "region-5": ["Fort Wellington", "Rosignol", "Blairmont", "Bath"],
  "region-6": ["New Amsterdam", "Corriverton", "Skeldon", "Rose Hall"],
  "region-7": ["Bartica", "Kamarang", "Issano"],
  "region-8": ["Mahdia", "Paramakatoi", "Kato"],
  "region-9": ["Lethem", "Aishalton", "Annai", "Sand Creek"],
  "region-10": ["Linden", "Ituni", "Kwakwani"],
};

// Helper function to get region by ID
export function getRegionById(id: string): GuyanaRegion | undefined {
  return GUYANA_REGIONS.find((r) => r.id === id);
}

// Helper function to get region by name (case-insensitive, partial match)
export function findRegionByName(name: string): GuyanaRegion | undefined {
  const lowerName = name.toLowerCase();
  return GUYANA_REGIONS.find(
    (r) =>
      r.name.toLowerCase().includes(lowerName) ||
      lowerName.includes(r.name.toLowerCase())
  );
}

// Get cities for a region
export function getCitiesForRegion(regionId: string): string[] {
  return GUYANA_CITIES[regionId] || [];
}
