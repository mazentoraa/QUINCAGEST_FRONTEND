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
  const [activePeriod, setActivePeriod] = useState('week')
  const [chartPeriod, setChartPeriod] = useState('30d')
  const [simulationData, setSimulationData] = useState({
    additionalIncome: '',
    additionalExpense: '',
    simulationDate: '',
    scenarioType: 'realistic'
  })
  const [simulationResults, setSimulationResults] = useState(null)
  const getPeriodData = (period) => {
    const periodData = {
      week: {
        encaissements: { value: 125680, trend: 15.3, positive: true },
        decaissements: { value: -89450, trend: -5.2, positive: false },
        traitesFournisseurs: { value: -31200, trend: -8.1, positive: false },
        resultatNet: { value: 5030, trend: 28.7, positive: true },
        label: 'Cette semaine'
      },
      month: {
        encaissements: { value: 485200, trend: 12.8, positive: true },
        decaissements: { value: -342800, trend: -3.5, positive: false },
        traitesFournisseurs: { value: -125600, trend: -6.2, positive: false },
        resultatNet: { value: 16800, trend: 22.1, positive: true },
        label: 'Ce mois'
      },
      quarter: {
        encaissements: { value: 1456800, trend: 18.5, positive: true },
        decaissements: { value: -1028400, trend: -2.8, positive: false },
        traitesFournisseurs: { value: -378200, trend: -4.9, positive: false },
        resultatNet: { value: 50200, trend: 35.2, positive: true },
        label: 'Ce trimestre'
      },
      year: {
        encaissements: { value: 5824600, trend: 14.2, positive: true },
        decaissements: { value: -4112800, trend: -1.8, positive: false },
        traitesFournisseurs: { value: -1512400, trend: -3.1, positive: false },
        resultatNet: { value: 199400, trend: 28.9, positive: true },
        label: 'Cette année'
      }
    }
    return periodData[period] || periodData.week
  }
  const currentPeriodData = getPeriodData(activePeriod)
  const kpiData = {
    balance: { value: 45680, trend: 5.2, positive: true },
    income: { value: 28450, trend: 12, positive: true },
    expense: { value: -18200, trend: -8, positive: false },
    forecast: { value: 55930, trend: 22, positive: true }
  }
  const traitesData = {
    clients: { value: 45200, trend: 8, count: 12 },
    fournisseurs: { value: -28600, trend: -5, count: 8 },
    echues: { value: 6800, trend: 15, count: 3 },
    net: { value: 16600, trend: 12 }
  }
  const scheduleData = [
    { date: "Aujourd'hui - 02/07", description: "Encaissement client ABC", amount: 9300, type: "positive" },
    { date: "Aujourd'hui - 02/07", description: "Traite fournisseur TECH", amount: -3200, type: "supplier" },
    { date: "Demain - 03/07", description: "Virement bancaire", amount: 2700, type: "positive" },
    { date: "Jeudi 04/07", description: "Salaires + charges", amount: -4400, type: "negative" },
    { date: "Jeudi 04/07", description: "Traite fournisseur MAT", amount: -4800, type: "supplier" },
    { date: "Vendredi 05/07", description: "Facture client XYZ", amount: 15000, type: "positive" },
    { date: "Samedi 06/07", description: "Fournisseur DEF", amount: -8200, type: "negative" },
    { date: "Samedi 06/07", description: "Traite fournisseur LOG", amount: -4800, type: "supplier" }
  ]

  const traitesClients = [
    { id: 'TC-2024-001', client: 'Client ABC SARL', echeance: '05/07/2024', montant: 15000, status: 'en-cours' },
    { id: 'TC-2024-002', client: 'Client XYZ Ltd', echeance: '08/07/2024', montant: 12500, status: 'en-cours' },
    { id: 'TC-2024-003', client: 'Client DEF Corp', echeance: '10/07/2024', montant: 8700, status: 'en-cours' },
    { id: 'TC-2024-004', client: 'Client GHI SARL', echeance: '28/06/2024', montant: 4200, status: 'echu' },
    { id: 'TC-2024-005', client: 'Client JKL Ltd', echeance: '01/07/2024', montant: 4800, status: 'paye' }
  ]

  const traitesFournisseurs = [
    { id: 'TF-2024-001', fournisseur: 'Fournisseur TECH Solutions', echeance: '05/07/2024', montant: 8500, status: 'en-cours' },
    { id: 'TF-2024-002', fournisseur: 'Fournisseur MAT Industries', echeance: '07/07/2024', montant: 6200, status: 'en-cours' },
    { id: 'TF-2024-003', fournisseur: 'Fournisseur LOG Transport', echeance: '09/07/2024', montant: 4800, status: 'en-cours' },
    { id: 'TF-2024-004', fournisseur: 'Fournisseur ELEC Power', echeance: '30/06/2024', montant: 2600, status: 'echu' },
    { id: 'TF-2024-005', fournisseur: 'Fournisseur SERV Maintenance', echeance: '02/07/2024', montant: 6500, status: 'paye' }
  ]

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
  const currentPeriodChartData = getPeriodChartData(activePeriod)
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
            return value.toLocaleString() + ' DT'
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
            return Math.abs(value).toLocaleString() + ' DT'
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
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSimulationData(prev => ({
      ...prev,
      simulationDate: tomorrow.toISOString().split('T')[0]
    }))
  }, [])
  const formatAmount = (amount) => {
    if (amount === 0) return '0 DT'
    const sign = amount >= 0 ? '+' : ''
    return `${sign}${amount.toLocaleString('fr-FR')} DT`
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
  const getStatusBadge = (status) => {
    const statusConfig = {
      'en-cours': { label: 'EN COURS', color: 'bg-blue-100 text-blue-800' },
      'echu': { label: 'ÉCHU', color: 'bg-red-100 text-red-800' },
      'paye': { label: 'PAYÉ', color: 'bg-green-100 text-green-800' }
    }
    const config = statusConfig[status] || statusConfig['en-cours']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }
  const getTraiteTypeColor = (type) => {
    const colors = {
      client: 'border-l-green-500',
      fournisseur: 'border-l-orange-500',
      echu: 'border-l-red-500'
    }
    return colors[type] || colors.client
  }
  const handleKPIClick = (kpiType) => {
    const details = {
      balance: 'Détail du solde actuel : Compte principal 35,680 DT + Compte épargne 10,000 DT',
      income: 'Encaissements prévus : Factures clients 25,450 DT + Autres recettes 3,000 DT',
      expense: 'Décaissements prévus : Salaires 12,000 DT + Fournisseurs 4,200 DT + Autres 2,000 DT',
      forecast: 'Solde prévisionnel calculé sur la base des flux programmés et des tendances historiques'
    }
    alert(details[kpiType])
  }
  const handleScheduleClick = (item) => {
    alert(`Détail : ${item.description} - Montant : ${formatAmount(item.amount)}`)
  }
  const handleTraiteClick = (traite) => {
    const type = traite.id.startsWith('TC') ? 'Client' : 'Fournisseur'
    const name = traite.client || traite.fournisseur
    alert(`Traite ${type} ${name} - Échéance: ${traite.echeance} - Montant: ${formatAmount(traite.montant)} - Statut: ${traite.status}`)
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
  const handlePeriodChange = (period) => {
    setActivePeriod(period)
  }
  const handleSimulationChange = (field, value) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  const runSimulation = () => {
    const additionalIncome = parseFloat(simulationData.additionalIncome) || 0
    const additionalExpense = parseFloat(simulationData.additionalExpense) || 0
    const currentBalance = 45680
    const plannedIncome = 28450
    const plannedExpense = -18200
    const newBalance = currentBalance + plannedIncome + plannedExpense + additionalIncome - additionalExpense
    const riskFactors = {
      optimistic: 1.1,
      realistic: 1.0,
      pessimistic: 0.9
    }
    const adjustedBalance = newBalance * riskFactors[simulationData.scenarioType]
    const variation = adjustedBalance - 55930
    
    setSimulationResults({
      adjustedBalance: Math.round(adjustedBalance),
      variation: Math.round(variation),
      scenario: simulationData.scenarioType
    })
  }
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestion de la Trésorerie</h1>
      </div>
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'global', label: 'Vue Globale' },
            { key: 'traites', label: 'Traites' },
            { key: 'period', label: 'Par Période' },
            { key: 'simulation', label: 'Simulation' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'global' && (
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
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(kpiData.balance.positive)}`}>
                  {getTrendIcon(kpiData.balance.trend, kpiData.balance.positive)}
                  {kpiData.balance.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Solde Actuel</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData.balance.value)}</div>
              <div className="text-xs text-gray-500 mt-1">Tous comptes confondus</div>
            </div>
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleKPIClick('income')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(kpiData.income.positive)}`}>
                  {getTrendIcon(kpiData.income.trend, kpiData.income.positive)}
                  {kpiData.income.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Encaissements Prévus</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData.income.value)}</div>
              <div className="text-xs text-gray-500 mt-1">7 prochains jours</div>
            </div>
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleKPIClick('expense')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(!kpiData.expense.positive)}`}>
                  {getTrendIcon(kpiData.expense.trend, !kpiData.expense.positive)}
                  {Math.abs(kpiData.expense.trend)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Décaissements Prévus</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData.expense.value)}</div>
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
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(kpiData.forecast.positive)}`}>
                  {getTrendIcon(kpiData.forecast.trend, kpiData.forecast.positive)}
                  {kpiData.forecast.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Solde Prévisionnel</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(kpiData.forecast.value)}</div>
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
                {scheduleData.map((item, index) => (
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
      )}
      {activeTab === 'traites' && (
        <div className="space-y-6">
          {/* KPI Traites */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
                  <TrendingUp className="h-4 w-4" />
                  8%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Traites Clients</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(traitesData.clients.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{traitesData.clients.count} traites en cours</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                  <TrendingDown className="h-4 w-4" />
                  5%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Traites Fournisseurs</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(traitesData.fournisseurs.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{traitesData.fournisseurs.count} traites à payer</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
                  <TrendingUp className="h-4 w-4" />
                  15%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Traites Échues</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(traitesData.echues.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{traitesData.echues.count} traites en retard</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
                  <TrendingUp className="h-4 w-4" />
                  12%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Solde Net Traites</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(traitesData.net.value)}</div>
              <div className="text-xs text-gray-500 mt-1">Différence clients/fournisseurs</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traites Clients */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Traites Clients</h3>
                <p className="text-sm text-gray-600">À encaisser</p>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {traitesClients.map((traite) => (
                  <div
                    key={traite.id}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${
                      traite.status === 'echu' ? getTraiteTypeColor('echu') + ' bg-red-50' : 
                      getTraiteTypeColor('client') + ' bg-green-50'
                    }`}
                    onClick={() => handleTraiteClick(traite)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        CLIENT
                      </span>
                      {getStatusBadge(traite.status)}
                    </div>
                    <div className="mb-2">
                      <div className="font-semibold text-gray-900 mb-1">Traite #{traite.id}</div>
                      <div className="text-sm text-gray-600">{traite.client}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {traite.status === 'paye' ? `Payé le: ${traite.echeance}` : `Échéance: ${traite.echeance}`}
                      </span>
                      <span className={`font-semibold ${traite.status === 'echu' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatAmount(traite.montant)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Traites Fournisseurs</h3>
                <p className="text-sm text-gray-600">À payer</p>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {traitesFournisseurs.map((traite) => (
                  <div
                    key={traite.id}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${
                      traite.status === 'echu' ? getTraiteTypeColor('echu') + ' bg-red-50' : 
                      getTraiteTypeColor('fournisseur') + ' bg-orange-50'
                    }`}
                    onClick={() => handleTraiteClick(traite)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        FOURNISSEUR
                      </span>
                      {getStatusBadge(traite.status)}
                    </div>
                    <div className="mb-2">
                      <div className="font-semibold text-gray-900 mb-1">Traite #{traite.id}</div>
                      <div className="text-sm text-gray-600">{traite.fournisseur}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {traite.status === 'paye' ? `Payé le: ${traite.echeance}` : `Échéance: ${traite.echeance}`}
                      </span>
                      <span className={`font-semibold ${traite.status === 'echu' ? 'text-red-600' : 'text-orange-600'}`}>
                        -{traite.montant.toLocaleString()} DT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'period' && (
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
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(currentPeriodData.encaissements.positive)}`}>
                  {getTrendIcon(currentPeriodData.encaissements.trend, currentPeriodData.encaissements.positive)}
                  {currentPeriodData.encaissements.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Encaissements Période</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(currentPeriodData.encaissements.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{currentPeriodData.label}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(!currentPeriodData.decaissements.positive)}`}>
                  {getTrendIcon(currentPeriodData.decaissements.trend, !currentPeriodData.decaissements.positive)}
                  {Math.abs(currentPeriodData.decaissements.trend)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Décaissements Période</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(currentPeriodData.decaissements.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{currentPeriodData.label}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(!currentPeriodData.traitesFournisseurs.positive)}`}>
                  {getTrendIcon(currentPeriodData.traitesFournisseurs.trend, !currentPeriodData.traitesFournisseurs.positive)}
                  {Math.abs(currentPeriodData.traitesFournisseurs.trend)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Traites Fournisseurs</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(currentPeriodData.traitesFournisseurs.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{currentPeriodData.label}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(currentPeriodData.resultatNet.positive)}`}>
                  {getTrendIcon(currentPeriodData.resultatNet.trend, currentPeriodData.resultatNet.positive)}
                  {currentPeriodData.resultatNet.trend}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Résultat Net</div>
              <div className="text-2xl font-bold text-gray-900">{formatAmount(currentPeriodData.resultatNet.value)}</div>
              <div className="text-xs text-gray-500 mt-1">{currentPeriodData.label}</div>
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
      )}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Simulateur de Scénarios</h3>
              <p className="text-sm text-gray-600">Modélisation financière</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encaissement supplémentaire (DT)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={simulationData.additionalIncome}
                  onChange={(e) => handleSimulationChange('additionalIncome', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Décaissement supplémentaire (DT)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={simulationData.additionalExpense}
                  onChange={(e) => handleSimulationChange('additionalExpense', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de simulation
                </label>
                <input
                  type="date"
                  value={simulationData.simulationDate}
                  onChange={(e) => handleSimulationChange('simulationDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de scénario
                </label>
                <select
                  value={simulationData.scenarioType}
                  onChange={(e) => handleSimulationChange('scenarioType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="optimistic">Optimiste</option>
                  <option value="realistic">Réaliste</option>
                  <option value="pessimistic">Pessimiste</option>
                </select>
              </div>
              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lancer la Simulation
              </button>
              {simulationResults && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Résultats de la Simulation</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Solde simulé</span>
                      <span className="font-semibold">{simulationResults.adjustedBalance.toLocaleString()} DT</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Variation vs prévision</span>
                      <span className={`font-semibold ${simulationResults.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(simulationResults.variation)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Scénario appliqué</span>
                      <span className="font-semibold capitalize">{simulationResults.scenario}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Projection Graphique</h3>
              <p className="text-sm text-gray-600">Évolution simulée</p>
            </div>
            <div className="h-80">
              <Line 
                data={{
                  labels: ["Aujourd'hui", 'J+1', 'J+2', 'J+3', 'J+4', 'J+5', 'J+6', 'J+7'],
                  datasets: [{
                    label: 'Scénario Actuel',
                    data: [45680, 48380, 51080, 46680, 61680, 53480, 55330, 55930],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false
                  }]
                }} 
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top'
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default TresorerieMetalGest
