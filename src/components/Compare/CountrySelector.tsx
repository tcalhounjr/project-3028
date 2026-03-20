import React, { useContext, useState } from 'react'
import { DataContext } from '../../App'
import { toW40Url } from '../../utils/flagUrl'

// ---------------------------------------------------------------------------
// Seed country list — fallback when DataContext is null (e.g. in tests or
// before the data fetch resolves). Mirrors the 10 seed countries in data.json.
// ---------------------------------------------------------------------------

const SEED_COUNTRIES: Array<{ iso: string; name: string; flagUrl: string }> = [
  { iso: 'NIC', name: 'Nicaragua', flagUrl: 'https://flagcdn.com/w40/ni.png' },
  { iso: 'RUS', name: 'Russia', flagUrl: 'https://flagcdn.com/w40/ru.png' },
  { iso: 'VEN', name: 'Venezuela', flagUrl: 'https://flagcdn.com/w40/ve.png' },
  { iso: 'PHL', name: 'Philippines', flagUrl: 'https://flagcdn.com/w40/ph.png' },
  { iso: 'HUN', name: 'Hungary', flagUrl: 'https://flagcdn.com/w40/hu.png' },
  { iso: 'POL', name: 'Poland', flagUrl: 'https://flagcdn.com/w40/pl.png' },
  { iso: 'TUR', name: 'Turkey', flagUrl: 'https://flagcdn.com/w40/tr.png' },
  { iso: 'IND', name: 'India', flagUrl: 'https://flagcdn.com/w40/in.png' },
  { iso: 'BRA', name: 'Brazil', flagUrl: 'https://flagcdn.com/w40/br.png' },
  { iso: 'USA', name: 'United States', flagUrl: 'https://flagcdn.com/w40/us.png' },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CountrySelectorProps {
  /** Called with an array of ISO codes when the user confirms their selection. */
  onConfirm: (selectedIsos: string[]) => void
}

// ---------------------------------------------------------------------------
// CountrySelector
//
// Self-contained multi-select component:
//   - Sources country list from DataContext (falls back to SEED_COUNTRIES).
//   - Manages internal selection state (min 2, max 3).
//   - Renders a confirm button that is disabled when selection < 2.
//   - Calls onConfirm(isoArray) when confirmed.
// ---------------------------------------------------------------------------

export default function CountrySelector({ onConfirm }: CountrySelectorProps) {
  const data = useContext(DataContext)
  const [selected, setSelected] = useState<string[]>([])

  // Build display list from DataContext if available, otherwise fall back to
  // the hardcoded seed list.
  const displayCountries =
    data && data.countries.length > 0
      ? data.countries.map((c) => ({
          iso: c.iso,
          name: c.name,
          flagUrl: toW40Url(c.flag_url),
        }))
      : SEED_COUNTRIES

  const atMax = selected.length >= 3
  const canConfirm = selected.length >= 2

  function handleToggle(iso: string) {
    const isSelected = selected.includes(iso)
    if (isSelected) {
      // Allow deselection freely — the confirm button enforces the minimum.
      setSelected(selected.filter((s) => s !== iso))
    } else {
      // Enforce maximum: cannot select beyond 3
      if (atMax) return
      setSelected([...selected, iso])
    }
  }

  function handleConfirm() {
    if (canConfirm) {
      onConfirm(selected)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: '#1A237E',
          marginBottom: '4px',
          marginTop: 0,
        }}
      >
        Select Countries to Compare
      </h2>
      <p
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '13px',
          color: '#6C6C70',
          marginBottom: '16px',
          marginTop: 0,
        }}
      >
        Choose 2 to 3 countries. The compare view updates when you click "Compare".
      </p>

      {/* Max constraint message */}
      {atMax && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            backgroundColor: '#FFF8E1',
            border: '1px solid #F9A825',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '13px',
            color: '#E65100',
            fontWeight: 600,
          }}
        >
          Maximum 3 countries selected. Deselect one to choose another.
        </div>
      )}

      {/* Country list */}
      <ul
        aria-label="Country selection list"
        style={{
          listStyle: 'none',
          margin: '0 0 16px 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {displayCountries.map((country) => {
          const isSelected = selected.includes(country.iso)
          // Disable adding when at max
          const isDisabled = !isSelected && atMax

          return (
            <li key={country.iso}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isSelected ? '#E8EAF0' : 'transparent',
                  border: isSelected ? '1px solid #9FA8DA' : '1px solid transparent',
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'background-color 150ms ease-in-out',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    ;(e.currentTarget as HTMLLabelElement).style.backgroundColor = isSelected
                      ? '#C5CAE9'
                      : '#F5F7FA'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    ;(e.currentTarget as HTMLLabelElement).style.backgroundColor = isSelected
                      ? '#E8EAF0'
                      : 'transparent'
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleToggle(country.iso)}
                  aria-label={`Select ${country.name}`}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#1A237E',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                />
                <img
                  src={country.flagUrl}
                  alt={`Flag of ${country.name}`}
                  width={40}
                  height={27}
                  style={{
                    objectFit: 'cover',
                    borderRadius: '2px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='27' viewBox='0 0 40 27'%3E%3Crect width='40' height='27' fill='%23e5e7eb'/%3E%3C/svg%3E"
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 400,
                    color: '#1C1C1E',
                  }}
                >
                  {country.name}
                </span>
                <span
                  style={{
                    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                    fontSize: '11px',
                    color: '#6C6C70',
                    marginLeft: 'auto',
                    letterSpacing: '0.8px',
                  }}
                >
                  {country.iso}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {/* Min constraint message — show when < 2 selected */}
      {selected.length > 0 && selected.length < 2 && (
        <p
          style={{
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '13px',
            color: '#546E7A',
            marginBottom: '12px',
          }}
        >
          Select at least one more country to compare.
        </p>
      )}

      {/* Confirm / Compare button */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        aria-disabled={!canConfirm}
        style={{
          width: '100%',
          padding: '12px 20px',
          backgroundColor: canConfirm ? '#1A237E' : '#E8EAF0',
          color: canConfirm ? '#FFFFFF' : '#9FA8DA',
          border: 'none',
          borderRadius: '4px',
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: 700,
          cursor: canConfirm ? 'pointer' : 'not-allowed',
          transition: 'background-color 150ms ease-in-out',
          letterSpacing: '0.4px',
        }}
        onMouseEnter={(e) => {
          if (canConfirm) {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#283593'
          }
        }}
        onMouseLeave={(e) => {
          if (canConfirm) {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1A237E'
          }
        }}
      >
        Compare
      </button>
    </div>
  )
}
