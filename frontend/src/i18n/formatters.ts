export type Language = 'en' | 'km';

// Facility Name Mappings
const FACILITY_MAP_KM: Record<string, string> = {
  'Calmette Hospital': 'មន្ទីរពេទ្យកាល់ម៉ែត',
  'Khmer-Soviet Friendship Hospital': 'មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត (ពេទ្យរុស្ស៊ី)',
  'Kantha Bopha Children\'s Hospital IV': 'មន្ទីរពេទ្យគន្ធបុប្ផាទី៤ ភ្នំពេញ',
  'Kantha Bopha Children\'s Hospital': 'មន្ទីរពេទ្យគន្ធបុប្ផា ភ្នំពេញ',
  'Sunrise Japan Hospital Phnom Penh': 'មន្ទីរពេទ្យជប៉ុន សាន់រ៉ាយស៍ ភ្នំពេញ',
  'Preah Ket Mealea Hospital': 'មន្ទីរពេទ្យព្រះកេតុមាលា (ពេទ្យទាហាន)',
  'Pasteur Institute of Cambodia': 'វិទ្យាស្ថានប៉ាស្ទ័រ កម្ពុជា',
  'Phnom Penh Animal Care & Veterinary Clinic': 'គ្លីនិកព្យាបាលសត្វភ្នំពេញ',
  'Roomchang Dental & Aesthetic Hospital': 'មន្ទីរព្យាបាលធ្មេញ និងកែសម្ផស្ស រំចង់',
  'International Polyclinic & Maternity Center': 'គ្លីនិកសម្ភព និងរោគស្ត្រី អន្តរជាតិ',
  'Angkor Eye Care Specialty Clinic': 'គ្លីនិកឯកទេសចក្ខុរោគ អង្គរ',
  'VET-Care Cambodia Animal Hospital': 'មន្ទីរពេទ្យសត្វ វ៉េតឃែរ កម្ពុជា',
  'Angkor Pet Hospital & Emergency Care': 'មន្ទីរពេទ្យសត្វអង្គរ និងសង្គ្រោះបន្ទាន់',
  'Lucky Dog & Cat Veterinary Clinic': 'គ្លីនិកព្យាបាលសត្វឆ្កែ និងឆ្មា ឡាក់គី',
  'Royal City General Hospital': 'មន្ទីរពេទ្យទូទៅ រ៉ូយ៉ាល់ ស៊ីធី',
  'Monivong Medical Specialty Clinic': 'គ្លីនិកឯកទេសវេជ្ជសាស្ត្រ មុនីវង្ស',
};

