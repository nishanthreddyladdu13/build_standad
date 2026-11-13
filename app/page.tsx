"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  anthropometricProfiles,
  Citation,
  kitchenCitations,
  kitchenRules,
} from "./kitchen-data";

type Inputs = {
  state: string;
  city: string;
  baseline: string;
  height: number;
  storeys: number;
  basements: number;
  units: number;
  development: string;
  unitType: string;
  levels: string;
  operation: string;
  adults: number;
  children: number;
  elderly: number;
  guests: number;
  staff: number;
  workFromHome: number;
  accessibility: boolean;
  cars: number;
  twoWheelers: number;
  bicycles: number;
  pets: number;
  planning: string;
  lowIncome: boolean;
  kitchenDining: boolean;
  bathroomCount: number;
  wcCount: number;
  combinedToilet: boolean;
  attachedWashrooms: number;
  balcony: boolean;
  balconyWidth: number;
  balconyLength: number;
  additionalRoomTargetArea: number;
  storeroom: boolean;
  prayerRoom: boolean;
  walkInWardrobes: number;
  walkInTargetArea: number;
  utilityRoom: boolean;
  utilityTargetArea: number;
  studyRoom: boolean;
  studyTargetArea: number;
  kitchenLayout: string;
  cookMode: string;
  kitchenClearWidth: number;
  kitchenClearLength: number;
  kitchenClearHeight: number;
  counterDepthA: number;
  counterDepthB: number;
  anthroProfile: string;
  elbowHeight: number;
  shoulderHeight: number;
  dishwasher: boolean;
  microwave: boolean;
};

type SpaceRow = {
  space: string;
  qty: number;
  area: number | null;
  width: number | null;
  widthDisplay?: string;
  height: number | null;
  citation?: string;
  triggerCitation?: string;
  note?: string;
  status?: "needs-target" | "verified-range" | "user-target" | "qualitative";
};

type ResultData = {
  rows: SpaceRow[];
  subtotal: number;
  programmeSubtotal: number;
  fire: boolean;
  warnings: string[];
  habitable: number;
};

type KitchenDerived = {
  worktopLow: number;
  worktopHigh: number;
  aisle: number;
  microwaveBottom: number;
  inclusiveReach: number;
};

type SetInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;

type KitchenEnvelopeState = {
  applicable: boolean;
  status: "pass" | "conflict" | "regulatory-fail" | "input-required" | "not-applicable";
  message: string;
  regulatoryPass: boolean;
  functionalPass: boolean;
  opposingRuns: boolean;
  roomArea: number;
  minimumArea: number;
  minimumWidth: number;
  minimumHeight: number;
  availableAisle: number;
  requiredWidth: number;
};

function deriveKitchenEnvelope(inputs: Inputs, selectedAisle: number): KitchenEnvelopeState {
  const opposingRuns = ["Galley", "U-shaped", "Island"].includes(inputs.kitchenLayout);
  if (inputs.unitType === "Studio") {
    return { applicable: false, status: "not-applicable", message: "Integrated studio cooking area: no separate kitchen-room envelope is assigned.", regulatoryPass: false, functionalPass: false, opposingRuns, roomArea: 0, minimumArea: 0, minimumWidth: 0, minimumHeight: 0, availableAisle: 0, requiredWidth: 0 };
  }
  if (inputs.lowIncome) {
    return { applicable: false, status: "not-applicable", message: "The low-income kitchen uses a separate SP 73 row. KIT-D01 Table 32 comparison is paused to avoid mixing source conditions.", regulatoryPass: false, functionalPass: false, opposingRuns, roomArea: 0, minimumArea: 0, minimumWidth: 0, minimumHeight: 0, availableAisle: 0, requiredWidth: 0 };
  }

  const minimumArea = inputs.kitchenDining ? 7.5 : 5;
  const minimumWidth = inputs.kitchenDining ? 2.1 : 1.8;
  const minimumHeight = 2.75;
  const roomArea = inputs.kitchenClearWidth * inputs.kitchenClearLength;
  const regulatoryPass = roomArea >= minimumArea && inputs.kitchenClearWidth >= minimumWidth && inputs.kitchenClearHeight >= minimumHeight;
  const depthsReady = inputs.counterDepthA > 0 && (!opposingRuns || inputs.counterDepthB > 0);
  const occupiedDepth = inputs.counterDepthA + (opposingRuns ? inputs.counterDepthB : 0);
  const availableAisle = depthsReady ? Math.max(0, Math.round(inputs.kitchenClearWidth * 1000 - occupiedDepth)) : 0;
  const requiredWidth = depthsReady ? occupiedDepth + selectedAisle : 0;
  const functionalPass = depthsReady && availableAisle >= selectedAisle;

  if (!depthsReady) {
    return { applicable: true, status: "input-required", message: "Enter the selected cabinet or appliance depths to calculate the furnished clearance.", regulatoryPass, functionalPass, opposingRuns, roomArea, minimumArea, minimumWidth, minimumHeight, availableAisle, requiredWidth };
  }
  if (!regulatoryPass) {
    return { applicable: true, status: "regulatory-fail", message: "The proposed room geometry does not yet meet the applicable national-model room envelope.", regulatoryPass, functionalPass, opposingRuns, roomArea, minimumArea, minimumWidth, minimumHeight, availableAisle, requiredWidth };
  }
  if (!functionalPass) {
    return { applicable: true, status: "conflict", message: "Regulatory envelope passes; selected furniture layout does not fit the functional target.", regulatoryPass, functionalPass, opposingRuns, roomArea, minimumArea, minimumWidth, minimumHeight, availableAisle, requiredWidth };
  }
  return { applicable: true, status: "pass", message: "The room envelope and the selected advisory furniture-clearance target both pass.", regulatoryPass, functionalPass, opposingRuns, roomArea, minimumArea, minimumWidth, minimumHeight, availableAisle, requiredWidth };
}

const roomCitations: Record<string, Citation> = {
  "CIT-RA01-0003": { label: "SP 73:2023 · Table 31", locator: "PDF p.180 · printed p.156 · Rooms", tier: "India national reference", note: "National-reference room-area and clear-width row used by the programme calculator." },
  "CIT-RA01-0004": { label: "SP 73:2023 · Table 31 continued", locator: "PDF p.181 · printed p.157 · Additional room requirements", tier: "India national reference", note: "National-reference room row. The demo does not silently extend it to unsupported additional-bedroom values." },
  "CIT-RA01-0005": { label: "SP 73:2023 · Table 32", locator: "PDF p.181 · printed p.157 · 6.1.2.3 · Kitchens", tier: "India national reference", note: "Kitchen-room area, clear width and height national-model baseline. Location-specific adoption remains a separate check.", href: "https://www.bis.gov.in/standardized-development-and-building-regulations-2023/?lang=en" },
  "CIT-RA01-0006": { label: "SP 73:2023 · Kitchen provisions", locator: "PDF p.182 · printed p.158 · Low-income kitchen and finishes", tier: "India national reference", note: "Low-income-housing kitchen row." },
  "CIT-RA01-0007": { label: "SP 73:2023 · Table 33", locator: "PDF p.183 · printed p.159 · Storerooms and prayer rooms", tier: "India national reference", note: "Room-area, width and height baseline for these optional programme spaces." },
  "CIT-RA01-0008": { label: "SP 73:2023 · Table 34", locator: "PDF p.184 · printed p.160 · Bathrooms and water-closets", tier: "India national reference", note: "Sanitary-room area, width and height baseline." },
  "CIT-RA01-0009": { label: "SP 73:2023 · Table 34 continued", locator: "PDF p.185 · printed p.161 · Low-income sanitary rooms", tier: "India national reference", note: "Low-income-housing sanitary-room row." },
  "CIT-RA03-0001": { label: "SP 73:2023 · Clause 9.3", locator: "PDF p.251 · printed p.227 · Residential sanitation", tier: "India national reference", note: "Sanitary arrangement trigger used to keep a sole WC separate from the bathroom." },
  "CIT-RA01-0013": { label: "SP 73:2023 · Chapter 6", locator: "PDF p.190 · printed p.166 · Unenclosed balcony", tier: "India national reference", note: "Clear-width range used for the balcony check." },
};

