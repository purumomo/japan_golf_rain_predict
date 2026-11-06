from courses import is_number


def forecast_trend(values, expected_count, threshold):
    """Describe a sustained change only when the full sequence is available."""
    if len(values) != expected_count or len(values) < 2:
        return None
    differences = [right - left for left, right in zip(values, values[1:])]
    change = values[-1] - values[0]
    if change >= threshold and all(step >= 0 for step in differences):
        return "rising"
    if change <= -threshold and all(step <= 0 for step in differences):
        return "falling"
    return None


def clothing_advice(hours):
    """Return a packing checklist, using simple app guidelines rather than a comfort model."""
    keys = ("temperatureC", "precipitationMm", "precipitationProbability", "windSpeedKmh")
    values = {key: [hour[key] for hour in hours if is_number(hour.get(key))] for key in keys}
    temperatures = values["temperatureC"]
    minimum = min(temperatures, default=None)
    maximum = max(temperatures, default=None)
    rainy = max(values["precipitationMm"], default=0) > 0 or max(
        values["precipitationProbability"], default=0
    ) >= 40
    windy = max(values["windSpeedKmh"], default=0) >= 18
    items = []
    if minimum is not None:
        items.append("warmLayer" if minimum < 10 else "longSleeve" if minimum < 20 else "polo")
    if rainy:
        items.extend(["rainJacket", "spareGloves"])
        if max(values["precipitationMm"], default=0) >= 3:
            items.append("rainPants")
    elif windy:
        items.append("windJacket")
    return {
        "items": items,
        "temperatureMinC": minimum,
        "temperatureMaxC": maximum,
        "temperatureTrend": forecast_trend(temperatures, len(hours), 2),
        "windTrend": forecast_trend(values["windSpeedKmh"], len(hours), 3.6),
        "maxWindSpeedKmh": max(values["windSpeedKmh"], default=None),
        "incomplete": not hours or any(len(values[key]) != len(hours) for key in keys),
    }
