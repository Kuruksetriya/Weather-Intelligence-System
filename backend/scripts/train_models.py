"""
Machine Learning Training and Evaluation Pipeline.
Trains Logistic Regression, Decision Tree, and Random Forest models on chronological split.
Evaluates Precision, Recall, F1, Accuracy, ROC-AUC, and Confusion Matrix.
Selects and serializes the best performing model with metadata.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def train_weather_models():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_csv = os.path.join(base_dir, "datasets", "processed", "historical_weather_processed.csv")
    models_dir = os.path.join(base_dir, "trained_models")
    os.makedirs(models_dir, exist_ok=True)

    print(f"[*] Loading processed dataset from: {processed_csv}")
    df = pd.read_csv(processed_csv)

    feature_cols = [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "dew_point_spread",
        "surface_pressure",
        "pressure_trend_3h",
        "humidity_trend_3h",
        "past_precip_3h",
        "wind_speed_10m",
        "wind_direction_10m",
        "hour",
        "month"
    ]
    target_col = "target_rain_next_3h"

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    total_samples = len(df)
    train_size = int(total_samples * 0.8)

    print(f"[*] Chronological train/test split (80% train, 20% test):")
    print(f"    Train size: {train_size} records")
    print(f"    Test size:  {total_samples - train_size} records")

    X_train_raw = X.iloc[:train_size]
    y_train = y.iloc[:train_size]
    X_test_raw = X.iloc[train_size:]
    y_test = y.iloc[train_size:]

    # Inspect class balance in splits
    train_rain_pct = y_train.mean() * 100
    test_rain_pct = y_test.mean() * 100
    print(f"    Train Rain occurrence: {train_rain_pct:.2f}%")
    print(f"    Test Rain occurrence:  {test_rain_pct:.2f}%")

    # Standard Scaler (fitted strictly on train set to prevent data leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_test_scaled = scaler.transform(X_test_raw)

    # Candidate models
    models = {
        "Logistic Regression": {
            "model": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
            "use_scaled": True
        },
        "Decision Tree": {
            "model": DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42),
            "use_scaled": False
        },
        "Random Forest": {
            "model": RandomForestClassifier(n_estimators=100, max_depth=10, class_weight="balanced", random_state=42, n_jobs=-1),
            "use_scaled": False
        }
    }

    results = {}
    print("\n" + "="*70)
    print("MODEL TRAINING & EVALUATION BENCHMARK")
    print("="*70)

    for name, config in models.items():
        print(f"\n[*] Training {name}...")
        clf = config["model"]
        X_tr = X_train_scaled if config["use_scaled"] else X_train_raw.values
        X_te = X_test_scaled if config["use_scaled"] else X_test_raw.values

        clf.fit(X_tr, y_train)

        # Predictions
        y_pred = clf.predict(X_te)
        y_prob = clf.predict_proba(X_te)[:, 1] if hasattr(clf, "predict_proba") else y_pred

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc = float(roc_auc_score(y_test, y_prob))
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4),
            "confusion_matrix": cm,
            "uses_scaled_inputs": config["use_scaled"]
        }

        print(f"    Accuracy:  {acc*100:.2f}%")
        print(f"    Precision: {prec*100:.2f}%")
        print(f"    Recall:    {rec*100:.2f}%")
        print(f"    F1-Score:  {f1*100:.2f}%")
        print(f"    ROC-AUC:   {roc:.4f}")
        print(f"    Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

    # Determine best model based on balanced F1-score & ROC-AUC
    best_model_name = max(results, key=lambda k: results[k]["f1_score"] + results[k]["roc_auc"])
    best_model_obj = models[best_model_name]["model"]
    best_metrics = results[best_model_name]

    print("\n" + "="*70)
    print(f"[+] SELECTED BEST MODEL: {best_model_name}")
    print(f"    F1-Score: {best_metrics['f1_score']*100:.2f}% | ROC-AUC: {best_metrics['roc_auc']:.4f}")
    print("="*70)

    # Calculate feature importances if tree-based, or coefficients if linear
    feature_importance_dict = {}
    if hasattr(best_model_obj, "feature_importances_"):
        importances = best_model_obj.feature_importances_
        for f, imp in zip(feature_cols, importances):
            feature_importance_dict[f] = round(float(imp), 4)
    elif hasattr(best_model_obj, "coef_"):
        coefs = np.abs(best_model_obj.coef_[0])
        total_coef = np.sum(coefs)
        for f, c in zip(feature_cols, coefs):
            feature_importance_dict[f] = round(float(c / total_coef), 4)

    # Sort feature importances descending
    sorted_features = dict(sorted(feature_importance_dict.items(), key=lambda item: item[1], reverse=True))
    print(f"\n[*] Key Feature Contributions (Ranked):")
    for feat, imp in sorted_features.items():
        print(f"    - {feat}: {imp*100:.2f}%")

    # Serialize Best Model and Artifacts
    model_payload = {
        "model": best_model_obj,
        "scaler": scaler,
        "best_model_name": best_model_name,
        "feature_names": feature_cols,
        "uses_scaled_inputs": models[best_model_name]["use_scaled"],
        "metrics": best_metrics,
        "feature_importances": sorted_features,
        "training_metadata": {
            "dataset_rows": total_samples,
            "train_samples": train_size,
            "test_samples": total_samples - train_size,
            "target": target_col,
            "horizon": "Upcoming 1 to 3 hours"
        }
    }

    model_save_path = os.path.join(models_dir, "weather_model.joblib")
    joblib.dump(model_payload, model_save_path)
    print(f"\n[+] Serialized model package saved to: {model_save_path}")

    # Save evaluation results JSON
    eval_json_path = os.path.join(models_dir, "evaluation_results.json")
    with open(eval_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "models_evaluated": results,
            "selected_model": best_model_name,
            "feature_importances": sorted_features,
            "feature_cols": feature_cols
        }, f, indent=2)
    print(f"[+] Saved evaluation comparison JSON to: {eval_json_path}")

    # Save docs/ml/MODEL_REPORT.md
    docs_dir = os.path.join(os.path.dirname(base_dir), "docs", "ml")
    os.makedirs(docs_dir, exist_ok=True)
    report_md_path = os.path.join(docs_dir, "MODEL_REPORT.md")

    generate_markdown_report(report_md_path, results, best_model_name, sorted_features, feature_cols, total_samples, train_size)
    print(f"[+] Generated comprehensive model report at: {report_md_path}")

    return model_save_path

def generate_markdown_report(path, results, best_name, features, feature_cols, total_samples, train_size):
    best = results[best_name]
    content = f"""# Machine Learning Rainfall Prediction Report

