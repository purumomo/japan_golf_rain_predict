import unittest

from clothing import clothing_advice


def hour(temperature=22, rain=0, probability=0, wind=0):
    return {
        "temperatureC": temperature, "precipitationMm": rain,
        "precipitationProbability": probability, "windSpeedKmh": wind,
    }


class ClothingTests(unittest.TestCase):
    def test_uses_coldest_hour_including_negative_and_zero(self):
        advice = clothing_advice([hour(-2), hour(0), hour(14)])
        self.assertEqual(advice["items"], ["warmLayer"])
        self.assertEqual((advice["temperatureMinC"], advice["temperatureMaxC"]), (-2, 14))

    def test_temperature_guideline_boundaries(self):
        for temperature, item in [(9.9, "warmLayer"), (10, "longSleeve"), (19.9, "longSleeve"), (20, "polo")]:
            with self.subTest(temperature=temperature):
                self.assertEqual(clothing_advice([hour(temperature)])["items"], [item])

    def test_rain_gear_for_amount_or_probability(self):
        for entry in [hour(rain=0.1), hour(probability=40)]:
            self.assertEqual(clothing_advice([entry])["items"], ["polo", "rainJacket", "spareGloves"])
        self.assertIn("rainPants", clothing_advice([hour(rain=3)])["items"])

    def test_wind_layer_and_no_duplicate_outerwear(self):
        self.assertIn("windJacket", clothing_advice([hour(wind=18)])["items"])
        self.assertNotIn("windJacket", clothing_advice([hour(wind=18, rain=1)])["items"])

    def test_missing_data_never_implies_warm_or_dry(self):
        self.assertEqual(clothing_advice([])["items"], [])
        advice = clothing_advice([hour(None, None, None, None)])
        self.assertTrue(advice["incomplete"])
        self.assertIsNone(advice["temperatureMinC"])
        self.assertEqual(advice["items"], [])
        self.assertEqual(clothing_advice([hour(None, rain=1)])["items"], ["rainJacket", "spareGloves"])

    def test_sustained_round_trends_and_outfit_use_the_same_forecast(self):
        advice = clothing_advice([hour(14, wind=10), hour(16, wind=14), hour(18, wind=20)])
        self.assertEqual(advice["temperatureTrend"], "rising")
        self.assertEqual(advice["windTrend"], "rising")
        self.assertEqual(advice["maxWindSpeedKmh"], 20)
        self.assertEqual(advice["items"], ["longSleeve", "windJacket"])
        falling = clothing_advice([hour(4, wind=20), hour(0, wind=10), hour(-2, wind=0)])
        self.assertEqual(falling["temperatureTrend"], "falling")
        self.assertEqual(falling["windTrend"], "falling")

    def test_fluctuating_small_or_missing_changes_do_not_claim_a_trend(self):
        rounds = [
            [hour(14, wind=10), hour(13, wind=8), hour(18, wind=20)],
            [hour(14, wind=10), hour(14.5, wind=11)],
            [hour(14, wind=10), hour(None, wind=None), hour(18, wind=20)],
            [hour(14, wind=10)],
            [],
        ]
        for hours in rounds:
            with self.subTest(hours=hours):
                advice = clothing_advice(hours)
                self.assertIsNone(advice["temperatureTrend"])
                self.assertIsNone(advice["windTrend"])
