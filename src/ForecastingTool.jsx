import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

const FORECAST_API_URL = "https://aqlify-backend.onrender.com/forecast";

const PRODUCT_TYPES = [
  // Pharmaceutical & Medical
  { value: 'Prescription Medications', label: 'Prescription Medications (أدوية بوصفة طبية)' },
  { value: 'Over-the-Counter (OTC) Drugs', label: 'Over-the-Counter (OTC) Drugs (أدوية بدون وصفة طبية)' },
  { value: 'Medical Equipment', label: 'Medical Equipment (معدات طبية)' },
  { value: 'Medical Consumables (e.g., gloves, masks)', label: 'Medical Consumables (مستهلكات طبية)' },
  // Food & Beverage
  { value: 'Fresh Produce', label: 'Fresh Produce (منتجات طازجة)' },
  { value: 'Packaged Foods', label: 'Packaged Foods (أغذية معلبة)' },
  { value: 'Beverages', label: 'Beverages (مشروبات)' },
  { value: 'Frozen Goods', label: 'Frozen Goods (منتجات مجمدة)' },
  // Automotive
  { value: 'Engine Components', label: 'Engine Components (مكونات المحرك)' },
  { value: 'Tires & Wheels', label: 'Tires & Wheels (الإطارات والعجلات)' },
  { value: 'Body Parts', label: 'Body Parts (أجزاء الهيكل)' },
  { value: 'Lubricants & Fluids', label: 'Lubricants & Fluids (زيوت التشحيم والسوائل)' },
  // Electronics
  { value: 'Mobile Phones & Accessories', label: 'Mobile Phones & Accessories (الهواتف المحمولة وملحقاتها)' },
  { value: 'Home Appliances', label: 'Home Appliances (أجهزة منزلية)' },
  { value: 'Computers & Laptops', label: 'Computers & Laptops (أجهزة الكمبيوتر والمحمول)' },
  // Consumer Goods
  { value: 'Personal Care Products', label: 'Personal Care Products (منتجات العناية الشخصية)' },
  { value: 'Cleaning Supplies', label: 'Cleaning Supplies (مواد التنظيف)' },
  { value: 'Apparel & Fashion', label: 'Apparel & Fashion (الملابس والأزياء)' },
  // Construction
  { value: 'Cement & Concrete', label: 'Cement & Concrete (الأسمنت والخرسانة)' },
  { value: 'Steel & Metals', label: 'Steel & Metals (الصلب والمعادن)' },
  { value: 'Pipes & Fittings', label: 'Pipes & Fittings (الأنابيب والتجهيزات)' },
  // Oil & Gas
  { value: 'Drilling Chemicals', label: 'Drilling Chemicals (كيماويات الحفر)' },
  { value: 'Pipes and Tubular Goods', label: 'Pipes and Tubular Goods (الأنابيب والمنتجات الأنبوبية)' },
  { value: 'Safety Equipment', label: 'Safety Equipment (معدات السلامة)' },
  // Other
  { value: 'Other', label: 'Other (أخرى)' },
];

const REGIONS = [
  { value: 'Muscat', label: 'Muscat (مسقط)' },
  { value: 'Sohar', label: 'Sohar (صحار)' },
  { value: 'Salalah', label: 'Salalah (صلالة)' },
  { value: 'Nizwa', label: 'Nizwa (نزوى)' },
  { value: 'Sur', label: 'Sur (صور)' },
  { value: 'Ibri', label: 'Ibri (عبري)' },
  { value: 'Al Buraimi', label: 'Al Buraimi (البريمي)' },
  { value: 'Duqm', label: 'Duqm (الدقم)' },
  { value: 'Other', label: 'Other (أخرى)' },
];

