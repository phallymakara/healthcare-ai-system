# Comprehensive Report: Trusted Sources for Veterinary & Animal Clinic Information
**Project:** Health AI / CareQueue Platform (Proseth Solutions)  
**Date:** September 2026  
**Subject:** Trusted Geospatial Directories, Clinical Knowledge Bases, and Architecture for Animal Health & Veterinary Services

---

## Executive Summary

As the **Health AI** platform prepares for broader deployment, incorporating **veterinary clinics and animal healthcare information** fulfills a high-volume real-world need. Pet owners, farmers, and community members frequently turn to conversational AI to ask:
1. *"Where is the nearest 24/7 vet clinic or emergency hospital?"*
2. *"My dog/cat ate something toxic or is vomiting — what should I do?"*
3. *"What is the vaccination schedule for rabies and core vaccines?"*
4. *"A dog/monkey bit someone — what are the risks and where do we go?"* (One Health / Rabies Protocol).

This report outlines the **trusted, verified sources** across two critical pillars:
- **Pillar 1: Clinic & Facility Directories** (Geospatial & Contact info for Cambodia and regional operations).
- **Pillar 2: Clinical & Medical Knowledge Sources** (Authoritative, evidence-based veterinary data for AI symptom triage and guidance).
- **Implementation Blueprint**: How to integrate these sources into the existing FastAPI + PostgreSQL + React system using the same pipeline as the human health facilities (`hotosm_khm_health_facilities_osm_gpkg`).

---

## 1. Pillar 1: Trusted Clinic & Facility Directories

### 1.1. OpenStreetMap (OSM) & Humanitarian OpenStreetMap Team (HOT)
Just as the project currently utilizes `hotosm_khm_health_facilities_osm_gpkg` for public human hospitals, OpenStreetMap maintains a dedicated schema for veterinary services.

* **Primary Tag:** `amenity=veterinary`
* **Sub-tags:**
  - `veterinary=pet` (Small animal / companion pet clinics)
  - `veterinary=large_animals` / `veterinary=livestock` (Farm & rural veterinary care)
  - `emergency=yes` (24/7 emergency response)
  - `phone=*`, `contact:phone=*`, `opening_hours=*`, `website=*`, `addr:city=*`
* **How to Ingest:**
  - **Overpass API Query:** Can run live or scheduled batch updates directly covering Cambodia:
    ```overpassql
    [out:json][timeout:25];
    area["name"="Cambodia"]->.searchArea;
    (
      node["amenity"="veterinary"](area.searchArea);
      way["amenity"="veterinary"](area.searchArea);
      relation["amenity"="veterinary"](area.searchArea);
    );
    out body center;
    ```
  - **Humanitarian Data Exchange (HDX) / Geofabrik:** Downloadable monthly GPKG / Shapefile layers for Cambodia.

---

### 1.2. Verified Primary Veterinary Hospitals & Clinics in Cambodia
For high-confidence, production-grade responses, the system should maintain a verified curated tier of recognized clinics in Cambodia (with verified emergency hotlines):

| Facility Name | Location | Focus & Capabilities | Emergency Status |
| :--- | :--- | :--- | :--- |
| **Animal Mama Veterinary Hospital** | Phnom Penh (Phsar Derm Tkov) | Full surgery, digital X-ray, ultrasound, ICU, pet relocation, wildlife & rescue triage | **24/7 Emergency** |
| **EUROVET Clinic** | Phnom Penh | International standard surgery, hospitalization, diagnostics | **24/7 Hospitalization** |
| **VSL Veterinary Clinic** | Phnom Penh (BKK1) | Diagnostics, orthopedic surgery, international travel clearance | Regular / On-call |
| **CamPaws Animal Hospital** | Phnom Penh | Comprehensive medical, dental, surgical care | Regular hours |
| **Siem Reap Veterinary Care** | Siem Reap | Outpatient, soft tissue surgery, diagnostic lab | Regular / Emergency on-call |
| **Worldwide Veterinary Service (WVS) Cambodia** *(incorporating former ARC - Animal Rescue Cambodia)* | Phnom Penh | Community health, rabies vaccination, spay/neuter outreach | Non-profit / Welfare |
| **PPAWS (Phnom Penh Animal Welfare Society)** | Phnom Penh | Low-cost clinic, spay/neuter, rescue assistance | Community clinic |

---

