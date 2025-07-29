import React, { useEffect, useState } from 'react'
import { 
  TrendingDown, 
  DollarSign, 
  Building2,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { fetchPeriodData } from '../services/tresorerieApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function ParPeriode() {

    const [activePeriod, setActivePeriod] = useState('week')
    const [periodData, setPeriodData] = useState(null);

    const styles = `
      .treasury-container {
        padding: 2rem;
        background-color: #ffffff;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .treasury-header {
        margin-bottom: 2rem;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 1rem;
      }
      .treasury-title {
        font-size: 2rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
        background: #ff9100;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .treasury-button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 2rem;
      }
      .treasury-button {
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .treasury-button-active {
        background: linear-gradient(135deg, #eaaa66ff 0%, #ebbd35ff 100%);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      .treasury-button-inactive {
        background-color: #f8fafc;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }
      .treasury-button-inactive:hover {
        background-color: #f1f5f9;
        transform: translateY(-1px);
      }
      .treasury-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .treasury-card {
        background-color: #ffffff;
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
      }
      .treasury-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      .treasury-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .treasury-icon-container {
        width: 3rem;
        height: 3rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .treasury-trend-badge {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .treasury-card-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
        font-weight: 500;
      }
      .treasury-card-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      .treasury-card-period {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .treasury-chart-card {
        background-color: #ffffff;
        border-radius: 16px;
        padding: 2rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      .treasury-chart-header {
        margin-bottom: 2rem;
      }
      .treasury-chart-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      .treasury-chart-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
      }
      .treasury-chart-container {
        height: 20rem;
      }
    `;

    useEffect(() => {
      fetchPeriodData(activePeriod)
        .then(res => setPeriodData(res.data))
        .catch(err => console.error("Failed to fetch period data:", err));
    }, [activePeriod]);

      const formatAmount = (amount) => {
        if (amount === 0) return '0 DT'
        const sign = amount >= 0 ? '+' : ''
        return `${sign}${amount?.toLocaleString('fr-FR')} DT`
      }
    
      const getTrendIcon = (trend, positive) => {
        return positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
      }
    
      const getTrendColor = (positive) => {
        return positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
      }

    const getPeriodChartData = (period) => {
        const chartData = {
            week: {
            labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
            datasets: [
                {
                label: 'Encaissements',
                data: [15000, 22000, 18000, 25000, 19000, 12000, 8000],
                backgroundColor: '#3b82f6',
                borderRadius: 8
                },
                {
                label: 'Décaissements',
                data: [-8000, -12000, -15000, -18000, -11000, -7000, -5000],
                backgroundColor: '#ef4444',
                borderRadius: 8
                }
            ]
            },
            month: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            datasets: [
                {
                label: 'Encaissements',
                data: [125000, 118000, 142000, 100200],
                backgroundColor: '#3b82f6',
                borderRadius: 8
                },
                {
                label: 'Décaissements',
                data: [-85000, -92000, -78000, -87800],
                backgroundColor: '#ef4444',
                borderRadius: 8
                }
            ]
            },
            quarter: {
            labels: ['Mois 1', 'Mois 2', 'Mois 3'],
            datasets: [
                {
                label: 'Encaissements',
                data: [485200, 512800, 458800],
                backgroundColor: '#3b82f6',
                borderRadius: 8
                },
                {
                label: 'Décaissements',
                data: [-342800, -365200, -320400],
                backgroundColor: '#ef4444',
                borderRadius: 8
                }
            ]
            },
            year: {
            labels: ['T1', 'T2', 'T3', 'T4'],
            datasets: [
                {
                label: 'Encaissements',
                data: [1456800, 1523400, 1412200, 1432200],
                backgroundColor: '#3b82f6',
                borderRadius: 8
                },
                {
                label: 'Décaissements',
                data: [-1028400, -1085600, -998800, -1000000],
                backgroundColor: '#ef4444',
                borderRadius: 8
                }
            ]
            }
        }
        return chartData[period] || chartData.week
    }

    const currentPeriodChartData = {
      labels: periodData?.chart_data.labels,
      datasets: [
        {
          label: 'Encaissements',
          data: periodData?.chart_data.encaissements,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderRadius: 8
        },
        {
          label: 'Décaissements',
          data: periodData?.chart_data.decaissements,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderRadius: 8
        }
      ]
    }

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: '500'
              }
            }
          }
        },
        scales: {
          y: {
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                return Math.abs(value)?.toLocaleString() + ' DT'
              },
              font: {
                size: 11
              },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              },
              color: '#6b7280'
            }
          }
        }
      }

    const handlePeriodChange = (period) => {
        setActivePeriod(period)
    }

  return (
    <>
      <style>{styles}</style>
      <div className="treasury-container">
          <div className="treasury-header">
              <h1 className="treasury-title">Trésorerie Par Période</h1>
          </div>
          <div>
              <div className="treasury-button-container">
              {[
                  { key: 'week', label: 'Cette Semaine' },
                  { key: 'month', label: 'Ce Mois' },
                  { key: 'quarter', label: 'Ce Trimestre' },
                  { key: 'year', label: 'Cette Année' }
              ].map((period) => (
                  <button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key)}
                  className={`treasury-button ${
                      activePeriod === period.key
                      ? 'treasury-button-active'
                      : 'treasury-button-inactive'
                  }`}
                  >
                  {period.label}
                  </button>
              ))}
              </div>
              <div className="treasury-cards-grid">
              <div className="treasury-card">
                  <div className="treasury-card-header">
                  <div className="treasury-icon-container" style={{backgroundColor: '#ecfdf5'}}>
                      <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className={`treasury-trend-badge ${getTrendColor(periodData?.encaissements.positive)}`}>
                      {getTrendIcon(periodData?.encaissements.trend, periodData?.encaissements.positive)}
                      {periodData?.encaissements.trend}%
                  </div>
                  </div>
                  <div className="treasury-card-label">Encaissements Période</div>
                  <div className="treasury-card-value">{formatAmount(periodData?.encaissements.value)}</div>
                  <div className="treasury-card-period">{periodData?.label}</div>
              </div>
              <div className="treasury-card">
                  <div className="treasury-card-header">
                  <div className="treasury-icon-container" style={{backgroundColor: '#fef2f2'}}>
                      <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className={`treasury-trend-badge ${getTrendColor(!periodData?.decaissements.positive)}`}>
                      {getTrendIcon(periodData?.decaissements.trend, !periodData?.decaissements.positive)}
                      {Math.abs(periodData?.decaissements.trend)}%
                  </div>
                  </div>
                  <div className="treasury-card-label">Décaissements Période</div>
                  <div className="treasury-card-value">{formatAmount(periodData?.decaissements.value)}</div>
                  <div className="treasury-card-period">{periodData?.label}</div>
              </div>
              
              <div className="treasury-card">
                  <div className="treasury-card-header">
                  <div className="treasury-icon-container" style={{backgroundColor: '#eff6ff'}}>
                      <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className={`treasury-trend-badge ${getTrendColor(periodData?.resultatNet.positive)}`}>
                      {getTrendIcon(periodData?.resultatNet.trend, periodData?.resultatNet.positive)}
                      {periodData?.resultatNet.trend}%
                  </div>
                  </div>
                  <div className="treasury-card-label">Résultat Net</div>
                  <div className="treasury-card-value">{formatAmount(periodData?.resultatNet.value)}</div>
                  <div className="treasury-card-period">{periodData?.label}</div>
              </div>
              </div>
              <div className="treasury-chart-card">
              <div className="treasury-chart-header">
                  <h3 className="treasury-chart-title">Analyse Comparative</h3>
                  <p className="treasury-chart-subtitle">Évolution par période</p>
              </div>
              <div className="treasury-chart-container">
                  <Bar data={currentPeriodChartData} options={barChartOptions} />
              </div>
              </div>
          </div>
      </div>
    </>
  )
}