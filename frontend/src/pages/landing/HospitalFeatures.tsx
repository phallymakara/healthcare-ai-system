import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import doctorProfileImg from '../../assets/hospital_doctor_profile.jpg';
import opsDashboardImg from '../../assets/hospital_ops_dashboard.jpg';
import shiftScheduleImg from '../../assets/hospital_shift_schedule.jpg';
import stockInventoryImg from '../../assets/hospital_stock_inventory.jpg';

export const HospitalFeatures: React.FC = () => {
  const { t } = useLanguage();

  const cards = [
    {
      id: 'doctor-profiles',
      image: doctorProfileImg,
      title: t('hf_card1_title'),
      desc: t('hf_card1_desc'),
      bullets: [
        t('hf_card1_bullet1').replace(/^✓\s*/, ''),
        t('hf_card1_bullet2').replace(/^✓\s*/, ''),
      ],
    },
    {
      id: 'ops-dashboard',
      image: opsDashboardImg,
      title: t('hf_card2_title'),
      desc: t('hf_card2_desc'),
      bullets: [
        t('hf_card2_bullet1').replace(/^✓\s*/, ''),
        t('hf_card2_bullet2').replace(/^✓\s*/, ''),
      ],
    },
    {
      id: 'shift-management',
      image: shiftScheduleImg,
      title: t('hf_card3_title'),
      desc: t('hf_card3_desc'),
      bullets: [
        t('hf_card3_bullet1').replace(/^✓\s*/, ''),
        t('hf_card3_bullet2').replace(/^✓\s*/, ''),
      ],
    },
    {
      id: 'stock-management',
      image: stockInventoryImg,
      title: t('hf_card4_title'),
      desc: t('hf_card4_desc'),
      bullets: [
        t('hf_card4_bullet1').replace(/^✓\s*/, ''),
        t('hf_card4_bullet2').replace(/^✓\s*/, ''),
      ],
    },
  ];

  return (
    <section id="hospital-features" style={{ width: '100%', padding: '2.5rem 0 3.5rem 0' }}>
      {/* Section Header matching reference */}
      <div style={{ maxWidth: '860px', marginBottom: '2.85rem' }}>
        <h2
          style={{
            fontSize: 'clamp(1.95rem, 3.4vw, 2.55rem)',
            fontWeight: 800,
            color: '#0c2f27',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {t('hf_section_title')}
        </h2>
        <p
          style={{
            color: '#4b5563',
            fontSize: 'clamp(1.05rem, 1.5vw, 1.2rem)',
            marginTop: '0.75rem',
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          {t('hf_section_subtitle')}
        </p>
      </div>

      {/* 4 Cards Grid (Doctor Profile, Operational Console, Shift Management, Stock Management) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.85rem',
        }}
      >
        {cards.map((card) => (
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
            {/* UI Dashboard Preview Top Frame */}
            <div
              style={{
                width: '100%',
                height: '200px',
                overflow: 'hidden',
                position: 'relative',
                background: '#f1f5f9',
                borderBottom: '1px solid #edf2f7',
              }}
            >
              <img
                src={card.image}
                alt={card.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                  transition: 'transform 0.35s ease',
                }}
              />
            </div>

            {/* Bottom Content Area */}
            <div
              style={{
                padding: '1.85rem 1.6rem 2rem 1.6rem',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.42rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '0.75rem',
                    lineHeight: 1.35,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '1.02rem',
                    color: '#475569',
                    lineHeight: 1.65,
                    marginBottom: '1.35rem',
                  }}
                >
                  {card.desc}
                </p>
              </div>

              {/* Bullet Points with Green Checkmarks */}
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  padding: 0,
                  margin: 0,
                }}
              >
                {card.bullets.map((bullet, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      fontSize: '0.98rem',
                      color: '#334155',
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    <Check
                      size={18}
                      strokeWidth={2.5}
                      color="#16a34a"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HospitalFeatures;