const SELLING_POINTS = [
  // Retail Channels
  { value: 'Hypermarket / Supermarket', label: 'Hypermarket / Supermarket (هايبر ماركت / سوبر ماركت)' },
  { value: 'Convenience Store (Baqala)', label: 'Convenience Store (Baqala) (بقالة)' },
  { value: 'Specialty Retail Store', label: 'Specialty Retail Store (متجر تجزئة متخصص)' },
  // Healthcare
  { value: 'Retail Pharmacy', label: 'Retail Pharmacy (صيدلية تجزئة)' },
  { value: 'Hospital / Clinic', label: 'Hospital / Clinic (مستشفى / عيادة)' },
  // B2B
  { value: 'B2B Wholesale to Retail', label: 'B2B Wholesale to Retail (تجارة الجملة للتجزئة)' },
  { value: 'B2B Direct to Corporate/Industrial', label: 'B2B Direct to Corporate/Industrial (مباشر للشركات / الصناعي)' },
  // Direct & Online
  { value: 'Online Store (E-commerce)', label: 'Online Store (E-commerce) (متجر إلكتروني)' },
  { value: 'Direct Sales Force', label: 'Direct Sales Force (فريق مبيعات مباشر)' },
  // Project-Based
  { value: 'Construction Projects', label: 'Construction Projects (مشاريع بناء)' },
  { value: 'Oil & Gas Operations', label: 'Oil & Gas Operations (عمليات النفط والغاز)' },
  { value: 'Government Tenders', label: 'Government Tenders (مناقصات حكومية)' },
  // Other
  { value: 'Other', label: 'Other (أخرى)' },
];

