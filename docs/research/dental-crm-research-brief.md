# Dental CRM for All Specialties: Research Brief

**Date:** 2026-11-13
**Status:** Desk research is complete. Customer interviews have not started.
**Method:** Four parallel web-research tracks: competitors, specialty workflows, compliance and integrations, and market and pain points.

Several vendor sites could not be fetched directly. For those, figures come from search summaries, review sites (Capterra, G2), trade press and vendor material. **[V]** marks a claim made by a vendor, which may be biased. **[U]** marks a claim that is unverified or estimated. Check anything marked **[U]** before you rely on it publicly.

---

## 1. Executive summary

1. **"No dental CRM exists" is not accurate.** About 20 dental patient-engagement products exist (Weave, NexHealth, RevenueWell, Adit, Dental Intelligence and others), and a wave of AI receptionist startups. The accurate claim, which holds up, is narrower:

   > **No tool covers every dental specialty in depth while sitting on top of the practice-management system (PMS) a practice already uses.** The mainstream tools are built around general dentistry. Specialists get their CRM features from niche specialty PMSs, from standalone tools, or by switching their entire PMS.

2. **The closest competitors claim all-specialty coverage, but neither proves it.**
   - **CareStack** markets to ortho, oral surgery, perio, endo, pediatric and prosthodontic practices. But it is a full PMS replacement, and its endo, perio and prosthodontic depth is thin.
   - **Intiveo** claims "all specialties" and has referral tracking. It is small, and we found no endo or prosthodontic workflows.

