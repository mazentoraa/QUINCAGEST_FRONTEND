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
import './treasury-styles.css'
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

    // const getPeriodData = (period) => {
    //     const periodData = {
    //     week: {
    //         encaissements: { value: 125680, trend: 15.3, positive: true },
    //         decaissements: { value: -89450, trend: -5.2, positive: false },
    //         traitesFournisseurs: { value: -31200, trend: -8.1, positive: false },
    //         resultatNet: { value: 5030, trend: 28.7, positive: true },
    //         label: 'Cette semaine'
    //     },
    //     month: {
    //         encaissements: { value: 485200, trend: 12.8, positive: true },
    //         decaissements: { value: -342800, trend: -3.5, positive: false },
    //         traitesFournisseurs: { value: -125600, trend: -6.2, positive: false },
    //         resultatNet: { value: 16800, trend: 22.1, positive: true },
    //         label: 'Ce mois'
    //     },
    //     quarter: {
    //         encaissements: { value: 1456800, trend: 18.5, positive: true },
    //         decaissements: { value: -1028400, trend: -2.8, positive: false },
    //         traitesFournisseurs: { value: -378200, trend: -4.9, positive: false },
    //         resultatNet: { value: 50200, trend: 35.2, positive: true },
    //         label: 'Ce trimestre'
    //     },
    //     year: {
    //         encaissements: { value: 5824600, trend: 14.2, positive: true },
    //         decaissements: { value: -4112800, trend: -1.8, positive: false },
    //         traitesFournisseurs: { value: -1512400, trend: -3.1, positive: false },
    //         resultatNet: { value: 199400, trend: 28.9, positive: true },
    //         label: 'Cette année'
    //     }
    //     }
    //     return periodData[period] || periodData.week
    // }
    // const currentPeriodData = getPeriodData(activePeriod)
    // const currentPeriodChartData = getPeriodChartData(activePeriod)

    const currentPeriodChartData = {
      labels: periodData?.chart_data.labels,
      datasets: [
        {
          label: 'Encaissements',
          data: periodData?.chart_data.encaissements,
          backgroundColor: '#3b82f6',
          borderRadius: 8
        },
        {
          label: 'Décaissements',
          data: periodData?.chart_data.decaissements,
          backgroundColor: '#ef4444',
          borderRadius: 8
        }
      ]
    }

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              callback: function(value) {
                return Math.abs(value)?.toLocaleString() + ' DT'
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }

    const handlePeriodChange = (period) => {
        setActivePeriod(period)
    }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Trésorerie Par Période</h1>
        </div>
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
            {[
                { key: 'week', label: 'Cette Semaine' },
                { key: 'month', label: 'Ce Mois' },
                { key: 'quarter', label: 'Ce Trimestre' },
                { key: 'year', label: 'Cette Année' }
            ].map((period) => (
                <button
                key={period.key}
                onClick={() => handlePeriodChange(period.key)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                    activePeriod === period.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
                >
                {period.label}
                </button>
            ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(periodData?.encaissements.positive)}`}>
                    {getTrendIcon(periodData?.encaissements.trend, periodData?.encaissements.positive)}
                    {periodData?.encaissements.trend}%
                </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Encaissements Période</div>
                <div className="text-2xl font-bold text-gray-900">{formatAmount(periodData?.encaissements.value)}</div>
                <div className="text-xs text-gray-500 mt-1">{periodData?.label}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(!periodData?.decaissements.positive)}`}>
                    {getTrendIcon(periodData?.decaissements.trend, !periodData?.decaissements.positive)}
                    {Math.abs(periodData?.decaissements.trend)}%
                </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Décaissements Période</div>
                <div className="text-2xl font-bold text-gray-900">{formatAmount(periodData?.decaissements.value)}</div>
                <div className="text-xs text-gray-500 mt-1">{periodData?.label}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(!periodData?.traitesFournisseurs.positive)}`}>
                    {getTrendIcon(periodData?.traitesFournisseurs.trend, !periodData?.traitesFournisseurs.positive)}
                    {Math.abs(periodData?.traitesFournisseurs.trend)}%
                </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Traites Fournisseurs</div>
                <div className="text-2xl font-bold text-gray-900">{formatAmount(periodData?.traitesFournisseurs.value)}</div>
                <div className="text-xs text-gray-500 mt-1">{periodData?.label}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(periodData?.resultatNet.positive)}`}>
                    {getTrendIcon(periodData?.resultatNet.trend, periodData?.resultatNet.positive)}
                    {periodData?.resultatNet.trend}%
                </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Résultat Net</div>
                <div className="text-2xl font-bold text-gray-900">{formatAmount(periodData?.resultatNet.value)}</div>
                <div className="text-xs text-gray-500 mt-1">{periodData?.label}</div>
            </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Analyse Comparative</h3>
                <p className="text-sm text-gray-600">Évolution par période</p>
            </div>
            <div className="h-80">
                <Bar data={currentPeriodChartData} options={barChartOptions} />
            </div>
            </div>
        </div>
    </div>
  )
}
