import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatFacilityName } from '../../../i18n/formatters';
import { SimulatedHospitalLogo } from './discoveryUtils';

interface FacilityCardListProps {
  hospitals: any[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: 'All' | 'Nearby' | 'Hospital' | 'Kids' | 'Medical Clinic' | 'Animal Clinic';
  setSelectedCategory: (cat: 'All' | 'Nearby' | 'Hospital' | 'Kids' | 'Medical Clinic' | 'Animal Clinic') => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onSelectFacility: (facility: any) => void;
  onRequestLocation?: () => void;
  hasLocation?: boolean;
  locationLoading?: boolean;
  isRealTimeActive?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const FacilityCardList: React.FC<FacilityCardListProps> = ({
  hospitals,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onSearchSubmit,
  onClearSearch,
  onSelectFacility,
  onRequestLocation,
  hasLocation,
  locationLoading,
}) => {
  const { language, t } = useLanguage();
  const kmFont = language === 'km' ? 'var(--font-khmer)' : 'inherit';
  const INITIAL_BATCH = 12;
  const BATCH_SIZE = 12;
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
    setIsLoadingMore(false);
  }, [searchQuery, selectedCategory, hospitals.length]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting && !isLoadingMore && visibleCount < hospitals.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, hospitals.length));
            setIsLoadingMore(false);
          }, 350);
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [visibleCount, hospitals.length, isLoadingMore]);

  return (
    <div className="facility-list-animate" style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top Search Controls & Category Filter Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <form
          onSubmit={onSearchSubmit}
          className="facility-search-form"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '640px',
            marginBottom: '1.15rem',
          }}
        >
          <input
            type="text"
            className="input-search-rounded"
            placeholder={t('discovery_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: searchQuery
                ? '0.74rem 10.5rem 0.74rem 1.35rem'
                : '0.74rem 7.5rem 0.74rem 1.35rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.94rem',
              color: 'var(--text-main)',
              boxShadow: 'none',
              outline: 'none',
              fontFamily: kmFont,
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                style={{
                  padding: '0.42rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontFamily: kmFont,
                }}
              >
                {language === 'km' ? 'សម្អាត' : 'Clear'}
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.52rem 1.15rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                fontFamily: kmFont,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Search size={15} />
              <span>{language === 'km' ? 'ស្វែងរក' : 'Search'}</span>
            </button>
          </div>
        </form>

        {/* Category Selection Tabs */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: t('cat_all'), value: 'All' },
            { label: t('filter_nearby'), value: 'Nearby' },
            { label: t('cat_hospitals'), value: 'Hospital' },
            { label: t('cat_kids'), value: 'Kids' },
            { label: t('cat_medical_clinics'), value: 'Medical Clinic' },
            { label: t('cat_animal_clinics'), value: 'Animal Clinic' },
          ].map((cat) => (
            <button
              type="button"
              key={cat.value}
              onClick={() => {
                if (cat.value === 'Nearby' && !hasLocation) {
                  onRequestLocation?.();
                }
                setSelectedCategory(cat.value as any);
              }}
              className={`category-filter-pill ${selectedCategory === cat.value ? 'active' : ''}`}
              style={{
                fontWeight: selectedCategory === cat.value ? 700 : 500,
                background: selectedCategory === cat.value ? 'var(--accent-primary)' : 'transparent',
                border: selectedCategory === cat.value ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                color: selectedCategory === cat.value ? '#ffffff' : 'var(--text-muted)',
                fontFamily: kmFont,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{cat.label}</span>
              {cat.value === 'Nearby' && locationLoading && (
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>...</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Facility 2-Column Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {language === 'km' ? 'កំពុងដំណើរការ...' : 'Loading facilities...'}
        </div>
      ) : hospitals.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '3rem 1rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            boxShadow: 'none',
          }}
        >
          {language === 'km' ? 'មិនមានទីតាំងត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ' : 'No facilities found matching your selected category or query.'}
        </div>
      ) : (
        <>
          <div className="discovery-facilities-grid">
            {hospitals.slice(0, visibleCount).map((hosp) => (
              <button
                key={hosp.id}
                className="hospital-facility-card"
                onClick={() => onSelectFacility(hosp)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.zIndex = '35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.zIndex = '1';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  width: '100%',
                  height: '100%',
                  textAlign: 'left',
                  padding: '1.1rem 1.25rem',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  position: 'relative',
                }}
              >
                <SimulatedHospitalLogo name={hosp.name} logoUrl={hosp.logo_url} size={54} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div
                      title={formatFacilityName(hosp.name, language)}
                      style={{
                        fontSize: '1.08rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        lineHeight: 1.35,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: kmFont,
                        flex: 1,
                      }}
                    >
                      {formatFacilityName(hosp.name, language)}
                    </div>
                    {typeof hosp.distance_km === 'number' && (
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          fontFamily: kmFont,
                        }}
                      >
                        ~{hosp.distance_km} {language === 'km' ? 'គ.ម' : 'km'}{hosp.duration_minutes ? ` • ~${hosp.duration_minutes} ${language === 'km' ? 'នាទី' : 'mins'}` : ''}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                      fontFamily: kmFont,
                    }}
                  >
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      {t('hotline_contact')}{' '}
                    </span>
                    {hosp.phone || (language === 'km' ? 'មិនមាន' : 'N/A')}
                  </div>

                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      fontFamily: kmFont,
                    }}
                    title={hosp.address || hosp.city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh')}
                  >
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      {t('location_label')}{' '}
                    </span>
                    {hosp.address || hosp.city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh')}
                  </div>
                </div>
              </button>
            ))}
            {visibleCount < hospitals.length && (
              <div
                ref={sentinelRef}
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 0 0.25rem 0',
                  margin: 0,
                  background: 'transparent',
                }}
              >
                <Loader2
                  size={22}
                  className="spin"
                  style={{
                    color: 'var(--accent-primary)',
                    background: 'transparent',
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