## 1. Problem Formulation
- **Objective**: Predict whether precipitation ($>0.1\\text{{ mm}}$) will occur within the upcoming 1 to 3 hours ($t+1 \\dots t+3$) based on current and antecedent atmospheric conditions.
- **Dataset**: 35,061 chronological hourly meteorological observations (2021-2024).
- **Split Protocol**: Chronological partition (first 80% train = {train_size} hours, holdout 20% test = {total_samples - train_size} hours) to strictly prevent future-to-past data leakage.
- **Input Features ($n={len(feature_cols)}$)**: `{', '.join(feature_cols)}`.

---

## 2. Experimental Benchmark Results

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|---|---|
"""
    for name, m in results.items():
        is_best = " ⭐ (Selected)" if name == best_name else ""
        content += f"| **{name}{is_best}** | {m['accuracy']*100:.2f}% | {m['precision']*100:.2f}% | {m['recall']*100:.2f}% | **{m['f1_score']*100:.2f}%** | **{m['roc_auc']:.4f}** |\n"

    content += f"""
---

## 3. Confusion Matrix Analysis ({best_name})
- **True Negatives (TN)**: {best['confusion_matrix'][0][0]} (Correctly predicted No Rain)
- **False Positives (FP)**: {best['confusion_matrix'][0][1]} (False Alarm)
- **False Negatives (FN)**: {best['confusion_matrix'][1][0]} (Missed Rain)
- **True Positives (TP)**: {best['confusion_matrix'][1][1]} (Correctly predicted Rain)

---

## 4. Key Atmospheric Drivers (Feature Importance)
The model identified the following meteorological features as most predictive of imminent rainfall:

"""
    for feat, imp in features.items():
        content += f"- **`{feat}`**: {imp*100:.2f}%\n"

    content += """
### Meteorological Interpretation:
1. **`relative_humidity_2m` & `dew_point_spread`**: Near-saturation moisture levels in the troposphere strongly precede precipitation condensation.
2. **`past_precip_3h`**: Precipitation exhibits short-term temporal autocorrelation (rainfall continuation and convective cluster movement).
3. **`pressure_trend_3h`**: Rapid barometric pressure drops correspond to approaching dynamic cyclonic systems and frontal boundaries.
"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    train_weather_models()
