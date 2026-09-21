"""
Web Search Service for Authoritative Healthcare Information.

Enables searching official health sources strictly focused on:
1. World Health Organization (WHO): https://www.who.int and https://www.who.int/cambodia
2. Cambodia Ministry of Health (MoH): http://moh.gov.kh
3. Communicable Disease Control Department (CDC MoH Cambodia): http://cdcmoh.gov.kh
4. National Institute of Public Health (NIPH): http://niph.org.kh
5. National Centers & Hospitals (Calmette, CNM, CENAT, NIP): http://calmette.gov.kh

Provides structured citations (title, url, source authority name, snippet)
so patients and users can directly verify official government and WHO guidance.
"""

from typing import List, Dict, Any, Optional
import logging
import re
import urllib.parse
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# List of authorized official healthcare domains
ALLOWED_OFFICIAL_DOMAINS = [
    "who.int",
    "moh.gov.kh",
    "cdcmoh.gov.kh",
    "niph.org.kh",
    "calmette.gov.kh",
]

# Authoritative Curated Knowledge & Guidelines from WHO and MoH Cambodia
OFFICIAL_HEALTH_REPOSITORIES: List[Dict[str, Any]] = [
    {
        "id": "dengue",
        "keywords": ["dengue", "mosquito", "aedes", "គ្រុនឈាម", "មូសខ្លា", "គ្រុនក្តៅ", "ឈាមរាវ"],
        "title_en": "WHO Fact Sheet: Dengue and Severe Dengue",
        "title_km": "សេចក្តីណែនាំស្តីពីការបង្ការជំងឺគ្រុនឈាម — ក្រសួងសុខាភិបាលកម្ពុជា",
        "url_en": "https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue",
        "url_km": "http://cdcmoh.gov.kh/diseases/dengue",
        "source_name_en": "World Health Organization (WHO)",
        "source_name_km": "ក្រសួងសុខាភិបាលកម្ពុជា (MoH Cambodia)",
        "domain": "who.int",
        "domain_km": "cdcmoh.gov.kh",
        "snippet_en": (
            "Dengue is a viral infection transmitted to humans through the bite of infected Aedes mosquitoes. "
            "Symptoms include high fever, severe headache, pain behind the eyes, muscle and joint pains, and rash. "
            "Warning signs of severe dengue require urgent medical hospitalization: severe abdominal pain, persistent vomiting, "
            "rapid breathing, bleeding gums, fatigue, and restlessness. Avoid aspirin/ibuprofen (use paracetamol only)."
        ),
        "snippet_km": (
            "ជំងឺគ្រុនឈាមបង្កឡើងដោយវីរុសដែលចម្លងតាមរយៈមូសខ្លាញីខាំ។ រោគសញ្ញាសំខាន់ៗរួមមាន៖ ក្តៅខ្លួនខ្លាំងភ្លាមៗលើសពី ៣៨.៥°C "
            "ឈឺក្បាលខ្លាំង ឈឺសន្លាក់ និងសាច់ដុំ ឈឺគ្រាប់ភ្នែក និងមានស្នាមកន្ទួលក្រហមលើស្បែក។ សញ្ញាគ្រោះថ្នាក់ដែលត្រូវបញ្ជូនទៅមន្ទីរពេទ្យជាបន្ទាន់៖ "
            "ឈឺពោះខ្លាំង ក្អួតជាប់មិនបាត់ ហូរឈាមតាមអញ្ចាញធ្មេញ អស់កម្លាំងខ្លាំង និងពិបាកដកដង្ហើម។ ហាមប្រើប្រាស់ថ្នាំ Aspirin ឬ Ibuprofen ដាច់ខាត "
            "(ប្រើបានតែថ្នាំប៉ារ៉ាសេតាមុលក្នុងកម្រិតត្រឹមត្រូវ)។"
        ),
    },
    {
        "id": "rabies",
        "keywords": ["rabies", "dog bite", "cat bite", "animal bite", "ឆ្កែឆ្កួត", "ឆ្កែខាំ", "ឆ្មាខាំ", "ខាំ", "វ៉ាក់សាំងឆ្កែឆ្កួត"],
        "title_en": "WHO Fact Sheet: Rabies Post-Exposure Prophylaxis & Guidance",
        "title_km": "ការណែនាំស្តីពីការការពារជំងឺឆ្កែឆ្កួត និងការចាក់ថ្នាំបង្ការក្រោយសត្វខាំ — នាយកដ្ឋានប្រយុទ្ធនឹងជំងឺឆ្លង (CDC)",
        "url_en": "https://www.who.int/news-room/fact-sheets/detail/rabies",
        "url_km": "http://cdcmoh.gov.kh/diseases/rabies",
        "source_name_en": "World Health Organization (WHO)",
        "source_name_km": "នាយកដ្ឋានប្រយុទ្ធនឹងជំងឺឆ្លង ក្រសួងសុខាភិបាល (CDC MoH)",
        "domain": "who.int",
        "domain_km": "cdcmoh.gov.kh",
        "snippet_en": (
            "Rabies is a 100% vaccine-preventable viral disease. Immediate first-aid after dog or cat bite: "
            "vigorously wash and flush wound with soap and running water for at least 15 minutes. "
            "Seek immediate medical evaluation for Rabies Post-Exposure Prophylaxis (PEP) vaccination at Institut Pasteur du Cambodge "
            "or accredited provincial health center before symptoms appear. Once clinical symptoms appear, rabies is virtually 100% fatal."
        ),
        "snippet_km": (
            "ជំងឺឆ្កែឆ្កួតបណ្តាលមកពីវីរុសរ៉ាប៊ីស តាមរយៈការខាំ ឬខ្វាចពីសត្វដែលមានផ្ទុកមេរោគ (ជាពិសេសសត្វឆ្កែ និងឆ្មា)។ "
            "វិធានការសង្គ្រោះបឋមបន្ទាន់៖ លាងសម្អាតមុខរបួសភ្លាមៗជាមួយទឹកស្អាត និងសាប៊ូឱ្យបានហ្មត់ចត់យ៉ាងតិច ១៥ នាទី "
            "រួចលាងជាមួយទឹកថ្នាំសម្លាប់មេរោគ (អាល់កុល ឬបេតាឌីន)។ បន្ទាប់មកត្រូវប្រញាប់ទៅមន្ទីរពេទ្យ ឬវិទ្យាស្ថានប៉ាស្ទ័រកម្ពុជា ដើម្បីចាក់វ៉ាក់សាំងការពារជំងឺឆ្កែឆ្កួត (PEP) "
            "ជាបន្ទាន់។ ហាមរង់ចាំឱ្យចេញរោគសញ្ញា ពីព្រោះនៅពេលចេញរោគសញ្ញា អត្រាស្លាប់គឺ ១០០%។"
        ),
    },
    {
        "id": "h5n1_avian_flu",
        "keywords": ["avian flu", "bird flu", "h5n1", "influenza", "ផ្តាសាយបក្សី", "បក្សីឈឺ", "មាន់ទាឈឺ"],
        "title_en": "WHO / Cambodia MoH: Avian Influenza A (H5N1) Public Health Advisory",
        "title_km": "សេចក្តីប្រកាសព័ត៌មានស្តីពីជំងឺផ្តាសាយបក្សី H5N1 — ក្រសួងសុខាភិបាល",
        "url_en": "https://www.who.int/emergencies/disease-outbreak-news/item/2024-DON501",
        "url_km": "http://cdcmoh.gov.kh/diseases/avian-influenza",
        "source_name_en": "World Health Organization (WHO)",
        "source_name_km": "ក្រសួងសុខាភិបាលកម្ពុជា (MoH Cambodia)",
        "domain": "who.int",
        "domain_km": "cdcmoh.gov.kh",
        "snippet_en": (
            "Avian influenza A (H5N1) is a severe respiratory disease caused by influenza viruses transmitted from sick or dead poultry. "
            "Symptoms include high fever (>38.5°C), cough, sore throat, and shortness of breath progressing rapidly to severe pneumonia. "
            "Public advice: Avoid contact with sick or dead birds. Cook poultry and eggs thoroughly. Wash hands frequently with soap. "
            "Call MoH hotline 115 immediately if experiencing fever after handling sick poultry."
        ),
        "snippet_km": (
            "ជំងឺផ្តាសាយបក្សី H5N1 ឆ្លងមកមនុស្សតាមរយៈការប៉ះពាល់ផ្ទាល់ជាមួយបក្សី (មាន់ ទា) ឈឺ ឬងាប់។ "
            "រោគសញ្ញារួមមាន៖ ក្តៅខ្លួនលើសពី ៣៨.៥°C ក្អក ឈឺបំពង់ក ហៀរសំបោរ និងពិបាកដកដង្ហើម ដែលអាចវិវត្តទៅជារលាកសួតធ្ងន់ធ្ងរយ៉ាងឆាប់រហ័ស។ "
            "វិធានការការពារ៖ ហាមប៉ះពាល់ ឬបរិភោគសត្វបក្សីដែលឈឺឬងាប់ ចម្អិនសាច់មាន់ទានិងស៊ុតឱ្យឆ្អិនល្អ និងលាងដៃជាមួយសាប៊ូជាប្រចាំ។ "
            "ប្រសិនបើមានរោគសញ្ញាសង្ស័យក្រោយប៉ះពាល់បក្សី សូមទាក់ទងមកលេខទូរស័ព្ទទាន់ហេតុការណ៍ ១១៥ របស់ក្រសួងសុខាភិបាលភ្លាមៗ។"
        ),
    },
    {
        "id": "malaria",
        "keywords": ["malaria", "anopheles", "plasmodium", "fever", "chills", "គ្រុនចាញ់", "មូសដែកគោល", "ញាក់", "គ្រុនញាក់"],
        "title_en": "WHO Fact Sheet: Malaria Prevention & Elimination in the Greater Mekong Subregion",
        "title_km": "យុទ្ធសាស្ត្រលុបបំបាត់ជំងឺគ្រុនចាញ់ — មជ្ឈមណ្ឌលជាតិប្រយុទ្ធនឹងជំងឺគ្រុនចាញ់ (CNM)",
        "url_en": "https://www.who.int/news-room/fact-sheets/detail/malaria",
        "url_km": "http://www.cnm.gov.kh/",
        "source_name_en": "World Health Organization (WHO)",
        "source_name_km": "មជ្ឈមណ្ឌលជាតិប្រយុទ្ធនឹងជំងឺគ្រុនចាញ់ (CNM / MoH)",
        "domain": "who.int",
        "domain_km": "cnm.gov.kh",
        "snippet_en": (
            "Malaria is a life-threatening disease caused by Plasmodium parasites transmitted through bites of infected female Anopheles mosquitoes. "
            "Symptoms include fever, chills, headache, sweats, fatigue, nausea, and vomiting. In Cambodia, malaria testing and artemisinin-based "
            "combination therapy (ACT) are provided free of charge at public health centers and community village malaria workers (VMWs)."
        ),
        "snippet_km": (
            "ជំងឺគ្រុនចាញ់បង្កឡើងដោយប៉ារ៉ាស៊ីតផ្លាស្មូដ្យូម ដែលចម្លងដោយមូសដែកគោលញីខាំ (ជាពិសេសនៅតំបន់ព្រៃភ្នំ)។ "
            "រោគសញ្ញាសំខាន់ៗ៖ គ្រុនក្តៅខ្លាំង ញាក់រងារ ឈឺក្បាល បែកញើស និងអស់កម្លាំងខ្លាំង។ "
            "នៅកម្ពុជា ការពិនិត្យឈាមរកមេរោគគ្រុនចាញ់ និងការផ្តល់ថ្នាំព្យាបាលពេញលេញ គឺឥតគិតថ្លៃនៅគ្រប់មណ្ឌលសុខភាពសាធារណៈ "
            "និងតាមរយៈអ្នកស្ម័គ្រចិត្តភូមិព្យាបាលជំងឺគ្រុនចាញ់ (VMW)។"
        ),
    },
    {
        "id": "immunization_child",
        "keywords": ["vaccine", "vaccination", "immunization", "bcg", "measles", "polio", "ចាក់ថ្នាំ", "ថ្នាំបង្ការ", "កូនក្មេង", "កុមារ", "កញ្ជ្រិល"],
        "title_en": "WHO Cambodia: National Routine Immunization Schedule & Child Health Guidelines",
        "title_km": "កាលវិភាគនៃការចាក់ថ្នាំបង្ការជាតិសម្រាប់កុមារ — កម្មវិធីជាតិផ្តល់ថ្នាំបង្ការ ក្រសួងសុខាភិបាល (NIP)",
        "url_en": "https://www.who.int/cambodia/health-topics/immunization",
        "url_km": "http://moh.gov.kh/national-immunization-program",
        "source_name_en": "WHO Cambodia Office",
        "source_name_km": "កម្មវិធីជាតិផ្តល់ថ្នាំបង្ការ ក្រសួងសុខាភិបាល (NIP / MoH)",
        "domain": "who.int",
        "domain_km": "moh.gov.kh",
        "snippet_en": (
            "The National Immunization Program (NIP) in Cambodia provides free essential vaccines for all infants and children: "
            "BCG & HepB at birth; Pentavalent (DTP-HepB-Hib), Polio (OPV/IPV), and PCV (Pneumococcal) at 1.5, 2.5, and 3.5 months; "
            "Measles-Rubella (MR) and Japanese Encephalitis (JE) at 9 months; MR booster at 18 months. Accessible at all public health centers."
        ),
        "snippet_km": (
            "កម្មវិធីជាតិផ្តល់ថ្នាំបង្ការនៃក្រសួងសុខាភិបាល ផ្តល់ការចាក់ថ្នាំបង្ការការពារជំងឺ ១១ មុខដោយឥតគិតថ្លៃដល់ទារក និងកុមារគ្រប់រូប៖ "
            "ពេលកើតភ្លាម៖ ចាក់ថ្នាំ BCG (ការពាររបេង) និងរលាកថ្លើមប្រភេទបេ (HepB0)។ "
            "អាយុ ១ខែកន្លះ, ២ខែកន្លះ, ៣ខែកន្លះ៖ ថ្នាំការពារ ៥ មុខ (ខាន់ស្លាក់ ក្អកមាន់ តេតាណូស រលាកថ្លើមបេ រលាកស្រោមខួរ Hib), ប៉ូឡូយ៉ូ (OPV/IPV) និង PCV។ "
            "អាយុ ៩ ខែ៖ ថ្នាំការពារកញ្ជ្រិល-ស្អូច (MR1) និងរលាកខួរក្បាលជប៉ុន (JE)។ អាយុ ១៨ ខែ៖ ចាក់រំលឹកកញ្ជ្រិល-ស្អូច (MR2) នៅគ្រប់មណ្ឌលសុខភាពទូទាំងប្រទេស។"
        ),
    },
    {
        "id": "hfmd",
        "keywords": ["hfmd", "hand foot mouth", "enterovirus", "blister", "ពងបែក", "ពងបែកដៃជើង", "មាត់", "កន្ទួល"],
        "title_en": "WHO Western Pacific: Hand, Foot and Mouth Disease (HFMD) Clinical Management",
        "title_km": "សេចក្តីណែនាំស្តីពីជំងឺពងបែកដៃ ជើង និងក្នុងមាត់ — នាយកដ្ឋានប្រយុទ្ធនឹងជំងឺឆ្លង",
        "url_en": "https://www.who.int/westernpacific/health-topics/hand-foot-and-mouth-disease",
        "url_km": "http://cdcmoh.gov.kh/diseases/hfmd",
        "source_name_en": "World Health Organization (WHO WPRO)",
        "source_name_km": "នាយកដ្ឋានប្រយុទ្ធនឹងជំងឺឆ្លង (CDC MoH Cambodia)",
        "domain": "who.int",
        "domain_km": "cdcmoh.gov.kh",
        "snippet_en": (
            "Hand, foot and mouth disease (HFMD) is a common infectious disease affecting infants and children caused by enteroviruses. "
            "Characterized by fever, painful sores in the mouth, and a rash with blisters on hands, feet and buttocks. "
            "Warning signs of complication (EV71 neurological involvement): high fever lasting >48 hours, lethargy, limb weakness, "
            "jerking movements (myoclonus), rapid breathing. Maintain strict hand hygiene and isolate sick children."
        ),
        "snippet_km": (
            "ជំងឺពងបែកដៃ ជើង និងក្នុងមាត់ (HFMD) កើតឡើងញឹកញាប់លើទារក និងកុមារតូចៗ បង្កឡើងដោយវីរុស Enterovirus។ "
            "រោគសញ្ញាសំខាន់ៗ៖ ក្តៅខ្លួន មានដំបៅឈឺចាប់ក្នុងមាត់ អណ្តាត និងមានពងបែកក្រហមលើបាតដៃ បាតជើង និងគូទ។ "
            "សញ្ញាគ្រោះថ្នាក់ដែលត្រូវបញ្ជូនទៅមន្ទីរពេទ្យកុមារជាបន្ទាន់៖ ក្តៅខ្លួនលើស ៤៨ ម៉ោង ងងុយដេកខ្លាំង ឬវង្វេង ញាក់កន្ត្រាក់ដៃជើង ដកដង្ហើមញាប់ ឬដង្ហក់។ "
            "វិធានការ៖ លាងដៃជាមួយសាប៊ូឱ្យបានញឹកញាប់ និងញែកកុមារឈឺកុំឱ្យទៅសាលារៀនរហូតដល់ជាសះស្បើយ។"
        ),
    },
    {
        "id": "tuberculosis",
        "keywords": ["tb", "tuberculosis", "cough", "blood cough", "របេង", "ក្អកធ្លាក់ឈាម", "ក្អករ៉ាំរ៉ៃ", "ស្គម"],
        "title_en": "WHO Fact Sheet: Tuberculosis Diagnosis and Treatment Protocols",
        "title_km": "គោលការណ៍ណែនាំស្តីពីការធ្វើរោគវិនិច្ឆ័យ និងព្យាបាលជំងឺរបេង — មជ្ឈមណ្ឌលជាតិកំចាត់រោគរបេង (CENAT)",
        "url_en": "https://www.who.int/news-room/fact-sheets/detail/tuberculosis",
        "url_km": "http://cenat.gov.kh/",
        "source_name_en": "World Health Organization (WHO)",
        "source_name_km": "មជ្ឈមណ្ឌលជាតិកំចាត់រោគរបេង (CENAT / MoH)",
        "domain": "who.int",
        "domain_km": "cenat.gov.kh",
        "snippet_en": (
            "Tuberculosis (TB) is caused by Mycobacterium tuberculosis bacteria that most often affect the lungs. "
            "Symptoms include persistent cough lasting 2+ weeks, chest pain, coughing up blood, fatigue, night sweats, and weight loss. "
            "TB is curable and preventable with a standard 6-month course of 4 antimicrobial drugs. In Cambodia, diagnosis with GeneXpert "
            "and DOTS treatment are provided free of charge at all public health facilities."
        ),
        "snippet_km": (
            "ជំងឺរបេងបង្កឡើងដោយបាក់តេរី Mycobacterium tuberculosis ដែលភាគច្រើនប៉ះពាល់ដល់សួត។ "
            "រោគសញ្ញាសង្ស័យ៖ ក្អកជាប់គ្នាយូរជាង ២ សប្តាហ៍ ក្អកធ្លាក់ឈាម ឈឺទ្រូង ក្តៅខ្លួនស្ទាវៗពេលរសៀល បែកញើសពេលយប់ និងស្រកទម្ងន់ខុសធម្មតា។ "
            "ជំងឺរបេងអាចព្យាបាលជាសះស្បើយ ១០០% ដោយប្រើថ្នាំត្រឹមត្រូវរយៈពេល ៦ ខែ។ "
            "នៅកម្ពុជា ការពិនិត្យស្លេស្មដោយម៉ាស៊ីន GeneXpert និងការផ្តល់ថ្នាំព្យាបាលជំងឺរបេង គឺឥតគិតថ្លៃនៅគ្រប់មណ្ឌលសុខភាព និងមន្ទីរពេទ្យរដ្ឋ។"
        ),
    },
    {
        "id": "hypertension_diabetes",
        "keywords": ["hypertension", "blood pressure", "diabetes", "sugar", "លើសឈាម", "សម្ពាធឈាម", "ទឹកនោមផ្អែម", "ជាតិស្ករ"],
        "title_en": "WHO Fact Sheet: Hypertension Prevention & Noncommunicable Disease Management",
        "title_km": "សេចក្តីណែនាំស្តីពីការគ្រប់គ្រងជំងឺលើសសម្ពាធឈាម និងទឹកនោមផ្អែម — នាយកដ្ឋានការពារសុខភាព ក្រសួងសុខាភិបាល",
        "url_en": "https://www.who.int/news-room/fact-sheets/detail/hypertension",
        "url_km": "http://moh.gov.kh/ncd-guidelines",
        "source_name_en": "World Health Organization (WHO)",
        "source_name_km": "ក្រសួងសុខាភិបាលកម្ពុជា (MoH Cambodia)",
        "domain": "who.int",
        "domain_km": "moh.gov.kh",
        "snippet_en": (
            "Hypertension (high blood pressure) is when the pressure in blood vessels is 140/90 mmHg or higher. It is a major cause of premature death worldwide. "
            "Most people with hypertension have no symptoms ('silent killer'). Prevention & control: reduce salt intake (<5g daily), eat more fruits and vegetables, "
            "maintain physical activity, avoid tobacco and excessive alcohol, and take prescribed antihypertensive medication regularly."
        ),
        "snippet_km": (
            "ជំងឺលើសសម្ពាធឈាមត្រូវបានកំណត់នៅពេលកម្រិតសម្ពាធឈាមលើសពី ១៤០/៩០ mmHg។ វាជាឃាតករលាក់មុខព្រោះភាគច្រើនមិនមានរោគសញ្ញាអ្វីគួរឱ្យកត់សម្គាល់ឡើយ។ "
            "ផលវិបាកធ្ងន់ធ្ងររួមមាន៖ ជំងឺដាច់សរសៃឈាមខួរក្បាល (ស្លាប់មួយចំហៀងខ្លួន) ជំងឺគាំងបេះដូង និងខូចតម្រងនោម។ "
            "ការការពារ និងថែទាំ៖ កាត់បន្ថយការបរិភោគប្រៃ (អំបិលតិចជាង ៥ ក្រាមក្នុងមួយថ្ងៃ) បរិភោគបន្លែផ្លែឈើ ហាត់ប្រាណជាប្រចាំ ជៀសវាងបារី និងគ្រឿងស្រវឹង "
            "និងលេបថ្នាំទៀងទាត់តាមវេជ្ជបញ្ជាគ្រូពេទ្យ។"
        ),
    },
    {
        "id": "moh_hotline_115",
        "keywords": ["hotline", "emergency number", "contact", "115", "១១៥", "119", "១១៩", "លេខទូរស័ព្ទ", "ទាន់ហេតុការណ៍", "ក្រសួងសុខាភិបាល"],
        "title_en": "Cambodia MoH National Health Emergency Hotlines (115 & SAMU 119)",
        "title_km": "លេខទូរស័ព្ទទាន់ហេតុការណ៍សុខាភិបាលជាតិ (115 / ១១៥ និងសង្គ្រោះបន្ទាន់ 119 / ១១៩) — ក្រសួងសុខាភិបាល",
        "url_en": "http://cdcmoh.gov.kh",
        "url_km": "http://cdcmoh.gov.kh",
        "source_name_en": "Cambodia Ministry of Health (MoH)",
        "source_name_km": "ក្រសួងសុខាភិបាលកម្ពុជា (MoH Cambodia)",
        "domain": "cdcmoh.gov.kh",
        "domain_km": "cdcmoh.gov.kh",
        "snippet_en": (
            "Official emergency telephone hotlines in Cambodia: "
            "Call 115 (Toll-Free) for Cambodia Ministry of Health Communicable Disease reporting and outbreak alerts. "
            "Call 119 for SAMU National Emergency Medical Ambulance Service (24/7). "
            "For urgent hospital admission in Phnom Penh: Calmette Hospital (+855 23 426 948) or Khmer-Soviet Friendship Hospital (+855 23 217 764)."
        ),
        "snippet_km": (
            "លេខទូរស័ព្ទទាន់ហេតុការណ៍ផ្លូវការរបស់ក្រសួងសុខាភិបាលកម្ពុជា៖ "
            "ទូរស័ព្ទឥតគិតថ្លៃលេខ 115 (១១៥) សម្រាប់រាយការណ៍អំពីជំងឺឆ្លងរាតត្បាត និងព័ត៌មានសុខភាពបន្ទាន់។ "
            "ទូរស័ព្ទលេខ 119 (១១៩) សម្រាប់សេវាឡានពេទ្យសង្គ្រោះបន្ទាន់ជាតិ SAMU (២៤/៧)។ "
            "សម្រាប់ការសង្គ្រោះបន្ទាន់នៅរាជធានីភ្នំពេញ៖ មន្ទីរពេទ្យកាល់ម៉ែត (+855 23 426 948) ឬមន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត (+855 23 217 764)។"
        ),
    },
]


