import React from 'react';
import { Search, MapPin, Navigation, RotateCw } from 'lucide-react';
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
  isRealTimeActive,
  userLocation,
}) => {
  const { language, t } = useLanguage();
  const kmFont = language === 'km' ? 'var(--font-khmer)' : 'inherit';
  const [visibleCount, setVisibleCount] = React.useState(40);

  React.useEffect(() => {
    setVisibleCount(40);
  }, [searchQuery, selectedCategory, hospitals.length]);

  return (
    <div className="facility-list-animate" style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top Search Controls & Category Filter Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <form
          onSubmit={onSearchSubmit}
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

        {/* Real-time Location Indicator & Category Selection Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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

          {/* Real-Time Location Live Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasLocation ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.28rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.78rem',
                  color: '#059669',
                  fontWeight: 600,
                  fontFamily: kmFont,
                }}
              >
                <span
                  title={userLocation ? `GPS: ${userLocation.latitude}, ${userLocation.longitude}` : undefined}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                    display: 'inline-block',
                    animation: isRealTimeActive ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span title={userLocation ? `GPS: ${userLocation.latitude}, ${userLocation.longitude}` : undefined}>
                  {t('realtime_location_active')}
                </span>
                {onRequestLocation && (
                  <button
                    type="button"
                    onClick={onRequestLocation}
                    title={t('refresh_location')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      marginLeft: '2px',
                      color: '#059669',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCw size={12} className={locationLoading ? 'spin' : ''} />
                  </button>
                )}
              </div>
            ) : locationLoading ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontFamily: kmFont,
                }}
              >
                <RotateCw size={12} className="spin" />
                <span>{t('detecting_realtime_location')}</span>
              </div>
            ) : onRequestLocation ? (
              <button
                type="button"
                onClick={onRequestLocation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0.28rem 0.7rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                }}
              >
                <Navigation size={12} />
                <span>{t('btn_use_location')}</span>
              </button>
            ) : null}
          </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                        minWidth: '150px',
                      }}
                    >
                      {formatFacilityName(hosp.name, language)}
                    </div>
                    {typeof hosp.distance_km === 'number' && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#0284c7',
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          whiteSpace: 'nowrap',
                          fontFamily: kmFont,
                        }}
                      >
                        <MapPin size={12} />
                        <span>{hosp.distance_km} {t('distance_km_away')}</span>
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
          </div>

          {visibleCount < hospitals.length && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 40)}
                className="btn btn-outline"
                style={{
                  padding: '0.58rem 1.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-primary)',
                  transition: 'all 0.2s ease',
                }}
              >
                {language === 'km'
                  ? `បង្ហាញបន្ថែម (${Math.min(visibleCount, hospitals.length)} នៃ ${hospitals.length})`
                  : `Load More Facilities (${Math.min(visibleCount, hospitals.length)} of ${hospitals.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