const citations: Record<string, Citation> = { ...roomCitations, ...kitchenCitations };

const initial: Inputs = {
  state: "Telangana",
  city: "Hyderabad",
  baseline: "India national reference",
  height: 12,
  storeys: 4,
  basements: 0,
  units: 8,
  development: "Apartment / group housing",
  unitType: "1BHK",
  levels: "Single-level",
  operation: "Owner occupied",
  adults: 2,
  children: 1,
  elderly: 0,
  guests: 1,
  staff: 0,
  workFromHome: 1,
  accessibility: false,
  cars: 1,
  twoWheelers: 1,
  bicycles: 1,
  pets: 0,
  planning: "Minimum Standard",
  lowIncome: false,
  kitchenDining: false,
  bathroomCount: 1,
  wcCount: 1,
  combinedToilet: false,
  attachedWashrooms: 0,
  balcony: true,
  balconyWidth: 1.2,
  balconyLength: 3,
  additionalRoomTargetArea: 7.5,
  storeroom: false,
  prayerRoom: false,
  walkInWardrobes: 0,
  walkInTargetArea: 3,
  utilityRoom: false,
  utilityTargetArea: 3,
  studyRoom: false,
  studyTargetArea: 5,
  kitchenLayout: "L-shaped",
  cookMode: "One cook",
  kitchenClearWidth: 2.4,
  kitchenClearLength: 3,
  kitchenClearHeight: 2.75,
  counterDepthA: 600,
  counterDepthB: 600,
  anthroProfile: "Combined median",
  elbowHeight: 1022,
  shoulderHeight: 1357,
  dishwasher: true,
  microwave: true,
};

const sections = ["Project", "Building", "Dwelling", "Spaces", "Kitchen", "Household", "Lifestyle", "Planning", "Results"];

function NumberField({ label, value, onChange, min = 0, max, step = 1, suffix }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return <label className="field"><span>{label}</span><div className="number-wrap"><input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/>{suffix && <em>{suffix}</em>}</div></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}

function Toggle({ label, hint, checked, disabled = false, onChange }: { label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className={`toggle-row${disabled ? " disabled" : ""}`}><span><strong>{label}</strong>{hint && <small>{hint}</small>}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)}/><i aria-hidden="true"/></label>;
}

