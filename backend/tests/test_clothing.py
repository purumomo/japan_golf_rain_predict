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
        self.assertEqual(advice["items"], ["warmLayer", "longSleeve", "insulatedJacket", "thermalPants", "beanie", "neckWarmer"])
        self.assertEqual((advice["temperatureMinC"], advice["temperatureMaxC"]), (-2, 14))

    def test_temperature_guideline_boundaries(self):
        for temperature, items in [
            (4.9, ["warmLayer", "longSleeve", "insulatedJacket", "thermalPants", "beanie", "neckWarmer"]),
            (5, ["warmLayer", "longSleeve", "fleece", "thermalPants"]),
            (9.9, ["warmLayer", "longSleeve", "fleece", "thermalPants"]),
            (10, ["longSleeve", "vest", "golfPants"]),
            (14.9, ["longSleeve", "vest", "golfPants"]),
            (15, ["longSleeve", "golfPants"]), (19.9, ["longSleeve", "golfPants"]),
            (20, ["polo", "golfPants"]), (25, ["polo", "lightPants", "cap"]),
            (28, ["polo", "lightPants", "cap", "towel"]),
        ]:
            with self.subTest(temperature=temperature):
                self.assertEqual(clothing_advice([hour(temperature)])["items"], items)

    def test_rain_gear_for_amount_or_probability(self):
        for entry in [hour(rain=0.1), hour(probability=40)]:
            self.assertEqual(clothing_advice([entry])["items"], ["polo", "golfPants", "rainJacket", "rainHat", "waterproofShoes", "spareGloves", "towel"])
        self.assertIn("rainPants", clothing_advice([hour(rain=3)])["items"])

    def test_wind_layer_and_no_duplicate_outerwear(self):
        self.assertIn("windJacket", clothing_advice([hour(19, wind=18)])["items"])
        self.assertNotIn("windJacket", clothing_advice([hour(19, wind=18, rain=1)])["items"])

    def test_warm_windy_round_does_not_recommend_windproof_outerwear(self):
        for temperature in [20, 25, 30]:
            for wind in [18, 36, 60]:
                with self.subTest(temperature=temperature, wind=wind):
                    advice = clothing_advice([hour(temperature, wind=wind)])
                    self.assertNotIn("windJacket", advice["items"])
                    self.assertIn("polo", advice["items"])
                    self.assertEqual(advice["maxWindSpeedKmh"], wind)

    def test_wind_layer_requires_same_hour_cool_temperature_and_wind(self):
        for hours in [
            [hour(16, wind=0), hour(25, wind=36)],
            [hour(None, wind=36)],
            [hour(19, wind=None)],
            [hour(19.9, wind=17.9)],
        ]:
            with self.subTest(hours=hours):
                self.assertNotIn("windJacket", clothing_advice(hours)["items"])
        self.assertIn("windJacket", clothing_advice([hour(19.9, wind=18)])["items"])

    def test_warm_rainy_round_keeps_rain_protection(self):
        items = clothing_advice([hour(25, rain=1, wind=25)])["items"]
        self.assertIn("rainJacket", items)
        self.assertNotIn("windJacket", items)

    def test_hot_or_rainy_round_packs_only_one_towel(self):
        items = clothing_advice([hour(30, rain=3, wind=25)])["items"]
        self.assertIn("lightPants", items)
        self.assertIn("rainPants", items)
        self.assertIn("cap", items)
        self.assertEqual(items.count("towel"), 1)
        self.assertEqual(len(items), len(set(items)))
        self.assertNotIn("windJacket", items)

    def test_cold_wind_avoids_redundant_jackets_and_rain_keeps_shell(self):
        items = clothing_advice([hour(-2, wind=25)])["items"]
        self.assertIn("insulatedJacket", items)
        self.assertNotIn("windJacket", items)
        self.assertIn("rainJacket", clothing_advice([hour(-2, rain=1)])["items"])

    def test_variable_temperature_retains_cold_layers_and_warm_weather_accessories(self):
        items = clothing_advice([hour(8), hour(28)])["items"]
        self.assertIn("warmLayer", items)
        self.assertIn("fleece", items)
        self.assertIn("thermalPants", items)
        self.assertIn("cap", items)
        self.assertIn("towel", items)
        self.assertNotIn("polo", items)

    def test_missing_data_never_implies_warm_or_dry(self):
        self.assertEqual(clothing_advice([])["items"], [])
        advice = clothing_advice([hour(None, None, None, None)])
        self.assertTrue(advice["incomplete"])
        self.assertIsNone(advice["temperatureMinC"])
        self.assertEqual(advice["items"], [])
        self.assertEqual(clothing_advice([hour(None, rain=1)])["items"], ["rainJacket", "rainHat", "waterproofShoes", "spareGloves", "towel"])

    def test_sustained_round_trends_and_outfit_use_the_same_forecast(self):
        advice = clothing_advice([hour(14, wind=10), hour(16, wind=14), hour(18, wind=20)])
        self.assertEqual(advice["temperatureTrend"], "rising")
        self.assertEqual(advice["windTrend"], "rising")
        self.assertEqual(advice["maxWindSpeedKmh"], 20)
        self.assertEqual(advice["items"], ["longSleeve", "vest", "golfPants", "windJacket"])
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
