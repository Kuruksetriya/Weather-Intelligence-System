# Historical Meteorological Dataset

## 1. Dataset Overview
- **Data Source**: [Open-Meteo Historical Weather Archive API](https://open-meteo.com/en/docs/historical-weather-api)
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Geographical Coordinates**: Latitude 51.5074° N, Longitude -0.1278° W (London, UK)
- **Temporal Horizon**: 2021-01-01 00:00:00 to 2024-12-31 23:00:00 UTC (4 full calendar years)
- **Temporal Resolution**: Hourly observations
- **Total Raw Records**: 35,064 records
- **Valid Processed Records**: 35,061 records (after lag and shift alignment)

---

## 2. Variables & Meteorological Features

### Input Features ($t \le \text{current}$)
| Feature | Type | Unit | Meteorological Significance |
|---|---|---|---|
| `temperature_2m` | Float | °C | Air temperature at 2 meters above ground |
| `relative_humidity_2m` | Float | % | Atmospheric moisture saturation level |
| `apparent_temperature` | Float | °C | Perceived "feels-like" temperature accounting for humidity and wind |
| `dew_point_2m` | Float | °C | Temperature to which air must be cooled to become saturated with water vapor |
| `dew_point_spread` | Float | °C | Spread between temperature and dew point. Low values ($<2^\circ\text{C}$) signify condensation/saturation |
| `surface_pressure` | Float | hPa | Local atmospheric pressure at surface level |
| `pressure_trend_3h` | Float | hPa/3h | Barometric pressure tendency over past 3 hours. Falling pressure indicates approaching low-pressure storm front |
| `humidity_trend_3h` | Float | %/3h | Moisture trend over past 3 hours |
| `past_precip_3h` | Float | mm | Accumulated precipitation over past 3 hours |
| `wind_speed_10m` | Float | km/h | Sustained wind speed at 10 meters height |
| `wind_direction_10m` | Float | Degrees | Direction from which wind originates |
| `hour` | Integer | 0-23 | Diurnal solar heating cycle indicator |
| `month` | Integer | 1-12 | Seasonal climate cycle indicator |

### Target Variable ($t > \text{current}$)
| Target | Type | Definition |
|---|---|---|
| `target_rain_next_3h` | Binary (0 / 1) | `1` if cumulative precipitation across the subsequent 3 hours ($t+1, t+2, t+3$) $> 0.1\text{ mm}$; `0` otherwise. |

> **Note on Data Leakage Prevention**: Future precipitation values are strictly used to compute `target_rain_next_3h` and are completely excluded from the predictor feature matrix $X$.

---

## 3. Preprocessing Decisions
1. **Chronological Ordering**: The dataset was verified and sorted chronologically without time gaps.
2. **Missing Values**: Verified zero missing values across the 35,064 raw API rows.
3. **Outlier Filtering**: Clamped physical constraints ($0 \le \text{humidity} \le 100$, $\text{precipitation} \ge 0$, $\text{wind speed} \ge 0$).
4. **Boundary Truncation**: Dropped the first 3 rows due to the 3-hour backward lag, and the last 3 rows due to the 3-hour forward target window.
5. **Class Balance**: 
   - Non-rain periods: 28,081 records (80.09%)
   - Rain periods: 6,980 records (19.91%)
