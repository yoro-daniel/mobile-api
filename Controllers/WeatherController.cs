using System.Globalization;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

namespace MobileApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private static readonly string[] CurrentMetrics =
        {
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        };

        private static readonly string[] HourlyMetrics =
        {
            "temperature_2m",
            "apparent_temperature",
            "precipitation_probability",
            "precipitation",
            "weather_code"
        };

        private static readonly string[] DailyMetrics =
        {
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "precipitation_sum"
        };

        private readonly IHttpClientFactory _httpClientFactory;

        public WeatherController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("forecast")]
        public async Task<IActionResult> Forecast(
            [FromQuery] double? latitude,
            [FromQuery] double? longitude,
            [FromQuery] string timezone = "auto",
            CancellationToken cancellationToken = default)
        {
            if (latitude is null || longitude is null)
            {
                return BadRequest(new
                {
                    message = "latitude and longitude are required query parameters."
                });
            }

            var lat = latitude.Value;
            var lon = longitude.Value;

            if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
            {
                return BadRequest(new
                {
                    message = "latitude must be between -90 and 90, and longitude must be between -180 and 180."
                });
            }

            var url =
                "https://api.open-meteo.com/v1/forecast" +
                $"?latitude={lat.ToString(CultureInfo.InvariantCulture)}" +
                $"&longitude={lon.ToString(CultureInfo.InvariantCulture)}" +
                $"&timezone={Uri.EscapeDataString(timezone)}" +
                $"&current={string.Join(",", CurrentMetrics)}" +
                $"&hourly={string.Join(",", HourlyMetrics)}" +
                $"&daily={string.Join(",", DailyMetrics)}" +
                "&forecast_days=7" +
                "&wind_speed_unit=kmh";

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            try
            {
                using var response = await client.GetAsync(url, cancellationToken);
                var payload = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new
                    {
                        message = "Forecast provider request failed.",
                        providerResponse = payload
                    });
                }

                return Content(payload, "application/json");
            }
            catch (OperationCanceledException)
            {
                return StatusCode(StatusCodes.Status504GatewayTimeout, new
                {
                    message = "Forecast request timed out."
                });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    message = "Forecast provider is unreachable from this server.",
                    detail = ex.Message
                });
            }
        }
    }
}
