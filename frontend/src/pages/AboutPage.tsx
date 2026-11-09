import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Code2,
  Database,
  Brain,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Award,
  Terminal,
  ExternalLink
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const vivaQuestions = [
    {
      q: "Why did you use chronological splitting instead of k-fold cross-validation or random train_test_split?",
      a: "Weather is inherently continuous temporal data with strong autocorrelation. If we used standard random train_test_split, observations from hour t would be in the test set while hour t-1 and hour t+1 were in the training set, causing catastrophic data leakage and artificially inflated metrics. Chronological splitting (training on historical data up to mid-2024 and testing strictly on unseen future data from mid-to-late 2024) authentically simulates real-world meteorological forecasting."
    },
    {
      q: "How did you prevent data leakage when defining the rainfall prediction target?",
      a: "The prediction target is defined as whether cumulative precipitation exceeds 0.1 mm within the upcoming 1 to 3 hours (t+1, t+2, t+3). All input features (temperature, relative humidity, pressure trend, dew point spread, past precipitation) are strictly restricted to time <= t. Future precipitation is never included in the input feature matrix X."
    },
    {
      q: "What is the key distinction between the Open-Meteo forecast and your AI/ML model?",
      a: "Open-Meteo provides forecasts derived from Numerical Weather Prediction (NWP) physics simulations executed by national meteorological supercomputers (e.g. NOAA GFS, ECMWF IFS). Our AI/ML module is an empirical statistical model (Scikit-Learn Random Forest) trained locally on 35,061 historical hourly records to learn how surface barometric tendencies and humidity gradients correlate with imminent short-range precipitation. They are separate, complementary components."
    },
    {
      q: "Why was Random Forest selected as the final production model over Logistic Regression and Decision Trees?",
      a: "In our empirical benchmark on 7,013 holdout test samples, Logistic Regression achieved an F1-score of 56.90% and ROC-AUC of 0.8419, while a single Decision Tree achieved 58.61% F1 and 0.8631 ROC-AUC. Random Forest outperformed both with an F1-score of 62.38%, ROC-AUC of 0.8792, and an impressive 80.60% recall on actual rainfall events. Furthermore, its ensemble bagging mechanism substantially reduces variance and resists overfitting to local microclimate fluctuations."
    },
    {
      q: "How does the activity-based decision support system work?",
      a: "It is an explainable, rule-based expert decision system that evaluates live physical telemetry against established domain thresholds (e.g., wind speeds > 15 km/h triggering spray drift warnings for agriculture; high heat indexes triggering athletic exertion pauses; road friction and visibility penalties for travel). It calculates an objective 0-100 suitability score and transparently explains every triggered criterion."
    }
  ];

  const modelsBenchmark = [
    { name: "Logistic Regression", acc: "77.23%", prec: "46.29%", rec: "73.81%", f1: "56.90%", roc: "0.8419", status: "Baseline Linear Model" },
    { name: "Decision Tree (depth=6)", acc: "75.72%", prec: "44.88%", rec: "84.45%", f1: "58.61%", roc: "0.8631", status: "Non-linear Single Tree" },
    { name: "Random Forest (100 trees)", acc: "80.21%", prec: "50.88%", rec: "80.60%", f1: "62.38%", roc: "0.8792", status: "Selected Final Model ⭐" }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Title */}
      <div className="bg-gradient-to-br from-brand-950/40 via-slate-900 to-slate-900 border border-brand-500/30 rounded-3xl p-6 sm:p-10 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-7 h-7 text-brand-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
            Academic Project Deliverable & Defense Guide
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          AI-Based Weather Intelligence & Decision Support System
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          An end-to-end full-stack undergraduate engineering project integrating real-time meteorological APIs,
          machine learning rainfall classification on multi-year hourly data, transparent decision support,
          and a responsive modern dashboard.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 font-semibold border border-slate-700">
            Frontend: React 18 + TypeScript + Vite + Tailwind CSS
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 font-semibold border border-slate-700">
            Backend: FastAPI + Uvicorn + Pydantic
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 font-semibold border border-slate-700">
            ML: Scikit-Learn + Pandas + NumPy + Joblib
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 font-semibold border border-slate-700">
            Telemetry: Open-Meteo Global Forecasting & Archive APIs
          </span>
        </div>
      </div>

      {/* Project Objectives */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-brand-400" />
          <h2 className="text-xl font-bold text-white">Project Objectives & Deliverables</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-brand-400 font-bold text-sm block mb-1">1. Live Meteorological Telemetry</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time temperature, humidity, surface pressure, wind vectors, and precipitation measurements via global geocoding.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-brand-400 font-bold text-sm block mb-1">2. Historical Dataset Engineering</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Curated 35,061 hourly records (2021–2024), feature engineering with pressure trends, dew point depression, and lag variables.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-brand-400 font-bold text-sm block mb-1">3. Rigorous ML Training & Evaluation</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Chronological split, benchmarking Logistic Regression, Decision Tree, and Random Forest with complete confusion matrix analysis.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-brand-400 font-bold text-sm block mb-1">4. Explainable AI Inference</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transparent prediction probabilities for 1-3 hour horizons, isolating top meteorological drivers without black-box obfuscation.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-brand-400 font-bold text-sm block mb-1">5. Activity Decision Support</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Threshold-driven advisories for Travel, Outdoor Events, Sports, and Agriculture with suitability scores (0-100).
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-brand-400 font-bold text-sm block mb-1">6. Severe Weather Risk Indicators</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated triggers detecting high sustained winds, extreme thermal stress, heavy rainfall ponding, and convective thunderstorms.
            </p>
          </div>
        </div>
      </div>

      {/* Experimental ML Model Benchmark Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Machine Learning Experimental Benchmark Results</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Evaluated strictly on holdout 7,013 future test hours (20% chronological split, mid-2024 to Dec-2024):
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/70 text-slate-300">
                <th className="py-3 px-4 font-bold">Model Architecture</th>
                <th className="py-3 px-4 font-bold">Accuracy</th>
                <th className="py-3 px-4 font-bold">Precision</th>
                <th className="py-3 px-4 font-bold">Recall</th>
                <th className="py-3 px-4 font-bold">F1-Score</th>
                <th className="py-3 px-4 font-bold">ROC-AUC</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {modelsBenchmark.map((m, idx) => (
                <tr key={idx} className={m.name.includes('Random Forest') ? 'bg-brand-950/20 font-semibold text-white' : ''}>
                  <td className="py-3 px-4">{m.name}</td>
                  <td className="py-3 px-4">{m.acc}</td>
                  <td className="py-3 px-4">{m.prec}</td>
                  <td className="py-3 px-4 text-emerald-400">{m.rec}</td>
                  <td className="py-3 px-4 text-purple-400">{m.f1}</td>
                  <td className="py-3 px-4 text-cyan-400">{m.roc}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      m.name.includes('Random Forest')
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viva / Oral Examination Preparation Guide */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Academic Viva & Oral Defense Q&A Guide</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Key theoretical and architectural defense questions with concise explanations for viva panels:
        </p>

        <div className="space-y-3">
          {vivaQuestions.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-slate-900/60 rounded-2xl border border-slate-700/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-brand-300 transition-colors"
                >
                  <span className="pr-4">Q{index + 1}: {item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-brand-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                    <p className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/40 text-slate-200">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
