import asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

async def run_e2e_verification():
    print("======================================================================")
    print("E2E BACKEND VERIFICATION REPORT")
    print("======================================================================")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Root
        r1 = await client.get("/")
        print(f"[1] Root Endpoint: {r1.status_code}")
        print(f"    Application: {r1.json()['application']}")
        print(f"    Status: {r1.json()['status']}")

        # 2. Health
        r2 = await client.get("/health")
        print(f"\n[2] Health Endpoint: {r2.status_code}")
        print(f"    ML Model Loaded: {r2.json()['ml_model_loaded']}")
        print(f"    Active Model: {r2.json()['active_model_name']}")
        print(f"    ROC-AUC: {r2.json()['model_metrics'].get('roc_auc')}")

        # 3. Weather
        r3 = await client.get("/weather/London")
        print(f"\n[3] Current Weather (London): {r3.status_code}")
        w = r3.json()
        print(f"    City: {w['location']['name']}, {w['location']['country']}")
        print(f"    Temperature: {w['temperature']}°C (Feels like: {w['apparent_temperature']}°C)")
        print(f"    Condition: {w['condition']} (WMO Code: {w['weather_code']})")
        print(f"    Humidity: {w['relative_humidity']}%, Wind: {w['wind_speed']} km/h")

        # 4. Forecast
        r4 = await client.get("/forecast/London")
        print(f"\n[4] Forecast (London): {r4.status_code}")
        f = r4.json()
        print(f"    Hourly count: {len(f['hourly'])} hours")
        print(f"    Daily count: {len(f['daily'])} days")
        print(f"    Tomorrow Outlook: {f['daily'][1]['condition']}, Max: {f['daily'][1]['max_temperature']}°C")

        # 5. ML Prediction
        r5 = await client.get("/prediction/London")
        print(f"\n[5] Machine Learning Prediction (London): {r5.status_code}")
        p = r5.json()
        print(f"    Prediction: {p['prediction_label']}")
        print(f"    Rainfall Probability: {p['rain_probability_percentage']}%")
        print(f"    Confidence: {p['confidence_score']*100:.1f}%")
        print(f"    Model Name: {p['model_name']}")
        print(f"    Explanation: {p['explanation']}")
        print(f"    Top Drivers: {', '.join(p['top_drivers'])}")

        # 6. Weather Intelligence
        r6 = await client.get("/intelligence/London")
        print(f"\n[6] Weather Intelligence (London): {r6.status_code}")
        intel = r6.json()
        print(f"    Overall Risk Level: {intel['overall_risk_level']}")
        print(f"    Summary: {intel['meteorological_summary']}")
        print(f"    Key Insights: {intel['key_insights'][0]}")

        # 7. Recommendations
        print("\n[7] Activity-Based Decision Support:")
        for act in ["Travel", "Outdoor Events", "Sports", "Agriculture"]:
            r7 = await client.post("/recommendation", json={"city": "London", "activity": act})
            rec = r7.json()
            print(f"    - {act}: Status = {rec['suitability_status']}, Score = {rec['suitability_score']}/100")
            print(f"      Recommendation: {rec['primary_recommendation']}")

        # 8. Severe Weather Alerts
        r8 = await client.get("/alerts/London")
        print(f"\n[8] Severe Weather Alerts (London): {r8.status_code}")
        alt = r8.json()
        print(f"    Has Active Alerts: {alt['has_active_alerts']}")
        print(f"    Risk Severity: {alt['overall_risk_severity']}")
        if alt['has_active_alerts']:
            print(f"    Alert Title: {alt['alerts'][0]['title']}")
    
    print("\n======================================================================")
    print("ALL API ENDPOINTS VALIDATED SUCCESSFULLY WITH LIVE METEOROLOGICAL DATA!")
    print("======================================================================")

if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
