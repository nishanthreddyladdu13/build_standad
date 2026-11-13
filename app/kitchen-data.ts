export type EvidenceTier =
  | "India national reference"
  | "Indian anthropometric data"
  | "Professional recommendation"
  | "Manufacturer guidance";

export type Citation = {
  label: string;
  locator: string;
  tier: EvidenceTier;
  note: string;
  href?: string;
};

export type KitchenRule = {
  id: string;
  item: string;
  value: string;
  trigger: string;
  citationIds: string[];
  status: "active" | "reference" | "product-specific";
};

export type AnthropometricProfile = {
  label: string;
  elbow: number;
  shoulder: number;
  waist: number;
  verticalReach: number;
  citationIds: string[];
};

export const kitchenSourceLinks = {
  nkba: "https://media.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf",
  hettich: "https://web.hettich.com/fileadmin/Company_website/HAU/Media/Hettich_Australia_-_Guide_to_planning_an_Intelligent_Kitchen.pdf",
};

export const anthropometricProfiles: Record<string, AnthropometricProfile> = {
  "Combined median": {
    label: "Combined Indian median",
    elbow: 1022,
    shoulder: 1357,
    waist: 965,
    verticalReach: 2059,
    citationIds: ["CIT-ANTHRO-P35", "CIT-ANTHRO-P36", "CIT-ANTHRO-P43"],
  },
  "Female median": {
    label: "Indian female median",
    elbow: 953,
    shoulder: 1267,
    waist: 931,
    verticalReach: 1909,
    citationIds: ["CIT-ANTHRO-P35", "CIT-ANTHRO-P36", "CIT-ANTHRO-P43"],
  },
  "Male median": {
    label: "Indian male median",
    elbow: 1039,
    shoulder: 1381,
    waist: 970,
    verticalReach: 2109,
    citationIds: ["CIT-ANTHRO-P35", "CIT-ANTHRO-P36", "CIT-ANTHRO-P43"],
  },
};

