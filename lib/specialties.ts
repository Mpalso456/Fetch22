/**
 * Specialty packs: configuration layered on the shared core model.
 *
 * The MVP ships the three referral-driven packs (endo, oral surgery, perio).
 * The others are defined so the data model and UI can already speak about
 * them, and are flagged `available: false` until their workflows are built.
 */
import type { Specialty } from './db/schema';

export type DemandModel = 'referral' | 'direct' | 'both';

export interface CareCadence {
  key: string;
  label: string;
  /** Days after the anchor event (e.g. treatment completion) the touchpoint is due. */
  dueAfterDays: number;
  repeatEveryDays?: number;
}

export interface SpecialtyPack {
  specialty: Specialty;
  label: string;
  shortLabel: string;
  available: boolean;
  demandModel: DemandModel;
  /** Referral reasons offered in the referral portal. key → label */
  referralReasons: Record<string, string>;
  /** Default case value (cents) used for pipeline value when the referrer gives none. */
  defaultCaseValueCents: number;
  cadences: CareCadence[];
  /** What the report back to the referring dentist must contain. */
  reportChecklist: string[];
}

export const SPECIALTY_PACKS: Record<Specialty, SpecialtyPack> = {
  endodontics: {
    specialty: 'endodontics',
    label: 'Endodontics',
    shortLabel: 'Endo',
    available: true,
    demandModel: 'referral',
    referralReasons: {
      evaluation: 'Evaluate & treat',
      rct: 'Root canal therapy',
      retreatment: 'Non-surgical retreatment',
      apicoectomy: 'Apicoectomy / endodontic surgery',
      trauma: 'Dental trauma',
      cracked_tooth: 'Cracked tooth evaluation',
      pain_dx: 'Diagnosis of unknown pain',
    },
    defaultCaseValueCents: 140000,
    cadences: [
      { key: 'post_op_check', label: 'Post-op check-in', dueAfterDays: 2 },
      { key: 'restoration_reminder', label: 'Return to GP for final restoration', dueAfterDays: 14 },
      { key: 'recall_6m', label: '6-month healing evaluation', dueAfterDays: 182 },
      { key: 'recall_12m', label: '12-month healing evaluation', dueAfterDays: 365 },
    ],
    reportChecklist: ['Diagnosis', 'Treatment performed', 'Pre/post-op radiographs', 'Restoration recommendation', 'Recall plan'],
  },
  oral_surgery: {
    specialty: 'oral_surgery',
    label: 'Oral & Maxillofacial Surgery',
    shortLabel: 'OMS',
    available: true,
    demandModel: 'both',
    referralReasons: {
      third_molars: 'Third molar extraction',
      extraction: 'Extraction(s)',
      implant: 'Implant placement',
      bone_graft: 'Bone / sinus graft',
      full_arch: 'Full-arch (All-on-X) consult',
      biopsy: 'Biopsy / pathology',
      trauma: 'Trauma',
      orthognathic: 'Orthognathic consult',
    },
    defaultCaseValueCents: 250000,
    cadences: [
      { key: 'pre_op_instructions', label: 'Pre-op / NPO & escort instructions', dueAfterDays: -2 },
      { key: 'post_op_check', label: 'Post-op check-in', dueAfterDays: 1 },
      { key: 'post_op_visit', label: 'Post-op visit', dueAfterDays: 7 },
      { key: 'restore_handoff', label: 'Implant ready for restoration — notify GP', dueAfterDays: 90 },
    ],
    reportChecklist: ['Procedure performed', 'Anesthesia type', 'Pathology result (if biopsy)', 'Healing status', 'Restorative hand-off date'],
  },
  periodontics: {
    specialty: 'periodontics',
    label: 'Periodontics',
    shortLabel: 'Perio',
    available: true,
    demandModel: 'both',
    referralReasons: {
      perio_eval: 'Periodontal evaluation',
      srp: 'Scaling & root planing',
      surgery: 'Periodontal surgery',
      graft: 'Gingival graft',
      implant: 'Implant placement',
      peri_implantitis: 'Peri-implantitis',
      crown_lengthening: 'Crown lengthening',
    },
    defaultCaseValueCents: 180000,
    cadences: [
      { key: 'post_op_check', label: 'Post-op check-in', dueAfterDays: 2 },
      // Perio maintenance alternates with the GP's hygiene visits (co-managed recall).
      { key: 'perio_maintenance', label: 'Perio maintenance (alternating with GP)', dueAfterDays: 90, repeatEveryDays: 180 },
      { key: 'gp_hygiene', label: 'GP hygiene visit (co-managed)', dueAfterDays: 180, repeatEveryDays: 180 },
    ],
    reportChecklist: ['Periodontal charting', 'Diagnosis & staging/grading', 'Treatment performed', 'Co-managed maintenance schedule'],
  },
  orthodontics: pack('orthodontics', 'Orthodontics', 'Ortho', 'direct', 600000),
  pediatric: pack('pediatric', 'Pediatric Dentistry', 'Pedo', 'direct', 80000),
  prosthodontics: pack('prosthodontics', 'Prosthodontics', 'Prosth', 'both', 1500000),
  orofacial_pain: pack('orofacial_pain', 'Orofacial Pain', 'OFP', 'referral', 120000),
  oral_medicine: pack('oral_medicine', 'Oral Medicine', 'Oral Med', 'referral', 50000),
  dental_anesthesiology: pack('dental_anesthesiology', 'Dental Anesthesiology', 'Anesthesia', 'referral', 90000),
  general: pack('general', 'General Dentistry', 'General', 'direct', 50000),
};

function pack(
  specialty: Specialty,
  label: string,
  shortLabel: string,
  demandModel: DemandModel,
  defaultCaseValueCents: number,
): SpecialtyPack {
  return {
    specialty,
    label,
    shortLabel,
    available: false,
    demandModel,
    referralReasons: { evaluation: 'Evaluate & treat' },
    defaultCaseValueCents,
    cadences: [],
    reportChecklist: [],
  };
}

export function getPack(specialty: Specialty): SpecialtyPack {
  return SPECIALTY_PACKS[specialty];
}

export function reasonLabel(specialty: Specialty, reason: string): string {
  return getPack(specialty).referralReasons[reason] ?? reason;
}

export const AVAILABLE_PACKS = Object.values(SPECIALTY_PACKS).filter((p) => p.available);
