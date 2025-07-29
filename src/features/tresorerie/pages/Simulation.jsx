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
import { fetchKPIs } from '../services/tresorerieApi'
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

    const [simulationResults, setSimulationResults] = useState([]);
    const [simulationData, setSimulationData] = useState({
        additionalIncome: '',
        additionalExpense: '',
        simulationDate: '',
        scenarioType: 'realistic'
    })
    const [kpiData, setKpiData] = useState(null);
    const [simulatedSolde, setSimulatedSolde] = useState(0);
    const [variationVsPrevision, setVariationVsPrevision] = useState(0);
    const [scenarioApplique, setScenarioApplique] = useState("réaliste");
    
    useEffect(() => {
        fetchKPIs().then(res => setKpiData(res.data));
    }, []);

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
            color: '#fff5f0'
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
        return `${sign}${amount?.toLocaleString('fr-FR')} DT`
    }


    const handleSimulate = () => {
        if (!kpiData?.global_balance?.value) return;

        const currentBalance = kpiData.global_balance.value;

        const plannedIncome = kpiData?.expected_income?.value || 0;
        const plannedExpense = kpiData?.expected_expense?.value || 0;

        const additionalIncome = parseFloat(simulationData.additionalIncome) || 0;
        const additionalExpense = parseFloat(simulationData.additionalExpense) || 0;

        const scenario = simulationData.scenarioType;
        const riskFactor = {
            optimistic: 1.1,
            realistic: 1.0,
            pessimistic: 0.9,
        }[scenario];

        // Calculate daily variation
        const totalIncome = (plannedIncome + additionalIncome) * riskFactor;
        const totalExpense = (plannedExpense + additionalExpense) * riskFactor;
        const dailyVariation = (totalIncome - totalExpense) / 7;

        // Simulated balance over 8 days
        const projected = Array.from({ length: 8 }, (_, i) =>
            Math.round(currentBalance + dailyVariation * i)
        );

        // Set simulated solde
        const finalSimulatedSolde = projected[projected.length - 1];
        setSimulatedSolde(finalSimulatedSolde);

        // Calculate prévision (without additional input)
        const baseIncome = kpiData?.expected_income?.value || 0;
        const baseExpense = kpiData?.expected_expense?.value || 0;
        const variationPrevue = (baseIncome - baseExpense) * riskFactor;
        const soldePrevu = currentBalance + variationPrevue;

        // Variation vs prévision
        const variationVsPrevision = finalSimulatedSolde - soldePrevu;
        setVariationVsPrevision(variationVsPrevision);

        // Store scenario label
        setScenarioApplique(scenario);

        // Save simulation results
        setSimulationResults(projected);
    };

  return (
    <div style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
        <div style={{ marginBottom: '32px' }}>
            <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ff9100',
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #ff9100 0%, #ffb347 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
            }}>
                Simulation de la Trésorerie
            </h1>
            <div style={{
                width: '80px',
                height: '4px',
                background: 'linear-gradient(90deg, #ff6b35, #ff8c42)',
                borderRadius: '2px'
            }}></div>
        </div>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '32px'
        }}>
            {/* Simulateur Panel */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 10px 40px rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative gradient */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: 'linear-gradient(90deg, #ff6b35, #ff8c42, #ffb347)',
                }}></div>
                
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>⚡</div>
                        Simulateur de Scénarios
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        marginLeft: '52px'
                    }}>Modélisation financière avancée</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            💰 Encaissement supplémentaire (DT)
                        </label>
                        <input
                            type="number"
                            placeholder="Montant en DT"
                            value={simulationData.additionalIncome}
                            onChange={(e) => handleSimulationChange('additionalIncome', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #f0f0f0',
                                borderRadius: '12px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                backgroundColor: '#fafafa',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#ff6b35';
                                e.target.style.backgroundColor = '#fff';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#f0f0f0';
                                e.target.style.backgroundColor = '#fafafa';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            💸 Décaissement supplémentaire (DT)
                        </label>
                        <input
                            type="number"
                            placeholder="Montant en DT"
                            value={simulationData.additionalExpense}
                            onChange={(e) => handleSimulationChange('additionalExpense', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #f0f0f0',
                                borderRadius: '12px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                backgroundColor: '#fafafa',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#ff6b35';
                                e.target.style.backgroundColor = '#fff';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#f0f0f0';
                                e.target.style.backgroundColor = '#fafafa';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            📅 Date de simulation
                        </label>
                        <input
                            type="date"
                            value={simulationData.simulationDate}
                            onChange={(e) => handleSimulationChange('simulationDate', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #f0f0f0',
                                borderRadius: '12px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                backgroundColor: '#fafafa',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#ff6b35';
                                e.target.style.backgroundColor = '#fff';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#f0f0f0';
                                e.target.style.backgroundColor = '#fafafa';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            📊 Type de scénario
                        </label>
                        <select
                            value={simulationData.scenarioType}
                            onChange={(e) => handleSimulationChange('scenarioType', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #f0f0f0',
                                borderRadius: '12px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                backgroundColor: '#fafafa',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#ff6b35';
                                e.target.style.backgroundColor = '#fff';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#f0f0f0';
                                e.target.style.backgroundColor = '#fafafa';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="optimistic">🚀 Optimiste</option>
                            <option value="realistic">⚖️ Réaliste</option>
                            <option value="pessimistic">⚠️ Pessimiste</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSimulate}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                            color: 'white',
                            padding: '16px 24px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
                        }}
                    >
                        🎯 Lancer la Simulation
                    </button>

                    {(
                        <div style={{
                            background: 'linear-gradient(135deg, #fff5f0, #ffe8dc)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(255, 107, 53, 0.2)',
                            marginTop: '8px'
                        }}>
                            <h4 style={{
                                fontWeight: '600',
                                color: '#1a1a1a',
                                marginBottom: '20px',
                                fontSize: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                📈 Résultats de la Simulation
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.1)',
                                    border: '1px solid rgba(255, 107, 53, 0.1)'
                                }}>
                                    <span style={{ color: '#666', fontWeight: '500' }}>💼 Solde simulé</span>
                                    <span style={{ 
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        color: '#ff6b35'
                                    }}>
                                        {simulatedSolde?.toLocaleString()} DT
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.1)',
                                    border: '1px solid rgba(255, 107, 53, 0.1)'
                                }}>
                                    <span style={{ color: '#666', fontWeight: '500' }}>📊 Variation vs prévision</span>
                                    <span style={{
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        color: variationVsPrevision >= 0 ? '#10b981' : '#ef4444'
                                    }}>
                                        {formatAmount(variationVsPrevision)}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.1)',
                                    border: '1px solid rgba(255, 107, 53, 0.1)'
                                }}>
                                    <span style={{ color: '#666', fontWeight: '500' }}>🎯 Scénario appliqué</span>
                                    <span style={{ 
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        color: '#ff6b35',
                                        textTransform: 'capitalize'
                                    }}>
                                        {scenarioApplique}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Graphique Panel */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 10px 40px rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative gradient */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: 'linear-gradient(90deg, #ff6b35, #ff8c42, #ffb347)',
                }}></div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>📈</div>
                        Projection Graphique
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        marginLeft: '52px'
                    }}>Évolution simulée sur 7 jours</p>
                </div>

                <div style={{
                    height: '400px',
                    background: 'linear-gradient(135deg, #fff9f5, #fff5f0)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255, 107, 53, 0.1)'
                }}>
                    <Line 
                        data={{
                            labels: ["Aujourd'hui", 'J+1', 'J+2', 'J+3', 'J+4', 'J+5', 'J+6', 'J+7'],
                            datasets: [{
                                label: 'Projection de trésorerie',
                                data: simulationResults.length ? simulationResults : [kpiData?.balance?.value || 0],
                                borderColor: '#ff6b35',
                                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: '#ff6b35',
                                pointBorderColor: 'white',
                                pointBorderWidth: 3,
                                pointRadius: 6,
                                pointHoverRadius: 8
                            },
                            {
                                label: 'Évolution Attendue',
                                data: kpiData?.expected_balance_evolution
                                ? Array(8).fill(kpiData?.expected_balance_evolution?.expected_balance || 0)
                                : [],
                                borderColor: '#ff8c42',
                                borderDash: [8, 8],
                                borderWidth: 2,
                                fill: false,
                                pointRadius: 4,
                                pointBackgroundColor: '#ff8c42'
                            }]
                        }} 
                        options={{
                            ...chartOptions,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 20,
                                        font: {
                                            size: 12,
                                            weight: '600'
                                        }
                                    }
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