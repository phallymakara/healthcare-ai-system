import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import doctorConsultImg from '../../assets/testimonial_doctor_1.jpg';
import doctorSmileImg from '../../assets/testimonial_doctor_2.jpg';

interface TestimonialItem {
  id: number;
  image: string;
  quoteKey: string;
  authorKey: string;
  roleKey: string;
  rating: number;
}

export const TestimonialsSection: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);

  const testimonials: TestimonialItem[] = [
    {
      id: 1,
      image: doctorConsultImg,
      quoteKey: 'testimonial_1_quote',
      authorKey: 'testimonial_1_author',
      roleKey: 'testimonial_1_role',
      rating: 5,
    },
    {
      id: 2,
      image: doctorSmileImg,
      quoteKey: 'testimonial_2_quote',
      authorKey: 'testimonial_2_author',
      roleKey: 'testimonial_2_role',
      rating: 5,
    },
    {
      id: 3,
      image: doctorConsultImg,
      quoteKey: 'testimonial_3_quote',
      authorKey: 'testimonial_3_author',
      roleKey: 'testimonial_3_role',
      rating: 5,
    },
    {
      id: 4,
      image: doctorSmileImg,
      quoteKey: 'testimonial_4_quote',
      authorKey: 'testimonial_4_author',
      roleKey: 'testimonial_4_role',
      rating: 5,
    },
  ];

  const total = testimonials.length;

  const handlePrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (idx: number) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 'next' : 'prev');
    setCurrentIndex(idx);
  };

  // Auto-advance carousel every 6s unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const currentItem = testimonials[currentIndex];
  const nextItem = testimonials[(currentIndex + 1) % total];

  return (
    <section
      id="user-testimonials"
      style={{
        width: '100%',
        padding: '0.75rem 0 1.25rem 0',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="testimonial-main-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'nowrap',
          position: 'relative',
        }}
      >
        {/* Left Section Title */}
        <div style={{ flexShrink: 0, minWidth: '180px' }}>
          <h2
            style={{
              fontSize: 'clamp(1.55rem, 2.5vw, 1.95rem)',
              fontWeight: 800,
              color: '#0c2f27',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            {t('testimonials_title')}
          </h2>
        </div>

        {/* Carousel Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden',
            padding: '1rem 0.5rem',
          }}
        >
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            aria-label="Previous testimonial"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              zIndex: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.color = '#10b981';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Active Card with Smooth Slide Animation */}
          <div
            key={currentIndex}
            className={`testimonial-card-responsive ${direction === 'next' ? 'testimonial-animate-next' : 'testimonial-animate-prev'}`}
            style={{
              flex: '1 1 540px',
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
              padding: '1.25rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              minWidth: 0,
            }}
          >
            {/* Doctor & Patient Illustration on Left */}
            <div
              className="testimonial-img-responsive"
              style={{
                width: '180px',
                height: '130px',
                borderRadius: '14px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#e0f2fe',
                border: '1px solid #e2e8f0',
              }}
            >
              <img
                src={currentItem.image}
                alt="Doctor consultation"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                }}
              />
            </div>

            {/* Content & Rating on Right */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Star Rating */}
              <div style={{ display: 'flex', gap: '3px', marginBottom: '0.6rem' }}>
                {[...Array(currentItem.rating)].map((_, i) => (
                  <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>

              {/* Testimonial Quote */}
              <p
                className="text-clamp-3"
                style={{
                  fontSize: '0.98rem',
                  color: '#334155',
                  lineHeight: 1.6,
                  fontWeight: 500,
                  marginBottom: '0.6rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t(currentItem.quoteKey)}
              </p>

              {/* Author & Role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span className="text-truncate" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0c2f27', maxWidth: '140px' }}>
                  {t(currentItem.authorKey)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>•</span>
                <span className="text-truncate" style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '160px' }}>
                  {t(currentItem.roleKey)}
                </span>
              </div>
            </div>
          </div>

          {/* Peeking Next Card (Matching Reference Layout) */}
          <div
            className="testimonial-peek-card"
            style={{
              flex: '0 0 160px',
              height: '158px',
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.06)',
              padding: '1.25rem 1rem',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              opacity: 0.65,
              position: 'relative',
              cursor: 'pointer',
              transition: 'opacity 0.25s ease',
            }}
            onClick={handleNext}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.65';
            }}
          >
            <div
              style={{
                width: '120px',
                height: '130px',
                borderRadius: '14px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#e0f2fe',
                border: '1px solid #e2e8f0',
              }}
            >
              <img
                src={nextItem.image}
                alt="Next doctor consultation"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            aria-label="Next testimonial"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              zIndex: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.color = '#10b981';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Pagination Dots Below Carousel (Matching Reference) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '1.25rem',
        }}
      >
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: currentIndex === idx ? '22px' : '8px',
              height: '8px',
              borderRadius: '9999px',
              background: currentIndex === idx ? '#10b981' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
