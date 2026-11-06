from courses import is_number


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
        "incomplete": not hours or any(len(values[key]) != len(hours) for key in keys),
    }
