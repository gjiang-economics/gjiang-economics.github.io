# Research Design Specification

*Last updated: 2026-04-14*

## Research Question & Identification

**Research question:** What is the effect of European immigration on house prices in American cities between 1900 and 1930?

**Identification strategy:** Instrumental variables (2SLS) using a shift-share (Bartik) instrument.

The instrument exploits the interaction between the initial settlement pattern of European country groups in 1900 and subsequent national-level immigration flows from those same groups. The intuition: cities where, say, Italians clustered in 1900 received more Italian immigrants in later decades when Italian emigration surged — but the national-level flow is plausibly exogenous to any single city's housing market conditions.

**Key mechanism:** [Not yet specified]

**Contribution:** [Not yet specified]

## Variable Definitions

**Dependent variable:**
- House price outcomes -> Lyons, Shertzer, Gray, and Agorastos replication data (multiple measures)
  - House price index (repeat-sales HPI)
  - Rental price index (RPI)
  - Simple average prices
- Definition: City-level annual house price measures constructed from historical real estate transaction records for up to 30 US cities, 1890–2006. The project will estimate using each available price measure to test robustness.

**Main independent variable (treatment/exposure):**
- Recent immigration share -> IPUMS Census micro-data
- Definition: ImmigShare_ct = Σ_{s=t-k+1}^{t} (immigrants arriving in year s in city c) / Pop_c,1900. Baseline uses k=5 (past 5 years); robustness uses k=10 (past 10 years). The denominator (1900 population) is fixed across all years to avoid endogeneity from population responding to treatment.
- Construction from micro-data: The IPUMS complete-count Census records each foreign-born individual's arrival year (YRIMMIG) and geographic location (METAREA or CITY). Although the Census is conducted decennially (1910, 1920, 1930), YRIMMIG allows recovery of annual arrival flows: for each Census, count European-born individuals by their YRIMMIG and their METAREA/CITY to obtain the number of immigrants who arrived in each year in each city. Pooling across Census years yields an annual city-level inflow series, which is then summed over the rolling k-year window to produce the immigration share.
- The detailed coding system of BPL is here: https://usa.ipums.org/usa-action/variables/bpl#codes_section (or in stata, use `label list BPL`)
- The detailed coding system of METAREA is here: https://usa.ipums.org/usa-action/variables/metarea#codes_section (or in stata, use `label list METAREA`)
- The detailed coding system of CITY is here: https://usa.ipums.org/usa-action/variables/CITY#codes_section (or in stata, use `label list CITY`)

**Instrument:**
- Predicted immigration share (shift-share / Bartik)
- Definition: Z_ct = Σ_g (share_gc,1900 × Σ_{s=t-k+1}^{t} Flow_gs), where:
  - share_gc,1900 = share of European country group g in city c's population in the 1900 Census (from IPUMS BPL variable)
  - Flow_gs = national immigration flow from country group g in year s (from Historical Statistics of the United States)
  - k matches the endogenous variable (k=5 baseline, k=10 robustness)

**Key controls:** None beyond fixed effects. The baseline specification includes city and year fixed effects only.

## Data Sources & Linkage

**Datasets used:**
- **Lyons, Shertzer, Gray, and Agorastos house price data:** City-level annual house price indices (HPI, RPI, simple prices) for up to 30 US cities, covering 1890–2006. Used for the dependent variable. Path: data\raw\lyons_house_prices
- **IPUMS complete-count Census micro-data (1900, 1910, 1920, 1930):** Individual-level Census records. Used to construct the immigration share (treatment variable) and the 1900 settlement shares (instrument component). Key variables: BPL (birthplace), YRIMMIG (year of immigration), CITY, METAREA. Path: data\raw\ipums_usa
- **Historical Statistics of the United States (HSUS):** National-level annual immigration flows by European country/country group. Used for the "shift" component of the instrument. Path: data\raw\historical_statistics

**Data crosswalks:**
- **Census geography → Lyons cities:** Maps METAREA (or CITY) codes in the IPUMS Census to city identifiers in the Lyons house price data, enabling the merge between immigration shares and house prices.
- **IPUMS BPL → HSUS country groups:** Reconciles birthplace codes in the Census with country categories in the Historical Statistics so that settlement shares and national flows use consistent country group definitions. In some cases BPL is more granular and must be aggregated up; in other cases the HSUS classification is finer. The crosswalk is determined case by case.

**Using YRIMMIG to identify immigrant arrival years:** Each Census records YRIMMIG (year of first arrival in the US) for foreign-born individuals. To construct annual immigrant inflows for a given city, count individuals by YRIMMIG within each Census. Since multiple Censuses may observe the same arrival year, assign each arrival year to a single Census to avoid double-counting:

| Census | Arrival years observed via YRIMMIG |
|--------|-----------------------------------|
| 1910   | < 1910 (i.e., 1900–1909)         |
| 1920   | 1910–1919                         |
| 1930   | 1920–1929                         |

Boundary years (e.g., 1910) go to the next Census using strict inequality (< 1910, not ≤ 1910), because Census Day falls within that year and we cannot distinguish pre- vs post-Census Day arrivals. Arrivals in 1930 are excluded (no subsequent Census available).

## Regression Specification(s)

**Main specification (OLS):**

```
y_ct = α + β × ImmigShare_ct + δ_c + θ_t + ε_ct
```

**Main specification (2SLS):**

First stage:
```
ImmigShare_ct = π_0 + π_1 × Z_ct + δ_c + θ_t + u_ct
```

Second stage:
```
y_ct = α + β × ImmigShare_hat_ct + δ_c + θ_t + ε_ct
```

where:
- y_ct = house price outcome for city c in year t (HPI, RPI, or simple prices)
- ImmigShare_ct = immigration share as defined in Variable Definitions
- Z_ct = shift-share instrument as defined in Variable Definitions
- δ_c = city fixed effects
- θ_t = year fixed effects

**Standard errors:** Both robust standard errors and standard errors clustered at the city level will be reported.

**Estimation commands (Stata):** Use `reghdfe` for OLS with high-dimensional fixed effects, and `ivreghdfe` for 2SLS with high-dimensional fixed effects.

**Alternative specifications:**
- CITY instead of METAREA as geographic unit (see Methodological decisions for rationale)
- Different dependent variables (HPI, RPI, simple prices)
- 10-year immigration window (k=10) instead of baseline 5-year window (k=5)

## Sample Restrictions

**Unit of observation:** City-year (annual panel)

**Time period:** 1900–1930 for house prices. Immigrant flows cover 1900–1929; arrivals in 1930 are excluded because no subsequent Census is available to observe them.

**Geographic scope:** US cities covered by both the Lyons house price data and IPUMS Census data.

**Exclusions:**
- No city exclusions based on population thresholds

## Key Assumptions & Decisions

**Identifying assumptions:**
- [Not yet specified]

**Methodological decisions:**
- **Geographic unit:** METAREA as baseline (fixed 1950 county-group boundaries; captures housing market spillovers beyond city limits). CITY as robustness check. 
- **Denominator:** Fixed 1900 population for immigration share — avoids endogeneity from contemporaneous population changes.
- **Country group crosswalk:** Between IPUMS BPL and HSUS, reconciled case by case (see Data crosswalks above).