// Department Name Mappings
const DEPT_MAP_KM: Record<string, string> = {
  'Cardiology & Heart Center': 'ផ្នែកជំងឺបេះដូង (Cardiology)',
  'Cardiology': 'ផ្នែកជំងឺបេះដូង (Cardiology)',
  'Neurology & Stroke Center': 'ផ្នែកប្រព័ន្ធប្រសាទ និងដាច់សរសៃឈាមខួរក្បាល (Neurology)',
  'General & Laparoscopic Surgery': 'ផ្នែកវះកាត់ទូទៅ (Surgery)',
  'General Surgery': 'ផ្នែកវះកាត់ទូទៅ (Surgery)',
  'Pulmonology & Respiratory Care': 'ផ្នែកជំងឺសួត និងផ្លូវដង្ហើម (Pulmonology)',
  'Nephrology & Hemodialysis': 'ផ្នែកតម្រងនោម និងលាងឈាម (Nephrology)',
  'Pediatric Outpatient & Emergency': 'ផ្នែកពិគ្រោះ និងសង្គ្រោះបន្ទាន់កុមារ (Pediatrics)',
  'Pediatric': 'ផ្នែកកុមារ (Pediatrics)',
  'Pediatrics': 'ផ្នែកកុមារ (Pediatrics)',
  'Emergency & Neuro-Stroke Care': 'ផ្នែកសង្គ្រោះបន្ទាន់ និងដាច់សរសៃឈាមខួរក្បាល (Emergency)',
  'Endoscopy & Digestive Health': 'ផ្នែកឆ្លុះក្រពះពោះវៀន (Endoscopy)',
  'Orthopedics & Traumatology': 'ផ្នែកជំងឺឆ្អឹង និងរបួសបាក់បែក (Orthopedics)',
  'Orthopedics': 'ផ្នែកជំងឺឆ្អឹង (Orthopedics)',
  'Ophthalmology & Eye Clinic': 'ផ្នែកជំងឺភ្នែក (Ophthalmology)',
  'Eye Clinic': 'ផ្នែកជំងឺភ្នែក (Eye Clinic)',
  'Rabies Prevention & Animal Bites': 'ផ្នែកការពារជំងឺឆ្កែឆ្កួត និងព្យាបាលសត្វខាំ (Rabies)',
  'Animal Surgery & Urgent Care': 'ផ្នែកវះកាត់ និងសង្គ្រោះបន្ទាន់សត្វ (Animal Surgery)',
  'Pet Outpatient & Preventive Care': 'ផ្នែកពិគ្រោះជំងឺសត្វទូទៅ (Pet Outpatient)',
  'Implant & Oral Maxillofacial Surgery': 'ផ្នែកវះកាត់ដាក់ធ្មេញ និងឆ្អឹងថ្គាម (Implant Surgery)',
  'Orthodontics & Pediatric Dentistry': 'ផ្នែកតម្រង់ធ្មេញ និងទន្តសាស្ត្រកុមារ (Orthodontics)',
  'Obstetrics & Gynecology (OB-GYN)': 'ផ្នែកសម្ភព និងរោគស្ត្រី (OB-GYN)',
  'Comprehensive Ophthalmology & Cataract': 'ផ្នែកចក្ខុរោគទូទៅ និងបកភ្នែកឡើងបាយ (Ophthalmology)',
  'Veterinary Outpatient & Diagnostics': 'ផ្នែកពិនិត្យ និងរោគវិនិច្ឆ័យសត្វ (Veterinary Outpatient)',
  'Pet Orthopedic & Soft Tissue Surgery': 'ផ្នែកវះកាត់ឆ្អឹង និងសាច់សត្វ (Pet Surgery)',
  'Animal ICU & Emergency Triage': 'ផ្នែកសង្គ្រោះបន្ទាន់ និង ICU សត្វ (Animal ICU)',
  'Preventative Pet Care & Wellness': 'ផ្នែកថែទាំ និងសុខភាពសត្វ (Pet Wellness)',
  'General Medicine': 'ផ្នែកជំងឺទូទៅ (General Medicine)',
  'Emergency Trauma': 'ផ្នែកសង្គ្រោះបន្ទាន់ (Emergency Trauma)',
  'Dermatology': 'ផ្នែកសើស្បែក (Dermatology)',
};

// Doctor Name Mappings
const DOCTOR_MAP_KM: Record<string, string> = {
  'Sokha Meas, MD': 'វេជ្ជបណ្ឌិត សុខា មាស (MD)',
  'Dr. Sokha Meas, MD': 'វេជ្ជបណ្ឌិត សុខា មាស (MD)',
  'Dr. Sokha Meas': 'វេជ្ជបណ្ឌិត សុខា មាស (MD)',
  'Dr. Chan Moly, MD': 'វេជ្ជបណ្ឌិត ចាន់ ម៉ូលី (MD)',
  'Dr. Bopha Tep, MD': 'វេជ្ជបណ្ឌិត បុប្ផា ទេព (MD)',
  'Dr. Tith Hongsar, DDS': 'ទន្តបណ្ឌិត ទិត ហុងសារ (DDS)',
  'Dr. Vuthy Keo, DDS': 'ទន្តបណ្ឌិត វុទ្ធី កែវ (DDS)',
  'Dr. Chantrea Sam, MD': 'វេជ្ជបណ្ឌិត ចន្ទ្រា សំ (MD)',
  'Dr. Sovannarith Kong, MD': 'វេជ្ជបណ្ឌិត សុវណ្ណារិទ្ធ គង់ (MD)',
  'Dr. Kimheng Ouk, DVM': 'វេជ្ជបណ្ឌិតសត្វ គឹមហេង អ៊ុក (DVM)',
  'Dr. Julien Moreau, DVM': 'វេជ្ជបណ្ឌិតសត្វ Julien Moreau (DVM)',
  'Dr. Sereyroth Mao, DVM': 'វេជ្ជបណ្ឌិតសត្វ សិរីរ័ត្ន ម៉ៅ (DVM)',
  'Dr. Piseth Rin, DVM': 'វេជ្ជបណ្ឌិតសត្វ ពិសិដ្ឋ រិន (DVM)',
  'Dr. Vibol Som, MD': 'វេជ្ជបណ្ឌិត វិបុល សោម (MD)',
  'Dr. Socheata Keo, MD': 'វេជ្ជបណ្ឌិត សុជាតា កែវ (MD)',
  'Dr. Rithy Prak, MD': 'វេជ្ជបណ្ឌិត រិទ្ធី ប្រាក់ (MD)',
  'Dr. Vanna Seng, MD': 'វេជ្ជបណ្ឌិត វណ្ណា សេង (MD)',
  'Dr. Kiri Chea, MD': 'វេជ្ជបណ្ឌិត គិរី ជា (MD)',
  'Dr. Kenji Tanaka, MD': 'វេជ្ជបណ្ឌិត Kenji Tanaka (MD)',
  'Dr. Sopheak Yun, MD': 'វេជ្ជបណ្ឌិត សុភក្ត្រ យុន (MD)',
  'Dr. Chamroeun Ros, MD': 'វេជ្ជបណ្ឌិត ចំរើន រស់ (MD)',
  'Dr. Sophea Neth, MD': 'វេជ្ជបណ្ឌិត សុភា នេត្រ (MD)',
  'Dr. Narith Long, MD': 'វេជ្ជបណ្ឌិត ណារិទ្ធ ឡុង (MD)',
  'Dr. Samnang Pich, DVM': 'វេជ្ជបណ្ឌិតសត្វ សំណាង ពេជ្រ (DVM)',
  'Dr. Thida Roeun, DVM': 'វេជ្ជបណ្ឌិតសត្វ ធីតា រឿន (DVM)',
  'Dr. Sarah Chen, MD': 'វេជ្ជបណ្ឌិត Sarah Chen (MD)',
  'Dr. Robert Taylor, MD': 'វេជ្ជបណ្ឌិត Robert Taylor (MD)',
  'Dr. Emily Watson, MD': 'វេជ្ជបណ្ឌិត Emily Watson (MD)',
  'Dr. Michael Chang, MD': 'វេជ្ជបណ្ឌិត Michael Chang (MD)',
};