export default function Home() {
  const [inputs, setInputs] = useState(initial);
  const [step, setStep] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [view, setView] = useState<"home" | "planner">("home");
  const set: SetInput = (key, value) => setInputs(previous => ({ ...previous, [key]: value }));

  const kitchen = useMemo<KitchenDerived>(() => ({
    worktopLow: Math.round(inputs.elbowHeight - 150),
    worktopHigh: Math.round(inputs.elbowHeight - 100),
    aisle: inputs.cookMode === "One cook" ? 1067 : 1219,
    microwaveBottom: Math.round(Math.min(inputs.shoulderHeight - 76, 1372)),
    inclusiveReach: 1759,
  }), [inputs.elbowHeight, inputs.shoulderHeight, inputs.cookMode]);
  const kitchenEnvelope = useMemo(() => deriveKitchenEnvelope(inputs, kitchen.aisle), [inputs, kitchen.aisle]);

  const result = useMemo<ResultData>(() => {
    const habitableByUnit: Record<string, number> = { Studio: 1, "1BHK": 2, "2BHK": 3, "3BHK": 4, "4BHK": 5, "5BHK+": 6 };
    const habitable = habitableByUnit[inputs.unitType] ?? 2;
    const rows: SpaceRow[] = [];

    if (habitable === 1) {
      rows.push({ space: inputs.lowIncome ? "Multipurpose habitable room" : "Habitable room", qty: 1, area: inputs.lowIncome ? 12.5 : 9.5, width: 2.4, height: 2.75, citation: "CIT-RA01-0003" });
    } else {
      rows.push({ space: "Primary habitable room", qty: 1, area: inputs.lowIncome ? 9 : 9.5, width: inputs.lowIncome ? 2.5 : 2.4, height: 2.75, citation: "CIT-RA01-0003" });
      rows.push({ space: "Second habitable room", qty: 1, area: inputs.lowIncome ? 6.5 : 7.5, width: 2.1, height: 2.75, citation: "CIT-RA01-0004" });
      if (habitable > 2) rows.push({
        space: `Additional bedroom${habitable > 3 ? "s" : ""}`,
        qty: habitable - 2,
        area: inputs.additionalRoomTargetArea > 0 ? inputs.additionalRoomTargetArea : null,
        width: null,
        height: null,
        note: inputs.additionalRoomTargetArea > 0 ? "Editable working target. It is included in the programme total and remains visibly separate from the verified national subtotal." : "Enter a working target in Spaces. The item remains active without inventing a minimum.",
        status: inputs.additionalRoomTargetArea > 0 ? "user-target" : "needs-target",
      });
    }

    if (inputs.unitType !== "Studio") rows.push({ space: inputs.lowIncome ? "Separate low-income kitchen" : inputs.kitchenDining ? "Kitchen with dining" : "Kitchen without dining", qty: 1, area: inputs.lowIncome ? 3.3 : inputs.kitchenDining ? 7.5 : 5, width: inputs.lowIncome ? 1.8 : inputs.kitchenDining ? 2.1 : 1.8, height: 2.75, citation: inputs.lowIncome ? "CIT-RA01-0006" : "CIT-RA01-0005" });
    else rows.push({ space: "Integrated cooking area with sink", qty: 1, area: null, width: null, height: null, citation: "CIT-RA03-0001", note: "Verified fixture requirement inside the studio; no separate kitchen-room area is assigned.", status: "qualitative" });

    const matchedCount = Math.min(inputs.bathroomCount, inputs.wcCount);
    const combinedCount = inputs.combinedToilet && inputs.wcCount > 1 ? matchedCount : 0;
    const attachedRequested = Math.min(inputs.attachedWashrooms, matchedCount);
    const attachedCombined = Math.min(attachedRequested, combinedCount);
    const commonCombined = combinedCount - attachedCombined;
    const remainingAttached = attachedRequested - attachedCombined;
    const separateBathrooms = Math.max(0, inputs.bathroomCount - combinedCount);
    const separateWcs = Math.max(0, inputs.wcCount - combinedCount);
    const attachedSeparateBathrooms = Math.min(remainingAttached, separateBathrooms);
    const attachedSeparateWcs = Math.min(remainingAttached, separateWcs);
    const commonSeparateBathrooms = separateBathrooms - attachedSeparateBathrooms;
    const commonSeparateWcs = separateWcs - attachedSeparateWcs;
    const sanitaryCitation = inputs.lowIncome ? "CIT-RA01-0009" : "CIT-RA01-0008";

    if (attachedCombined > 0) rows.push({ space: "Attached combined bathroom + WC", qty: attachedCombined, area: inputs.lowIncome ? 2 : 3, width: 1.2, height: 2.4, citation: sanitaryCitation, triggerCitation: "CIT-RA03-0001", note: "Attachment changes room association; the cited sanitary-room minimum is unchanged." });
    if (commonCombined > 0) rows.push({ space: "Common combined bathroom + WC", qty: commonCombined, area: inputs.lowIncome ? 2 : 3, width: 1.2, height: 2.4, citation: sanitaryCitation, triggerCitation: "CIT-RA03-0001" });
    if (attachedSeparateBathrooms > 0) rows.push({ space: "Attached separate bathroom", qty: attachedSeparateBathrooms, area: inputs.lowIncome ? 1.2 : 1.8, width: inputs.lowIncome ? 1 : 1.2, height: 2.4, citation: sanitaryCitation, triggerCitation: "CIT-RA03-0001", note: "Paired with a separate attached WC where only one WC is provided or the combined option is not selected." });
    if (attachedSeparateWcs > 0) rows.push({ space: "Attached separate water-closet", qty: attachedSeparateWcs, area: inputs.lowIncome ? 1 : 1.1, width: 1, height: 2.4, citation: sanitaryCitation, triggerCitation: "CIT-RA03-0001" });
    if (commonSeparateBathrooms > 0) rows.push({ space: "Common separate bathroom", qty: commonSeparateBathrooms, area: inputs.lowIncome ? 1.2 : 1.8, width: inputs.lowIncome ? 1 : 1.2, height: 2.4, citation: sanitaryCitation, triggerCitation: inputs.wcCount === 1 ? "CIT-RA03-0001" : undefined });
    if (commonSeparateWcs > 0) rows.push({ space: "Common separate water-closet", qty: commonSeparateWcs, area: inputs.lowIncome ? 1 : 1.1, width: 1, height: 2.4, citation: sanitaryCitation, triggerCitation: inputs.wcCount === 1 ? "CIT-RA03-0001" : undefined, note: inputs.wcCount === 1 ? "Kept separate from the bathroom because the dwelling has only one WC." : undefined });

    if (inputs.storeroom) rows.push({ space: "Dedicated storeroom", qty: 1, area: 3, width: 1.2, height: 2.2, citation: "CIT-RA01-0007" });
    if (inputs.prayerRoom) rows.push({ space: "Dedicated prayer room", qty: 1, area: 3, width: 1.2, height: 2.4, citation: "CIT-RA01-0007" });
    if (inputs.walkInWardrobes > 0) rows.push({ space: "Walk-in wardrobe / dressing", qty: inputs.walkInWardrobes, area: inputs.walkInTargetArea > 0 ? inputs.walkInTargetArea : null, width: null, height: null, note: inputs.walkInTargetArea > 0 ? "Editable target pending the wardrobe furniture-clearance module." : "Enter a target area; the programme item remains visible.", status: inputs.walkInTargetArea > 0 ? "user-target" : "needs-target" });
    if (inputs.studyRoom) rows.push({ space: "Study / home office", qty: 1, area: inputs.studyTargetArea > 0 ? inputs.studyTargetArea : null, width: null, height: null, note: "Editable user target pending the desk/chair module.", status: inputs.studyTargetArea > 0 ? "user-target" : "needs-target" });
    if (inputs.utilityRoom) rows.push({ space: "Laundry / utility room", qty: 1, area: inputs.utilityTargetArea > 0 ? inputs.utilityTargetArea : null, width: null, height: null, note: "Editable user target pending selected-appliance operating clearances.", status: inputs.utilityTargetArea > 0 ? "user-target" : "needs-target" });
    if (inputs.balcony) rows.push({ space: "Unenclosed balcony", qty: 1, area: inputs.balconyWidth * inputs.balconyLength, width: null, widthDisplay: `${inputs.balconyWidth.toFixed(1)} m selected`, height: null, citation: "CIT-RA01-0013", note: "Area is derived from your selected width and length. The cited national reference gives a 0.9–1.5 m clear-width range.", status: "verified-range" });

    const subtotal = rows.reduce((sum, row) => sum + ((row.status === "user-target" || row.status === "verified-range") ? 0 : (row.area ?? 0) * row.qty), 0);
    const programmeSubtotal = rows.reduce((sum, row) => sum + (row.area ?? 0) * row.qty, 0);
    const fire = inputs.height >= 15 || inputs.basements >= 2;
    const warnings = [
      "This result uses an India national reference; state/city adoption and amendments remain a separate check.",
      ...(inputs.accessibility ? ["Accessibility is requested. Kitchen access values are shown only as a provisional international advisory layer until the official Indian HG2021 source is ingested."] : []),
      ...(inputs.planning !== "Minimum Standard" ? [`${inputs.planning} is recorded. Verified room values and editable targets remain separate.`] : []),
      ...(habitable > 2 ? ["Additional bedrooms use the visible working target entered in Spaces; the target is not labelled as a national minimum."] : []),
      ...(inputs.balcony && (inputs.balconyWidth < 0.9 || inputs.balconyWidth > 1.5) ? ["The selected balcony width is outside the verified 0.9–1.5 m national-reference range."] : []),
      ...(inputs.walkInWardrobes > 0 ? ["Walk-in wardrobe area remains a user target until its dedicated furniture-clearance module is verified."] : []),
      ...(fire ? ["Chapter 7 fire/life-safety conditions are activated by the entered height/basement configuration."] : []),
      "Cabinet carcass dimensions and appliance recess/door-swing clearances require the selected manufacturer and model; the demo does not invent them.",
    ];
    return { rows, subtotal, programmeSubtotal, fire, warnings, habitable };
  }, [inputs]);

  const next = () => setStep(current => Math.min(sections.length - 1, current + 1));
  const back = () => setStep(current => Math.max(0, current - 1));
  const maxAttached = Math.min(inputs.bathroomCount, inputs.wcCount);

  const setSanitaryCount = (key: "bathroomCount" | "wcCount", value: number) => {
    const safeValue = Math.max(1, value);
    setInputs(previous => {
      const nextInputs = { ...previous, [key]: safeValue };
      const nextMaxAttached = Math.min(nextInputs.bathroomCount, nextInputs.wcCount);
      return {
        ...nextInputs,
        combinedToilet: nextInputs.wcCount > 1 ? nextInputs.combinedToilet : false,
        attachedWashrooms: Math.min(nextInputs.attachedWashrooms, nextMaxAttached),
      };
    });
  };

  const applyAnthropometricProfile = (profileName: string) => {
    const profile = anthropometricProfiles[profileName];
    if (!profile) {
      set("anthroProfile", "Custom input");
      return;
    }
    setInputs(previous => ({ ...previous, anthroProfile: profileName, elbowHeight: profile.elbow, shoulderHeight: profile.shoulder }));
  };

  if (view === "home") return <LandingPage onStart={() => setView("planner")} />;

  return <main className="app-shell">
    <aside className="sidebar">
      <button className="brand brand-button" onClick={() => setView("home")} aria-label="Return to BuiltStandard home"><Image src="/builtstandard-mark.svg" alt="" width={40} height={40}/><div><strong>BuiltStandard</strong><span>Residential module</span></div></button>
      <nav aria-label="Questionnaire sections">{sections.map((section, index) => <button key={section} className={index === step ? "active" : index < step ? "complete" : ""} onClick={() => setStep(index)}><b>{index < step ? "✓" : index + 1}</b><span>{section}</span></button>)}</nav>
      <div className="release-card"><span>Programme release</span><strong>RA10 · v4</strong><small>{kitchenRules.length} kitchen rules · approved KIT-D01 · live conflict check</small></div>
    </aside>

    <section className="workspace">
      <header className="topbar"><div><span className="eyebrow">Layered residential evidence</span><h1>{step === 8 ? "Your residential programme" : sections[step]}</h1></div><div className="top-actions"><button className="ghost" onClick={() => setShowSources(true)}>Review sources</button><span className="status-pill"><i/>Evidence layers visible</span></div></header>

      <div className="content-grid">
        <section className={`main-card${step === 4 ? " kitchen-card" : ""}`}>
          {step === 0 && <ProjectStep inputs={inputs} set={set}/>}
          {step === 1 && <BuildingStep inputs={inputs} set={set} fire={result.fire}/>}
          {step === 2 && <DwellingStep inputs={inputs} set={set} setSanitaryCount={setSanitaryCount}/>}
          {step === 3 && <SpacesStep inputs={inputs} set={set} habitable={result.habitable} maxAttached={maxAttached}/>}
          {step === 4 && <KitchenStep inputs={inputs} set={set} setInputs={setInputs} kitchen={kitchen} onProfile={applyAnthropometricProfile} onSources={() => setShowSources(true)}/>}
          {step === 5 && <HouseholdStep inputs={inputs} set={set}/>}
          {step === 6 && <LifestyleStep inputs={inputs} set={set}/>}
          {step === 7 && <PlanningStep inputs={inputs} set={set}/>}
          {step === 8 && <Results inputs={inputs} result={result} kitchen={kitchen} onSources={() => setShowSources(true)}/>}
          {step < 8 && <footer className="form-actions"><button className="ghost" disabled={step === 0} onClick={back}>Back</button><span>Step {step + 1} of 8</span><button className="primary" onClick={next}>{step === 7 ? "Generate programme" : "Continue"}<b>→</b></button></footer>}
        </section>

        <aside className="live-panel">
          <div className="live-head"><span>Live project</span><i>Updated now</i></div>
          <div className="project-line"><strong>{inputs.unitType}</strong><span>{inputs.development}</span></div>
          <div className="metric-grid"><div><span>Residents</span><b>{inputs.adults + inputs.children + inputs.elderly + inputs.staff}</b></div><div><span>Programme rows</span><b>{result.rows.length}</b></div><div><span>Verified subtotal</span><b>{result.subtotal.toFixed(1)} m²</b></div><div><span>Programme total</span><b>{result.programmeSubtotal.toFixed(1)} m²</b></div></div>
          <div className="rule-state"><div><span>Kitchen layout</span><b>{inputs.kitchenLayout}</b></div><div><span>Worktop band</span><b>{kitchen.worktopLow}–{kitchen.worktopHigh} mm</b></div><div><span>Work aisle</span><b>{kitchen.aisle} mm</b></div><div><span>Room vs furniture</span><b className={kitchenEnvelope.status === "pass" ? "pass" : kitchenEnvelope.status === "not-applicable" ? "muted" : kitchenEnvelope.status === "input-required" ? "pending" : "blocked"}>{kitchenEnvelope.status === "pass" ? "Both checks pass" : kitchenEnvelope.status === "conflict" ? "Furniture conflict" : kitchenEnvelope.status === "regulatory-fail" ? "Room envelope fails" : kitchenEnvelope.status === "input-required" ? "Product input required" : "Not applicable"}</b></div><div><span>Accessibility</span><b className={inputs.accessibility ? "pending" : "muted"}>{inputs.accessibility ? "Indian overlay pending" : "Not requested"}</b></div></div>
          <button className="mini-primary" onClick={() => setStep(8)}>View current result</button>
        </aside>
      </div>
    </section>

    {showSources && <SourceModal onClose={() => setShowSources(false)}/>}
  </main>;
}

