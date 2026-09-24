import React, { useState, useEffect } from 'react';
import { DriverProfile, Vehicle } from '../../types';
import {
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverActive,
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleActive
} from '../../services/api';
import {
  Bike,
  Car,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Layers,
  Filter,
  RefreshCw,
  Navigation,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

export const FleetTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Driver Modal state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverProfile | null>(null);
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleId: '',
    status: 'available' as DriverProfile['status']
  });

  // Vehicle Modal state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    type: 'Moto' as 'Moto' | 'Voiture' | 'Scooter',
    licensePlate: '',
    model: '',
    year: '2025',
    assignedDriverId: '',
    status: 'AVAILABLE' as Vehicle['status']
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dList, vList] = await Promise.all([fetchDrivers(), fetchVehicles()]);
      setDrivers(dList);
      setVehicles(vList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DRIVER ACTIONS
  // ==========================================
  const handleOpenCreateDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      name: '',
      phone: '',
      email: '',
      vehicleId: '',
      status: 'available'
    });
    setErrorMsg('');
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: DriverProfile) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      email: '',
      vehicleId: driver.vehicleId || '',
      status: driver.status
    });
    setErrorMsg('');
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Phone format validation
    const cleanPhone = driverForm.phone.replace(/[\s-]/g, '');
    const isValidTunisian =
      cleanPhone.startsWith('+216') ? cleanPhone.length === 12 : cleanPhone.length === 8;
    if (!isValidTunisian) {
      setErrorMsg('Numéro invalide. Format requis : 8 chiffres (ex: 20123456) ou +21620123456.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingDriver) {
        await updateDriver(editingDriver.id, {
          name: driverForm.name,
          phone: driverForm.phone,
          email: driverForm.email || undefined,
          vehicleId: driverForm.vehicleId || '',
          status: driverForm.status
        });
      } else {
        await createDriver({
          name: driverForm.name,
          phone: driverForm.phone,
          email: driverForm.email || undefined,
          vehicleId: driverForm.vehicleId || undefined
        });
      }
      setIsDriverModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l enregistrement du livreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (driver: DriverProfile) => {
    if (driver.status === 'busy') {
      alert(`Impossible de supprimer le livreur « ${driver.name} » car il est actuellement en cours de livraison.`);
      return;
    }

    if (
      !confirm(
        `Confirmez-vous la suppression définitive du livreur « ${driver.name} » ? Le véhicule associé sera libéré et son compte sera révoqué.`
      )
    ) {
      return;
    }

    try {
      await deleteDriver(driver.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleDriverActive = async (driver: DriverProfile) => {
    const isInactive = driver.status === 'inactive' || driver.status === 'suspended';
    const actionName = isInactive ? 'réactiver' : 'désactiver';

    if (driver.status === 'busy') {
      alert('Impossible de désactiver un livreur en cours de livraison.');
      return;
    }

    if (!confirm(`Voulez-vous vraiment ${actionName} le livreur « ${driver.name} » ?`)) {
      return;
    }

    try {
      await toggleDriverActive(driver.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  // ==========================================
  // VEHICLE ACTIONS
  // ==========================================
  const handleOpenCreateVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      type: 'Moto',
      licensePlate: '',
      model: '',
      year: '2025',
      assignedDriverId: '',
      status: 'AVAILABLE'
    });
    setErrorMsg('');
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehicleForm({
      type: veh.type,
      licensePlate: veh.licensePlate,
      model: veh.model,
      year: veh.year || '2025',
      assignedDriverId: veh.assignedDriverId || '',
      status: veh.status
    });
    setErrorMsg('');
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehicleForm.licensePlate.trim() || !vehicleForm.model.trim()) {
      setErrorMsg('Veuillez renseigner le modèle et l immatriculation.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          type: vehicleForm.type,
          licensePlate: vehicleForm.licensePlate,
          model: vehicleForm.model,
          year: vehicleForm.year,
          assignedDriverId: vehicleForm.assignedDriverId || undefined,
          status: vehicleForm.status
        });
      } else {
        await createVehicle({
          type: vehicleForm.type,
          licensePlate: vehicleForm.licensePlate,
          model: vehicleForm.model,
          year: vehicleForm.year,
          assignedDriverId: vehicleForm.assignedDriverId || undefined,
          status: vehicleForm.status
        });
      }
      setIsVehicleModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l enregistrement du véhicule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (veh: Vehicle) => {
    if (veh.status === 'ASSIGNED') {
      const confirmUnassign = confirm(
        `Le véhicule « ${veh.model} (${veh.licensePlate}) » est actuellement assigné à un livreur. Le supprimer libérera le conducteur. Confirmer ?`
      );
      if (!confirmUnassign) return;
    } else if (!confirm(`Supprimer définitivement le véhicule « ${veh.model} (${veh.licensePlate}) » ?`)) {
      return;
    }

    try {
      await deleteVehicle(veh.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur suppression véhicule');
    }
  };

  const handleToggleVehicleActive = async (veh: Vehicle) => {
    const isInactive = veh.status === 'INACTIVE' || veh.status === 'inactive';
    const actionName = isInactive ? 'réactiver' : 'désactiver';

    if (!confirm(`Voulez-vous ${actionName} le véhicule « ${veh.model} (${veh.licensePlate}) » ?`)) {
      return;
    }

    try {
      await toggleVehicleActive(veh.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur bascule véhicule');
    }
  };

  // Filtered lists
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(search.toLowerCase())) ||
      (d.vehicleModel && d.vehicleModel.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (d.status === 'available' || d.status === 'busy' || d.status === 'offline')) ||
      (statusFilter === 'inactive' && (d.status === 'inactive' || d.status === 'suspended')) ||
      d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && v.status !== 'INACTIVE' && v.status !== 'inactive') ||
      (statusFilter === 'inactive' && (v.status === 'INACTIVE' || v.status === 'inactive')) ||
      v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'available').length;
  const busyDrivers = drivers.filter(d => d.status === 'busy').length;
  const inactiveDrivers = drivers.filter(d => d.status === 'inactive' || d.status === 'suspended').length;

  const totalVehicles = vehicles.length;
  const assignedVehicles = vehicles.filter(v => v.status === 'ASSIGNED').length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'INACTIVE' || v.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Header & KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Livreurs</span>
            <Bike className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{totalDrivers}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            <span className="text-emerald-600 font-bold">{availableDrivers} dispo</span> • {busyDrivers} en cours
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Flotte Véhicules</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{totalVehicles}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            <span className="text-blue-600 font-bold">{assignedVehicles} assignés</span> • {availableVehicles} libres
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Livreurs Inactifs</span>
            <Power className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{inactiveDrivers}</div>
          <div className="text-[11px] text-stone-500 mt-1">Suspendus ou désactivés</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Véhicules Inactifs</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{inactiveVehicles}</div>
          <div className="text-[11px] text-stone-500 mt-1">Hors service / désactivés</div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setSubTab('drivers');
                setSearch('');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                subTab === 'drivers'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Gestion des Livreurs ({totalDrivers})</span>
            </button>

            <button
              onClick={() => {
                setSubTab('vehicles');
                setSearch('');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                subTab === 'vehicles'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Gestion de la Flotte ({totalVehicles})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {subTab === 'drivers' ? (
              <button
                onClick={handleOpenCreateDriver}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Livreur</span>
              </button>
            ) : (
              <button
                onClick={handleOpenCreateVehicle}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Véhicule</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                subTab === 'drivers'
                  ? 'Rechercher par nom, téléphone, véhicule...'
                  : 'Rechercher par modèle, immatriculation, conducteur...'
              }
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="p-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs / Désactivés</option>
              {subTab === 'drivers' ? (
                <>
                  <option value="available">Disponibles</option>
                  <option value="busy">En cours de livraison</option>
                  <option value="offline">Hors ligne</option>
                </>
              ) : (
                <>
                  <option value="AVAILABLE">Disponibles</option>
                  <option value="ASSIGNED">Assignés</option>
                  <option value="MAINTENANCE">En Maintenance</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* ========================================== */}
        {/* SUBTAB 1: DRIVERS TABLE */}
        {/* ========================================== */}
        {subTab === 'drivers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Livreur & Contact</th>
                  <th className="py-3 px-4">Véhicule Assigné</th>
                  <th className="py-3 px-4 text-center">Statut Opérationnel</th>
                  <th className="py-3 px-4 text-center">Livraisons Aujourd hui</th>
                  <th className="py-3 px-4 text-right">Encaissé Aujourd hui</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      Chargement des livreurs...
                    </td>
                  </tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      Aucun livreur trouvé avec ces filtres.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(drv => {
                    const isInactive = drv.status === 'inactive' || drv.status === 'suspended';

                    return (
                      <tr
                        key={drv.id}
                        className={`transition ${isInactive ? 'bg-stone-50/70 opacity-75' : 'hover:bg-purple-50/30'}`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 flex items-center gap-2">
                            <span>{drv.name}</span>
                            {isInactive && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.2 rounded-full font-bold">
                                DÉSACTIVÉ
                              </span>
                            )}
                          </div>
                          <div className="text-stone-500 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{drv.phone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {drv.vehicleModel ? (
                            <div>
                              <div className="font-medium text-stone-800 flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-purple-600" />
                                <span>{drv.vehicleModel}</span>
                              </div>
                              <div className="text-[10px] font-mono text-stone-500">
                                {drv.vehiclePlate || 'Sans plaque'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic text-[11px]">Aucun véhicule assigné</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              drv.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : drv.status === 'busy'
                                ? 'bg-blue-100 text-blue-800'
                                : drv.status === 'offline'
                                ? 'bg-stone-100 text-stone-600'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {drv.status === 'available'
                              ? 'DISPONIBLE'
                              : drv.status === 'busy'
                              ? 'EN LIVRAISON'
                              : drv.status === 'offline'
                              ? 'HORS LIGNE'
                              : 'INACTIF'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                            {drv.completedDeliveriesToday || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-800">
                          {(drv.collectedAmountToday || 0).toFixed(2)} DT
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active / Inactive */}
                            <button
                              onClick={() => handleToggleDriverActive(drv)}
                              className={`p-1.5 rounded-lg border transition ${
                                isInactive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                              }`}
                              title={isInactive ? 'Réactiver le livreur' : 'Désactiver le livreur'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditDriver(drv)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-purple-700 hover:bg-purple-50 transition border border-stone-200"
                              title="Modifier le livreur"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteDriver(drv)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition border border-rose-200"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB 2: VEHICLES TABLE */}
        {/* ========================================== */}
        {subTab === 'vehicles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Véhicule & Modèle</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 font-mono">Immatriculation</th>
                  <th className="py-3 px-4">Conducteur Assigné</th>
                  <th className="py-3 px-4 text-center">État du Véhicule</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      Chargement de la flotte...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      Aucun véhicule trouvé avec ces critères.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(veh => {
                    const isInactive = veh.status === 'INACTIVE' || veh.status === 'inactive';

                    return (
                      <tr
                        key={veh.id}
                        className={`transition ${isInactive ? 'bg-stone-50/70 opacity-75' : 'hover:bg-purple-50/30'}`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 flex items-center gap-2">
                            <span>{veh.model}</span>
                            {veh.year && (
                              <span className="text-[10px] text-stone-400 font-normal">({veh.year})</span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">{veh.id}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded text-[11px] font-medium text-stone-700">
                            {veh.type === 'Moto' ? (
                              <Bike className="w-3 h-3 text-purple-600" />
                            ) : (
                              <Car className="w-3 h-3 text-blue-600" />
                            )}
                            <span>{veh.type}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-stone-800">
                          {veh.licensePlate}
                        </td>

                        <td className="py-3 px-4">
                          {veh.assignedDriverName ? (
                            <span className="font-semibold text-stone-800">
                              {veh.assignedDriverName}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">Non assigné (Libre)</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              veh.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : veh.status === 'ASSIGNED'
                                ? 'bg-blue-100 text-blue-800'
                                : veh.status === 'MAINTENANCE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {veh.status === 'AVAILABLE'
                              ? 'DISPONIBLE'
                              : veh.status === 'ASSIGNED'
                              ? 'ASSIGNÉ'
                              : veh.status === 'MAINTENANCE'
                              ? 'EN MAINTENANCE'
                              : 'INACTIF'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active / Inactive */}
                            <button
                              onClick={() => handleToggleVehicleActive(veh)}
                              className={`p-1.5 rounded-lg border transition ${
                                isInactive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                              }`}
                              title={isInactive ? 'Réactiver le véhicule' : 'Désactiver le véhicule'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditVehicle(veh)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-purple-700 hover:bg-purple-50 transition border border-stone-200"
                              title="Modifier le véhicule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteVehicle(veh)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition border border-rose-200"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* DRIVER CREATE / EDIT MODAL */}
      {/* ========================================== */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                <Bike className="w-5 h-5 text-purple-600" />
                <span>{editingDriver ? 'Modifier le Livreur' : 'Nouveau Livreur'}</span>
              </h3>
              <button
                onClick={() => setIsDriverModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDriver} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={driverForm.name}
                  onChange={e => setDriverForm({ ...driverForm, name: e.target.value })}
                  placeholder="Ex: Mehdi Ben Amor"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Téléphone mobile (+216) *</label>
                <input
                  type="tel"
                  required
                  value={driverForm.phone}
                  onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })}
                  placeholder="Ex: 20123456 ou +21620123456"
                  className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Email professionnel (optionnel)</label>
                <input
                  type="email"
                  value={driverForm.email}
                  onChange={e => setDriverForm({ ...driverForm, email: e.target.value })}
                  placeholder="mehdi.livreur@bebba.tn"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Véhicule assigné</label>
                <select
                  value={driverForm.vehicleId}
                  onChange={e => setDriverForm({ ...driverForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Aucun véhicule (Pieds / En attente)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.licensePlate}) - {v.type} [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              {editingDriver && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Statut opérationnel</label>
                  <select
                    value={driverForm.status}
                    onChange={e => setDriverForm({ ...driverForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  >
                    <option value="available">Disponible</option>
                    <option value="busy">En cours de livraison</option>
                    <option value="offline">Hors ligne</option>
                    <option value="inactive">Désactivé / Inactif</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VEHICLE CREATE / EDIT MODAL */}
      {/* ========================================== */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <span>{editingVehicle ? 'Modifier le Véhicule' : 'Nouveau Véhicule de Flotte'}</span>
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Type de véhicule *</label>
                  <select
                    value={vehicleForm.type}
                    onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Moto">Moto</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Voiture">Voiture</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Année</label>
                  <input
                    type="text"
                    value={vehicleForm.year}
                    onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    placeholder="2025"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Modèle & Marque *</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.model}
                  onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="Ex: Honda Forza 300 / Peugeot 208"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Numéro d immatriculation *</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.licensePlate}
                  onChange={e => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })}
                  placeholder="Ex: 242 TN 8910"
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Conducteur attitré</label>
                <select
                  value={vehicleForm.assignedDriverId}
                  onChange={e => setVehicleForm({ ...vehicleForm, assignedDriverId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Aucun conducteur assigné (Disponible)</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.userId}>
                      {d.name} ({d.phone}) {d.vehicleModel ? `[Actuellement sur ${d.vehicleModel}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">État du véhicule</label>
                <select
                  value={vehicleForm.status}
                  onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="ASSIGNED">Assigné</option>
                  <option value="MAINTENANCE">En Maintenance / Révision</option>
                  <option value="INACTIVE">Inactif / Hors Service</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
