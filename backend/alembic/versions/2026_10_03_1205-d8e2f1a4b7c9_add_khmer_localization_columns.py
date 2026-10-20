"""add khmer localization columns to hospitals, branches, departments, services, doctors

Revision ID: d8e2f1a4b7c9
Revises: c9a1d2e3f4b5
Create Date: 2026-10-03 12:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e2f1a4b7c9'
down_revision: Union[str, None] = 'c9a1d2e3f4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HOSPITAL_TRANSLATIONS = {
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
    'Preah Ang Duong Hospital': 'មន្ទីរពេទ្យព្រះអង្គឌួង',
    'Ang Duong Hospital': 'មន្ទីរពេទ្យព្រះអង្គឌួង',
    'Cambodia-China Friendship Preah Kossamak Hospital': 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ព្រះកុសុមៈ',
    'Preah Kossamak Hospital': 'មន្ទីរពេទ្យព្រះកុសុមៈ',
    'Cho Ray Phnom Penh Hospital': 'មន្ទីរពេទ្យចោរ៉ៃភ្នំពេញ',
    'Royal Phnom Penh Hospital': 'មន្ទីរពេទ្យរ៉ូយ៉ាល់ភ្នំពេញ',
    'Sensok International University Hospital': 'មន្ទីរពេទ្យសាកលវិទ្យាល័យអន្តរជាតិសែនសុខ',
    'Central Hospital': 'មន្ទីរពេទ្យកណ្តាល',
    'Phnom Penh Municipal Referral Hospital': 'មន្ទីរពេទ្យបង្អែករាជធានីភ្នំពេញ',
    'Siem Reap Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តសៀមរាប',
    'Angkor Hospital for Children': 'មន្ទីរពេទ្យកុមារអង្គរ (សៀមរាប)',
    'Battambang Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តបាត់ដំបង',
    'Kampong Cham Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តកំពង់ចាម',
    'Sihanoukville Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តព្រះសីហនុ',
    'Kampot Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តកំពត',
    'Takeo Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តតាកែវ',
    'Svay Rieng Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តស្វាយរៀង',
    'Kandal Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តកណ្តាល (ក្រុងតាខ្មៅ)',
    'Kampong Chhnang Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តកំពង់ឆ្នាំង',
    'Pursat Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តពោធិ៍សាត់',
    'Banteay Meanchey Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តបន្ទាយមានជ័យ (សិរីសោភ័ណ)',
    'Mongkol Borey Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកមង្គលបូរី',
    'Preah Vihear Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តព្រះវិហារ (១៦ មករា)',
    'Stung Treng Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តស្ទឹងត្រែង',
    'Kratie Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តក្រចេះ',
    'Ratanakiri Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តរតនគិរី (បានលុង)',
    'Mondulkiri Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តមណ្ឌលគិរី (សែនមនោរម្យ)',
    'Koh Kong Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តកោះកុង',
    'Prey Veng Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តព្រៃវែង',
    'Tbong Khmum Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តត្បូងឃ្មុំ',
    'Kep Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តកែប',
    'Pailin Provincial Referral Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តប៉ៃលិន',
    'Oddar Meanchey Provincial Hospital': 'មន្ទីរពេទ្យបង្អែកខេត្តឧត្តរមានជ័យ (សំរោង)',
    'Chea Sim Kamchaymear Referral Hospital': 'មន្ទីរពេទ្យបង្អែក ជា ស៊ីម កំចាយមារ',
}

DEPT_TRANSLATIONS = {
    'Cardiology & Heart Center': 'ផ្នែកជំងឺបេះដូង',
    'Cardiology': 'ផ្នែកជំងឺបេះដូង',
    'Dermatology & Skin Care': 'ផ្នែកសើស្បែក និងថែរក្សាស្បែក',
    'Dermatology': 'ផ្នែកសើស្បែក',
    'Pediatrics': 'ផ្នែកជំងឺកុមារ',
    'Pediatric Outpatient & Emergency': 'ផ្នែកពិគ្រោះ និងសង្គ្រោះបន្ទាន់កុមារ',
    'Pediatric': 'ផ្នែកជំងឺកុមារ',
    'Neurology & Stroke Center': 'ផ្នែកប្រព័ន្ធប្រសាទ និងដាច់សរសៃឈាមខួរក្បាល',
    'General & Laparoscopic Surgery': 'ផ្នែកវះកាត់ទូទៅ',
    'General Surgery': 'ផ្នែកវះកាត់ទូទៅ',
    'Pulmonology & Respiratory Care': 'ផ្នែកជំងឺសួត និងផ្លូវដង្ហើម',
    'Nephrology & Hemodialysis': 'ផ្នែកតម្រងនោម និងលាងឈាម',
    'Emergency & Neuro-Stroke Care': 'ផ្នែកសង្គ្រោះបន្ទាន់',
    'Endoscopy & Digestive Health': 'ផ្នែកឆ្លុះក្រពះពោះវៀន',
    'Orthopedics & Traumatology': 'ផ្នែកជំងឺឆ្អឹង និងរបួសបាក់បែក',
    'Orthopedics': 'ផ្នែកជំងឺឆ្អឹង និងសន្លាក់',
    'Ophthalmology & Eye Clinic': 'ផ្នែកជំងឺភ្នែក',
    'Eye Clinic': 'ផ្នែកជំងឺភ្នែក',
    'General Medicine': 'ផ្នែកវេជ្ជសាស្ត្រទូទៅ',
    'Emergency Trauma': 'ផ្នែកសង្គ្រោះបន្ទាន់',
    'Rabies Prevention & Animal Bites': 'ផ្នែកការពារជំងឺឆ្កែឆ្កួត និងព្យាបាលសត្វខាំ',
    'Animal Surgery & Urgent Care': 'ផ្នែកវះកាត់ និងសង្គ្រោះបន្ទាន់សត្វ',
    'Pet Outpatient & Preventive Care': 'ផ្នែកពិគ្រោះជំងឺសត្វទូទៅ',
    'Implant & Oral Maxillofacial Surgery': 'ផ្នែកវះកាត់ដាក់ធ្មេញ និងឆ្អឹងថ្គាម',
    'Orthodontics & Pediatric Dentistry': 'ផ្នែកតម្រង់ធ្មេញ និងទន្តសាស្ត្រកុមារ',
    'Obstetrics & Gynecology (OB-GYN)': 'ផ្នែកសម្ភព និងរោគស្ត្រី',
    'Comprehensive Ophthalmology & Cataract': 'ផ្នែកចក្ខុរោគទូទៅ និងបកភ្នែកឡើងបាយ',
    'Veterinary Outpatient & Diagnostics': 'ផ្នែកពិនិត្យ និងរោគវិនិច្ឆ័យសត្វ',
    'Pet Orthopedic & Soft Tissue Surgery': 'ផ្នែកវះកាត់ឆ្អឹង និងសាច់សត្វ',
    'Animal ICU & Emergency Triage': 'ផ្នែកសង្គ្រោះបន្ទាន់ និង ICU សត្វ',
    'Preventative Pet Care & Wellness': 'ផ្នែកថែទាំ និងសុខភាពសត្វ',
}

DOCTOR_TRANSLATIONS = {
    'Sokha Meas, MD': 'វេជ្ជបណ្ឌិត មាស សុខា',
    'Dr. Sokha Meas, MD': 'វេជ្ជបណ្ឌិត មាស សុខា',
    'Dr. Sokha Meas': 'វេជ្ជបណ្ឌិត មាស សុខា',
    'Dr. Chann Vatey, MD': 'វេជ្ជបណ្ឌិត ចាន់ វ៉ាតី',
    'Chann Vatey, MD': 'វេជ្ជបណ្ឌិត ចាន់ វ៉ាតី',
    'Dr. Sarah Chen, MD': 'វេជ្ជបណ្ឌិត សារ៉ា ចេន',
    'Dr. Sarah Chen': 'វេជ្ជបណ្ឌិត សារ៉ា ចេន',
    'Dr. Chan Moly, MD': 'វេជ្ជបណ្ឌិត ចាន់ ម៉ូលី',
    'Dr. Bopha Tep, MD': 'វេជ្ជបណ្ឌិត បុប្ផា ទេព',
    'Dr. Tith Hongsar, DDS': 'ទន្តបណ្ឌិត ទិត ហុងសារ',
    'Dr. Vuthy Keo, DDS': 'ទន្តបណ្ឌិត វុទ្ធី កែវ',
    'Dr. Chantrea Sam, MD': 'វេជ្ជបណ្ឌិត ចន្ទ្រា សំ',
    'Dr. Sovannarith Kong, MD': 'វេជ្ជបណ្ឌិត សុវណ្ណារិទ្ធ គង់',
    'Dr. Kimheng Ouk, DVM': 'វេជ្ជបណ្ឌិតសត្វ គឹមហេង អ៊ុក',
    'Dr. Julien Moreau, DVM': 'វេជ្ជបណ្ឌិតសត្វ Julien Moreau',
    'Dr. Sereyroth Mao, DVM': 'វេជ្ជបណ្ឌិតសត្វ សិរីរ័ត្ន ម៉ៅ',
    'Dr. Piseth Rin, DVM': 'វេជ្ជបណ្ឌិតសត្វ ពិសិដ្ឋ រិន',
    'Dr. Vibol Som, MD': 'វេជ្ជបណ្ឌិត វិបុល សោម',
    'Dr. Socheata Keo, MD': 'វេជ្ជបណ្ឌិត សុជាតា កែវ',
    'Dr. Rithy Prak, MD': 'វេជ្ជបណ្ឌិត រិទ្ធី ប្រាក់',
    'Dr. Vanna Seng, MD': 'វេជ្ជបណ្ឌិត វណ្ណា សេង',
    'Dr. Kiri Chea, MD': 'វេជ្ជបណ្ឌិត គិរី ជា',
    'Dr. Kenji Tanaka, MD': 'វេជ្ជបណ្ឌិត Kenji Tanaka',
    'Dr. Sopheak Yun, MD': 'វេជ្ជបណ្ឌិត សុភក្ត្រ យុន',
    'Dr. Chamroeun Ros, MD': 'វេជ្ជបណ្ឌិត ចំរើន រស់',
    'Dr. Sophea Neth, MD': 'វេជ្ជបណ្ឌិត សុភា នេត្រ',
    'Dr. Narith Long, MD': 'វេជ្ជបណ្ឌិត ណារិទ្ធ ឡុង',
    'Dr. Samnang Pich, DVM': 'វេជ្ជបណ្ឌិតសត្វ សំណាង ពេជ្រ',
    'Dr. Thida Roeun, DVM': 'វេជ្ជបណ្ឌិតសត្វ ធីតា រឿន',
    'Dr. Robert Taylor, MD': 'វេជ្ជបណ្ឌិត Robert Taylor',
    'Dr. Emily Watson, MD': 'វេជ្ជបណ្ឌិត Emily Watson',
    'Dr. Michael Chang, MD': 'វេជ្ជបណ្ឌិត Michael Chang',
}

SPECIALTY_TRANSLATIONS = {
    'Senior Interventional Cardiologist': 'ឯកទេសជាន់ខ្ពស់ជំងឺបេះដូង',
    'Senior Cardiologist': 'ឯកទេសជាន់ខ្ពស់ជំងឺបេះដូង',
    'Cardiologist': 'ឯកទេសជំងឺបេះដូង',
    'Consultant Dermatologist': 'ឯកទេសជំងឺសើស្បែក',
    'Dermatologist': 'ឯកទេសជំងឺសើស្បែក',
    'Pediatrician': 'ឯកទេសជំងឺកុមារ',
    'Senior Pediatric Surgeon': 'ឯកទេសវះកាត់កុមារ',
    'Orthodontist': 'ឯកទេសតម្រង់ធ្មេញ',
    'Maxillofacial & Dental Implant Surgeon': 'ឯកទេសវះកាត់ដាក់ធ្មេញ និងឆ្អឹងថ្គាម',
    'Senior Obstetrician & Gynecologist': 'ឯកទេសសម្ភព និងរោគស្ត្រី',
    'Consultant Ophthalmic Surgeon': 'ឯកទេសវះកាត់ភ្នែក',
    'Small Animal Clinical Veterinarian': 'ឯកទេសព្យាបាលជំងឺសត្វទូទៅ',
    'Senior Veterinary Surgeon': 'ឯកទេសវះកាត់សត្វ',
    'Emergency & Critical Care Veterinarian': 'ឯកទេសសង្គ្រោះបន្ទាន់សត្វ',
    'General Practice Veterinarian': 'ឯកទេសព្យាបាលជំងឺសត្វទូទៅ',
    'Neurosurgeon & Spine Specialist': 'ឯកទេសវះកាត់ប្រព័ន្ធប្រសាទ និងឆ្អឹងខ្នង',
    'Consultant Pulmonologist': 'ឯកទេសជំងឺសួត និងផ្លូវដង្ហើម',
    'Nephrologist & Dialysis Specialist': 'ឯកទេសតម្រងនោម និងលាងឈាម',
    'Emergency & Neuro-Interventionist': 'ឯកទេសសង្គ្រោះបន្ទាន់ និងសរសៃឈាមខួរក្បាល',
    'Gastroenterologist & Hepatologist': 'ឯកទេសក្រពះ ពោះវៀន និងថ្លើម',
    'Senior Orthopedic Trauma Surgeon': 'ឯកទេសវះកាត់ឆ្អឹង និងរបួសបាក់បែក',
    'Ophthalmologist & Retinal Specialist': 'ឯកទេសចក្ខុរោគ និងបាតភ្នែក',
    'Infectious Disease & Rabies Specialist': 'ឯកទេសជំងឺឆ្លង និងជំងឺឆ្កែឆ្កួត',
    'Veterinary Soft-Tissue Surgeon': 'ឯកទេសវះកាត់សត្វ',
    'General Practitioner': 'វេជ្ជបណ្ឌិតទូទៅ',
    'Emergency Physician': 'វេជ្ជបណ្ឌិតសង្គ្រោះបន្ទាន់',
}


def upgrade() -> None:
    # 1. Add columns
    op.add_column('hospitals', sa.Column('name_km', sa.String(length=255), nullable=True))
    op.add_column('hospital_branches', sa.Column('name_km', sa.String(length=255), nullable=True))
    op.add_column('departments', sa.Column('name_km', sa.String(length=128), nullable=True))
    op.add_column('services', sa.Column('name_km', sa.String(length=128), nullable=True))
    op.add_column('doctors', sa.Column('full_name_km', sa.String(length=128), nullable=True))
    op.add_column('doctors', sa.Column('specialty_km', sa.String(length=128), nullable=True))

    conn = op.get_bind()

    # 2. Extract and separate bracketed Khmer names if present in hospitals.name: e.g. "Name (មន្ទីរពេទ្យ...)"
    conn.execute(sa.text("""
        UPDATE hospitals
        SET name_km = substring(name from '\\(([\u1780-\u17FF\\s/–-]+)\\)'),
            name = trim(regexp_replace(name, '\\s*\\(([\u1780-\u17FF\\s/–-]+)\\)', ''))
        WHERE name ~ '\\(([\u1780-\u17FF\\s/–-]+)\\)'
          AND (name_km IS NULL OR name_km = '');
    """))

    # 3. Populate known hospitals
    for en_name, km_name in HOSPITAL_TRANSLATIONS.items():
        conn.execute(
            sa.text("UPDATE hospitals SET name_km = :km WHERE (name = :en OR name ILIKE :en_like) AND (name_km IS NULL OR name_km = '')"),
            {"en": en_name, "en_like": f"%{en_name}%", "km": km_name}
        )

    # 4. Populate departments
    for en_name, km_name in DEPT_TRANSLATIONS.items():
        conn.execute(
            sa.text("UPDATE departments SET name_km = :km WHERE (name = :en OR name ILIKE :en_like) AND (name_km IS NULL OR name_km = '')"),
            {"en": en_name, "en_like": f"%{en_name}%", "km": km_name}
        )

    # 5. Populate doctors
    for en_name, km_name in DOCTOR_TRANSLATIONS.items():
        conn.execute(
            sa.text("UPDATE doctors SET full_name_km = :km WHERE (full_name = :en OR full_name ILIKE :en_like) AND (full_name_km IS NULL OR full_name_km = '')"),
            {"en": en_name, "en_like": f"%{en_name}%", "km": km_name}
        )
    for en_spec, km_spec in SPECIALTY_TRANSLATIONS.items():
        conn.execute(
            sa.text("UPDATE doctors SET specialty_km = :km WHERE (specialty = :spec OR specialty ILIKE :spec_like) AND (specialty_km IS NULL OR specialty_km = '')"),
            {"spec": en_spec, "spec_like": f"%{en_spec}%", "km": km_spec}
        )


def downgrade() -> None:
    op.drop_column('doctors', 'specialty_km')
    op.drop_column('doctors', 'full_name_km')
    op.drop_column('services', 'name_km')
    op.drop_column('departments', 'name_km')
    op.drop_column('hospital_branches', 'name_km')
    op.drop_column('hospitals', 'name_km')
