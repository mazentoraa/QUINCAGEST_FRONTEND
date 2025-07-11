import React from 'react'
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

export default function TresorerieTraite() {

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

    const traitesData = {
        clients: { value: 45200, trend: 8, count: 12 },
        fournisseurs: { value: -28600, trend: -5, count: 8 },
        echues: { value: 6800, trend: 15, count: 3 },
        net: { value: 16600, trend: 12 }
    }

    const handleTraiteClick = (traite) => {
        const type = traite.id.startsWith('TC') ? 'Client' : 'Fournisseur'
        const name = traite.client || traite.fournisseur
        alert(`Traite ${type} ${name} - Échéance: ${traite.echeance} - Montant: ${formatAmount(traite.montant)} - Statut: ${traite.status}`)
    }

    const getTraiteTypeColor = (type) => {
        const colors = {
        client: 'border-l-green-500',
        fournisseur: 'border-l-orange-500',
        echu: 'border-l-red-500'
        }
        return colors[type] || colors.client
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

    const formatAmount = (amount) => {
        if (amount === 0) return '0 DT'
        const sign = amount >= 0 ? '+' : ''
        return `${sign}${amount.toLocaleString('fr-FR')} DT`
    }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Traites</h1>
        </div>
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
    </div>
  )
}