function LandingPage({ onStart }: { onStart: () => void }) {
  const segments = [
    { icon: "⌂", title: "Residential", text: "Homes, apartments, villas and dwelling programmes.", state: "Available now", active: true },
    { icon: "▦", title: "Educational", text: "Schools, colleges, classrooms and learning spaces.", state: "Coming next" },
    { icon: "◫", title: "Commercial", text: "Offices, retail, banks and workplace planning.", state: "Coming next" },
    { icon: "⌬", title: "Healthcare", text: "Clinics, hospitals and patient-centred spaces.", state: "Coming next" },
    { icon: "◇", title: "Hospitality", text: "Hotels, hostels, restaurants and guest facilities.", state: "Coming next" },
    { icon: "▤", title: "Industrial", text: "Workshops, factories, warehouses and production areas.", state: "Coming next" },
    { icon: "◎", title: "Public & Assembly", text: "Libraries, halls, civic and community buildings.", state: "Coming next" },
  ];

  return <main className="landing-shell">
    <nav className="landing-nav">
      <div className="landing-brand"><Image src="/builtstandard-mark.svg" alt="BuiltStandard logo" width={48} height={48} priority/><div><strong>BuiltStandard</strong><span>Architectural standards, made usable.</span></div></div>
      <div className="landing-nav-note"><i/> Evidence-led planning platform</div>
    </nav>

    <section className="landing-hero">
      <div className="hero-copy">
        <span className="landing-eyebrow">A practical standards guide for better building design</span>
        <h1>From scattered standards<br/><em>to clear design decisions.</em></h1>
        <p>BuiltStandard helps architects, students and building professionals turn requirements into structured space programmes, planning checks and source-backed decisions.</p>
        <div className="hero-actions"><button className="hero-primary" onClick={onStart}>Explore residential standards <b>→</b></button><span>Residential prototype available now</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustration showing standards becoming a building plan">
        <div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
        <div className="visual-card card-top"><span>01</span><strong>Requirements</strong><small>Users · rooms · activities</small></div>
        <div className="visual-card card-mid"><span>02</span><strong>Standards</strong><small>Evidence · dimensions · sources</small></div>
        <div className="visual-card card-bottom"><span>03</span><strong>Design decisions</strong><small>Checks · conflicts · clarity</small></div>
        <div className="hero-grid-mark"><div/><div/><div/><div/><div/><div/><div/><div/><div/></div>
      </div>
    </section>

    <section className="landing-section problem-section"><div className="section-kicker">Why BuiltStandard</div><div className="problem-grid"><h2>Good design decisions should not begin with a search through ten disconnected documents.</h2><div><p>Architectural standards are spread across codes, handbooks, guidelines, product manuals and local rules. BuiltStandard brings the relevant information into one understandable workflow.</p><p className="muted-copy">It separates mandatory minimums, professional recommendations, user targets and product-specific requirements—so a designer can see what is verified and what still needs professional judgement.</p></div></div></section>

    <section className="landing-section segment-section"><div className="section-kicker">One platform · multiple building types</div><div className="segment-heading"><h2>Choose the building you are designing.</h2><p>Each segment will use its own users, activities, room types, furniture and applicable standards.</p></div><div className="segment-grid">{segments.map(segment => <article className={`segment-card${segment.active ? " segment-active" : ""}`} key={segment.title}><div className="segment-icon">{segment.icon}</div><div><div className="segment-status">{segment.state}</div><h3>{segment.title}</h3><p>{segment.text}</p></div>{segment.active && <button onClick={onStart}>Open module <b>→</b></button>}</article>)}</div></section>

    <section className="landing-section how-section"><div className="section-kicker">How it works</div><div className="how-grid"><div><span>01</span><h3>Describe the project</h3><p>Choose the building segment, location, users, unit type and activities.</p></div><div><span>02</span><h3>Activate the right rules</h3><p>The platform keeps national references, recommendations and local checks visibly separate.</p></div><div><span>03</span><h3>Make better decisions</h3><p>Review the programme, clearances, conflicts, warnings and source references.</p></div></div></section>

    <footer className="landing-footer"><div className="landing-brand"><Image src="/builtstandard-mark.svg" alt="" width={34} height={34}/><div><strong>BuiltStandard</strong><span>Prototype · Residential module first</span></div></div><span>Standards support design judgement; it does not replace local approval.</span></footer>
  </main>;
}

function SectionHead({ number, title, children }: { number: string; title: string; children: string }) {
  return <div className="section-head"><span>{number}</span><div><h2>{title}</h2><p>{children}</p></div></div>;
}

function ProjectStep({ inputs, set }: { inputs: Inputs; set: SetInput }) {
  return <><SectionHead number="01" title="Where is the project?">Location selects the evidence layer. This pilot starts with a national reference and intentionally excludes setbacks and development controls.</SectionHead><div className="form-grid"><SelectField label="State / UT" value={inputs.state} options={["Telangana", "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra", "Delhi NCT", "Other / not selected"]} onChange={value => set("state", value)}/><label className="field"><span>City</span><input value={inputs.city} onChange={event => set("city", event.target.value)}/></label><SelectField label="Evidence baseline" value={inputs.baseline} options={["India national reference", "National + local overlay (not yet available)"]} onChange={value => set("baseline", value)}/></div><div className="info-note"><b>National reference</b><span>SP 73:2023 supplies the current room-level starting point in this demo. It does not mean local approval; state and local layers remain separate.</span></div></>;
}

function BuildingStep({ inputs, set, fire }: { inputs: Inputs; set: SetInput; fire: boolean }) {
  return <><SectionHead number="02" title="Describe the building">Building facts activate relevant rule groups. Plot setbacks are outside this spatial-programming pilot.</SectionHead><div className="form-grid"><NumberField label="Building height" value={inputs.height} onChange={value => set("height", value)} suffix="m"/><NumberField label="Storeys" value={inputs.storeys} onChange={value => set("storeys", value)} min={1}/><NumberField label="Basements" value={inputs.basements} onChange={value => set("basements", value)}/><NumberField label="Dwelling units" value={inputs.units} onChange={value => set("units", value)} min={1}/><SelectField label="Development type" value={inputs.development} options={["Individual plotted house", "Row / semi-detached / cluster", "Apartment / group housing", "Shared accommodation / hostel / PG", "Mixed-use residential", "Senior / assisted living"]} onChange={value => set("development", value)}/></div>{fire && <div className="warning-note"><b>Additional rule group</b><span>The entered height/basement conditions activate a fire/life-safety review. This demo does not claim to complete that review.</span></div>}</>;
}

