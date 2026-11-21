import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Lock,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Download,
  AlertCircle,
} from 'lucide-react';
import { SECTORS } from '../data/scpContent';
import type {
  WorkspacePayload,
  SectorId,
  RequestStatus,
  UserRole,
  ContractDocument,
} from '../types/scp';

interface WorkspaceDashboardProps {
  token: string;
  workspace: WorkspacePayload;
  onRefresh: () => Promise<void>;
  onDemoSwitch: (role: UserRole) => Promise<void>;
  onLogout: () => void;
}

const REQUEST_PIPELINE: RequestStatus[] = [
  '1. Solicitud recibida',
  '2. Estudio y opciones',
  '3. Presupuesto aceptado',
  '4. En ejecución',
  '5. Cierre y valoración',
];

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  token,
  workspace,
  onRefresh,
  onDemoSwitch,
  onLogout,
}) => {
  const { user, specialistProfile, requests, specialists, appointments, escrowTransactions, documents } =
    workspace;

  const [activeTab, setActiveTab] = useState<'expedientes' | 'agenda' | 'documentos' | 'escrow'>('expedientes');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New Titular Request Form
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newSector, setNewSector] = useState<SectorId>('tramites');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCity, setNewCity] = useState(user.city || 'Madrid');
  const [newModality, setNewModality] = useState<'Presencial' | 'Online' | 'Mixta'>('Presencial');
  const [newBudget, setNewBudget] = useState(250);

  // Specialist proposal form per request
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, { text: string; amount: number }>>({});

  // New Appointment Form
  const [aptSpecId, setAptSpecId] = useState(specialists[0]?.id || '');
  const [aptDate, setAptDate] = useState('2026-11-28');
  const [aptTime, setAptTime] = useState('11:00');
  const [aptModality, setAptModality] = useState<'Presencial' | 'Videoconsulta SCP'>('Presencial');
  const [aptNotes, setAptNotes] = useState('');
  const [aptReqId, setAptReqId] = useState('');

  // Document viewer
  const [docFilter, setDocFilter] = useState<string>('Todos');
  const [selectedDoc, setSelectedDoc] = useState<ContractDocument | null>(documents[0] || null);

  // Admin assignment drafts
  const [adminAssignDraft, setAdminAssignDraft] = useState<Record<string, string>>({});

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('new-req');
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          sector: newSector,
          title: newTitle,
          description: newDesc,
          city: newCity,
          modality: newModality,
          estimatedBudget: newBudget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar expediente.');
      setNewTitle('');
      setNewDesc('');
      setShowNewRequest(false);
      setFeedback(`Expediente ${data.request.code} creado en estado «1. Solicitud recibida».`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al crear expediente.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePropose = async (requestId: string, fallbackBudget: number) => {
    const draft = proposalDrafts[requestId];
    const proposalText = draft?.text || '';
    const amount = draft?.amount || Math.round(fallbackBudget * 0.75);
    setBusyId(requestId);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch(`/api/requests/${requestId}/propose`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ proposal: proposalText, proposedFinalAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la propuesta.');
      setFeedback(`Opciones enviadas para el expediente ${data.request.code}.`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar propuesta.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEscrowDeposit = async (requestId: string) => {
    setBusyId(requestId);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch(`/api/requests/${requestId}/escrow-deposit`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo activar el Pago Protegido.');
      setFeedback(`Pago Protegido (Escrow SCP) activado para ${data.request.code}.`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error en custodia.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEscrowRelease = async (requestId: string) => {
    setBusyId(requestId);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch(`/api/requests/${requestId}/escrow-release`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ rating: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo liberar el Pago Protegido.');
      setFeedback(`Expediente ${data.request.code} cerrado y Pago Protegido liberado al especialista.`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al liberar fondos.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('new-apt');
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          specialistId: aptSpecId || specialists[0]?.id,
          dateISO: aptDate,
          timeSlot: aptTime,
          modality: aptModality,
          notes: aptNotes,
          requestId: aptReqId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo reservar la cita.');
      setAptNotes('');
      setFeedback('Cita registrada en tu Agenda SCP.');
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al reservar cita.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateAppointment = async (id: string, status: 'Confirmada' | 'Completada' | 'Cancelada') => {
    setBusyId(id);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Error al actualizar cita.');
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar cita.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminValidateSpecialist = async (
    specialistId: string,
    validationStatus: 'Validado' | 'Rechazado' | 'En revisión por SCP'
  ) => {
    setBusyId(specialistId);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch(`/api/admin/specialists/${specialistId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ validationStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar validación.');
      setFeedback(`Estado de ${data.specialist.fullName} actualizado a «${validationStatus}».`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error en validación.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminUpdateRequest = async (requestId: string, status: RequestStatus) => {
    setBusyId(requestId);
    setErrorMsg('');
    setFeedback('');
    try {
      const assignedSpecialistId = adminAssignDraft[requestId];
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          status,
          assignedSpecialistId: assignedSpecialistId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar expediente.');
      setFeedback(`Expediente ${data.request.code} actualizado a «${status}».`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar expediente.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminAssignOnly = async (requestId: string) => {
    const assignedSpecialistId = adminAssignDraft[requestId];
    if (!assignedSpecialistId) {
      setErrorMsg('Selecciona un especialista validado en el desplegable antes de asignar.');
      return;
    }
    setBusyId(requestId);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ assignedSpecialistId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo asignar el especialista.');
      setFeedback(`Especialista asignado al expediente ${data.request.code}.`);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al asignar especialista.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadContract = (doc: ContractDocument) => {
    const content = [
      `SERVICIOS CANAL PUENTE (SCP) · CONTRATO MODELO OFICIAL`,
      `Código: ${doc.code} | Área: ${doc.category} | Versión: ${doc.version}`,
      `Título: ${doc.title}`,
      `------------------------------------------------------------`,
      doc.summary,
      ``,
      `CLÁUSULAS PRINCIPALES:`,
      ...doc.clauses.map((c, idx) => `${idx + 1}. ${c}`),
      ``,
      `Pago Protegido (Escrow SCP) y Escudo Dual SCP · Tel./WhatsApp +34 673 735 059`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openContractForSector = (sector: SectorId) => {
    const matchedDoc = documents.find((d) => d.sector === sector) || documents[0];
    if (matchedDoc) {
      setSelectedDoc(matchedDoc);
      setDocFilter('Todos');
      setActiveTab('documentos');
    }
  };

  const totalCustody = escrowTransactions
    .filter((e) => e.status === 'En custodia SCP')
    .reduce((acc, e) => acc + e.netCustodyAmount, 0);

  const totalReleased = escrowTransactions
    .filter((e) => e.status === 'Liberado al especialista')
    .reduce((acc, e) => acc + e.netCustodyAmount, 0);

  const totalSaved = escrowTransactions.reduce((acc, e) => acc + e.discountSaved, 0);

  const validatedSpecs = specialists.filter((s) => s.validationStatus === 'Validado');
  const filteredDocs =
    docFilter === 'Todos' ? documents : documents.filter((d) => d.category === docFilter);

  return (
    <div className="pt-24 lg:pt-32 pb-20 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 space-y-8">
        {/* Cabecera de Mi Espacio / Administración SCP */}
        <div className="bg-[#14284B] text-white rounded-xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#D7B45F]">
              {user.role === 'admin'
                ? 'Panel de Administración SCP · El Puente'
                : user.role === 'especialista'
                  ? 'Mi Espacio - Especialista'
                  : 'Mi Espacio - Titular'}
            </p>
            <h1 className="font-editorial text-3xl font-semibold">{user.fullName}</h1>
            <p className="text-xs text-white/75">
              {user.email} · {user.city} · Membresía {user.membershipTier}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-white/65 mr-1">Cambiar entorno demo:</span>
            <button
              type="button"
              onClick={() => onDemoSwitch('titular')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                user.role === 'titular' ? 'bg-[#C59B3B] text-[#14284B]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Titular
            </button>
            <button
              type="button"
              onClick={() => onDemoSwitch('especialista')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                user.role === 'especialista' ? 'bg-[#C59B3B] text-[#14284B]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Especialista
            </button>
            <button
              type="button"
              onClick={() => onDemoSwitch('admin')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                user.role === 'admin' ? 'bg-[#2E5A44] text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Administración SCP
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-md border border-white/25 text-xs text-white/85 hover:text-white cursor-pointer ml-1"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Estado de acreditación si es Especialista */}
        {user.role === 'especialista' && specialistProfile && (
          <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#C59B3B]">
                Ficha profesional · {SECTORS.find((s) => s.id === specialistProfile.sector)?.name.es}
              </p>
              <p className="text-sm font-semibold text-[#14284B]">
                {specialistProfile.companyName ? `${specialistProfile.companyName} · ` : ''}
                {specialistProfile.specialty} · Col./Acred. {specialistProfile.licenseNumber} · Tarifa orientativa{' '}
                {specialistProfile.orientativeRate} €
              </p>
              <p className="text-xs text-[#14284B]/65">
                Póliza RC {specialistProfile.rcInsurancePolicy} · Compromiso de Calidad SCP aceptado
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
              {specialistProfile.validationStatus === 'Validado' ? (
                <span className="inline-flex items-center gap-1.5 text-[#2E5A44]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validado por SCP (Dto. {specialistProfile.discountPercent} %)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#C59B3B]">
                  <AlertCircle className="w-4 h-4" />
                  <span>{specialistProfile.validationStatus}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navegación interna */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#E5DFD5] rounded-lg w-fit">
          {[
            {
              id: 'expedientes',
              label:
                user.role === 'admin'
                  ? 'Validaciones y Expedientes'
                  : user.role === 'especialista'
                    ? 'Encargos asignados'
                    : 'Mis expedientes',
              icon: FileText,
            },
            { id: 'agenda', label: 'Agenda de citas', icon: Calendar },
            { id: 'documentos', label: 'Contratos oficiales', icon: ShieldCheck },
            {
              id: 'escrow',
              label:
                user.role === 'especialista'
                  ? 'Historial de liquidaciones'
                  : 'Pago Protegido (Escrow SCP)',
              icon: Lock,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#14284B] text-white'
                    : 'text-[#14284B]/75 hover:bg-[#FAF8F5] hover:text-[#14284B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#C59B3B]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="p-3.5 rounded-lg bg-[#E7EFEA] border border-[#2E5A44]/30 text-xs font-semibold text-[#14284B]">
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: EXPEDIENTES / ADMIN */}
        {activeTab === 'expedientes' && (
          <div className="space-y-8">
            {/* Sección Admin: Altas de Especialistas */}
            {user.role === 'admin' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
                    Altas de Especialistas (Validación colegial y Seguro RC)
                  </h2>
                  <span className="text-xs font-mono text-[#14284B]/70 tabular-nums">
                    {specialists.length} perfiles registrados
                  </span>
                </div>

                <div className="bg-white border border-[#E5DFD5] rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-[#14284B] border-b border-[#E5DFD5]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Especialista / Empresa</th>
                        <th className="py-3 px-4 font-semibold">Área y especialidad</th>
                        <th className="py-3 px-4 font-semibold">Acreditación / Seguro RC</th>
                        <th className="py-3 px-4 font-semibold text-right">Tarifa / Dto.</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                        <th className="py-3 px-4 font-semibold text-right">Validación SCP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DFD5]">
                      {specialists.map((sp) => (
                        <tr key={sp.id} className="hover:bg-[#FAF8F5]">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#14284B]">{sp.fullName}</p>
                            <p className="text-[#14284B]/65">
                              {sp.companyName ? `${sp.companyName} · ` : ''}
                              {sp.city} ({sp.modality})
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-[#14284B]">
                              {SECTORS.find((s) => s.id === sp.sector)?.shortName.es}
                            </p>
                            <p className="text-[#14284B]/70 max-w-xs truncate">{sp.specialty}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#14284B]/80">
                            <p>{sp.licenseNumber}</p>
                            <p>{sp.rcInsurancePolicy}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {sp.orientativeRate} € · -{sp.discountPercent} %
                          </td>
                          <td className="py-3.5 px-4 font-semibold">
                            <span
                              className={
                                sp.validationStatus === 'Validado'
                                  ? 'text-[#2E5A44]'
                                  : sp.validationStatus === 'Rechazado'
                                    ? 'text-red-700'
                                    : 'text-[#C59B3B]'
                              }
                            >
                              {sp.validationStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            {sp.validationStatus !== 'Validado' && (
                              <button
                                type="button"
                                disabled={busyId === sp.id}
                                onClick={() => handleAdminValidateSpecialist(sp.id, 'Validado')}
                                className="px-3 py-1.5 rounded bg-[#2E5A44] hover:bg-[#244736] text-white font-semibold cursor-pointer"
                              >
                                Validar
                              </button>
                            )}
                            {sp.validationStatus !== 'Rechazado' && (
                              <button
                                type="button"
                                disabled={busyId === sp.id}
                                onClick={() => handleAdminValidateSpecialist(sp.id, 'Rechazado')}
                                className="px-3 py-1.5 rounded border border-[#E5DFD5] text-[#14284B] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                              >
                                Rechazar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Expedientes */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
                    {user.role === 'especialista'
                      ? 'Encargos asignados y solicitudes disponibles en tu área'
                      : user.role === 'admin'
                        ? 'Todas las solicitudes de Usuarios Titulares'
                        : 'Mis expedientes activos SCP'}
                  </h2>
                  <p className="text-xs text-[#14284B]/70">
                    Progreso de 5 estados: 1. Solicitud recibida · 2. Estudio y opciones · 3. Presupuesto aceptado · 4. En ejecución · 5. Cierre y valoración
                  </p>
                </div>

                {(user.role === 'titular' || user.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(!showNewRequest)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#C59B3B]" />
                    <span>Nueva solicitud de servicio</span>
                  </button>
                )}
              </div>

              {showNewRequest && (
                <form
                  onSubmit={handleCreateRequest}
                  className="bg-white border border-[#C59B3B] rounded-xl p-6 space-y-4"
                >
                  <h3 className="font-editorial text-xl font-semibold text-[#14284B]">
                    Nuevo expediente de solicitud SCP
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value as SectorId)}
                      className="sm:col-span-3 px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                    >
                      {SECTORS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.number}. {s.name.es}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newModality}
                      onChange={(e) => setNewModality(e.target.value as 'Presencial' | 'Online' | 'Mixta')}
                      className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Online">Online</option>
                      <option value="Mixta">Mixta</option>
                    </select>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Ciudad"
                      className="sm:col-span-2 px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Título de tu solicitud (ej. Homologación de título universitario)"
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <textarea
                    rows={3}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Explica tu necesidad y plazos..."
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#14284B]">Presupuesto orientativo (€):</span>
                      <input
                        type="number"
                        min={40}
                        max={50000}
                        value={newBudget}
                        onChange={(e) => setNewBudget(Number(e.target.value))}
                        className="w-28 px-2.5 py-1.5 border border-[#E5DFD5] rounded font-mono tabular-nums"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewRequest(false)}
                        className="px-4 py-2 text-xs text-[#14284B]/70 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={busyId === 'new-req'}
                        className="px-5 py-2 rounded-md bg-[#14284B] text-white text-xs font-semibold cursor-pointer"
                      >
                        Crear expediente EXP-2026
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {requests.length === 0 ? (
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-10 text-center space-y-2">
                  <p className="font-editorial text-2xl font-semibold text-[#14284B]">
                    Todavía no hay expedientes asignados en esta vista
                  </p>
                  <p className="text-xs text-[#14284B]/70">
                    {user.role === 'titular'
                      ? 'Pulsa «Nueva solicitud de servicio» para abrir tu primer expediente con hasta un 25 % de descuento.'
                      : 'Cuando Administración SCP valide tu ficha o asigne un expediente de tu área aparecerá aquí.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => {
                    const currentStepIdx = REQUEST_PIPELINE.indexOf(req.status);
                    const sectorName = SECTORS.find((s) => s.id === req.sector)?.name.es || req.sector;
                    const draft = proposalDrafts[req.id] || {
                      text: '',
                      amount: Math.round(req.estimatedBudget * 0.75),
                    };

                    return (
                      <div
                        key={req.id}
                        className="bg-white border border-[#E5DFD5] rounded-xl p-6 space-y-5"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <p className="text-xs font-mono text-[#C59B3B] font-semibold">
                              {req.code} · {sectorName} · {req.city} ({req.modality})
                            </p>
                            <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">
                              {req.title}
                            </h3>
                            <p className="text-sm text-[#14284B]/75 max-w-3xl">{req.description}</p>
                            <p className="text-xs text-[#14284B]/65 pt-1">
                              Titular: <strong>{req.titularName}</strong>
                              {req.assignedSpecialistName
                                ? ` · Especialista asignado: ${req.assignedSpecialistName}`
                                : ' · Especialista pendiente de asignación por SCP'}
                            </p>
                          </div>

                          <div className="text-left lg:text-right shrink-0 space-y-1">
                            <p className="text-xs font-semibold text-[#14284B]">{req.status}</p>
                            <p className="font-mono text-lg font-semibold text-[#14284B] tabular-nums">
                              {req.proposedFinalAmount ?? Math.round(req.estimatedBudget * 0.75)} €{' '}
                              <span className="text-xs font-normal text-[#2E5A44]">
                                (-{req.appliedDiscountPercent} % SCP)
                              </span>
                            </p>
                            <p className="text-xs font-medium text-[#2E5A44]">
                              Pago Protegido (Escrow SCP): {req.escrowStatus}
                            </p>
                          </div>
                        </div>

                        {/* Barra de progreso de 5 estados */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                          {REQUEST_PIPELINE.map((step, idx) => {
                            const active = idx <= currentStepIdx;
                            return (
                              <div
                                key={step}
                                className={`px-3 py-2 rounded-md border text-[11px] font-semibold ${
                                  active
                                    ? 'bg-[#14284B] text-white border-[#14284B]'
                                    : 'bg-[#FAF8F5] text-[#14284B]/45 border-[#E5DFD5]'
                                }`}
                              >
                                {step}
                              </div>
                            );
                          })}
                        </div>

                        {req.specialistProposal && (
                          <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-lg p-4 text-xs text-[#14284B]">
                            <p className="font-semibold text-[#C59B3B] mb-1">Propuesta cerrada del especialista:</p>
                            <p>{req.specialistProposal}</p>
                          </div>
                        )}

                        {/* Acciones por rol */}
                        <div className="pt-3 border-t border-[#E5DFD5] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openContractForSector(req.sector)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FAF8F5] hover:border-[#14284B] text-xs font-semibold text-[#14284B] cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#C59B3B]" />
                              <span>Ver / Descargar contrato oficial</span>
                            </button>

                            {user.role === 'titular' && req.escrowStatus === 'Pendiente de depósito' && (
                              <button
                                type="button"
                                disabled={busyId === req.id}
                                onClick={() => handleEscrowDeposit(req.id)}
                                className="px-4 py-1.5 rounded-md bg-[#C59B3B] hover:bg-[#A67E26] text-[#14284B] text-xs font-semibold cursor-pointer"
                              >
                                Aceptar y activar Pago Protegido (Escrow)
                              </button>
                            )}

                            {(user.role === 'titular' || user.role === 'admin') &&
                              req.escrowStatus === 'En custodia SCP' &&
                              req.status !== '5. Cierre y valoración' && (
                                <button
                                  type="button"
                                  disabled={busyId === req.id}
                                  onClick={() => handleEscrowRelease(req.id)}
                                  className="px-4 py-1.5 rounded-md bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-semibold cursor-pointer"
                                >
                                  Liberar Pago Protegido y cerrar
                                </button>
                              )}
                          </div>

                          {/* Especialista: enviar opciones */}
                          {user.role === 'especialista' &&
                            specialistProfile?.validationStatus === 'Validado' &&
                            (req.status === '1. Solicitud recibida' || req.status === '2. Estudio y opciones') && (
                              <div className="w-full flex flex-col sm:flex-row gap-2 items-stretch sm:items-center pt-2">
                                <input
                                  type="text"
                                  value={draft.text}
                                  onChange={(e) =>
                                    setProposalDrafts((prev) => ({
                                      ...prev,
                                      [req.id]: { ...draft, text: e.target.value },
                                    }))
                                  }
                                  placeholder="Detalle de tu presupuesto cerrado y plazos..."
                                  className="flex-1 px-3 py-2 text-xs border border-[#E5DFD5] rounded-md"
                                />
                                <input
                                  type="number"
                                  value={draft.amount}
                                  onChange={(e) =>
                                    setProposalDrafts((prev) => ({
                                      ...prev,
                                      [req.id]: { ...draft, amount: Number(e.target.value) },
                                    }))
                                  }
                                  className="w-28 px-3 py-2 text-xs border border-[#E5DFD5] rounded-md font-mono tabular-nums"
                                />
                                <button
                                  type="button"
                                  disabled={busyId === req.id}
                                  onClick={() => handlePropose(req.id, req.estimatedBudget)}
                                  className="px-4 py-2 rounded-md bg-[#14284B] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  Enviar presupuesto al Titular
                                </button>
                              </div>
                            )}

                          {/* Admin SCP: asignar especialista + cambiar estado + liberar Escrow */}
                          {user.role === 'admin' && (
                            <div className="w-full pt-2 border-t border-[#E5DFD5]/60 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={adminAssignDraft[req.id] ?? req.assignedSpecialistId ?? ''}
                                  onChange={(e) =>
                                    setAdminAssignDraft((prev) => ({ ...prev, [req.id]: e.target.value }))
                                  }
                                  className="px-3 py-1.5 text-xs border border-[#E5DFD5] rounded-md bg-white"
                                >
                                  <option value="">Seleccionar especialista validado...</option>
                                  {validatedSpecs.map((sp) => (
                                    <option key={sp.id} value={sp.id}>
                                      {sp.fullName} ({SECTORS.find((s) => s.id === sp.sector)?.shortName.es})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={busyId === req.id}
                                  onClick={() => handleAdminAssignOnly(req.id)}
                                  className="px-3 py-1.5 rounded bg-[#C59B3B] text-[#14284B] text-xs font-semibold cursor-pointer"
                                >
                                  Asignar especialista
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {REQUEST_PIPELINE.map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    disabled={busyId === req.id}
                                    onClick={() => handleAdminUpdateRequest(req.id, st)}
                                    className={`px-2.5 py-1.5 rounded text-[11px] font-semibold cursor-pointer ${
                                      req.status === st
                                        ? 'bg-[#14284B] text-white'
                                        : 'bg-[#FAF8F5] border border-[#E5DFD5] text-[#14284B] hover:border-[#14284B]'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: AGENDA */}
        {activeTab === 'agenda' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-[#E5DFD5] rounded-xl p-6 space-y-4 h-fit">
              <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
                Solicitar nueva cita de Agenda
              </h2>
              <form onSubmit={handleBookAppointment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">
                    Especialista validado
                  </label>
                  <select
                    value={aptSpecId}
                    onChange={(e) => setAptSpecId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                  >
                    {validatedSpecs.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.fullName} · {SECTORS.find((s) => s.id === sp.sector)?.shortName.es}
                      </option>
                    ))}
                  </select>
                </div>

                {requests.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#14284B] mb-1">
                      Expediente vinculado (opcional)
                    </label>
                    <select
                      value={aptReqId}
                      onChange={(e) => setAptReqId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                    >
                      <option value="">Sin vincular a expediente</option>
                      {requests.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} · {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#14284B] mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#14284B] mb-1">Hora</label>
                    <select
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white font-mono"
                    >
                      {['09:30', '11:00', '12:30', '16:30', '18:00', '19:00'].map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">Modalidad</label>
                  <select
                    value={aptModality}
                    onChange={(e) => setAptModality(e.target.value as 'Presencial' | 'Videoconsulta SCP')}
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Videoconsulta SCP">Videoconsulta SCP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">Motivo / Notas</label>
                  <textarea
                    rows={2}
                    value={aptNotes}
                    onChange={(e) => setAptNotes(e.target.value)}
                    placeholder="Indica idioma preferido (Castellano, Catalán, Árabe, Darija)..."
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busyId === 'new-apt'}
                  className="w-full py-2.5 px-4 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold cursor-pointer"
                >
                  Reservar cita en Agenda SCP
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
                Agenda de citas ({appointments.length})
              </h2>
              {appointments.length === 0 ? (
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-8 text-center text-sm text-[#14284B]/70">
                  No hay citas programadas todavía.
                </div>
              ) : (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white border border-[#E5DFD5] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-[#C59B3B] tabular-nums">
                        {apt.dateISO} · {apt.timeSlot} h · {apt.modality}
                        {apt.requestCode ? ` · ${apt.requestCode}` : ''}
                      </p>
                      <p className="font-editorial text-xl font-semibold text-[#14284B]">
                        {apt.specialistName}
                      </p>
                      <p className="text-xs text-[#14284B]/70">
                        Titular: {apt.titularName} {apt.notes ? `· ${apt.notes}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-[#2E5A44] mr-2">{apt.status}</span>
                      {(user.role === 'especialista' || user.role === 'admin') && apt.status === 'Solicitada' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateAppointment(apt.id, 'Confirmada')}
                          className="px-3 py-1.5 rounded bg-[#2E5A44] text-white text-xs font-semibold cursor-pointer"
                        >
                          Confirmar
                        </button>
                      )}
                      {apt.status === 'Confirmada' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateAppointment(apt.id, 'Completada')}
                          className="px-3 py-1.5 rounded border border-[#E5DFD5] text-xs font-semibold text-[#14284B] cursor-pointer"
                        >
                          Marcar realizada
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONTRATOS OFICIALES */}
        {activeTab === 'documentos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
                  Contratos oficiales y documentos modelo SCP
                </h2>
                <p className="text-xs text-[#14284B]/70">
                  Visualiza o descarga el contrato correspondiente a cada una de las 8 áreas de actividad.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Todos', 'Trámites', 'Sanidad', 'Academia', 'Bienestar', 'Inmobiliaria', 'Protección Animal', 'Comunicación', 'Asociación'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDocFilter(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      docFilter === cat ? 'bg-[#14284B] text-white' : 'bg-white border border-[#E5DFD5] text-[#14284B]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      selectedDoc?.id === doc.id
                        ? 'bg-[#14284B] text-white border-[#14284B]'
                        : 'bg-white text-[#14284B] border-[#E5DFD5] hover:border-[#C59B3B]'
                    }`}
                  >
                    <p className={`text-[11px] font-mono ${selectedDoc?.id === doc.id ? 'text-[#D7B45F]' : 'text-[#C59B3B]'}`}>
                      {doc.category} · {doc.code}
                    </p>
                    <p className="font-semibold text-sm mt-1">{doc.title}</p>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-7">
                {selectedDoc && (
                  <div className="bg-white border border-[#E5DFD5] rounded-xl p-7 space-y-5">
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DFD5]">
                      <div>
                        <p className="font-mono text-xs text-[#C59B3B]">
                          {selectedDoc.code} · {selectedDoc.version}
                        </p>
                        <h3 className="font-editorial text-2xl font-semibold text-[#14284B] mt-1">
                          {selectedDoc.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadContract(selectedDoc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#14284B] text-white text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#D7B45F]" />
                        <span>Descargar contrato</span>
                      </button>
                    </div>
                    <p className="text-sm text-[#14284B]/80 leading-relaxed">{selectedDoc.summary}</p>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#14284B]">Cláusulas esenciales incluidas:</p>
                      {selectedDoc.clauses.map((clause, i) => (
                        <div key={clause} className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] text-xs text-[#14284B]/85 leading-relaxed">
                          <span className="font-mono font-semibold text-[#C59B3B] mr-2">0{i + 1}.</span>
                          {clause}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAGO PROTEGIDO (ESCROW SCP) / HISTORIAL DE LIQUIDACIONES */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5">
                <p className="text-xs text-[#14284B]/65">En custodia (Pago Protegido Escrow SCP)</p>
                <p className="font-mono text-2xl font-semibold text-[#14284B] tabular-nums mt-1">
                  {totalCustody.toFixed(2)} €
                </p>
              </div>
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5">
                <p className="text-xs text-[#14284B]/65">Liquidado al especialista</p>
                <p className="font-mono text-2xl font-semibold text-[#2E5A44] tabular-nums mt-1">
                  {totalReleased.toFixed(2)} €
                </p>
              </div>
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5">
                <p className="text-xs text-[#14284B]/65">Ahorro total aplicado por descuentos SCP</p>
                <p className="font-mono text-2xl font-semibold text-[#C59B3B] tabular-nums mt-1">
                  {totalSaved.toFixed(2)} €
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E5DFD5] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#14284B] border-b border-[#E5DFD5]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Ref. Escrow</th>
                    <th className="py-3 px-4 font-semibold">Expediente</th>
                    <th className="py-3 px-4 font-semibold">Titular / Especialista</th>
                    <th className="py-3 px-4 font-semibold text-right">Tarifa base</th>
                    <th className="py-3 px-4 font-semibold text-right">Ahorro SCP</th>
                    <th className="py-3 px-4 font-semibold text-right">Importe protegido</th>
                    <th className="py-3 px-4 font-semibold">Estado Escrow SCP</th>
                    <th className="py-3 px-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD5]">
                  {escrowTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#14284B]">{tx.referenceCode}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#C59B3B] font-semibold">{tx.requestCode}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#14284B]">{tx.titularName}</p>
                        <p className="text-[#14284B]/65">{tx.specialistName}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">{tx.grossAmount.toFixed(2)} €</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#2E5A44]">
                        -{tx.discountSaved.toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                        {tx.netCustodyAmount.toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <span
                          className={
                            tx.status === 'Liberado al especialista'
                              ? 'text-[#2E5A44]'
                              : tx.status === 'En custodia SCP'
                                ? 'text-[#14284B]'
                                : 'text-[#C59B3B]'
                          }
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {(user.role === 'titular' || user.role === 'admin') && tx.status === 'Pendiente de depósito' && (
                          <button
                            type="button"
                            disabled={busyId === tx.requestId}
                            onClick={() => handleEscrowDeposit(tx.requestId)}
                            className="px-3 py-1.5 rounded bg-[#C59B3B] text-[#14284B] font-semibold cursor-pointer"
                          >
                            Activar custodia
                          </button>
                        )}
                        {(user.role === 'titular' || user.role === 'admin') && tx.status === 'En custodia SCP' && (
                          <button
                            type="button"
                            disabled={busyId === tx.requestId}
                            onClick={() => handleEscrowRelease(tx.requestId)}
                            className="px-3 py-1.5 rounded bg-[#2E5A44] text-white font-semibold cursor-pointer"
                          >
                            Liberar Pago Protegido
                          </button>
                        )}
                        {user.role === 'especialista' && (
                          <span className="text-[#14284B]/60">Respaldo Escrow SCP</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