// Doctor Specialty Mappings
const SPECIALTY_MAP_KM: Record<string, string> = {
  'Senior Interventional Cardiologist': 'វេជ្ជបណ្ឌិតឯកទេសជាន់ខ្ពស់ ជំងឺបេះដូង (Interventional Cardiology)',
  'Cardiologist': 'វេជ្ជបណ្ឌិតឯកទេសជំងឺបេះដូង (Cardiology)',
  'Senior Cardiologist': 'វេជ្ជបណ្ឌិតឯកទេសជាន់ខ្ពស់ ជំងឺបេះដូង (Cardiology)',
  'Pediatrician': 'វេជ្ជបណ្ឌិតឯកទេសជំងឺកុមារ (Pediatrics)',
  'Senior Pediatric Surgeon': 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់កុមារ (Pediatric Surgery)',
  'Orthodontist': 'ទន្តបណ្ឌិតឯកទេសតម្រង់ធ្មេញ (Orthodontics)',
  'Maxillofacial & Dental Implant Surgeon': 'ទន្តបណ្ឌិតឯកទេសវះកាត់ដាក់ធ្មេញ និងឆ្អឹងថ្គាម (Dental Implants)',
  'Senior Obstetrician & Gynecologist': 'វេជ្ជបណ្ឌិតឯកទេសសម្ភព និងរោគស្ត្រី (OB-GYN)',
  'Consultant Ophthalmic Surgeon': 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់ភ្នែក (Ophthalmic Surgery)',
  'Small Animal Clinical Veterinarian': 'វេជ្ជបណ្ឌិតសត្វព្យាបាលជំងឺទូទៅ (Small Animal Vet)',
  'Senior Veterinary Surgeon': 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់សត្វ (Veterinary Surgeon)',
  'Emergency & Critical Care Veterinarian': 'វេជ្ជបណ្ឌិតឯកទេសសង្គ្រោះបន្ទាន់សត្វ (Emergency Vet)',
  'General Practice Veterinarian': 'វេជ្ជបណ្ឌិតសត្វព្យាបាលទូទៅ (General Vet)',
  'Neurosurgeon & Spine Specialist': 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់ប្រព័ន្ធប្រសាទ និងឆ្អឹងខ្នង (Neurosurgery)',
  'Consultant Pulmonologist': 'វេជ្ជបណ្ឌិតឯកទេសជំងឺសួត និងផ្លូវដង្ហើម (Pulmonology)',
  'Nephrologist & Dialysis Specialist': 'វេជ្ជបណ្ឌិតឯកទេសតម្រងនោម និងលាងឈាម (Nephrology)',
  'Emergency & Neuro-Interventionist': 'វេជ្ជបណ្ឌិតឯកទេសសង្គ្រោះបន្ទាន់ និងសរសៃឈាមខួរក្បាល (Stroke)',
  'Gastroenterologist & Hepatologist': 'វេជ្ជបណ្ឌិតឯកទេសក្រពះ ពោះវៀន និងថ្លើម (Gastroenterology)',
  'Senior Orthopedic Trauma Surgeon': 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់ឆ្អឹង និងរបួសបាក់បែក (Orthopedics)',
  'Ophthalmologist & Retinal Specialist': 'វេជ្ជបណ្ឌិតឯកទេសចក្ខុរោគ និងបាតភ្នែក (Ophthalmology)',
  'Infectious Disease & Rabies Specialist': 'វេជ្ជបណ្ឌិតឯកទេសជំងឺឆ្លង និងជំងឺឆ្កែឆ្កួត (Infectious Diseases)',
  'Veterinary Soft-Tissue Surgeon': 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់សត្វ (Veterinary Surgery)',
  'General Practitioner': 'វេជ្ជបណ្ឌិតទូទៅ (General Practitioner)',
  'Emergency Physician': 'វេជ្ជបណ្ឌិតឯកទេសសង្គ្រោះបន្ទាន់ (Emergency Medicine)',
};