function DwellingStep({ inputs, set, setSanitaryCount }: { inputs: Inputs; set: SetInput; setSanitaryCount: (key: "bathroomCount" | "wcCount", value: number) => void }) {
  return <><SectionHead number="03" title="Configure the dwelling">Choose the unit, operation and sanitary quantities. All BHK choices remain usable; unsupported extra-bedroom areas stay editable targets.</SectionHead><div className="choice-row">{["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK+"].map(unit => <button className={inputs.unitType === unit ? "selected" : ""} onClick={() => set("unitType", unit)} key={unit}>{unit}</button>)}</div><div className="form-grid"><SelectField label="Unit levels" value={inputs.levels} options={["Single-level", "Duplex", "Multi-level"]} onChange={value => set("levels", value)}/><SelectField label="Operation" value={inputs.operation} options={["Owner occupied", "Long-term rental", "Short-term rental", "Shared occupancy"]} onChange={value => set("operation", value)}/><NumberField label="Bathrooms / bathing spaces" value={inputs.bathroomCount} onChange={value => setSanitaryCount("bathroomCount", value)} min={1}/><NumberField label="Total WCs in dwelling" value={inputs.wcCount} onChange={value => setSanitaryCount("wcCount", value)} min={1}/></div><h3 className="subhead">Visible derived decisions</h3><div className="toggle-stack"><Toggle label="Low-income housing row" hint="Changes the applicable room, kitchen and sanitary minimums" checked={inputs.lowIncome} onChange={value => set("lowIncome", value)}/><Toggle label="Kitchen includes dining" hint="Selects the verified kitchen-room configuration" checked={inputs.kitchenDining} onChange={value => set("kitchenDining", value)}/><Toggle label="Combine matched bathroom and WC counts" hint={inputs.wcCount === 1 ? "Separate arrangement is active because the dwelling has only one WC" : "Matched bathroom/WC quantities combine; any remainder stays separate"} checked={inputs.combinedToilet} disabled={inputs.wcCount === 1} onChange={value => set("combinedToilet", value)}/></div></>;
}

function SpacesStep({ inputs, set, habitable, maxAttached }: { inputs: Inputs; set: SetInput; habitable: number; maxAttached: number }) {
  const setAttached = (value: number) => set("attachedWashrooms", Math.max(0, Math.min(value, maxAttached)));
  return <><SectionHead number="04" title="Add and associate spaces">This screen now works independently of the combined-toilet toggle. Association and room configuration are separate decisions.</SectionHead>{habitable > 2 && <div className="target-banner"><div><span>Additional-bedroom working target</span><strong>{inputs.additionalRoomTargetArea.toFixed(1)} m² per room</strong></div><NumberField label="Edit target" value={inputs.additionalRoomTargetArea} onChange={value => set("additionalRoomTargetArea", Math.max(0, value))} step={0.1} suffix="m²"/></div>}<div className="support-grid"><Toggle label="Dedicated storeroom" hint="Verified room row: 3.0 m², 1.2 m clear width" checked={inputs.storeroom} onChange={value => set("storeroom", value)}/><Toggle label="Dedicated prayer room" hint="Verified room row: 3.0 m², 1.2 m clear width" checked={inputs.prayerRoom} onChange={value => set("prayerRoom", value)}/><Toggle label="Include unenclosed balcony" hint="Verified width range; user selects width and length" checked={inputs.balcony} onChange={value => set("balcony", value)}/></div>{inputs.balcony && <div className="form-grid compact"><NumberField label="Balcony clear width" value={inputs.balconyWidth} onChange={value => set("balconyWidth", Math.max(0, value))} step={0.1} suffix="m"/><NumberField label="Balcony length" value={inputs.balconyLength} onChange={value => set("balconyLength", Math.max(0, value))} step={0.1} suffix="m"/></div>}<h3 className="subhead">Bathroom association</h3><div className="association-card"><div><strong>How many sanitary suites attach to bedrooms?</strong><span>0 to {maxAttached} can be associated. Where only one WC exists, its bathroom and WC remain separate rooms but may still form an attached suite.</span></div><div className="count-pills">{Array.from({ length: maxAttached + 1 }, (_, index) => index).map(count => <button key={count} className={inputs.attachedWashrooms === count ? "selected" : ""} onClick={() => setAttached(count)}>{count === 0 ? "Common only" : count === maxAttached ? `${count} · all possible` : `${count} attached`}</button>)}</div></div><h3 className="subhead spaced">User-target spaces</h3><div className="form-grid"><NumberField label="Walk-in wardrobes" value={inputs.walkInWardrobes} onChange={value => set("walkInWardrobes", Math.max(0, value))}/>{inputs.walkInWardrobes > 0 && <NumberField label="Target per walk-in wardrobe" value={inputs.walkInTargetArea} onChange={value => set("walkInTargetArea", Math.max(0, value))} step={0.1} suffix="m²"/>}</div><div className="support-grid"><Toggle label="Study / home office" hint="Editable target until the desk/chair module is released" checked={inputs.studyRoom} onChange={value => set("studyRoom", value)}/><Toggle label="Laundry / utility room" hint="Editable target; selected-appliance clearances will follow" checked={inputs.utilityRoom} onChange={value => set("utilityRoom", value)}/></div>{(inputs.studyRoom || inputs.utilityRoom) && <div className="form-grid compact">{inputs.studyRoom && <NumberField label="Study target area" value={inputs.studyTargetArea} onChange={value => set("studyTargetArea", Math.max(0, value))} step={0.1} suffix="m²"/>}{inputs.utilityRoom && <NumberField label="Utility target area" value={inputs.utilityTargetArea} onChange={value => set("utilityTargetArea", Math.max(0, value))} step={0.1} suffix="m²"/>}</div>}</>;
}

