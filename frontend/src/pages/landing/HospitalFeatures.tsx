import React from 'react';
import { UserCheck, LayoutDashboard, CalendarClock, Pill, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import specialistDoctorImg from '../../assets/hospital_doctor_specialist.jpg';
import opsReceptionImg from '../../assets/hospital_ops_reception.jpg';
import deptRoomsImg from '../../assets/hospital_dept_rooms.jpg';
import pharmacyInventoryImg from '../../assets/hospital_pharmacy_inventory.jpg';

export const HospitalFeatures: React.FC = () => {
  const { t, language } = useLanguage();

  const cards = [
    {
      id: 'doctor-profiles',
      icon: UserCheck,
      image: specialistDoctorImg,
      title: t('hf_card1_title'),
      desc: t('hf_card1_desc'),
      bullets: [
        t('hf_card1_bullet1').replace(/^✓\s*/, ''),
        t('hf_card1_bullet2').replace(/^✓\s*/, ''),
      ],
    },
    {
      id: 'ops-dashboard',
      icon: LayoutDashboard,
      image: opsReceptionImg,
      title: t('hf_card2_title'),
      desc: t('hf_card2_desc'),
      bullets: [
        t('hf_card2_bullet1').replace(/^✓\s*/, ''),
        t('hf_card2_bullet2').replace(/^✓\s*/, ''),
      ],
    },
    {
      id: 'shift-management',
      icon: CalendarClock,
      image: deptRoomsImg,
      title: t('hf_card3_title'),
      desc: t('hf_card3_desc'),
      bullets: [
        t('hf_card3_bullet1').replace(/^✓\s*/, ''),
        t('hf_card3_bullet2').replace(/^✓\s*/, ''),
      ],
    },
    {
      id: 'stock-management',
      icon: Pill,
      image: pharmacyInventoryImg,
      title: t('hf_card4_title'),
      desc: t('hf_card4_desc'),
      bullets: [
        t('hf_card4_bullet1').replace(/^✓\s*/, ''),
        t('hf_card4_bullet2').replace(/^✓\s*/, ''),
      ],
    },
  ];

  return (
    <section id="hospital-features" style={{ width: '100%', padding: '1rem 0 2rem 0' }}>
      {/* Section Header matching PatientFeatures clean style */}
      <div style={{ maxWidth: '860px', marginBottom: '2.25rem' }}>
        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)',
            fontWeight: 700,
            color: '#0c2f27',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            marginBottom: '0.65rem',
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('hf_section_badge')}
        </h2>

        <p
          style={{
            color: '#64748b',
            fontSize: 'clamp(0.92rem, 1.3vw, 1rem)',
            lineHeight: 1.6,
            fontWeight: 400,
            margin: 0,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('hf_section_subtitle')}
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.85rem',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="hospital-ops-card"
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Top Image Frame */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#f8fafc',
                  borderBottom: '1px solid #edf2f7',
                }}
              >
                <img
                  src={card.image}
                  alt=""
                  role="presentation"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'transform 0.35s ease',
                  }}
                />
              </div>

              {/* Bottom Content Area */}
              <div
                style={{
                  padding: '1.1rem 1.25rem 1.35rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Title with Prefix Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <Icon size={19} color="#0c2f27" style={{ flexShrink: 0 }} />
                    <h3
                      className="text-truncate"
                      style={{
                        fontSize: language === 'km' ? '1.16rem' : '1.1rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: 0,
                        lineHeight: 1.3,
                        fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      }}
                    >
                      {card.title}
                    </h3>
                  </div>

                  <p
                    className="text-clamp-3"
                    style={{
                      fontSize: language === 'km' ? '0.92rem' : '0.88rem',
                      color: '#475569',
                      lineHeight: language === 'km' ? 1.55 : 1.5,
                      margin: '0 0 1rem 0',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                    }}
                  >
                    {card.desc}
                  </p>
                </div>

                {/* Bullet Points with Clean Green Checkmarks */}
                <ul
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    padding: 0,
                    margin: 0,
                    marginTop: 'auto',
                  }}
                >
                  {card.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: language === 'km' ? '0.88rem' : '0.84rem',
                        color: '#334155',
                        lineHeight: language === 'km' ? 1.45 : 1.4,
                        fontWeight: 500,
                        fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      }}
                    >
                      <Check
                        size={15}
                        strokeWidth={2.5}
                        color="#10b981"
                        style={{ flexShrink: 0, marginTop: '2px' }}
                      />
                      <span className="text-clamp-2">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HospitalFeatures;
