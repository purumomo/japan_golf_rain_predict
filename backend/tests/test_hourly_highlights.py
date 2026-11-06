import unittest

from hourly_highlights import highlight_hours


def hour(temperature=15, wind=10, rain=0, snow=0, probability=0, code=0):
    return {"temperatureC": temperature, "windSpeedKmh": wind, "rainMm": rain,
            "snowfallCm": snow, "precipitationMm": rain, "precipitationProbability": probability,
            "weatherCode": code}


class HourlyHighlightTests(unittest.TestCase):
    def test_only_one_coldest_label_with_meaningful_difference(self):
        result = highlight_hours([hour(-2), hour(-2), hour(2)])
        self.assertEqual([entry["highlights"] for entry in result], [["coldest"], [], []])
        for hours in [[hour(15), hour(15.5)], [hour(25), hour(30)], [hour(0), hour(None), hour(4)]]:
            self.assertFalse(any("coldest" in entry["highlights"] for entry in highlight_hours(hours)))

    def test_wind_increase_is_significant_and_not_repeated(self):
        result = highlight_hours([hour(wind=9), hour(wind=15), hour(wind=18), hour(wind=24)])
        self.assertEqual([entry["highlights"] for entry in result], [[], [], ["windIncreasing"], []])
        for hours in [[hour(wind=20), hour(wind=22)], [hour(wind=5), hour(wind=14)],
                      [hour(wind=9), hour(wind=None), hour(wind=20)]]:
            self.assertFalse(any(entry["highlights"] for entry in highlight_hours(hours)))

    def test_precipitation_onsets_and_type_changes_not_every_wet_hour(self):
        result = highlight_hours([hour(), hour(rain=1), hour(rain=2), hour(snow=1), hour(snow=2)])
        self.assertEqual([entry["highlights"] for entry in result],
                         [[], ["rainPossible"], [], ["snowPossible"], []])
        result = highlight_hours([hour(code=61), hour(), hour(probability=40), hour(probability=50)])
        self.assertEqual([entry["highlights"] for entry in result],
                         [["rainPossible"], [], ["precipitationPossible"], []])

    def test_missing_and_zero_data_never_invent_events_or_mutate_source(self):
        source = [hour(temperature=None, wind=None, rain=None, snow=None, probability=None, code=None), hour()]
        self.assertEqual([entry["highlights"] for entry in highlight_hours(source)], [[], []])
        self.assertNotIn("highlights", source[0])
        self.assertEqual(highlight_hours([]), [])

    def test_at_most_two_notices_per_card(self):
        result = highlight_hours([hour(18, wind=9), hour(14, wind=20, rain=1)])
        self.assertEqual(result[1]["highlights"], ["rainPossible", "windIncreasing"])
