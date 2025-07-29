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

  // const alertsData = [
  //   { type: 'critical', title: 'Solde critique prévu', description: 'Le 08/07 - Solde prévu: 2,300 DT (seuil min: 5,000 DT)' },
  //   { type: 'warning', title: 'Traite fournisseur importante', description: 'Fournisseur TECH - 8,500 DT - Échéance: 05/07' },
  //   { type: 'warning', title: 'Facture importante à échoir', description: 'Client ABC - 15,000 DT - Échéance: 05/07' },
  //   { type: 'info', title: 'Optimisation possible', description: 'Négocier 10 jours de délai avec Fournisseur XYZ' },
  //   { type: 'warning', title: 'Retard de paiement client', description: 'Client DEF - 8,500 DT - Retard: 5 jours' }
  // ]
  // const treasuryChartData = {
  //   labels: ['01/06', '05/06', '10/06', '15/06', '20/06', '25/06', '30/06', '02/07'],
  //   datasets: [{
  //     label: 'Solde de Trésorerie',
  //     data: [42000, 38000, 45000, 41000, 48000, 44000, 46000, 45680],
  //     borderColor: '#10b981',
  //     backgroundColor: 'rgba(16, 185, 129, 0.1)',
  //     borderWidth: 3,
  //     fill: true,
  //     tension: 0.4,
  //     pointBackgroundColor: '#10b981',
  //     pointBorderColor: '#ffffff',
  //     pointBorderWidth: 2,
  //     pointRadius: 6
  //   }]
  // }
  
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
    fetchKPIs(period).then(res => setKpiData(res.data));
  }

 return (
  <div className="p-6 min-h-screen" style={{ 
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    backgroundColor: '#ffffff',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    position: 'relative'
  }}>

    <div className="relative z-10">
      <div className="mb-8">
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700',
          color: '#ff9100',
          letterSpacing: '-0.025em',
          marginBottom: '8px'
        }}>
          Vue Globale de la Trésorerie
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Tableau de bord financier en temps réel
        </p>
      </div>

      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => handleKPIClick('balance')}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <CreditCard style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: kpiData?.balance.positive ? 
                  'linear-gradient(135deg, #dcfdf7, #a7f3d0)' : 
                  'linear-gradient(135deg, #fef2f2, #fecaca)',
                color: kpiData?.balance.positive ? '#065f46' : '#991b1b'
              }}>
                {getTrendIcon(kpiData?.balance.trend, kpiData?.balance.positive)}
                {kpiData?.balance.trend}%
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Solde Actuel
            </div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1f2937',
              letterSpacing: '-0.025em'
            }}>
              {formatAmount(kpiData?.global_balance.value)}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Tous comptes confondus
            </div>
          </div>

          <div 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => handleKPIClick('expected_income')}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: kpiData?.expected_income.positive ? 
                  'linear-gradient(135deg, #dcfdf7, #a7f3d0)' : 
                  'linear-gradient(135deg, #fef2f2, #fecaca)',
                color: kpiData?.expected_income.positive ? '#065f46' : '#991b1b'
              }}>
                {getTrendIcon(kpiData?.expected_income.trend, kpiData?.expected_income.positive)}
                {kpiData?.expected_income.trend}%
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Encaissements Prévus
            </div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1f2937',
              letterSpacing: '-0.025em'
            }}>
              {formatAmount(kpiData?.expected_income.value)}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Les prochains jours
            </div>
          </div>

          <div 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => handleKPIClick('expected_expense')}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <TrendingDown style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: !kpiData?.expected_expense.positive ? 
                  'linear-gradient(135deg, #dcfdf7, #a7f3d0)' : 
                  'linear-gradient(135deg, #fef2f2, #fecaca)',
                color: !kpiData?.expected_expense.positive ? '#065f46' : '#991b1b'
              }}>
                {getTrendIcon(kpiData?.expected_expense.trend, !kpiData?.expected_expense.positive)}
                {Math.abs(kpiData?.expected_expense.trend)}%
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Décaissements Prévus
            </div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1f2937',
              letterSpacing: '-0.025em'
            }}>
              {formatAmount(kpiData?.expected_expense.value)}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Les prochains jours
            </div>
          </div>

          <div 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => handleKPIClick('forecast')}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <BarChart3 style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: kpiData?.forecast.positive ? 
                  'linear-gradient(135deg, #dcfdf7, #a7f3d0)' : 
                  'linear-gradient(135deg, #fef2f2, #fecaca)',
                color: kpiData?.forecast.positive ? '#065f46' : '#991b1b'
              }}>
                {getTrendIcon(kpiData?.forecast.trend, kpiData?.forecast.positive)}
                {kpiData?.forecast.trend}%
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Solde Prévisionnel
            </div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1f2937',
              letterSpacing: '-0.025em'
            }}>
              {formatAmount(kpiData?.forecast.value)}
            </div>
          </div>
        </div>

        {/* Charts and Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2" style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '4px'
                }}>
                  Évolution de la Trésorerie
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Tendance sur 30 jours
                </p>
              </div>
              <div className="flex gap-2">
                {['30d', '90d', '1y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handleChartPeriodChange(period)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: chartPeriod === period
                        ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                        : '#f3f4f6',
                      color: chartPeriod === period ? 'white' : '#6b7280'
                    }}
                  >
                    {period === '30d' ? '30j' : period === '90d' ? '90j' : '1an'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '320px' }}>
              {kpiData?.treasury_chart_data && (
                <Line data={kpiData.treasury_chart_data} options={chartOptions} />
              )}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <div className="mb-8">
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                Échéancier
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                7 prochains jours
              </p>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {scheduleData?.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer transform transition-all duration-200 hover:scale-102"
                  onClick={() => handleScheduleClick(item)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${
                      item.type === 'positive' ? '#10b981' :
                      item.type === 'supplier' ? '#f59e0b' :
                      '#ef4444'
                    }`,
                    background: item.type === 'positive' ? 
                      'linear-gradient(135deg, #ecfdf5, #d1fae5)' :
                      item.type === 'supplier' ? 
                      'linear-gradient(135deg, #fffbeb, #fef3c7)' :
                      'linear-gradient(135deg, #fef2f2, #fecaca)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    {item.date}
                  </div>
                  <div className="flex justify-between items-center">
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {item.description}
                    </div>
                    <div style={{
                      fontWeight: '700',
                      color: getAmountColor(item.amount, item.type)
                    }}>
                      {formatAmount(item.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2" style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div className="mb-8">
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                Alertes Trésorerie
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Notifications importantes
              </p>
            </div>
            <div className="space-y-4">
              {kpiData?.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="cursor-pointer transform transition-all duration-200 hover:scale-102"
                  onClick={() => handleAlertClick(alert)}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: `1px solid ${
                      alert.type === 'critical' ? '#fecaca' :
                      alert.type === 'warning' ? '#fef3c7' :
                      '#dbeafe'
                    }`,
                    background: alert.type === 'critical' ? 
                      '#fef2f2' :
                      alert.type === 'warning' ? 
                      '#fffbeb' :
                      '#eff6ff',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'white',
                      background: alert.type === 'critical' ? 
                        'linear-gradient(135deg, #ef4444, #dc2626)' :
                        alert.type === 'warning' ? 
                        'linear-gradient(135deg, #f59e0b, #d97706)' :
                        'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                    }}>
                      {alert.type === 'critical' ? '!' : alert.type === 'warning' ? '⚠' : 'ℹ'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: alert.type === 'critical' ? '#7f1d1d' :
                          alert.type === 'warning' ? '#92400e' :
                          '#1e3a8a'
                      }}>
                        {alert.title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {alert.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div className="mb-8">
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                Résumé Financier
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Cette semaine
              </p>
            </div>
            {kpiData && (
              <div className="space-y-4">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Total Encaissements</span>
                  <span style={{ fontWeight: '700', color: '#059669' }}>+{kpiData?.income.value} DT</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Total Décaissements</span>
                  <span style={{ fontWeight: '700', color: '#dc2626' }}>-{kpiData?.expense.value} DT</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Flux Net</span>
                  <span style={{
                    fontWeight: '700',
                    color: kpiData.balance.positive ? '#059669' : '#dc2626'
                  }}>
                    {kpiData.balance.positive ? '+' : ''}{kpiData?.balance.value} DT
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Nb Transactions</span>
                  <span style={{ fontWeight: '700', color: '#1f2937' }}>{kpiData?.nb_transactions}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Taux de Recouvrement</span>
                  <span style={{ fontWeight: '700', color: '#1f2937' }}>{kpiData?.taux_de_recouvrement}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)
}
export default TresorerieMetalGest