/**
 * Formats a facility name according to active language
 */
export const formatFacilityName = (rawName: string, lang: Language): string => {
  if (!rawName) return '';

  // 1. If format has bracketed Khmer: "English Name (Khmer Name)"
  const match = rawName.match(/^(.*?)\s*\(([\u1780-\u17FF\s/–-]+)\)$/);
  if (match) {
    const enPart = match[1].trim();
    const khPart = match[2].trim();
    if (lang === 'en') {
      return enPart; // 100% English only
    } else {
      return khPart; // Pure Khmer name!
    }
  }

  // 2. If already pure English, check dictionary for Khmer translation
  if (lang === 'km') {
    if (FACILITY_MAP_KM[rawName]) {
      return FACILITY_MAP_KM[rawName];
    }
    // Partial substring match
    for (const [enKey, kmVal] of Object.entries(FACILITY_MAP_KM)) {
      if (rawName.toLowerCase().includes(enKey.toLowerCase())) {
        return kmVal;
      }
    }
  }

  return rawName;
};

/**
 * Formats a department name according to active language
 */
export const formatDepartmentName = (deptName: string, lang: Language): string => {
  if (!deptName) return '';
  if (lang === 'en') return deptName;

  if (DEPT_MAP_KM[deptName]) {
    return DEPT_MAP_KM[deptName];
  }

  for (const [enKey, kmVal] of Object.entries(DEPT_MAP_KM)) {
    if (deptName.toLowerCase().includes(enKey.toLowerCase())) {
      return kmVal;
    }
  }

  return deptName;
};

/**
 * Formats a doctor's full name according to active language
 */
export const formatDoctorName = (docName: string, lang: Language): string => {
  if (!docName) return '';
  if (lang === 'en') {
    // If name begins with Khmer or has brackets, strip them
    return docName.replace(/\s*\([\u1780-\u17FF\s/–-]+\)/g, '').trim();
  }

  if (DOCTOR_MAP_KM[docName]) {
    return DOCTOR_MAP_KM[docName];
  }

  for (const [enKey, kmVal] of Object.entries(DOCTOR_MAP_KM)) {
    if (docName.toLowerCase().includes(enKey.toLowerCase())) {
      return kmVal;
    }
  }

  // If starts with "Dr. "
  if (docName.startsWith('Dr. ')) {
    return `វេជ្ជបណ្ឌិត ${docName.replace('Dr. ', '')}`;
  }

  return `វេជ្ជបណ្ឌិត ${docName}`;
};

/**
 * Formats a doctor's medical specialty according to active language
 */
export const formatSpecialty = (specialty: string, lang: Language): string => {
  if (!specialty) return '';
  if (lang === 'en') return specialty;

  if (SPECIALTY_MAP_KM[specialty]) {
    return SPECIALTY_MAP_KM[specialty];
  }

  for (const [enKey, kmVal] of Object.entries(SPECIALTY_MAP_KM)) {
    if (specialty.toLowerCase().includes(enKey.toLowerCase())) {
      return kmVal;
    }
  }

  return specialty;
};

/**
 * Formats facility category label
 */
export const formatCategory = (category: string, lang: Language): string => {
  if (!category) return '';
  if (lang === 'en') {
    if (category === 'Hospital' || category === 'General Hospital') return 'Hospital';
    return category;
  }

  if (category === 'Hospital' || category === 'General Hospital') return 'មន្ទីរពេទ្យ';
  if (category === 'Medical Clinic') return 'គ្លីនិកឯកទេស';
  if (category === 'Animal Clinic') return 'គ្លីនិកព្យាបាលសត្វ';
  return category;
};