function KitchenStep({ inputs, set, setInputs, kitchen, onProfile, onSources }: { inputs: Inputs; set: SetInput; setInputs: React.Dispatch<React.SetStateAction<Inputs>>; kitchen: KitchenDerived; onProfile: (value: string) => void; onSources: () => void }) {
  const setCustom = (key: "elbowHeight" | "shoulderHeight", value: number) => setInputs(previous => ({ ...previous, anthroProfile: "Custom input", [key]: Math.max(0, value) }));
  const opposingRuns = ["Galley", "U-shaped", "Island"].includes(inputs.kitchenLayout);
  return <>
    <SectionHead number="05" title="Kitchen room and furniture fit">First check the national-model room envelope. Then check whether the selected furniture and work aisle fit inside it. Passing one check does not automatically pass the other.</SectionHead>
    <div className="kitchen-inputs"><SelectField label="Kitchen layout" value={inputs.kitchenLayout} options={["Single wall", "Galley", "L-shaped", "U-shaped", "Island"]} onChange={value => set("kitchenLayout", value)}/><SelectField label="Simultaneous cooks" value={inputs.cookMode} options={["One cook", "Multiple cooks"]} onChange={value => set("cookMode", value)}/><SelectField label="Anthropometric profile" value={inputs.anthroProfile} options={[...Object.keys(anthropometricProfiles), "Custom input"]} onChange={onProfile}/><NumberField label="Bent-elbow height" value={inputs.elbowHeight} onChange={value => setCustom("elbowHeight", value)} min={650} max={1400} suffix="mm"/><NumberField label="Mid-shoulder height" value={inputs.shoulderHeight} onChange={value => setCustom("shoulderHeight", value)} min={900} max={1800} suffix="mm"/></div>
    <div className="support-grid kitchen-toggles"><Toggle label="Dishwasher included" hint="Activates placement and right-angle operating-space guidance" checked={inputs.dishwasher} onChange={value => set("dishwasher", value)}/><Toggle label="Microwave included" hint="Activates personalised mounting and landing guidance" checked={inputs.microwave} onChange={value => set("microwave", value)}/></div>
    <h3 className="subhead">Proposed room and selected furniture inputs</h3>
    <div className="kitchen-geometry-grid"><NumberField label="Kitchen clear width" value={inputs.kitchenClearWidth} onChange={value => set("kitchenClearWidth", Math.max(0, value))} step={0.05} suffix="m"/><NumberField label="Kitchen clear length" value={inputs.kitchenClearLength} onChange={value => set("kitchenClearLength", Math.max(0, value))} step={0.05} suffix="m"/><NumberField label="Kitchen clear height" value={inputs.kitchenClearHeight} onChange={value => set("kitchenClearHeight", Math.max(0, value))} step={0.05} suffix="m"/><NumberField label="Counter/appliance depth A" value={inputs.counterDepthA} onChange={value => set("counterDepthA", Math.max(0, value))} step={10} suffix="mm"/>{opposingRuns && <NumberField label="Opposing run / island depth B" value={inputs.counterDepthB} onChange={value => set("counterDepthB", Math.max(0, value))} step={10} suffix="mm"/>}</div>
    <div className="input-assumption"><b>Editable product inputs</b><span>The 600 mm sample depths are demo inputs, not Indian regulatory dimensions. Replace them with the selected cabinet or appliance system.</span></div>
    <KitchenEnvelopeComparison inputs={inputs} kitchen={kitchen} onSources={onSources}/>
    <div className="kitchen-metrics"><Metric label="Personalised worktop" value={`${kitchen.worktopLow}–${kitchen.worktopHigh} mm`} tier="Derived advisory"/><Metric label="Selected work aisle" value={`${kitchen.aisle} mm`} tier="Professional recommendation"/><Metric label="General walkway" value="914 mm" tier="Professional recommendation"/><Metric label="Inclusive upward reach" value={`${kitchen.inclusiveReach} mm`} tier="Raw body reference"/></div>
    <h3 className="subhead">Next-detail prototypes</h3>
    <div className="diagram-grid"><KitchenPlan layout={inputs.kitchenLayout} aisle={kitchen.aisle}/><KitchenElevation inputs={inputs} kitchen={kitchen}/></div>
    <div className="evidence-callout"><div><strong>What is deliberately not calculated</strong><span>Shutter projections, appliance recesses, ventilation gaps and door swings remain “selected product required.” A model-specific manual must supply them.</span></div><button className="ghost" onClick={onSources}>Open evidence layers</button></div>
  </>;
}

function KitchenEnvelopeComparison({ inputs, kitchen, onSources, compact = false }: { inputs: Inputs; kitchen: KitchenDerived; onSources: () => void; compact?: boolean }) {
  const envelope = deriveKitchenEnvelope(inputs, kitchen.aisle);
  const statusLabel = envelope.status === "pass" ? "Both checks pass" : envelope.status === "conflict" ? "Furniture conflict" : envelope.status === "regulatory-fail" ? "Room envelope fails" : envelope.status === "input-required" ? "Product input required" : "Not applicable";
  return <section className={`envelope-comparison envelope-${envelope.status}${compact ? " compact" : ""}`}>
    <header><div><span>KIT-D01 · approved original diagram</span><h3>Room envelope versus furnished envelope</h3></div><b>{statusLabel}</b></header>
    {!compact && <div className="envelope-art"><Image src="/kit-d01-room-vs-furniture.svg" alt="Two-panel diagram separating the SP 73 kitchen room envelope from the advisory furnished work-aisle envelope" width={1600} height={1000} priority/></div>}
    <div className="envelope-live">
      {envelope.applicable ? <>
        <article className={envelope.regulatoryPass ? "check-pass" : "check-fail"}><span>Regulatory room check</span><strong>{envelope.regulatoryPass ? "Pass" : "Does not pass"}</strong><small>{envelope.roomArea.toFixed(2)} m² proposed / {envelope.minimumArea.toFixed(2)} m² minimum · {inputs.kitchenClearWidth.toFixed(2)} m width / {envelope.minimumWidth.toFixed(2)} m minimum · {inputs.kitchenClearHeight.toFixed(2)} m height / {envelope.minimumHeight.toFixed(2)} m minimum</small></article>
        <article className={envelope.status === "input-required" ? "check-input" : envelope.functionalPass ? "check-pass" : "check-fail"}><span>Selected furniture check</span><strong>{envelope.status === "input-required" ? "Input required" : envelope.functionalPass ? "Pass" : "Does not fit"}</strong><small>{envelope.status === "input-required" ? "Enter the selected product depths." : `${envelope.availableAisle} mm available / ${kitchen.aisle} mm advisory target · ${envelope.opposingRuns ? "two opposing depths included" : "one principal depth included"}`}</small></article>
      </> : <article className="check-input wide"><span>Current configuration</span><strong>{statusLabel}</strong><small>{envelope.message}</small></article>}
    </div>
    <div className="envelope-decision"><div><span>Visible decision</span><strong>{envelope.message}</strong>{envelope.applicable && envelope.requiredWidth > 0 && <small>Clear-width fit equation: {inputs.counterDepthA} + {envelope.opposingRuns ? `${kitchen.aisle} + ${inputs.counterDepthB}` : kitchen.aisle} = {envelope.requiredWidth} mm required.</small>}</div><button className="ghost" onClick={onSources}>Review both sources</button></div>
  </section>;
}

function HouseholdStep({ inputs, set }: { inputs: Inputs; set: SetInput }) {
  return <><SectionHead number="06" title="Who will use the home?">These are user facts, not dataset assumptions. They will activate later bedroom, accessibility, storage and activity rules.</SectionHead><div className="form-grid three"><NumberField label="Adults" value={inputs.adults} onChange={value => set("adults", value)}/><NumberField label="Children" value={inputs.children} onChange={value => set("children", value)}/><NumberField label="Elderly occupants" value={inputs.elderly} onChange={value => set("elderly", value)}/><NumberField label="Regular guests" value={inputs.guests} onChange={value => set("guests", value)}/><NumberField label="Live-in staff" value={inputs.staff} onChange={value => set("staff", value)}/><NumberField label="Work-from-home users" value={inputs.workFromHome} onChange={value => set("workFromHome", value)}/></div><Toggle label="Wheelchair or other accessibility requirement" hint="Keeps Indian accessibility verification visibly pending while provisional international guidance is shown separately" checked={inputs.accessibility} onChange={value => set("accessibility", value)}/></>;
}

function LifestyleStep({ inputs, set }: { inputs: Inputs; set: SetInput }) {
  return <><SectionHead number="07" title="Possessions and lifestyle">These user inputs prepare parking, storage and activity modules without pretending that every possession has one universal area.</SectionHead><div className="form-grid"><NumberField label="Cars" value={inputs.cars} onChange={value => set("cars", value)}/><NumberField label="Two-wheelers" value={inputs.twoWheelers} onChange={value => set("twoWheelers", value)}/><NumberField label="Bicycles" value={inputs.bicycles} onChange={value => set("bicycles", value)}/><NumberField label="Pets" value={inputs.pets} onChange={value => set("pets", value)}/></div><div className="info-note"><b>Programme signal</b><span>{inputs.workFromHome > 0 ? `${inputs.workFromHome} work-from-home position requested. Activate a Study in Spaces if a dedicated room is required.` : "No work-from-home position requested."}</span></div></>;
}