3. **"All specialties" is really two products that should share one data model.**
   - **Referral-driven specialties** need a CRM for managing relationships with the dentists who refer to them, a B2B problem. These are endo, oral surgery, perio, oral medicine and orofacial pain. About 90% of endodontist root canals come from referrals ([AAE](https://newsroom.aae.org/featured-stories/more-dentists-are-referring-to-endodontists-new-aae-survey-finds/)).
   - **Patient-driven work** needs a patient funnel CRM: lead, then consult, then start, then recall. This covers ortho, pediatric, general dentistry, and high-value elective cases (full-arch implants, aligners, sleep appliances).
   - Oral surgery, perio and prosthodontics need both.

4. **Specialist relationship management is the clearest gap.** None of the mainstream engagement suites treats referring dentists as relationships to manage. Specialty PMSs treat a referral as "a data field, not a workflow" ([DSN](https://www.dsn.com/best-endo-software-worth-investment/)). Specific things nobody offers:
   - a health score for each referring dentist, with alerts when one stops referring;
   - logs of liaison and outreach activity tied to the referrals it produced;
   - closed-loop status shared between the specialist and the referring dentist;
   - leakage analytics for DSOs (patients referred out of network instead of to their own specialists).

5. **Recommended wedge:** start with **referral-driven specialists (endo, oral surgery, perio)**:
   - a referral CRM layered on their existing PMS;
   - Fetch 22's existing no-show and reminder engine;
   - a free portal for referring dentists, which pulls general dentists onto the platform and becomes the acquisition channel for a later general-dentistry edition.

   Expand afterwards through "specialty packs" (Section 7).

6. **The hardest problems are integration and compliance, not features.**
   - Henry Schein One (Dentrix) now blocks unapproved third-party access, including the NexHealth and Sikka integration services. It requires SOC 2 Type II to join its API Exchange.
   - Open Dental is the most open system and should be the first direct integration.
   - Under the FCC's texting-consent rules, the revised opt-out ("revocation") requirements take effect **2026-11-25**, so consent tracking must be built in from the start.

---

## 2. Market

| Metric | Value | Source |
|---|---|---|
| Active US dentists (2025) | 205,088 | [ADA HPI](https://www.ada.org/resources/research/health-policy-institute/dentist-workforce) |
| Share who are specialists | 21.2% (~43.5k) | same |
| Orthodontists / pediatric / oral surgery / endo / perio / prosthodontics | ~10.8k / ~9.3k (fastest-growing) / ~7.4k / ~5.7k / ~5.5k / ~3.5k | ADA HPI via Becker's **[U: data year]** |
| Practice locations | ~140k–160k (sources disagree) | BLS QCEW, Orbital, IBISWorld |
| Dentists affiliated with a DSO | ~17% (2025), up from ~7% (2015); 27% of dentists ≤10 years out of school | [ADA HPI](https://www.ada.org/resources/research/health-policy-institute/dental-practice-research/practice-modalities-among-us-dentists) |
| US dental spending | $189B (2024) | [ADA HPI / CMS](https://ada.org/resources/research/health-policy-institute/dental-care-market/national-dental-expenses) |
| US dental PMS software market | $924M (2024) → $1.55B (2030), 9.1% CAGR | [ResearchAndMarkets](https://www.businesswire.com/news/home/20250623198049/en/) |
| Average net income | General dentist $208k; specialist $339k; oral surgeon $480k (2022) | ADA HPI via Dental Economics / Becker's |
| Monthly workflow-software budget | 66% of practices budget $401–$500/mo | Becker's **[U: survey year]** |

**Market signals:**
- Francisco Partners agreed to take **Weave private for about $650M**, roughly 2.7x revenue (Aug 2026). That is a modest multiple for generic dental communications tools.
- The **ADA endorsed Weave** as its patient-engagement platform (Mar 2026).
- 43% of dentists already use AI for at least one task ([ADA HPI 2026](https://www.ada.org/resources/research/health-policy-institute/dental-practice-research/dentists-ai-usage-and-attitudes)).
- AI receptionist startups (Arini, Patientdesk, Viva, 10xDental, Newton) are numerous but are all point tools for the front desk.

### Validated pain points

| Pain | Data |
|---|---|
| Staffing | 88% say hiring hygienists is extremely or very hard (Q1 2025, ADA) |
| Missed calls | 30–38% of calls go unanswered **[V]** |
| Insurance verification | At least 12 minutes per manual check (CAQH) |
| Case acceptance | 45% on average vs. 75% for the top decile **[V: HS One]** |
| No-shows | 9–14% in academic studies; vendors cite ~15% |
| Referral dependence (endo) | ~90% of endodontist root canals come from referrals (AAE) |
| Referral leakage | **No dental benchmark exists.** Medical-sector studies put it at 20–65%. This is an opportunity to publish the first one. |

---

## 3. Specialty map

There are **12 ADA-recognized specialties** ([NCRDSCB](https://ncrdscb.ada.org/recognized-dental-specialties)). General dentistry is not a specialty, but it is the largest buyer and the source of referrals.

| Segment | Where demand comes from | CRM shape | What it needs that general tools lack | Software used today | Served? |
|---|---|---|---|---|---|
| **General / family** | Direct from patients | Patient funnel | Follow-up on referrals sent out ("did they go?"); elective funnels | Dentrix, Eaglesoft, Open Dental + Weave, NexHealth, etc. | Saturated |
| **Endodontics** | ~90% referral | Referring-dentist CRM | Referring-dentist health scoring, alerts when a dentist stops referring, outreach tracking, report-back to the referring dentist | TDO, PBS Endo, EndoVision, DSN Endo-Exec | Report letters yes; **relationship management no** |
| **Oral & maxillofacial surgery** | Referral + direct full-arch | Both | Referring-dentist CRM, sedation pre-op instructions, medical/dental billing crossover, full-arch sales pipeline | OMSVision, WinOMS/Sensei, DSN | **Partial** |
| **Periodontics** | Referral + implants | Both | Recall shared with the general dentist (3-month perio maintenance alternating with GP hygiene), hand-off for implant restoration | DSN Perio-Exec, general PMS | **Weak** |
| **Orthodontics** | Mostly direct | Patient funnel | Consult-to-start pipeline, observation pool, contracts and payment plans, responsible party | Dolphin, Ortho2, Cloud 9, Greyfinch + Gaidge, OrthoFi | **Crowded** (but fragmented) |
| **Pediatric** | Parents + referrals | Patient funnel | Multiple guardians and custody, sibling grouping, sedation/OR backlog, Medicaid, hand-off to a general dentist at age 18 | General PMS (Open Dental, Curve, CareStack) | **Ad hoc** |
| **Prosthodontics** | Referral + high-value direct | Both | Multi-phase plans, lab coordination, financing, coordination with oral surgery and perio | General PMS | **Unserved** |
| **Orofacial pain / TMD** | Referral (dental + medical) + direct | Referral + follow-up | Pain questionnaires (DC/TMD), ICD-10/CPT medical billing, prior authorization | DentalWriter (Nierman), DS3 | Billing tools only |
| **Oral medicine** | Referral from physicians | Referring-provider CRM | Intake from medical referrers, result letters, long-term follow-up | Hospital EHRs | Niche |
| **Dental anesthesiology** | B2B: host practices | Account CRM | Host offices treated as accounts, case requests, ASA status, NPO instructions | Open Dental + anesthesia module | **Untouched (open niche)** |
| **Oral & maxillofacial pathology / radiology** | B2B: lab or reading service | Client-account CRM | Submitter accounts, turnaround time | Lab systems; BeamReaders, etc. | Not a target; *integrate their reports* |
| **Dental public health** | Government and programs | n/a | n/a | n/a | **Exclude** |

**Cross-cutting opportunities:**
- **DSO referral leakage across PMSs.** DSOs often run several PMSs after acquisitions and want internal referrals to stay in network.
- **High-value elective funnels** (full-arch implants at $20–30k+ per arch **[U]**, aligners, sleep appliances). Today these run on agency GoHighLevel setups that are cut off from clinical data, and GoHighLevel is not HIPAA-ready by default.

---

## 4. Competitive landscape

| Cluster | Players | Specialty depth | Referring-dentist CRM? |
|---|---|---|---|
| Dental engagement add-ons | Weave ($199–250+/location/mo), NexHealth (~$350+), RevenueWell ($189+), Adit ($399+), Dental Intelligence/Modento, Practice by Numbers ($249+), Solutionreach, Yapi, Lighthouse 360 | Ortho PMS integrations only (Dolphin, Ortho2, OrthoTrac); **no oral surgery or endo PMS integrations found** | No |
| PMS with built-in engagement | CareStack, Curve, Dentrix Ascend, Open Dental eServices ($165/location), Planet DDS | CareStack is broad on paper; DSN has separate oral surgery, endo and perio products | CareStack, DSN (inside their own PMS) |
| Specialty point tools | Gaidge, OrthoFi (ortho); ReferralMD (medical referrals; one oral surgery case study); Refera | One specialty each | ReferralMD (not dental-native) |
| AI-native front desk | Arini, Viva, Heygent, 10xDental, Newton, TrueLark | None | No |
| General-purpose CRMs | GoHighLevel snapshots (HIPAA add-on ~$297/mo), Birdeye, Podium, Salesforce Health Cloud | Templates only | DIY |

**Weaknesses that come up repeatedly in reviews:**
- Sync with the PMS is unreliable: NexHealth, Adit, RevenueWell, Practice by Numbers.
- Prices jump at renewal.
- Analytics, engagement and phones are split across separate products, so practices end up running two or three tools.

**Competitive risks:**
- Weave's ADA endorsement and new private-equity backing.
- CareStack moving deeper into specialties.
- Henry Schein One and Patterson bundling AI into their PMSs.

---

## 5. Compliance requirements (build in from day one)

**HIPAA.** We are a Business Associate.
- Sign a BAA with every practice, and with every vendor that touches patient data: cloud host, SMS carrier, email provider, LLM providers.
- The proposed 2025 Security Rule is **not final**; HHS now targets July 2027. Build to it anyway: MFA, encryption, asset inventory, tested restores.

**HIPAA marketing rule.**
- Recall, treatment follow-up and messages about the practice's own services do not need patient authorization.
- Messages paid for by a third party, and uploading patient lists to ad platforms, do need authorization.
- **Review replies must never confirm that someone is a patient.** The federal health-privacy regulator (HHS OCR) has fined dental practices for this ($10k, $50k).

**TCPA and FCC rules.**
- Appointment reminders fall under a healthcare exemption with conditions: at most 1 per day and 3 per week, 160 characters or fewer, opt-out included.
- Marketing requires prior express written consent.
- Opt-outs made by any reasonable means must be honored within 10 business days.
- **The revised revocation rules take effect 2026-11-25**; counsel should review the final order.
- Build a **consent ledger** that records consent per channel and per purpose.

**A2P 10DLC (business texting registration).**
- Each practice is a registered brand, and reminder and marketing messages need separate campaigns. Unregistered traffic is blocked.
- Automate this registration through Twilio, Telnyx or Bandwidth, using a plan that comes with a BAA.

**State law.**
- **Texas SB 1188:** patient records must be stored in the US from 2026-01-01, so host in US regions only.
- **Washington My Health My Data Act:** applies to data that falls outside HIPAA, such as website and ad data. It allows private lawsuits and bans geofencing.
- CCPA applies to our B2B and marketing data.

**SOC 2.** Type II is **required** for Henry Schein One's API Exchange (Dentrix) and is expected by DSOs. Plan for Type I at launch and Type II 3–6 months later.

**CDT codes** are copyrighted by the ADA. Display the practice's own procedure labels pulled from its PMS, and avoid shipping a CDT table until we have a license. Confirm this approach with the ADA.

---

## 6. Integration strategy

| PMS | Share (single / multi-location, CIRO 2024 [U]) | How to integrate | Plan |
|---|---|---|---|
| Open Dental | 15.9% / 12.4% | Public API, ~$0–35 per location per month; reads allowed, writes only through the API | **Phase 1, built directly** |
| Dentrix / Ascend | 32.5% / 22.8% | Henry Schein One API Exchange: SOC 2 Type II, ~$10k+ in fees plus royalties **[U]**; **actively blocks aggregators** | Apply once SOC 2 is in place; use CSV import until then |
| Eaglesoft | 20.8% / 11.8% | Patterson partner program (~$3–5k plus monthly fees **[U]**) or an aggregator | Phase 1–2, through an aggregator |
| Denticon / Cloud 9 (Planet DDS) | DSO-heavy | Open partner API program | Phase 2 (DSO channel) |
| Specialty PMSs (TDO, PBS Endo, WinOMS, OMSVision, Dolphin, Ortho2) | n/a | Mostly on-premise with no public API → **Sikka** sync agent or a direct partnership | Sikka (read-only) for the specialist wedge |

**Architecture rule:** put every PMS behind our own adapter interface so aggregators can be swapped out. **Make the referral record live in our system as the source of truth**, so the referral CRM still works with read-only, delayed or CSV-only PMS data.

That is what makes the specialist wedge practical even though specialty PMSs are closed: referrals arrive through *our* portal, form and fax intake, not the PMS.

---

## 7. Recommended product

### Positioning
> The CRM built for how each dental specialty actually grows. It works on top of the PMS you already use and covers referring dentists, patients and high-value cases.

### Core data model (shared by every specialty)
- **Organization → Location → Provider.** Built for multiple locations, so DSOs fit from day one.
- **Patient** + **Household/Guardian/Responsible party.** Supports more than one guardian, custody notes and sibling grouping.
- **Referring provider.** Dentist, physician or host practice, with practice, contact, liaison owner, relationship history, health score and preferences.
- **Referral.** Status flows received → scheduled → seen → treated → report sent → returned to the referring dentist. Attachments include imaging and pathology reports.
- **Opportunity / case.** A pipeline for consults, starts and full-arch cases, with stage, value, financing status and owner.
- **Treatment phase / contract.** Multi-phase plans, payment plans, lab steps.
- **Care cadence.** Recall rules per specialty: 6-month hygiene, 3-month perio maintenance, ortho adjustments, post-op checks, observation re-checks.
- **Communications + consent ledger.** Channel, purpose, consent source, revocations.
- **Activity / outreach.** Liaison visits, lunch-and-learns, CE events, gifts, each tied to the referrals that followed.

### Specialty packs (configuration on top of the shared core)

| Pack | Key features |
|---|---|
| **Endo** | Referral intake portal, automatic acknowledgment letter, report-back, referring-dentist dashboard and alerts when a dentist stops referring |
| **Oral surgery** | Endo pack features + sedation pre-op and NPO sequences, post-op check-ins, full-arch pipeline, flags for medical billing |
| **Perio** | Recall shared with the referring dentist, implant restoration hand-off, maintenance retention tracking |
| **Ortho** | Consult-to-start pipeline, observation pool, contract and payment-plan follow-up, referrals from general dentists |
| **Pediatric** | Messaging to guardians and households, sedation/OR backlog, age-based recall, hand-off to a general dentist at 18 |
| **Prosthodontics** | Phased case tracking, lab coordination, financing links, interdisciplinary team view |
| **Orofacial pain** | Intake questionnaires, follow-up adherence, referrals from physicians |
| **Anesthesiology** | Host-practice accounts, case requests, pre-op screening workflow |
| **General** | Recall and reactivation, unscheduled treatment, closed-loop tracking of referrals sent out |

### Phased roadmap

| Phase | Scope | Why |
|---|---|---|
| **0: Validate (4–6 wks)** | Interview 15–20 people: endodontists, oral surgeons, periodontists, their office managers, 5 DSO operations leads. Recruit 3–5 design partners. | Confirms willingness to pay and which PMS they run |
| **1: MVP (≈3–4 mo)** | Endo + oral surgery + perio packs; referring-dentist CRM + referral portal (free for referring dentists) + report-back; Fetch 22 reminders and no-show engine; Open Dental direct + Sikka read-only + CSV import; HIPAA, consent ledger, 10DLC; SOC 2 Type I in progress | Sharpest gap, fewest competitors, ~90% referral dependence |
| **2: High-value cases (≈3 mo)** | Full-arch, prosthodontic and implant pipeline; financing links (CareCredit, Sunbit, Cherry); attribution from ad spend to production | Large deal sizes; GoHighLevel incumbents are weak |
| **3: Patient-funnel packs** | Ortho, pediatric, general packs; Eaglesoft through an aggregator; Dentrix through the API Exchange once SOC 2 Type II is done | Expands reach; the referring-dentist portal has already brought general dentists on |
| **4: DSO and AI** | Leakage dashboards across PMSs, SSO, role-based access per location; AI voice and text agents for intake and reactivation; anesthesiology pack | Enterprise contracts |

### Pricing hypothesis (to test in Phase 0)
- **Referring dentists:** free portal. This is the network-effect acquisition channel.
- **Specialist practice:** ~$300–$500 per location per month. This sits inside the ~$400–500 workflow budget and compares with Weave/NexHealth at $199–700.
- **High-value case add-on:** priced per active pipeline or as a flat add-on.
- **DSO:** enterprise contract per location, with volume tiers.

### Fit with the current Fetch 22 product
Fetch 22 already sells "End patient no-shows" at $149/$249 per month. The plan is to keep that as the **entry tier** (reminders and no-show prevention) and sell specialty packs and the referral CRM as upgrades. That gives a path from the existing product to the CRM.

---

## 8. Key risks

| Risk | Mitigation |
|---|---|
| PMS access is controlled by Henry Schein One and Patterson | Referral records live in our system; Open Dental first; get SOC 2 early; adapter layer |
| Weave and CareStack expand into specialties | Out-execute on depth of referring-dentist relationship management; free referring-dentist network effect |
| Unreliable PMS sync (the top complaint in the category) | Sync health monitoring visible to the customer; reconciliation jobs |
| TCPA lawsuits | Consent ledger, message classification, quiet hours, counsel review |
| "We don't need a separate CRM, our PMS does it" | Lead with measurable outcomes: recovered referring dentists and referral volume, consult conversion |
| Spreading across 12 specialties too early | Sequence through packs; launch with three referral-driven specialties |

---

## 9. Open questions for primary research

1. Willingness to pay for a referring-dentist CRM vs. what specialty PMSs already include.
2. Which PMS our design partners actually run, especially the endo and oral surgery PMS split.
3. Referral-leakage rates in DSOs (a dental benchmark doesn't exist yet).
4. Typical sales cycle and how dentists discover tools (no data found).
5. Hygiene recall and reactivation benchmarks.
6. Whether showing PMS procedure labels avoids the need for an ADA CDT license.
7. Final text of the FCC's 2026 revocation order (counsel).
8. Whether the Weave / Francisco Partners deal has closed, and any strategy change that follows.
