# Golf Rain MVP Product Requirements

## 1. Product goal
A mobile-first Japanese golf-course weather web app. Users select a golf course, a date and tee-off time, then see forecast rain risk during their planned round (default five hours). The key pain point is that general weather apps can be inaccurate for a specific golf course. The MVP focuses on location-specific, transparent information, **not** a claim of superior forecast accuracy.

## 2. Audience
Golfers booking rounds in Japan. Start with approximately 30 to 50 verified golf courses in the Kanto region.

## 3. Core user journey
1. Search and select a golf course from a local list.
2. Choose a future date within the provider's available forecast horizon.
3. Choose a tee time, such as 08:30.
4. View hourly precipitation probability and precipitation amount across the next five hours, including wind speed when available.
5. Highlight riskier hours; display the data source and most recent forecast time.

## 4. Required features
- Course search by name, using a bundled JSON dataset with real names, accurate latitude/longitude, and source attribution.
- Date and tee-time selection, using Asia/Tokyo for all displayed times.
- Live forecast request for the course coordinates, using an officially documented weather API such as Open-Meteo, subject to applicable usage terms.
- Readable mobile-first hourly chart and a plain-language risk summary.
- Clear loading, API failure, missing forecast, and out-of-range date states.
- Accessible UI and responsive design.

## 5. Weather calculation rules
- A round spans five hours after tee-off by default; clearly label this as an estimate.
- Hourly precipitation probability describes the provider's relevant hourly forecast probability. Never treat the maximum hourly probability as the mathematical probability of rain at any point in the five-hour window.
- Present the highest hourly probability clearly labeled as such, plus the hourly timeline. Do not invent an overall-round probability.
- Where an API supplies hourly data, align hour bins correctly for half-hour tee times and explain any approximation.
- Do not present forecast model output as measured rain or guarantee accuracy.

## 6. Explicitly out of scope
- Training a forecast model or claiming forecast improvements without evidence.
- Historical backtesting and radar fusion.
- Account creation, login, database, payments, subscriptions, notifications.
- Booking integration, consumer weather scraping, LLM integration.
- Multi-provider comparison in the first release; revisit after validating the basic product.

## 7. Technical approach
- Next.js with TypeScript and Tailwind CSS, using existing stable and supported versions verified before installation.
- Simple static `courses.json` file.
- Open-Meteo or an alternative documented forecast API with precipitation probability, precipitation amount and optional wind speed; inspect current documentation before coding.
- Deployable to Vercel; no database needed.
- Keep weather source attribution and licensing/usage limitations visible. Check commercial usage terms before monetizing.
- Since independent weather forecasting in Japan can trigger licensing requirements, display and contextualize licensed source forecasts instead of generating a proprietary probability for public release.

## 8. Acceptance criteria
- A user can select a course, date and tee time and see **real** forecast values for the relevant five-hour window.
- Hourly values and selected window match source timestamps in JST.
- Loading, failure, and unsupported dates are handled without fake results.
- Works on a mobile-sized screen.
- The maximum hourly rain probability is labeled correctly.
- `lint`, TypeScript checks, tests for time-window logic, and production build pass.

## 9. Future hypotheses (do not build yet)
- Add a second weather provider with comparable definitions and transparent disagreement.
- Track forecast changes after users save a scheduled round.
- Collect optional verified on-course feedback and evaluate forecast calibration.
- Explore weather-data partnerships and a premium product only after validation.

## 10. Development priorities
First build the course search, date/time selection and working hourly forecast display. Then verify time calculations, error handling and responsive design. Avoid architectural complexity.
