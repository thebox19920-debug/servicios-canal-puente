import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck, Briefcase, Lock } from 'lucide-react';
import { SECTORS } from '../data/scpContent';
import type { SectorId, UserProfile, UserRole } from '../types/scp';

export type ModalMode = 'login' | 'reserved' | 'titular-form' | 'especialista-form';

interface AuthAndFormsModalProps {
  open: boolean;
  mode: ModalMode;
  currentUser: UserProfile | null;
  authToken: string | null;
  prefill?: { sector?: SectorId; title?: string; budget?: number };
  onClose: () => void;
  onAuthenticated: (token: string, user: UserProfile, goToWorkspace?: boolean) => void;
  onDemoLogin: (role: UserRole) => Promise<void>;
  onRequestCreated?: () => Promise<void>;
}

export const AuthAndFormsModal: React.FC<AuthAndFormsModalProps> = ({
  open,
  mode,
  currentUser,
  authToken,
  prefill,
  onClose,
  onAuthenticated,
  onDemoLogin,
  onRequestCreated,
}) => {
  const [activeTab, setActiveTab] = useState<ModalMode>(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Titular form state
  const [titName, setTitName] = useState('');
  const [titEmail, setTitEmail] = useState('');
  const [titPhone, setTitPhone] = useState('');
  const [titPassword, setTitPassword] = useState('');
  const [titCity, setTitCity] = useState('Madrid');
  const [reqSector, setReqSector] = useState<SectorId>(prefill?.sector || 'tramites');
  const [reqTitle, setReqTitle] = useState(prefill?.title || '');
  const [reqDesc, setReqDesc] = useState('');
  const [reqModality, setReqModality] = useState<'Presencial' | 'Online' | 'Mixta'>('Presencial');
  const [reqBudget, setReqBudget] = useState<number>(prefill?.budget || 260);

  // Especialista form state
  const [espName, setEspName] = useState('');
  const [espCompany, setEspCompany] = useState('');
  const [espEmail, setEspEmail] = useState('');
  const [espPhone, setEspPhone] = useState('');
  const [espPassword, setEspPassword] = useState('');
  const [espCity, setEspCity] = useState('Madrid');
  const [espSector, setEspSector] = useState<SectorId>('salud');
  const [espSpecialty, setEspSpecialty] = useState('');
  const [espLicense, setEspLicense] = useState('');
  const [espRcPolicy, setEspRcPolicy] = useState('');
  const [espModality, setEspModality] = useState<'Presencial' | 'Online' | 'Mixta'>('Mixta');
  const [espRate, setEspRate] = useState(110);
  const [espDiscount, setEspDiscount] = useState(25);
  const [espQualityPledge, setEspQualityPledge] = useState(true);
  const [espBio, setEspBio] = useState('');

  useEffect(() => {
    setActiveTab(mode);
    setError('');
  }, [mode, open]);

  useEffect(() => {
    if (prefill?.sector) setReqSector(prefill.sector);
    if (prefill?.title) setReqTitle(prefill.title);
    if (prefill?.budget) setReqBudget(prefill.budget);
  }, [prefill]);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      onAuthenticated(data.token, data.user, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    setLoading(true);
    setError('');
    try {
      await onDemoLogin(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el entorno demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTitular = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let tokenToUse: string | null =
        currentUser && authToken && (currentUser.role === 'titular' || currentUser.role === 'admin')
          ? authToken
          : null;
      let userToUse: UserProfile | null =
        currentUser && (currentUser.role === 'titular' || currentUser.role === 'admin')
          ? currentUser
          : null;

      if (!tokenToUse || !userToUse) {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: titEmail,
            password: titPassword,
            fullName: titName,
            phone: titPhone,
            role: 'titular',
            city: titCity,
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Error al registrar Usuario Titular.');
        tokenToUse = regData.token;
        userToUse = regData.user;
      }

      if (tokenToUse && userToUse) {
        const reqRes = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenToUse}`,
          },
          body: JSON.stringify({
            sector: reqSector,
            title: reqTitle,
            description: reqDesc,
            city: currentUser ? currentUser.city : titCity,
            modality: reqModality,
            estimatedBudget: reqBudget,
          }),
        });
        const reqData = await reqRes.json();
        if (!reqRes.ok) throw new Error(reqData.error || 'No se pudo crear el expediente.');
        if (onRequestCreated) await onRequestCreated();
        onAuthenticated(tokenToUse, userToUse, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEspecialista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!espQualityPledge) {
      setError('Debes aceptar el Compromiso de Calidad SCP para completar tu adhesión profesional.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: espEmail,
          password: espPassword,
          fullName: espName,
          companyName: espCompany,
          phone: espPhone,
          role: 'especialista',
          city: espCity,
          sector: espSector,
          specialty: espSpecialty,
          licenseNumber: espLicense,
          rcInsurancePolicy: espRcPolicy,
          modality: espModality,
          orientativeRate: espRate,
          discountPercent: espDiscount,
          qualityPledgeAccepted: espQualityPledge,
          bio: espBio,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Error al registrar Usuario Especialista.');
      onAuthenticated(regData.token, regData.user, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar adhesión profesional.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14284B]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Cabecera modal */}
        <div className="sticky top-0 bg-[#14284B] text-white px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#D7B45F]">
              Servicios Canal Puente · Acceso y Formularios Reales
            </p>
            <h2 className="font-editorial text-2xl font-semibold">
              {activeTab === 'titular-form'
                ? 'Registra tu servicio (Usuario Titular)'
                : activeTab === 'especialista-form'
                  ? 'Ofrece tus servicios (Usuario Especialista)'
                  : 'Mi Espacio (Acceso Usuarios)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de modo */}
        <div className="px-6 pt-4 pb-2 bg-white border-b border-[#E5DFD5] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'login' || activeTab === 'reserved'
                ? 'bg-[#14284B] text-white'
                : 'bg-[#FAF8F5] text-[#14284B] border border-[#E5DFD5]'
            }`}
          >
            Mi Espacio (Acceso / Demo)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('titular-form')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'titular-form'
                ? 'bg-[#14284B] text-white'
                : 'bg-[#FAF8F5] text-[#14284B] border border-[#E5DFD5]'
            }`}
          >
            Registra tu servicio (Titular)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('especialista-form')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'especialista-form'
                ? 'bg-[#14284B] text-white'
                : 'bg-[#FAF8F5] text-[#14284B] border border-[#E5DFD5]'
            }`}
          >
            Ofrece tus servicios (Especialista)
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector rápido de demostración */}
          <div className="bg-white border border-[#C59B3B]/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#14284B]">
              <ShieldCheck className="w-4 h-4 text-[#C59B3B]" />
              <span>Selector rápido de prueba (1 clic)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('titular')}
                className="px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5DFD5] hover:border-[#14284B] text-xs font-semibold text-[#14284B] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#C59B3B]" />
                <span>Probar como Titular</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('especialista')}
                className="px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5DFD5] hover:border-[#14284B] text-xs font-semibold text-[#14284B] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#2E5A44]" />
                <span>Probar como Especialista</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('admin')}
                className="px-3 py-2 rounded-md bg-[#2E5A44] hover:bg-[#244736] text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#D7B45F]" />
                <span>Administración SCP</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          {(activeTab === 'login' || activeTab === 'reserved') && (
            <form onSubmit={handleLogin} className="space-y-4 bg-white border border-[#E5DFD5] rounded-lg p-5">
              <h3 className="font-editorial text-xl font-semibold text-[#14284B]">
                Acceder con tu correo y contraseña
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nombre@correo.es"
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Verificando...' : 'Entrar en Mi Espacio'}
              </button>
            </form>
          )}

          {activeTab === 'titular-form' && (
            <form onSubmit={handleSubmitTitular} className="space-y-4 bg-white border border-[#E5DFD5] rounded-lg p-5">
              {currentUser && (currentUser.role === 'titular' || currentUser.role === 'admin') ? (
                <div className="p-3 rounded-md bg-[#E7EFEA] text-xs text-[#14284B]">
                  Sesión activa: <strong>{currentUser.fullName}</strong>. El nuevo expediente (`EXP-2026-...`) se abrirá directamente en tu panel <strong>Mi Espacio - Titular</strong>.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#C59B3B]">1. Datos de registro del Usuario Titular</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={titName}
                      onChange={(e) => setTitName(e.target.value)}
                      placeholder="Nombre y apellidos"
                      className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                    />
                    <input
                      type="email"
                      required
                      value={titEmail}
                      onChange={(e) => setTitEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                    />
                    <input
                      type="tel"
                      required
                      value={titPhone}
                      onChange={(e) => setTitPhone(e.target.value)}
                      placeholder="Teléfono / WhatsApp"
                      className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={titPassword}
                      onChange={(e) => setTitPassword(e.target.value)}
                      placeholder="Contraseña de acceso (mín. 6)"
                      className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-[#E5DFD5]">
                <p className="text-xs font-semibold text-[#C59B3B]">
                  2. Área de actividad y detalle de tu necesidad (Estado inicial: 1. Solicitud recibida)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={reqSector}
                    onChange={(e) => setReqSector(e.target.value as SectorId)}
                    className="sm:col-span-3 px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                  >
                    {SECTORS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.number}. {s.name.es}
                      </option>
                    ))}
                  </select>
                  <select
                    value={reqModality}
                    onChange={(e) => setReqModality(e.target.value as 'Presencial' | 'Online' | 'Mixta')}
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                  >
                    <option value="Presencial">Preferencia: Presencial</option>
                    <option value="Online">Preferencia: Online</option>
                    <option value="Mixta">Preferencia: Indiferente / Mixta</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={titCity}
                    onChange={(e) => setTitCity(e.target.value)}
                    placeholder="Ciudad (ej. Madrid, Barcelona)"
                    className="sm:col-span-2 px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                </div>

                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="Título breve del servicio que necesitas"
                  className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                />
                <textarea
                  rows={3}
                  required
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Describe tu necesidad, urgencia o idioma preferido..."
                  className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-semibold text-[#14284B] whitespace-nowrap">
                    Presupuesto orientativo (€):
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={50000}
                    value={reqBudget}
                    onChange={(e) => setReqBudget(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-sm border border-[#E5DFD5] rounded-md font-mono tabular-nums"
                  />
                  <span className="text-xs text-[#2E5A44] font-semibold">
                    Ahorro estimado SCP (25 %): {Math.round(reqBudget * 0.25)} €
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Registrando expediente...' : 'Enviar solicitud y acceder a Mi Espacio - Titular'}
              </button>
            </form>
          )}

          {activeTab === 'especialista-form' && (
            <form onSubmit={handleSubmitEspecialista} className="space-y-4 bg-white border border-[#E5DFD5] rounded-lg p-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#2E5A44]">1. Datos de acceso y titularidad profesional</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={espName}
                    onChange={(e) => setEspName(e.target.value)}
                    placeholder="Nombre y apellidos del profesional"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <input
                    type="text"
                    value={espCompany}
                    onChange={(e) => setEspCompany(e.target.value)}
                    placeholder="Empresa / Despacho / Clínica (opcional)"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <input
                    type="email"
                    required
                    value={espEmail}
                    onChange={(e) => setEspEmail(e.target.value)}
                    placeholder="Correo profesional"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <input
                    type="tel"
                    required
                    value={espPhone}
                    onChange={(e) => setEspPhone(e.target.value)}
                    placeholder="Teléfono / WhatsApp"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={espPassword}
                    onChange={(e) => setEspPassword(e.target.value)}
                    placeholder="Contraseña de acceso (mín. 6)"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <input
                    type="text"
                    required
                    value={espCity}
                    onChange={(e) => setEspCity(e.target.value)}
                    placeholder="Ciudad de cobertura"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#E5DFD5]">
                <p className="text-xs font-semibold text-[#2E5A44]">
                  2. Acreditación y tarifa (Estado inicial: En revisión por SCP)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={espSector}
                    onChange={(e) => setEspSector(e.target.value as SectorId)}
                    className="sm:col-span-2 px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                  >
                    {SECTORS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.number}. {s.name.es}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={espSpecialty}
                    onChange={(e) => setEspSpecialty(e.target.value)}
                    placeholder="Especialidad concreta"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                  />
                  <select
                    value={espModality}
                    onChange={(e) => setEspModality(e.target.value as 'Presencial' | 'Online' | 'Mixta')}
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md bg-white"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Online">Online</option>
                    <option value="Mixta">Mixta</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={espLicense}
                    onChange={(e) => setEspLicense(e.target.value)}
                    placeholder="Nº Colegiado / Acreditación oficial"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={espRcPolicy}
                    onChange={(e) => setEspRcPolicy(e.target.value)}
                    placeholder="Nº Póliza Seguro RC"
                    className="px-3 py-2 text-sm border border-[#E5DFD5] rounded-md font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border border-[#E5DFD5] rounded-md bg-[#FAF8F5]">
                    <label className="text-xs font-semibold text-[#14284B]">Tarifa orientativa (€):</label>
                    <input
                      type="number"
                      min={20}
                      max={10000}
                      value={espRate}
                      onChange={(e) => setEspRate(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-[#E5DFD5] rounded bg-white font-mono tabular-nums"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border border-[#E5DFD5] rounded-md bg-[#FAF8F5]">
                    <label className="text-xs font-semibold text-[#14284B]">Dto. SCP (hasta 25 %):</label>
                    <input
                      type="number"
                      min={5}
                      max={25}
                      value={espDiscount}
                      onChange={(e) => setEspDiscount(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-[#E5DFD5] rounded bg-white font-mono tabular-nums"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={espBio}
                  onChange={(e) => setEspBio(e.target.value)}
                  placeholder="Breve resumen profesional, idiomas (Castellano, Catalán, Árabe, Darija) y experiencia..."
                  className="w-full px-3 py-2 text-sm border border-[#E5DFD5] rounded-md"
                />

                <label className="flex items-start gap-2.5 p-3 rounded-md bg-[#E7EFEA]/60 border border-[#2E5A44]/20 text-xs text-[#14284B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={espQualityPledge}
                    onChange={(e) => setEspQualityPledge(e.target.checked)}
                    className="mt-0.5 accent-[#2E5A44]"
                  />
                  <span>
                    <strong>Compromiso de Calidad SCP:</strong> Acepto ofrecer presupuesto cerrado previo, mantener vigente mi acreditación y póliza RC, y respetar la custodia en Pago Protegido (Escrow SCP).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-[#C59B3B] hover:bg-[#A67E26] text-[#14284B] text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Creando ficha profesional...' : 'Enviar adhesión y entrar en Mi Espacio - Especialista'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
