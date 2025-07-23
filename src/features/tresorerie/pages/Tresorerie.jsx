import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  Building2,
  FileText,
  BarChart3
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
import { fetchKPIs, fetchSchedule } from '../services/tresorerieApi'
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
function TresorerieMetalGest() {
  const [activeTab, setActiveTab] = useState('global')
  const [chartPeriod, setChartPeriod] = useState('30d')
  const [kpiData, setKpiData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);

  useEffect(() => {
    fetchKPIs().then(res => setKpiData(res.data));
    fetchSchedule().then(res => setScheduleData(res.data));
  }, []);
  
  // const kpiData = {
  //   balance: { value: 45680, trend: 5.2, positive: true },
  //   income: { value: 28450, trend: 12, positive: true },
  //   expense: { value: -18200, trend: -8, positive: false },
  //   forecast: { value: 55930, trend: 22, positive: true }
  // }
  // const scheduleData = [
  //   { date: "Aujourd'hui - 02/07", description: "Encaissement client ABC", amount: 9300, type: "positive" },
  //   { date: "Aujourd'hui - 02/07", description: "Traite fournisseur TECH", amount: -3200, type: "supplier" },
  //   { date: "Demain - 03/07", description: "Virement bancaire", amount: 2700, type: "positive" },
  //   { date: "Jeudi 04/07", description: "Salaires + charges", amount: -4400, type: "negative" },
  //   { date: "Jeudi 04/07", description: "Traite fournisseur MAT", amount: -4800, type: "supplier" },
  //   { date: "Vendredi 05/07", description: "Facture client XYZ", amount: 15000, type: "positive" },
  //   { date: "Samedi 06/07", description: "Fournisseur DEF", amount: -8200, type: "negative" },
  //   { date: "Samedi 06/07", description: "Traite fournisseur LOG", amount: -4800, type: "supplier" }
  // ]

  const alertsData = [
    { type: 'critical', title: 'Solde critique prévu', description: 'Le 08/07 - Solde prévu: 2,300 DT (seuil min: 5,000 DT)' },
    { type: 'warning', title: 'Traite fournisseur importante', description: 'Fournisseur TECH - 8,500 DT - Échéance: 05/07' },
    { type: 'warning', title: 'Facture importante à échoir', description: 'Client ABC - 15,000 DT - Échéance: 05/07' },
    { type: 'info', title: 'Optimisation possible', description: 'Négocier 10 jours de délai avec Fournisseur XYZ' },
    { type: 'warning', title: 'Retard de paiement client', description: 'Client DEF - 8,500 DT - Retard: 5 jours' }
  ]
  const treasuryChartData = {
    labels: ['01/06', '05/06', '10/06', '15/06', '20/06', '25/06', '30/06', '02/07'],
    datasets: [{
      label: 'Solde de Trésorerie',
      data: [42000, 38000, 45000, 41000, 48000, 44000, 46000, 45680],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6
    }]
  }
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          callback: function(value) {
            return value?.toLocaleString() + ' DT'
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

  const formatAmount = (amount) => {
    if (amount === 0) return '0 DT'
    const sign = amount >= 0 ? '+' : ''
    return `${sign}${amount?.toLocaleString('fr-FR')} DT`
  }

  const getAmountColor = (amount, type = 'default') => {
    if (type === 'supplier') return 'text-orange-600'
    return amount >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getTrendIcon = (trend, positive) => {
    return positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getTrendColor = (positive) => {
    return positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
  }

  const handleKPIClick = (kpiType) => {
    const details = {
      balance: 'Détail du solde actuel : Compte principal 35,680 DT + Compte épargne 10,000 DT',
      expected_income: 'Encaissements prévus : Factures clients 25,450 DT + Autres recettes 3,000 DT',
      expected_expense: 'Décaissements prévus : Salaires 12,000 DT + Fournisseurs 4,200 DT + Autres 2,000 DT',
      forecast: 'Solde prévisionnel calculé sur la base des flux programmés et des tendances historiques'
    }
    alert(details[kpiType])
  }

  const handleScheduleClick = (item) => {
    alert(`Détail : ${item.description} - Montant : ${formatAmount(item.amount)}`)
  }

  const handleAlertClick = (alert) => {
    const actions = {
      critical: 'Action recommandée : Activer ligne de crédit ou accélérer encaissements clients',
      warning: 'Action recommandée : Vérifier disponibilité fonds et relancer clients',
      info: 'Action recommandée : Contacter fournisseur pour négocier délai de paiement'
    }
    alert(actions[alert.type] || 'Aucune action spécifique recommandée')
  }

  const handleChartPeriodChange = (period) => {
    setChartPeriod(period)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Vue Globale de la Trésorerie</h1>
      </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleKPIClick('balance')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(kpiData?.balance.positive)}`}>
                  {getTrendIcon(kpiData?.balance.trend, kpiData?.balance.positive)}
                  {kpiData?.balance.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Solde Actuel</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData?.balance.value)}</div>
              <div className="text-xs text-gray-500 mt-1">Tous comptes confondus</div>
            </div>
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleKPIClick('expected_income')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(kpiData?.expected_income.positive)}`}>
                  {getTrendIcon(kpiData?.expected_income.trend, kpiData?.expected_income.positive)}
                  {kpiData?.expected_income.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Encaissements Prévus</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData?.expected_income.value)}</div>
              <div className="text-xs text-gray-500 mt-1">7 prochains jours</div>
            </div>
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleKPIClick('expected_expense')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(!kpiData?.expected_expense.positive)}`}>
                  {getTrendIcon(kpiData?.expected_expense.trend, !kpiData?.expected_expense.positive)}
                  {Math.abs(kpiData?.expected_expense.trend)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Décaissements Prévus</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData?.expected_expense.value)}</div>
              <div className="text-xs text-gray-500 mt-1">7 prochains jours</div>
            </div>
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleKPIClick('forecast')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(kpiData?.forecast.positive)}`}>
                  {getTrendIcon(kpiData?.forecast.trend, kpiData?.forecast.positive)}
                  {kpiData?.forecast.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Solde Prévisionnel</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData?.forecast.value)}</div>
              <div className="text-xs text-gray-500 mt-1">Dans 7 jours</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Évolution de la Trésorerie</h3>
                  <p className="text-sm text-gray-600">Tendance sur 30 jours</p>
                </div>
                <div className="flex gap-2">
                  {['30d', '90d', '1y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => handleChartPeriodChange(period)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        chartPeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {period === '30d' ? '30j' : period === '90d' ? '90j' : '1an'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80">
                <Line data={treasuryChartData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Échéancier</h3>
                <p className="text-sm text-gray-600">7 prochains jours</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {scheduleData?.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${
                      item.type === 'positive' ? 'border-l-green-500 bg-green-50' :
                      item.type === 'supplier' ? 'border-l-orange-500 bg-orange-50' :
                      'border-l-red-500 bg-red-50'
                    }`}
                    onClick={() => handleScheduleClick(item)}
                  >
                    <div className="text-xs font-medium text-gray-900 mb-2">{item.date}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">{item.description}</div>
                      <div className={`font-semibold ${getAmountColor(item.amount, item.type)}`}>
                        {formatAmount(item.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Alertes Trésorerie</h3>
                <p className="text-sm text-gray-600">Notifications importantes</p>
              </div>
              <div className="space-y-4">
                {alertsData.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${
                      alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                      alert.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        alert.type === 'critical' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {alert.type === 'critical' ? '!' : alert.type === 'warning' ? '⚠' : 'ℹ'}
                      </div>
                      <div>
                        <div className={`font-medium mb-1 ${
                          alert.type === 'critical' ? 'text-red-700' :
                          alert.type === 'warning' ? 'text-orange-700' :
                          'text-blue-700'
                        }`}>
                          {alert.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {alert.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Résumé Financier</h3>
                <p className="text-sm text-gray-600">Cette semaine</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Encaissements</span>
                  <span className="font-semibold text-green-600">+28,450 DT</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Décaissements</span>
                  <span className="font-semibold text-red-600">-18,200 DT</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Flux Net</span>
                  <span className="font-semibold text-green-600">+10,250 DT</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Nb Transactions</span>
                  <span className="font-semibold">32</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Taux de Recouvrement</span>
                  <span className="font-semibold">87%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
export default TresorerieMetalGest