class WebSearchService:
    """Service to search official Cambodia government and WHO health sources."""

    @classmethod
    async def search_official_sources(
        cls,
        query: str,
        language: str = "en",
        max_results: int = 3,
    ) -> List[Dict[str, Any]]:
        """Search authoritative WHO and Cambodia government health sources.
        
        Returns a list of structured citation items:
        [
            {
                "title": "...",
                "url": "https://www.who.int/...",
                "snippet": "...",
                "source_name": "World Health Organization (WHO)",
                "domain": "who.int"
            }
        ]
        """
        q_clean = (query or "").strip().lower()
        if not q_clean:
            return []

        # 1. Try external API if configured (e.g. Tavily API)
        if settings.TAVILY_API_KEY:
            try:
                external_results = await cls._search_via_tavily(query, max_results)
                if external_results:
                    return external_results
            except Exception as e:
                logger.warning(f"External search via Tavily failed, falling back to official knowledge index: {e}")

        # 2. Match against official Cambodia MoH & WHO indexed repositories
        matches: List[Dict[str, Any]] = []
        is_km = language == "km" or bool(re.search(r"[\u1780-\u17FF]", query))

        for item in OFFICIAL_HEALTH_REPOSITORIES:
            # Score match based on keywords
            matched_keywords = [
                kw for kw in item["keywords"] if kw.lower() in q_clean
            ]
            if matched_keywords:
                score = len(matched_keywords)
                title = item["title_km"] if is_km else item["title_en"]
                url = item["url_km"] if is_km else item["url_en"]
                source_name = item["source_name_km"] if is_km else item["source_name_en"]
                domain = item["domain_km"] if is_km else item["domain"]
                snippet = item["snippet_km"] if is_km else item["snippet_en"]

                matches.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "source_name": source_name,
                    "domain": domain,
                    "_score": score,
                })

        # Sort by relevance match count
        matches.sort(key=lambda x: x.get("_score", 0), reverse=True)

        # If no specific disease keyword was matched, provide WHO Cambodia / MoH general repository
        if not matches:
            if is_km:
                matches.append({
                    "title": "ព័ត៌មានសុខភាព និងជំងឺឆ្លង — នាយកដ្ឋានប្រយុទ្ធនឹងជំងឺឆ្លង ក្រសួងសុខាភិបាល",
                    "url": "http://cdcmoh.gov.kh",
                    "snippet": "គេហទំព័រផ្លូវការរបស់នាយកដ្ឋានប្រយុទ្ធនឹងជំងឺឆ្លង នៃក្រសួងសុខាភិបាលកម្ពុជា ផ្តល់ព័ត៌មាន និងសេចក្តីណែនាំស្តីពីការការពារជំងឺឆ្លង សុខភាពសាធារណៈ និងលេខទូរស័ព្ទទាន់ហេតុការណ៍ ១១៥។",
                    "source_name": "ក្រសួងសុខាភិបាលកម្ពុជា (MoH Cambodia)",
                    "domain": "cdcmoh.gov.kh",
                })
                matches.append({
                    "title": "ការិយាល័យអង្គការសុខភាពពិភពលោកប្រចាំកម្ពុជា (WHO Cambodia)",
                    "url": "https://www.who.int/cambodia",
                    "snippet": "ការណែនាំ និងព័ត៌មានសុខភាពផ្លូវការពីអង្គការសុខភាពពិភពលោក (WHO) ស្តីពីស្ថានភាពសុខភាពសាធារណៈ ការបង្ការជំងឺ និងគោលការណ៍ណែនាំវេជ្ជសាស្ត្រនៅកម្ពុជា។",
                    "source_name": "អង្គការសុខភាពពិភពលោក (WHO)",
                    "domain": "who.int",
                })
            else:
                matches.append({
                    "title": "WHO Fact Sheets & Health Topics",
                    "url": "https://www.who.int/health-topics",
                    "snippet": "Authoritative global health advice, disease fact sheets, and clinical guidelines from the World Health Organization (WHO).",
                    "source_name": "World Health Organization (WHO)",
                    "domain": "who.int",
                })
                matches.append({
                    "title": "Cambodia Communicable Disease Control Department (CDC MoH)",
                    "url": "http://cdcmoh.gov.kh",
                    "snippet": "Official health alerts, disease outbreak surveillance, and public health guidelines from the Ministry of Health of Cambodia.",
                    "source_name": "Ministry of Health Cambodia (MoH)",
                    "domain": "cdcmoh.gov.kh",
                })

        # Remove temporary internal score
        clean_results = []
        for m in matches[:max_results]:
            res = {k: v for k, v in m.items() if not k.startswith("_")}
            clean_results.append(res)

        return clean_results

    @classmethod
    async def _search_via_tavily(cls, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Query Tavily Search API constrained to official WHO and Cambodia MoH domains."""
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": f"{query} site:who.int OR site:moh.gov.kh OR site:cdcmoh.gov.kh",
            "search_depth": "advanced",
            "include_domains": ALLOWED_OFFICIAL_DOMAINS,
            "max_results": max_results,
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_results = data.get("results", [])
                formatted = []
                for r in raw_results:
                    link = r.get("url", "")
                    parsed_domain = urllib.parse.urlparse(link).netloc.lower()
                    
                    # Ensure domain is in official allowed domains
                    if not any(d in parsed_domain for d in ALLOWED_OFFICIAL_DOMAINS):
                        continue

                    source_name = "World Health Organization (WHO)" if "who.int" in parsed_domain else "ក្រសួងសុខាភិបាល (MoH Cambodia)"
                    formatted.append({
                        "title": r.get("title", "Official Health Guidance"),
                        "url": link,
                        "snippet": r.get("content", ""),
                        "source_name": source_name,
                        "domain": parsed_domain,
                    })
                return formatted
        return []
