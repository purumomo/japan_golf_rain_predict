import requests


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def fetch_json(url, params):
    try:
        response = requests.get(
            url,
            params=params,
            headers={"Accept": "application/json", "User-Agent": "GolfRain/0.1 (golf course weather)"},
            timeout=(5, 12),
        )
        if response.status_code == 429:
            raise ApiError(429, "Provider is busy. Please retry shortly.")
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as error:
        raise ApiError(502, "Provider lookup failed. Please retry shortly.") from error
