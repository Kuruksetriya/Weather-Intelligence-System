# Academic Viva & Project Defense Guide
## AI-Based Weather Intelligence & Decision Support System

Use this guide to prepare for your project demonstration, viva voce, and technical questioning by professors or external examiners.

---

### Question 1: What is the main objective of your project?
**Answer**:  
The objective is to create an end-to-end full-stack weather intelligence platform that does not just display raw weather numbers, but synthesizes live meteorological data with custom-trained machine learning models and domain-specific decision rules. It provides explainable short-range precipitation probabilities and actionable advisories for Travel, Outdoor Events, Sports, and Agriculture.

---

### Question 2: Why didn't you use standard Random Train/Test Split or K-Fold Cross-Validation?
**Answer**:  
Meteorological observations are time-series data characterized by strong temporal autocorrelation. If random splitting were applied, an observation at 2:00 PM would be in the test set while 1:00 PM and 3:00 PM observations were in the training set. This causes severe data leakage, giving the model access to past and future points of the same weather system and artificially inflating accuracy. We used **chronological temporal splitting** (first 80% chronologically for training, holdout last 20% for testing), which authentically replicates operational forecasting where a model must predict unseen future events.

---

### Question 3: How does your ML model predict rainfall, and what is its target?
**Answer**:  
- **Prediction Target**: Binary classification of whether cumulative rainfall in the upcoming 1 to 3 hours ($t+1, t+2, t+3$) exceeds $0.1\text{ mm}$.
- **Zero Leakage**: The target is calculated from future precipitation, but future precipitation is completely excluded from the predictor feature matrix $X$.
- **Features Used**: Temperature, relative humidity, apparent temperature, surface barometric pressure, 3-hour pressure trend, 3-hour humidity trend, antecedent 3-hour rainfall, dew point spread, wind speed, wind direction, hour of day, and month.

---

### Question 4: What machine learning models were trained and what were the experimental results?
**Answer**:  
We trained and evaluated three models on 7,013 holdout test samples:
1. **Logistic Regression (Class-Balanced)**: Accuracy: 77.23%, Precision: 46.29%, Recall: 73.81%, F1: 56.90%, ROC-AUC: 0.8419.
2. **Decision Tree (depth=6)**: Accuracy: 75.72%, Precision: 44.88%, Recall: 84.45%, F1: 58.61%, ROC-AUC: 0.8631.
3. **Random Forest (100 trees)**: Accuracy: 80.21%, Precision: 50.88%, Recall: 80.60%, F1: 62.38%, ROC-AUC: 0.8792.

**Why Random Forest?**: It delivered the highest overall F1-score and ROC-AUC (0.8792) while maintaining an $80.60\%$ recall on rain events. Its ensemble bagging reduces tree variance and handles non-linear atmospheric feature interactions effectively.

---

### Question 5: What is the most important feature according to the trained model?
**Answer**:  
The most influential features ranked by Gini impurity gain:
1. `past_precip_3h` ($41.37\%$): Reflects short-term precipitation continuity.
2. `surface_pressure` ($18.68\%$): Low barometric pressure indicates storm troughs.
3. `pressure_trend_3h` ($8.39\%$): Rapid barometric drops herald frontal boundaries.
4. Wind vectors, relative humidity, and dew point spread.

---

### Question 6: What is the difference between the Open-Meteo forecast and your ML model?
**Answer**:  
Open-Meteo provides forecasts derived from Numerical Weather Prediction (NWP) simulations running on supercomputers (solving physical conservation equations of atmosphere). Our ML model is a statistical classifier trained locally on historical meteorological observations. They are separate components: our FastAPI backend combines them into synthesized Weather Intelligence.

---

### Question 7: How does the Activity-Based Decision Support System work?
**Answer**:  
It uses an explainable, rule-based expert evaluation layer with domain thresholds:
- **Travel**: Evaluates road friction, severe thunderstorms, fog visibility, and high crosswinds.
- **Outdoor Events**: Checks marquee wind stability ($>35\text{ km/h}$), rain probability, and thermal comfort.
- **Sports**: Evaluates surface slipperiness, lightning safety (30/30 rule), ball deflection, and heat exhaustion index.
- **Agriculture**: Evaluates foliar spray drift (winds $>15\text{ km/h}$ cause drift, $<3\text{ km/h}$ cause inversions), chemical rain wash-off, and crop frost danger.

---

### Question 8: How did you test the application?
**Answer**:  
We implemented automated backend tests using `pytest` and `httpx` testing all 8 REST endpoints (Root, Health, Weather, Forecast, ML Prediction, Weather Intelligence, Recommendations for all 4 activities, Severe Alerts, and 404 handling) as well as ML unit inference logic. All 10 tests passed with 100% success rate. The React TypeScript frontend was verified with Vite production compilation with zero errors.
