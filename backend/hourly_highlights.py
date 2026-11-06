from courses import is_number


def highlight_hours(hours):
    """Annotate notable round events without filling gaps or changing provider values."""
    temperatures = [hour.get("temperatureC") for hour in hours]
    complete = bool(temperatures) and all(is_number(value) for value in temperatures)
    coldest = None
    if complete and min(temperatures) < 20 and max(temperatures) - min(temperatures) >= 2:
        coldest = temperatures.index(min(temperatures))
    previous_precipitation = None
    lowest_wind = None
    wind_highlighted = False
    result = []
    for index, hour in enumerate(hours):
        highlights = []
        code = hour.get("weatherCode")
        snow = (hour.get("snowfallCm") or 0) > 0 or code in {71, 73, 75, 77, 85, 86}
        rain = (hour.get("rainMm") or 0) > 0 or code in {
            51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
        }
        precipitation = "snowPossible" if snow else "rainPossible" if rain else (
            "precipitationPossible" if (hour.get("precipitationMm") or 0) > 0
            or (hour.get("precipitationProbability") or 0) >= 40 else None
        )
        if precipitation and precipitation != previous_precipitation:
            highlights.append(precipitation)
        previous_precipitation = precipitation
        wind = hour.get("windSpeedKmh")
        if not is_number(wind):
            lowest_wind = None
        else:
            if not wind_highlighted and lowest_wind is not None and wind >= 18 and wind - lowest_wind >= 7.2:
                highlights.append("windIncreasing")
                wind_highlighted = True
            lowest_wind = wind if lowest_wind is None else min(lowest_wind, wind)
        if index == coldest:
            highlights.append("coldest")
        result.append({**hour, "highlights": highlights[:2]})
    return result