### 1.3. Government & Regulatory Authorities (Cambodia)
* **General Directorate of Animal Health and Production (GDAHP):**
  - **Parent Ministry:** Ministry of Agriculture, Forestry and Fisheries (MAFF), Cambodia.
  - **Role:** Official national regulatory body for livestock and companion animal disease surveillance, import/export quarantine, rabies vaccination mandates, and veterinary practitioner registration.
  - **Website:** [maff.gov.kh](https://www.maff.gov.kh)
  - **Role in Health AI:** Referenced for official regulations (e.g., animal transport rules, mandatory disease alerts, and national vaccination campaigns).
* **Institut Pasteur du Cambodge (IPC):**
  - **Role:** The preeminent scientific institute in Cambodia for rabies surveillance, post-exposure human vaccination, and animal bite diagnostics.
  - **Crucial Rule:** Whenever an animal bite is mentioned in user chats, the AI must immediately provide guidance for Pasteur Institute Rabies Prevention Centers (Phnom Penh, Battambang, Kampong Cham).

---

## 2. Pillar 2: Trusted Clinical & Medical Knowledge Sources

To ensure the AI does **not hallucinate** medical advice or suggest dangerous human medicines to animals (e.g., Paracetamol/Acetaminophen is toxic to cats and dogs), the AI must be grounded in recognized veterinary authorities.

### 2.1. The Gold Standard: The Merck Veterinary Manual
* **Source:** [merckvetmanual.com](https://www.merckvetmanual.com)
* **Why Trusted:** The globally recognized, peer-reviewed clinical reference used by licensed veterinarians worldwide.
* **Coverage:**
  - Emergency triage (toxicity, heatstroke, gastric dilation volvulus/bloat, trauma).
  - Common infectious diseases (Parvovirus, Distemper, Feline Leukemia/FIV, Rabies).
  - Household poisons (chocolate, xylitol, rodenticides, lilies, onions/garlic).
  - Pet owner educational manuals (written in clear, accessible language).

### 2.2. WSAVA (World Small Animal Veterinary Association)
* **Source:** [wsava.org](https://wsava.org)
* **Key Global Guidelines:**
  - **Vaccination Guidelines:** Clear definitions of "core" vs. "non-core" vaccines for dogs and cats across global and tropical climates.
  - **Pain Management & Nutritional Assessment:** Standard protocols for pet health.
  - **Global Dental Guidelines:** Preventative oral care.

### 2.3. AVMA (American Veterinary Medical Association) & Pet Health Network
* **Source:** [avma.org/resources/pet-owners](https://www.avma.org/resources/pet-owners)
* **Key Guidelines:**
  - First-aid instructions for pet owners before arriving at an emergency clinic.
  - Zoonotic disease transmission prevention (diseases shared between humans and animals).
  - Safe handling of sick or aggressive injured animals.

### 2.4. WOAH (World Organisation for Animal Health / formerly OIE) & WHO One Health
* **Source:** [woah.org](https://www.woah.org) / [who.int/health-topics/one-health](https://www.who.int/health-topics/one-health)
* **Focus:** Zoonotic diseases (Rabies, Avian Influenza H5N1, Leptospirosis, Toxoplasmosis).
* **Significance:** Essential for Cambodia, where interaction between community animals, poultry, and humans requires synchronized "One Health" advice.

---

## 3. Recommended Platform Integration in Health AI

### 3.1. Database & Facility Model Extension
In the existing system (`backend/app/models/` and `hotosm` pipeline):
1. **Facility Type Enum:**
   Add `VETERINARY_CLINIC` and `ANIMAL_HOSPITAL_24_7` alongside existing `HOSPITAL`, `CLINIC`, and `HEALTH_POST`.
2. **Species Handled:**
   Tag facilities with species tags: `["canine", "feline", "exotic", "livestock"]`.
3. **Emergency Hotline Tag:**
   Ensure 24/7 animal emergency numbers have a dedicated high-visibility display card in the UI.

### 3.2. AI Assistant Prompting & Safety Guardrails
The AI chatbot (`medbot.bcietech.com`) should be provided with veterinary-specific safety instructions:

1. **Human Medicine Danger Alert:**
   > *Strict Rule:* Never advise administering human over-the-counter pain medications (e.g., Tylenol / Paracetamol, Ibuprofen) to pets. The AI must explicitly warn users that these are fatal to cats and dogs.
2. **Emergency Red Flags (Immediate Clinic Dispatch):**
   If the user reports:
   - Inability to urinate (especially male cats)
   - Distended abdomen / retching without vomit (bloat/GDV)
   - Ingestion of rat poison, lilies, antifreeze, or chocolate
   - Seizures lasting >3 minutes or respiratory distress  
   $\rightarrow$ The AI must immediately output the emergency vet hotline and map directions to the nearest 24/7 clinic (e.g., Animal Mama / EUROVET).
3. **Dual "One Health" Triage for Animal Bites:**
   If a user asks: *"A stray dog or puppy scratched/bit me or my child"*:
   - Provide immediate wound washing instructions (15 minutes running water + soap).
   - Direct the patient to **Institut Pasteur du Cambodge** or nearest provincial hospital for human Post-Exposure Prophylaxis (PEP).
   - Advise safe quarantine/observation of the animal if possible, without risking further bites.

### 3.3. UI / User Experience Enhancements
* **Category Switcher on Discovery Screen:**
  Allow patients to toggle between **"Human Hospitals & Clinics"** and **"Veterinary & Pet Care"**.
* **Khmer & English Language Support:**
  Ensure common animal terms are localized into Khmer:
  - Veterinary Clinic $\rightarrow$ **គ្លីនិកសត្វ** (Klinik Satv)
  - Pet Doctor / Veterinarian $\rightarrow$ **ពេទ្យសត្វ** (Pet Satv)
  - Emergency Animal Care $\rightarrow$ **សង្គ្រោះបន្ទាន់សត្វ** (Sangkruoh Bantoan Satv)
  - Rabies $\rightarrow$ **ជំងឺឆ្កែឆ្កួត** (Chhumgheu Chhkae Chhkoat)

---

## 4. Summary & Immediate Next Steps

| Milestone | Action Item | ETA |
| :--- | :--- | :--- |
| **Phase 1A** | Query Overpass Turbo for all `amenity=veterinary` in Cambodia and seed into database | 1-2 days |
| **Phase 1B** | Verify top 10 veterinary hospitals in Phnom Penh & Siem Reap (hours, emergency phone numbers) | 1 day |
| **Phase 2** | Integrate Merck Vet Manual & WSAVA guidelines into AI system prompt and knowledge retrieval (RAG) | 2-3 days |
| **Phase 3** | Expose "Pet & Animal Care" filter on frontend Facility Discovery page (`FacilityDetailView.tsx`) | 2 days |
