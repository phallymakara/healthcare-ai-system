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
    <section id="hospital-features" style={{ width: '100%', padding: '0.5rem 0 1.25rem 0' }}>
      {/* Section Header matching reference */}
      <div style={{ maxWidth: '860px', marginBottom: '2rem' }}>
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
                height: '160px',
                overflow: 'hidden',
                position: 'relative',
                background: '#f8fafc',
                borderBottom: '1px solid #edf2f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={card.image}
                alt={card.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  display: 'block',
                  transition: 'transform 0.35s ease',
                }}
              />
            </div>

            {/* Bottom Content Area */}
            <div
              style={{
                padding: '1.25rem 1.35rem 1.35rem 1.35rem',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  className="text-truncate"
                  style={{
                    fontSize: '1.24rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '0.4rem',
                    lineHeight: 1.35,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-clamp-3"
                  style={{
                    fontSize: '0.94rem',
                    color: '#475569',
                    lineHeight: 1.5,
                    marginBottom: '0.85rem',
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
                  gap: '0.45rem',
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
                      gap: '0.55rem',
                      fontSize: '0.9rem',
                      color: '#334155',
                      lineHeight: 1.45,
                      fontWeight: 500,
                    }}
                  >
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      color="#16a34a"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <span className="text-clamp-2">{bullet}</span>
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
