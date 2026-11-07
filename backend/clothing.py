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
    # Require cool temperatures and wind in the same hour, not separate round extremes.
    cool_and_windy = any(
        is_number(hour.get("temperatureC"))
        and hour["temperatureC"] < 20
        and is_number(hour.get("windSpeedKmh"))
        and hour["windSpeedKmh"] >= 18
        for hour in hours
    )
    items = []
    if minimum is not None:
        if minimum < 5:
            items.extend(["warmLayer", "longSleeve", "insulatedJacket", "thermalPants", "beanie", "neckWarmer"])
        elif minimum < 10:
            items.extend(["warmLayer", "longSleeve", "fleece", "thermalPants"])
        elif minimum < 15:
            items.extend(["longSleeve", "vest", "golfPants"])
        elif minimum < 20:
            items.extend(["longSleeve", "golfPants"])
        else:
            items.extend(["polo", "lightPants" if minimum >= 25 else "golfPants"])
        if maximum >= 25:
            items.append("cap")
        if maximum >= 28:
            items.append("towel")
    if rainy:
        items.extend(["rainJacket", "rainHat", "waterproofShoes", "spareGloves"])
        if "towel" not in items:
            items.append("towel")
        if max(values["precipitationMm"], default=0) >= 3:
            items.append("rainPants")
    elif cool_and_windy and "insulatedJacket" not in items:
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