export const kitchenCitations: Record<string, Citation> = {
  "CIT-ANTHRO-P35": {
    label: "Indian Anthropometric Dimensions · mid-shoulder height",
    locator: "Printed p.35 · PDF physical p.39 · percentile table",
    tier: "Indian anthropometric data",
    note: "Debkumar Chakrabarti, National Institute of Design. The uploaded scan is readable; edition and publication year are not visible in the available front matter and remain uncertain.",
  },
  "CIT-ANTHRO-P36": {
    label: "Indian Anthropometric Dimensions · elbow and waist height",
    locator: "Printed p.36 · PDF physical p.40 · percentile table",
    tier: "Indian anthropometric data",
    note: "Raw Indian body measurements in millimetres. They are inputs to ergonomic derivations, not building-code dimensions.",
  },
  "CIT-ANTHRO-P43": {
    label: "Indian Anthropometric Dimensions · vertical upward reach",
    locator: "Printed p.43 · PDF physical p.48 · percentile table",
    tier: "Indian anthropometric data",
    note: "The inclusive reference shown in the demo is the female 5th-percentile value of 1,759 mm. It is a body measure, not a universal shelf-height rule.",
  },
  "CIT-HETTICH-P16": {
    label: "Hettich · Guide to planning an intelligent kitchen",
    locator: "PDF p.16 · Work zone and clearances",
    tier: "Manufacturer guidance",
    note: "Advises a benchtop 10–15 cm below the bent elbow and frequently used storage near waist height. This is ergonomic guidance, not an Indian regulation.",
    href: kitchenSourceLinks.hettich,
  },
  "CIT-NKBA-P5": {
    label: "NKBA Kitchen Planning Guideline 6 · Work aisle",
    locator: "PDF file p.6 · printed p.6 · 1,067 mm one cook · 1,219 mm multiple cooks",
    tier: "Professional recommendation",
    note: "International professional planning guidance. It is not an Indian statutory minimum.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P7": {
    label: "NKBA Kitchen Planning Guideline 7 · Walkway",
    locator: "PDF p.7 · 914 mm walkway",
    tier: "Professional recommendation",
    note: "International professional planning guidance. It is not an Indian statutory minimum.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P12": {
    label: "NKBA Kitchen Planning Guideline 11 · Sink landing",
    locator: "PDF p.12 · 610 mm one side · 457 mm other side",
    tier: "Professional recommendation",
    note: "Landing area is measured as qualifying countertop frontage adjacent to the sink.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P13": {
    label: "NKBA Kitchen Planning Guideline 12 · Preparation area",
    locator: "PDF p.13 · 914 mm wide × 610 mm deep continuous worktop",
    tier: "Professional recommendation",
    note: "The continuous primary preparation area is placed immediately next to a sink.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P14": {
    label: "NKBA Kitchen Planning Guideline 13 · Dishwasher",
    locator: "PDF p.14 · within 914 mm of sink · 533 mm right-angle standing space",
    tier: "Professional recommendation",
    note: "Final door swing and service clearances must still follow the selected appliance manual.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P16": {
    label: "NKBA Kitchen Planning Guideline 16 · Refrigerator landing",
    locator: "PDF p.16 · 381 mm landing area",
    tier: "Professional recommendation",
    note: "Placement alternatives depend on refrigerator configuration and handle side.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P17": {
    label: "NKBA Kitchen Planning Guideline 17 · Cooking landing",
    locator: "PDF p.17 · 305 mm one side · 381 mm other side",
    tier: "Professional recommendation",
    note: "An island or peninsula at the same height also receives a 229 mm rear extension in this guidance.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P18": {
    label: "NKBA Kitchen Planning Guideline 18 · Cooking clearance",
    locator: "PDF pp.18–19 · 610 mm to protected noncombustible surface",
    tier: "Professional recommendation",
    note: "This source references US codes. The demo treats 610 mm only as advisory; the appliance manual and applicable Indian/local requirements control the final value.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P23": {
    label: "NKBA Kitchen Planning Guideline 21 · Microwave placement",
    locator: "PDF p.23 · bottom 76 mm below user shoulder · maximum 1,372 mm AFF",
    tier: "Professional recommendation",
    note: "The calculator combines this formula with the selected Indian shoulder-height profile.",
    href: kitchenSourceLinks.nkba,
  },
  "CIT-NKBA-P24": {
    label: "NKBA Kitchen Planning Guideline 22 · Microwave landing",
    locator: "PDF p.24 · 381 mm landing area at handle side",
    tier: "Professional recommendation",
    note: "Final appliance installation remains subject to the selected manufacturer manual.",
    href: kitchenSourceLinks.nkba,
  },
};

export const kitchenRules: KitchenRule[] = [
  { id: "KIT-R001", item: "Personalised worktop band", value: "Elbow height minus 150–100 mm", trigger: "Standing preparation worktop", citationIds: ["CIT-HETTICH-P16", "CIT-ANTHRO-P36"], status: "active" },
  { id: "KIT-R002", item: "One-cook work aisle", value: "1,067 mm", trigger: "One principal cook", citationIds: ["CIT-NKBA-P5"], status: "active" },
  { id: "KIT-R003", item: "Multiple-cook work aisle", value: "1,219 mm", trigger: "Two or more simultaneous cooks", citationIds: ["CIT-NKBA-P5"], status: "active" },
  { id: "KIT-R004", item: "Walkway", value: "914 mm", trigger: "Passage that is not a work aisle", citationIds: ["CIT-NKBA-P7"], status: "active" },
  { id: "KIT-R005", item: "Primary preparation surface", value: "914 × 610 mm", trigger: "Continuous worktop immediately next to sink", citationIds: ["CIT-NKBA-P13"], status: "active" },
  { id: "KIT-R006", item: "Sink landing", value: "610 mm + 457 mm", trigger: "Primary cleanup/preparation sink", citationIds: ["CIT-NKBA-P12"], status: "active" },
  { id: "KIT-R007", item: "Cooking-surface landing", value: "305 mm + 381 mm", trigger: "Hob or cooking surface", citationIds: ["CIT-NKBA-P17"], status: "active" },
  { id: "KIT-R008", item: "Refrigerator landing", value: "381 mm", trigger: "Handle side or listed alternative", citationIds: ["CIT-NKBA-P16"], status: "active" },
  { id: "KIT-R009", item: "Dishwasher relationship", value: "≤914 mm from sink; 533 mm right-angle standing space", trigger: "Dishwasher included", citationIds: ["CIT-NKBA-P14"], status: "active" },
  { id: "KIT-R010", item: "Protected overhead above hob", value: "610 mm advisory", trigger: "Protected noncombustible surface above cooking surface", citationIds: ["CIT-NKBA-P18"], status: "reference" },
  { id: "KIT-R011", item: "Microwave bottom", value: "Shoulder height minus 76 mm; maximum 1,372 mm AFF", trigger: "Wall or tall-unit microwave", citationIds: ["CIT-NKBA-P23", "CIT-ANTHRO-P35"], status: "active" },
  { id: "KIT-R012", item: "Microwave landing", value: "381 mm", trigger: "Landing above, below or beside handle side", citationIds: ["CIT-NKBA-P24"], status: "active" },
  { id: "KIT-R013", item: "Inclusive vertical reach reference", value: "1,759 mm", trigger: "Female 5th-percentile Indian raw measure", citationIds: ["CIT-ANTHRO-P43"], status: "reference" },
  { id: "KIT-R014", item: "Frequently used storage zone", value: "Near the selected user's waist height", trigger: "Everyday utensils, cookware and crockery", citationIds: ["CIT-HETTICH-P16", "CIT-ANTHRO-P36"], status: "reference" },
  { id: "KIT-R015", item: "Cabinet carcass, shutter and hardware dimensions", value: "Selected system required", trigger: "Every cabinet specification", citationIds: [], status: "product-specific" },
  { id: "KIT-R016", item: "Appliance recess, ventilation and door-swing clearance", value: "Selected model manual required", trigger: "Every refrigerator, oven, hob, hood, microwave and dishwasher", citationIds: [], status: "product-specific" },
];
