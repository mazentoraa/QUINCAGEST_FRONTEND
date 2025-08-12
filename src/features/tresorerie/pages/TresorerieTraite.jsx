import React, { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Building2,
  FileText,
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
import { fetchTraites } from '../services/tresorerieApi'

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

export default function TresorerieTraite() {

    const [traitesData, setTraitesData] = useState(null);
    const [traitesClients, setTraitesClients] = useState(null);
    const [traitesFournisseurs, setTraitesFournisseurs] = useState(null);

    useEffect(() => {
        fetchTraites().then(res => {
            setTraitesData(res.data.stats);
            console.log(res.data)
            setTraitesClients(res.data.traites.filter((traite)=> traite.type==='client'));
            setTraitesFournisseurs(res.data.traites.filter((traite)=> traite.type==='fournisseur'));
        })
    }, []);

    const handleTraiteClick = (traite) => {
        const type = traite.type=='client' ? 'Client' : 'Fournisseur'
        const name = traite.tier
        alert(`Traite ${type} ${name} - Échéance: ${traite.echeance} - Montant: ${formatAmount(traite.montant)} - Statut: ${traite.etat}`)
    }

    const getTraiteTypeColor = (type) => {
        const colors = {
        client: 'border-l-emerald-500',
        fournisseur: 'border-l-amber-500',
        echu: 'border-l-red-500'
        }
        return colors[type] || colors.client
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
        'en-cours': { label: 'EN COURS', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
        'echu': { label: 'ÉCHU', color: 'bg-red-50 text-red-700 border border-red-200' },
        'paye': { label: 'PAYÉ', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
        }
        const config = statusConfig[status] || statusConfig['en-cours']
        return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
            {config.label}
        </span>
        )
    }

    const formatAmount = (amount) => {
        if (amount === 0) return '0 DT'
        const sign = amount >= 0 ? '+' : ''
        return `${sign}${amount?.toLocaleString('fr-FR')} DT`
    }

  return (
    <div style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
        <style jsx>{`
            .kpi-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .kpi-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            }
            
            .kpi-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            }
            
            .icon-wrapper {
                width: 56px;
                height: 56px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, var(--bg-color), var(--bg-hover));
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .trend-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .traite-card {
                background: #ffffff;
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;
            }
            
            .traite-card:hover {
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            }
            
            .traite-item {
                background: #ffffff;
                border-radius: 12px;
                padding: 20px;
                border-left: 4px solid;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
                border-top: 1px solid #f1f5f9;
                border-right: 1px solid #f1f5f9;
                border-bottom: 1px solid #f1f5f9;
            }
            
            .traite-item:hover {
                transform: translateX(4px);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
                background: #fafbfc;
            }
            
            .traite-item.client {
                border-left-color: #10b981;
                background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
            }
            
            .traite-item.fournisseur {
                border-left-color: #f59e0b;
                background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
            }
            
            .traite-item.echu {
                border-left-color: #ef4444;
                background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
            }
            
            .scrollable-area {
                max-height: 450px;
                overflow-y: auto;
                padding-right: 8px;
            }
            
            .scrollable-area::-webkit-scrollbar {
                width: 6px;
            }
            
            .scrollable-area::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
            }
            
            .scrollable-area::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }
            
            .scrollable-area::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
            
            .page-title {
                font-size: 36px;
                font-weight: 700;
                color: #ff9100;
                margin-bottom: 8px;
                background: #ff9100;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .section-title {
                font-size: 24px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;
            }
            
            .section-subtitle {
                font-size: 16px;
                color: #64748b;
                margin-bottom: 24px;
            }
            
            .amount-positive {
                color: #059669;
                font-weight: 700;
            }
            
            .amount-negative {
                color: #dc2626;
                font-weight: 700;
            }
            
            .amount-neutral {
                color: #d97706;
                font-weight: 700;
            }
        `}</style>
        
        <div style={{ marginBottom: '40px' }}>
            <h1 className="page-title">Traites</h1>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* KPI Traites */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '24px' 
            }}>
                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="icon-wrapper" style={{ '--bg-color': '#dbeafe', '--bg-hover': '#bfdbfe' }}>
                            <FileText style={{ height: '28px', width: '28px', color: '#2563eb' }} />
                        </div>
                        <div className="trend-badge" style={{ 
                            color: '#059669', 
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #bbf7d0'
                        }}>
                            <TrendingUp style={{ height: '16px', width: '16px' }} />
                            {traitesData?.clients.trend}%
                        </div>
                    </div>
                    <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                        Traites Clients
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        {formatAmount(traitesData?.clients.value)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        {traitesData?.clients.count} traites en cours
                    </div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="icon-wrapper" style={{ '--bg-color': '#fed7aa', '--bg-hover': '#fdba74' }}>
                            <Building2 style={{ height: '28px', width: '28px', color: '#ea580c' }} />
                        </div>
                        <div className="trend-badge" style={{ 
                            color: '#dc2626', 
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca'
                        }}>
                            <TrendingDown style={{ height: '16px', width: '16px' }} />
                            {traitesData?.fournisseurs.trend}%
                        </div>
                    </div>
                    <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                        Traites Fournisseurs
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        {formatAmount(traitesData?.fournisseurs.value)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        {traitesData?.fournisseurs.count} traites à payer
                    </div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="icon-wrapper" style={{ '--bg-color': '#fecaca', '--bg-hover': '#fca5a5' }}>
                            <AlertTriangle style={{ height: '28px', width: '28px', color: '#dc2626' }} />
                        </div>
                        <div className="trend-badge" style={{ 
                            color: '#059669', 
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #bbf7d0'
                        }}>
                            <TrendingUp style={{ height: '16px', width: '16px' }} />
                            {traitesData?.echues.trend}%
                        </div>
                    </div>
                    <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                        Traites Échues
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        {formatAmount(traitesData?.echues.value)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        {traitesData?.echues.count} traites en retard
                    </div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="icon-wrapper" style={{ '--bg-color': '#bbf7d0', '--bg-hover': '#86efac' }}>
                            <DollarSign style={{ height: '28px', width: '28px', color: '#059669' }} />
                        </div>
                        <div className="trend-badge" style={{ 
                            color: '#059669', 
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #bbf7d0'
                        }}>
                            <TrendingUp style={{ height: '16px', width: '16px' }} />
                            {traitesData?.net.trend}%
                        </div>
                    </div>
                    <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                        Solde Net Traites
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        {formatAmount(traitesData?.net.value)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        Différence clients/fournisseurs
                    </div>
                </div>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
                gap: '32px' 
            }}>
                {/* Traites Clients */}
                <div className="traite-card">
                    <div style={{ marginBottom: '32px' }}>
                        <h3 className="section-title">Traites Clients</h3>
                        <p className="section-subtitle">À encaisser</p>
                    </div>
                    <div className="scrollable-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {traitesClients?.map((traite) => (
                            <div
                                key={traite.id}
                                className={`traite-item ${traite.etat === 'echu' ? 'echu' : 'client'}`}
                                onClick={() => handleTraiteClick(traite)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{
                                        padding: '6px 16px',
                                        backgroundColor: '#dbeafe',
                                        color: '#1d4ed8',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        borderRadius: '20px',
                                        border: '1px solid #bfdbfe'
                                    }}>
                                        CLIENT
                                    </span>
                                    {getStatusBadge(traite.etat)}
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px', fontSize: '16px' }}>
                                        Traite #{traite.tier}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                        {traite.client}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                        {traite.etat === 'paye' ? `Payé le: ${traite.echeance}` : `Échéance: ${traite.echeance}`}
                                    </span>
                                    <span className={
                                        traite.etat === 'echu' ? 'amount-negative' : 
                                        traite.etat === 'en-cours' ? 'amount-neutral' : 'amount-positive'
                                    } style={{ fontSize: '16px' }}>
                                        {formatAmount(traite.montant)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Traites Fournisseurs */}
                <div className="traite-card">
                    <div style={{ marginBottom: '32px' }}>
                        <h3 className="section-title">Traites Fournisseurs</h3>
                        <p className="section-subtitle">À payer</p>
                    </div>
                    <div className="scrollable-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {traitesFournisseurs?.map((traite) => (
                            <div
                                key={traite.id}
                                className={`traite-item ${traite.etat === 'echu' ? 'echu' : 'fournisseur'}`}
                                onClick={() => handleTraiteClick(traite)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{
                                        padding: '6px 16px',
                                        backgroundColor: '#fed7aa',
                                        color: '#c2410c',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        borderRadius: '20px',
                                        border: '1px solid #fdba74'
                                    }}>
                                        FOURNISSEUR
                                    </span>
                                    {getStatusBadge(traite.etat)}
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px', fontSize: '16px' }}>
                                        Traite #{traite.tier}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                        {traite.fournisseur}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                        {traite.etat === 'paye' ? `Payé le: ${traite.echeance}` : `Échéance: ${traite.echeance}`}
                                    </span>
                                    <span className={
                                        traite.etat === 'echu' ? 'amount-negative' : 
                                        traite.etat === 'en-cours' ? 'amount-neutral' : 'amount-positive'
                                    } style={{ fontSize: '16px' }}>
                                        {traite.montant.toLocaleString()} DT
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}