import React, { useEffect, useState } from 'react'
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

export default function Simulation() {

    const [simulationData, setSimulationData] = useState({
        additionalIncome: '',
        additionalExpense: '',
        simulationDate: '',
        scenarioType: 'realistic'
    })
    const [simulationResults, setSimulationResults] = useState(null)

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

    useEffect(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setSimulationData(prev => ({
            ...prev,
            simulationDate: tomorrow.toISOString().split('T')[0]
        }))
    }, [])

    const handleSimulationChange = (field, value) => {
        setSimulationData(prev => ({
        ...prev,
        [field]: value
        }))
    }

    const formatAmount = (amount) => {
        if (amount === 0) return '0 DT'
        const sign = amount >= 0 ? '+' : ''
        return `${sign}${amount.toLocaleString('fr-FR')} DT`
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Simulation de la Trésorerie</h1>
        </div>
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
    </div>
  )
}