function PlanningStep({ inputs, set }: { inputs: Inputs; set: SetInput }) {
  const cards = [["Minimum Standard", "Available", "Verified national-reference room areas and dimensions"], ["Functional / Moderate", "Kitchen pilot available", "Adds labelled furniture and everyday-use guidance"], ["Comfortable / Spacious", "Partially available", "Comfort uplifts remain editable until more room modules are verified"], ["User Customised", "Available", "Uses your explicit targets while retaining verified minimums"]];
  return <><SectionHead number="08" title="Choose the planning level">The choice is recorded in the output. Verified standards, advisory furniture guidance and user targets remain separate evidence layers.</SectionHead><div className="planning-cards">{cards.map(([name, tag, description]) => <button key={name} onClick={() => set("planning", name)} className={inputs.planning === name ? "selected" : ""}><span>{tag}</span><strong>{name}</strong><small>{description}</small></button>)}</div>{inputs.planning !== "Minimum Standard" && <div className="warning-note"><b>Visible calculation scope</b><span>{inputs.planning} is recorded. The verified subtotal still contains only source-backed room values; furniture guidance and user targets are reported separately.</span></div>}</>;
}

function Metric({ label, value, tier }: { label: string; value: string; tier: string }) {
  return <article><span>{label}</span><strong>{value}</strong><small>{tier}</small></article>;
}

function KitchenPlan({ layout, aisle }: { layout: string; aisle: number }) {
  const secondary = layout === "Galley" || layout === "U-shaped";
  const left = layout === "L-shaped" || layout === "U-shaped";
  const right = layout === "U-shaped";
  const island = layout === "Island";
  const lineTop = 140;
  const lineBottom = secondary ? 286 : island ? 248 : 312;
  return <figure className="diagram-card"><figcaption><div><span>Plan diagram</span><strong>{layout} workflow</strong></div><em>Schematic · not to scale</em></figcaption><svg role="img" aria-label={`${layout} kitchen plan with work aisle and appliance landing areas`} viewBox="0 0 720 420"><defs><marker id="plan-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#167d87"/></marker></defs><rect className="diagram-room" x="42" y="36" width="636" height="338" rx="18"/><rect className="counter" x="86" y="68" width="548" height="72" rx="8"/>{secondary && <rect className="counter" x="86" y="286" width="548" height="72" rx="8"/>}{left && <rect className="counter" x="86" y="132" width="72" height="226" rx="8"/>}{right && <rect className="counter" x="562" y="132" width="72" height="226" rx="8"/>}{island && <rect className="island" x="238" y="248" width="300" height="80" rx="10"/>}<rect className="fridge" x="104" y="80" width="82" height="48" rx="5"/><text x="145" y="110" textAnchor="middle">FRIDGE</text><rect className="landing sink-left" x="210" y="82" width="70" height="44" rx="4"/><rect className="sink" x="280" y="80" width="76" height="48" rx="5"/><text x="318" y="110" textAnchor="middle">SINK</text><rect className="landing sink-right" x="356" y="82" width="54" height="44" rx="4"/><rect className="landing hob-left" x="430" y="82" width="38" height="44" rx="4"/><rect className="hob" x="468" y="80" width="72" height="48" rx="5"/><text x="504" y="110" textAnchor="middle">HOB</text><rect className="landing hob-right" x="540" y="82" width="48" height="44" rx="4"/><line className="dimension" x1="654" y1={lineTop} x2="654" y2={lineBottom} markerStart="url(#plan-arrow)" markerEnd="url(#plan-arrow)"/><text className="dimension-label" x="640" y={(lineTop + lineBottom) / 2} textAnchor="end">{aisle} mm work aisle</text><g className="plan-legend"><rect x="86" y="390" width="14" height="8" className="sink-left"/><text x="106" y="398">Sink landing 610 + 457</text><rect x="272" y="390" width="14" height="8" className="hob-left"/><text x="292" y="398">Hob landing 305 + 381</text><rect x="470" y="390" width="14" height="8" className="fridge"/><text x="490" y="398">Fridge landing 381</text></g></svg></figure>;
}

function KitchenElevation({ inputs, kitchen }: { inputs: Inputs; kitchen: KitchenDerived }) {
  const y = (millimetres: number) => 360 - (millimetres / 2200) * 300;
  const worktopTop = y(kitchen.worktopHigh);
  const worktopBottom = y(kitchen.worktopLow);
  const shoulderY = y(inputs.shoulderHeight);
  const elbowY = y(inputs.elbowHeight);
  const reachY = y(kitchen.inclusiveReach);
  const microwaveBottomY = y(kitchen.microwaveBottom);
  const waistTop = y(1053);
  const waistBottom = y(833);
  return <figure className="diagram-card"><figcaption><div><span>Elevation diagram</span><strong>Personalised reach and work zones</strong></div><em>Values update with profile</em></figcaption><svg role="img" aria-label="Kitchen elevation showing personalised worktop, shoulder, elbow, waist and reach levels" viewBox="0 0 720 420"><defs><marker id="elevation-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#167d87"/></marker></defs><rect className="diagram-room" x="42" y="36" width="636" height="338" rx="18"/><line className="floor" x1="70" y1="360" x2="650" y2="360"/><rect className="waist-zone" x="74" y={waistTop} width="552" height={waistBottom - waistTop}/><line className="reach-line" x1="74" y1={reachY} x2="626" y2={reachY}/><text className="reach-label" x="620" y={reachY - 7} textAnchor="end">Inclusive raw reach reference · {kitchen.inclusiveReach} mm</text><rect className="base-unit" x="286" y={worktopTop} width="250" height={360 - worktopTop}/><rect className="worktop-band" x="270" y={worktopTop} width="282" height={Math.max(8, worktopBottom - worktopTop)}/><text className="cabinet-label" x="411" y={worktopTop + 66} textAnchor="middle">BASE UNITS</text><rect className="wall-unit" x="286" y="78" width="250" height="78" rx="5"/><text className="cabinet-label" x="411" y="122" textAnchor="middle">WALL UNITS · FINAL HEIGHT USER/PRODUCT SPECIFIC</text>{inputs.microwave && <><rect className="microwave" x="450" y={y(kitchen.microwaveBottom + 300)} width="86" height={microwaveBottomY - y(kitchen.microwaveBottom + 300)} rx="5"/><text className="appliance-label" x="493" y={y(kitchen.microwaveBottom + 135)} textAnchor="middle">MW</text><line className="leader" x1="540" y1={microwaveBottomY} x2="625" y2={microwaveBottomY}/><text className="small-label" x="620" y={microwaveBottomY - 6} textAnchor="end">bottom {kitchen.microwaveBottom} mm</text></>}<circle className="person" cx="176" cy="102" r="27"/><path className="person-line" d="M176 129 L176 238 M176 154 L222 195 L272 195 M176 238 L145 348 M176 238 L205 348"/><circle className="joint" cx="222" cy="195" r="5"/><line className="body-level" x1="74" y1={shoulderY} x2="262" y2={shoulderY}/><text className="small-label" x="82" y={shoulderY - 6}>shoulder {inputs.shoulderHeight}</text><line className="body-level" x1="74" y1={elbowY} x2="262" y2={elbowY}/><text className="small-label" x="82" y={elbowY - 6}>elbow {inputs.elbowHeight}</text><line className="dimension" x1="258" y1={worktopTop} x2="258" y2={worktopBottom} markerStart="url(#elevation-arrow)" markerEnd="url(#elevation-arrow)"/><text className="dimension-label" x="248" y={(worktopTop + worktopBottom) / 2} textAnchor="end">{kitchen.worktopLow}–{kitchen.worktopHigh} mm</text><text className="zone-label" x="620" y={(waistTop + waistBottom) / 2} textAnchor="end">frequent-use waist band · 833–1053 mm</text></svg></figure>;
}