function ForecastingTool({ onLogout, userType }) {
  // State for form inputs
  const [salesData, setSalesData] = useState(() => JSON.parse(localStorage.getItem('aqlify-salesData')) || []);
  const [fileName, setFileName] = useState(() => JSON.parse(localStorage.getItem('aqlify-fileName')) || '');
  const [productType, setProductType] = useState(() => JSON.parse(localStorage.getItem('aqlify-productType')) || '');
  const [region, setRegion] = useState(() => JSON.parse(localStorage.getItem('aqlify-region')) || '');
  const [sellingPoint, setSellingPoint] = useState(() => JSON.parse(localStorage.getItem('aqlify-sellingPoint')) || '');
  const [userNotes, setUserNotes] = useState(() => JSON.parse(localStorage.getItem('aqlify-userNotes')) || '');

  // State for API response and UI
  const [forecast, setForecast] = useState(() => JSON.parse(localStorage.getItem('aqlify-forecast')) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for benchmarking
  const [showBenchmark, setShowBenchmark] = useState(() => JSON.parse(localStorage.getItem('aqlify-showBenchmark')) || false);
  const [actualSales, setActualSales] = useState(() => JSON.parse(localStorage.getItem('aqlify-actualSales')) || []);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('aqlify-salesData', JSON.stringify(salesData));
    localStorage.setItem('aqlify-fileName', JSON.stringify(fileName));
    localStorage.setItem('aqlify-productType', JSON.stringify(productType));
    localStorage.setItem('aqlify-region', JSON.stringify(region));
    localStorage.setItem('aqlify-sellingPoint', JSON.stringify(sellingPoint));
    localStorage.setItem('aqlify-userNotes', JSON.stringify(userNotes));
    localStorage.setItem('aqlify-forecast', JSON.stringify(forecast));
    localStorage.setItem('aqlify-showBenchmark', JSON.stringify(showBenchmark));
    localStorage.setItem('aqlify-actualSales', JSON.stringify(actualSales));
  }, [salesData, fileName, productType, region, sellingPoint, userNotes, forecast, showBenchmark, actualSales]);

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map(row => ({
          date: row.date || row.Date,
          quantity: parseInt(row.quantity || row.Quantity, 10)
        })).filter(row => row.date && !isNaN(row.quantity));

        if (parsedData.length > 0) {
          if (type === 'sales') {
            setSalesData(parsedData);
            setFileName(file.name);
            // Reset downstream state
            setForecast(null);
            setShowBenchmark(false);
            setActualSales([]);
            setError('');
          } else if (type === 'actuals') {
            setActualSales(parsedData);
          }
          setError('');
        } else {
          setError('Invalid or empty CSV. Please ensure columns are named `date` and `quantity` and contain data.');
        }
      },
      error: (err) => setError(`CSV parsing error: ${err.message}`),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (salesData.length < 14) {
      setError('Please upload a CSV with at least 14 days of sales data.');
      return;
    }
    if (!productType || !region) {
      setError('"Product Type" and "Region" are required fields.');
      return;
    }

    setLoading(true);
    setForecast(null);
    setSuccessMessage('✅ Forecast submitted successfully. Your results will be ready shortly.');

    try {
      const response = await axios.post(FORECAST_API_URL, {
        product_type: productType,
        region: region,
        selling_point: sellingPoint || 'Other',
        sales_data: salesData,
        user_notes: userNotes,
      });
      setForecast(response.data);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(d => `${d.loc ? d.loc.join(' -> ') : 'Error'}: ${d.msg}`).join('; ');
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setSuccessMessage('');
    }
  };

  const benchmarkResults = useMemo(() => {
    if (!forecast || actualSales.length === 0) return null;
    const actualsMap = new Map(actualSales.map(item => [item.date, item.quantity]));
    let totalMae = 0, totalMape = 0, comparisonCount = 0;

    const details = forecast.forecasts.map(f => {
      const actualQty = actualsMap.get(f.forecast_date);
      if (actualQty === undefined || actualQty === null || isNaN(actualQty)) return null;
      const forecastQty = f.forecast_qty;
      const mae = Math.abs(forecastQty - actualQty);
      const mape = actualQty > 0 ? (mae / actualQty) * 100 : 0;
      totalMae += mae; totalMape += mape; comparisonCount++;
      return { date: f.forecast_date, forecast: forecastQty, actual: actualQty, mae, mape };
    }).filter(Boolean);

    if (comparisonCount === 0) return null;
    return { details, averageMae: totalMae / comparisonCount, averageMape: totalMape / comparisonCount };
  }, [forecast, actualSales]);

  const exportToCSV = () => {
    if (!forecast || !Array.isArray(forecast.forecasts)) return;
    const csvData = forecast.forecasts.map(f => ({ Date: f.forecast_date, 'Predicted Quantity': f.forecast_qty }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `forecast_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    if (!forecast || !Array.isArray(forecast.forecasts)) return null;
    return {
      labels: forecast.forecasts.map(f => f.forecast_date),
      datasets: [{
        label: 'Forecasted Quantity',
        data: forecast.forecasts.map(f => f.forecast_qty),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      }],
    };
  }, [forecast]);

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: '30-Day Demand Forecast' } } };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Aqlify Demand Forecasting {userType === 'demo' && <span className="demo-badge">Demo Mode</span>}</h1>
        <p>Welcome to the Aqlify Admin Test Portal. (مرحبًا بك في بوابة اختبار الإدارة من Aqlify.)</p>
        <button onClick={onLogout} className="btn btn-secondary" style={{float: 'right'}}>Logout</button>
      </header>

      <form onSubmit={handleSubmit} className="forecast-form">
        <div className="form-group upload-group">
          <label htmlFor="sales-csv-upload" className="btn btn-primary">1. Upload Sales History CSV</label>
          <input type="file" id="sales-csv-upload" className="file-input" onChange={(e) => handleFileUpload(e, 'sales')} accept=".csv" />
          {fileName && <span className="file-name">File: {fileName}</span>}
        </div>

        {salesData.length > 0 && (
          <div className="context-fields">
            <div className="form-group">
              <label htmlFor="productType">Product Type (نوع المنتج)</label>
              <select id="productType" className="form-control" value={productType} onChange={(e) => setProductType(e.target.value)} required>
                <option value="" disabled>Select a type...</option>
                {PRODUCT_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region">Region (المنطقة)</label>
              <select id="region" className="form-control" value={region} onChange={(e) => setRegion(e.target.value)} required>
                <option value="" disabled>Select a region...</option>
                {REGIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sellingPoint">Selling Point (نقطة البيع)</label>
              <select id="sellingPoint" className="form-control" value={sellingPoint} onChange={(e) => setSellingPoint(e.target.value)}>
                <option value="" disabled>Optional: Select a point...</option>
                {SELLING_POINTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="userNotes">Contextual Notes (ملاحظات سياقية)</label>
              <textarea
                id="userNotes"
                className="form-control"
                rows="3"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g., Upcoming promotion, local holiday, supply chain disruption..."
              ></textarea>
            </div>

            <div className="info-note">
              <p>This information helps improve forecast accuracy based on product type, region, and sales channel.</p>
              <p className="note-arabic">يساعدنا هذا المعلومات على تحسين دقة التوقعات بناءً على نوع المنتج والمنطقة ونقطة البيع.</p>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>2. Get Expert Forecast</button>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="success-message">{successMessage}</p>}
      </form>

      {forecast && (
        <div className="results-container">
          <div className="results-grid">
            <div className="chart-container">
              <h3>Forecast Visualization</h3>
              <div className="chart-wrapper">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
            <div className="table-container">
              <h3>30-Day Forecast <span className="arabic-header">(توقعات 30 يوم)</span></h3>
              <div className="forecast-table-scroll">
                <table className="forecast-table">
                  <thead><tr><th>Date <span className="arabic-header">(التاريخ)</span></th><th>Quantity <span className="arabic-header">(الكمية)</span></th></tr></thead>
                  <tbody>
                    {forecast.forecasts.map((f, i) => <tr key={i}><td>{f.forecast_date}</td><td>{f.forecast_qty}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="summary-notes">
            <div className="note-card"><h4>Suggested Reorder Quantity</h4><p>{forecast.reorder_qty}</p></div>
            <div className="note-card"><h4>Forecast Confidence</h4><p>{forecast.confidence}</p></div>
          </div>

          <div className="note-card full-width-card"><h4>English Summary & Analysis</h4><p>{forecast.english_summary}</p></div>
          <div className="note-card full-width-card"><h4>Arabic Summary</h4><p className="note-arabic">{forecast.arabic_summary}</p></div>

          <div className="button-group" style={{ marginTop: '1rem' }}>
            <button onClick={exportToCSV} className="btn btn-secondary">Export CSV</button>
          </div>

          <div className="benchmark-section">
            <hr />
            <h2>Benchmark Forecast Accuracy</h2>
            {!showBenchmark ? (
              <button onClick={() => setShowBenchmark(true)} className="btn btn-primary">Benchmark Accuracy</button>
            ) : (
              <div>
                <div className="form-group upload-group">
                  <label htmlFor="actuals-upload" className="btn btn-secondary">Upload Actuals CSV</label>
                  <input type="file" id="actuals-upload" className="file-input" onChange={(e) => handleFileUpload(e, 'actuals')} accept=".csv" />
                </div>
                {benchmarkResults ? (
                  <div className="benchmark-results">
                    <h3>Accuracy Metrics</h3>
                    <div className="summary-notes">
                      <div className="note-card"><h4>Average MAE</h4><p>{benchmarkResults.averageMae.toFixed(2)}</p></div>
                      <div className="note-card"><h4>Average MAPE</h4><p>{benchmarkResults.averageMape.toFixed(2)}%</p></div>
                    </div>
                    <div className="note-card full-width-card">
                      <h4>What do these metrics mean?</h4>
                      <p><b>MAE (Mean Absolute Error):</b> The average absolute difference between the forecast and actual sales. Lower is better. An MAE of {benchmarkResults.averageMae.toFixed(2)} means on average, the forecast was off by about {Math.round(benchmarkResults.averageMae)} units per day.</p>
                      <p><b>MAPE (Mean Absolute Percentage Error):</b> The average percentage error. Lower is better. MAPE under 10% is typically considered highly accurate.</p>
                    </div>
                    <h4>Daily Breakdown</h4>
                    <div className="forecast-table-scroll">
                      <table className="forecast-table">
                        <thead><tr><th>Date</th><th>Forecast</th><th>Actual</th><th>MAE</th><th>MAPE (%)</th></tr></thead>
                        <tbody>
                          {benchmarkResults.details.map((item, i) => <tr key={i}><td>{item.date}</td><td>{item.forecast}</td><td>{item.actual}</td><td>{item.mae}</td><td>{item.mape.toFixed(2)}%</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  actualSales.length > 0 && <p className="error-message">Could not calculate accuracy. Please check your actuals CSV.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ForecastingTool;