function KitchenRuleSchedule({ inputs, kitchen, onSources }: { inputs: Inputs; kitchen: KitchenDerived; onSources: () => void }) {
  const rows = [
    { item: "Personalised worktop", value: `${kitchen.worktopLow}–${kitchen.worktopHigh} mm`, trigger: `${inputs.elbowHeight} mm elbow height`, citations: ["CIT-HETTICH-P16", "CIT-ANTHRO-P36"] },
    { item: "Work aisle", value: `${kitchen.aisle} mm`, trigger: inputs.cookMode, citations: ["CIT-NKBA-P5"] },
    { item: "Walkway", value: "914 mm", trigger: "Non-working passage", citations: ["CIT-NKBA-P7"] },
    { item: "Primary preparation surface", value: "914 × 610 mm", trigger: "Immediately beside sink", citations: ["CIT-NKBA-P13"] },
    { item: "Sink landing", value: "610 + 457 mm", trigger: "Primary sink", citations: ["CIT-NKBA-P12"] },
    { item: "Hob landing", value: "305 + 381 mm", trigger: "Cooking surface", citations: ["CIT-NKBA-P17"] },
    { item: "Refrigerator landing", value: "381 mm", trigger: "Handle side / listed alternative", citations: ["CIT-NKBA-P16"] },
    ...(inputs.dishwasher ? [{ item: "Dishwasher", value: "≤914 mm from sink · 533 mm standing space", trigger: "Dishwasher selected", citations: ["CIT-NKBA-P14"] }] : []),
    ...(inputs.microwave ? [{ item: "Microwave bottom", value: `${kitchen.microwaveBottom} mm AFF`, trigger: `${inputs.shoulderHeight} mm shoulder height`, citations: ["CIT-NKBA-P23", "CIT-ANTHRO-P35"] }] : []),
    { item: "Upper reach", value: "1,759 mm raw reference", trigger: "Inclusive female P5 measure", citations: ["CIT-ANTHRO-P43"] },
    { item: "Cabinet + appliance construction", value: "Selected product required", trigger: "Model-specific recess, door and ventilation", citations: [] },
  ];
  return <section className="schedule kitchen-schedule"><header><h3>Kitchen furniture and clearance schedule</h3><span>{rows.length} active rows</span></header><div className="legend"><span><i className="anthro-dot"/>Indian body data</span><span><i className="recommend-dot"/>Professional/manufacturer advice</span><span><i className="product-dot"/>Product manual required</span></div><div className="table-wrap"><table><thead><tr><th>Item</th><th>Current value</th><th>Trigger</th><th>Evidence layer</th></tr></thead><tbody>{rows.map(row => <tr key={row.item}><td><strong>{row.item}</strong></td><td>{row.value}</td><td>{row.trigger}</td><td>{row.citations.length ? <button onClick={onSources}>{row.citations.map(id => citations[id]?.label).join(" + ")}</button> : <span className="product-label">Manufacturer/model manual required</span>}</td></tr>)}</tbody></table></div></section>;
}

function Results({ inputs, result, kitchen, onSources }: { inputs: Inputs; result: ResultData; kitchen: KitchenDerived; onSources: () => void }) {
  const sanitaryDecision = inputs.wcCount === 1 ? "Separate bath + WC; association still editable" : inputs.combinedToilet ? "Matched rooms combined; remainder separate" : "Bathrooms and WCs separate";
  const kitchenEnvelope = deriveKitchenEnvelope(inputs, kitchen.aisle);
  const kitchenEnvelopeLabel = kitchenEnvelope.status === "pass" ? "Both checks pass" : kitchenEnvelope.status === "conflict" ? "Furniture conflict" : kitchenEnvelope.status === "regulatory-fail" ? "Room envelope fails" : kitchenEnvelope.status === "input-required" ? "Product input required" : "Not applicable";
  return <div className="results"><div className="result-hero"><div><span className="eyebrow">National room baseline + labelled ergonomic layers</span><h2>{inputs.unitType} residential programme</h2><p>{inputs.city}, {inputs.state} · {inputs.development} · {inputs.planning}</p></div><div className="dual-totals"><div className="area-card"><span>Verified subtotal</span><strong>{result.subtotal.toFixed(1)}</strong><em>m²</em><small>Only source-backed room values</small></div><div className="area-card target"><span>Programme total</span><strong>{result.programmeSubtotal.toFixed(1)}</strong><em>m²</em><small>Includes explicit targets and derived balcony area</small></div></div></div><div className="result-actions"><a className="download-link" href="/kitchen-furniture-rules-v1.csv" download>Download kitchen rules CSV</a><button className="primary" onClick={() => window.print()}>Print / save PDF</button><button className="ghost" onClick={onSources}>Review citations</button></div><section className="schedule"><header><h3>Residential space schedule</h3><span>{result.rows.length} programme rows</span></header><div className="legend"><span><i className="verified-dot"/>Verified room value</span><span><i className="target-dot"/>User target</span><span><i className="input-dot"/>Input required</span></div><div className="table-wrap"><table><thead><tr><th>Space</th><th>Qty</th><th>Area / target</th><th>Width</th><th>Height</th><th>Evidence basis</th></tr></thead><tbody>{result.rows.map((row, index) => { const sourceLabel = row.citation ? citations[row.citation]?.label : undefined; return <tr key={`${row.space}-${index}`} className={row.status === "needs-target" ? "unresolved" : row.status === "verified-range" ? "verified-range" : row.status === "user-target" ? "user-target" : ""}><td><strong>{row.space}</strong>{row.note && <small>{row.note}</small>}</td><td>{row.qty}</td><td>{row.area === null ? (row.status === "qualitative" ? "Included" : "Set target") : `${row.area.toFixed(1)} m²`}</td><td>{row.widthDisplay ?? (row.width === null ? "—" : `${row.width.toFixed(1)} m`)}</td><td>{row.height === null ? "—" : `${row.height.toFixed(2)} m`}</td><td>{sourceLabel ? <button onClick={onSources}>{sourceLabel}{row.triggerCitation ? ` + ${citations[row.triggerCitation]?.label}` : ""}</button> : <span className="target-label">Editable user target</span>}</td></tr>; })}</tbody><tfoot><tr><td colSpan={2}>Verified subtotal</td><td>{result.subtotal.toFixed(1)} m²</td><td colSpan={3}>National-reference room values only</td></tr><tr className="programme-total"><td colSpan={2}>Programme total</td><td>{result.programmeSubtotal.toFixed(1)} m²</td><td colSpan={3}>Includes explicit targets; excludes walls and general-circulation uplift</td></tr></tfoot></table></div></section><KitchenEnvelopeComparison inputs={inputs} kitchen={kitchen} onSources={onSources} compact/><KitchenRuleSchedule inputs={inputs} kitchen={kitchen} onSources={onSources}/><div className="diagram-grid result-diagrams"><KitchenPlan layout={inputs.kitchenLayout} aisle={kitchen.aisle}/><KitchenElevation inputs={inputs} kitchen={kitchen}/></div><div className="result-columns"><section className="warning-list"><header><h3>Evidence notices and limitations</h3><span>{result.warnings.length}</span></header>{result.warnings.map((warning, index) => <div key={warning}><b>{index + 1}</b><p>{warning}</p></div>)}</section><section className="decision-list"><header><h3>Derived decisions</h3><span>Visible</span></header><div><span>Habitable-room count</span><b>{result.habitable}</b></div><div><span>Sanitary association</span><b>{inputs.attachedWashrooms} attached suite(s)</b></div><div><span>Sanitary arrangement</span><b>{sanitaryDecision}</b></div><div><span>Kitchen layout</span><b>{inputs.kitchenLayout}</b></div><div><span>Room vs furniture</span><b>{kitchenEnvelopeLabel}</b></div><div><span>Worktop band</span><b>{kitchen.worktopLow}–{kitchen.worktopHigh} mm</b></div><div><span>Chapter 7 review</span><b>{result.fire ? "Activated" : "Not activated"}</b></div></section></div></div>;
}

function SourceModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="source-modal" onMouseDown={event => event.stopPropagation()}><header><div><span className="eyebrow">Human-readable evidence register</span><h2>Sources and evidence layers</h2></div><button aria-label="Close source register" onClick={onClose}>×</button></header>{Object.entries(citations).map(([id, citation]) => <article key={id}><div><strong>{citation.label}</strong><span>{citation.locator}</span><p>{citation.note}</p><details><summary>Audit reference</summary><small>{id}</small></details></div><div className="source-meta"><em data-tier={citation.tier}>{citation.tier}</em>{citation.href && <a href={citation.href} target="_blank" rel="noreferrer">Open source ↗</a>}</div></article>)}<div className="modal-note">A source code is shown only inside “Audit reference.” Users see the source title, page and evidence type first. “Professional recommendation” and “manufacturer guidance” never become Indian statutory requirements.</div></section></div>;
}
