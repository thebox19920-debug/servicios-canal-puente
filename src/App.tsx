import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Header, type PageRoute } from './components/Header';
import { HomeSections } from './components/HomeSections';
import { PublicViews } from './components/PublicViews';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import { AuthAndFormsModal, type ModalMode } from './components/AuthAndFormsModal';
import { Footer } from './components/Footer';
import { LEGAL_DOCS } from './data/scpContent';
import type {
  LanguageCode,
  SectorId,
  UserProfile,
  UserRole,
  ServiceOffer,
  SpecialistProfile,
  ContractDocument,
  WorkspacePayload,
} from './types/scp';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('inicio');
  const [lang, setLang] = useState<LanguageCode>('es');

  // Public catalog data from server
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [publicSpecialists, setPublicSpecialists] = useState<Partial<SpecialistProfile>[]>([]);
  const [publicDocuments, setPublicDocuments] = useState<ContractDocument[]>([]);

  // Filter state when navigating to Servicios
  const [sectorFilter, setSectorFilter] = useState<SectorId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // In-memory auth session
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<ModalMode>('login');
  const [requestPrefill, setRequestPrefill] = useState<{
    sector?: SectorId;
    title?: string;
    budget?: number;
  }>();
  const [legalDocKey, setLegalDocKey] = useState<'aviso' | 'privacidad' | 'cookies' | 'condiciones' | null>(null);

  const loadPublicCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/public/catalog');
      if (!res.ok) return;
      const data = await res.json();
      setOffers(data.offers || []);
      setPublicSpecialists(data.validatedSpecialists || []);
      setPublicDocuments(data.documents || []);
    } catch {
      // Keep graceful empty catalog until network settles
    }
  }, []);

  useEffect(() => {
    loadPublicCatalog();
  }, [loadPublicCatalog]);

  const fetchWorkspace = useCallback(async (token: string) => {
    setWorkspaceLoading(true);
    try {
      const res = await fetch('/api/workspace', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as WorkspacePayload;
      setWorkspace(data);
      setCurrentUser(data.user);
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  const handleAuthenticated = useCallback(
    async (token: string, user: UserProfile, goToWorkspace = true) => {
      setAuthToken(token);
      setCurrentUser(user);
      setAuthModalOpen(false);
      await fetchWorkspace(token);
      await loadPublicCatalog();
      if (goToWorkspace) {
        setCurrentPage('espacio');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [fetchWorkspace, loadPublicCatalog]
  );

  const handleDemoLogin = useCallback(
    async (role: UserRole) => {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en acceso demo');
      await handleAuthenticated(data.token, data.user, true);
    },
    [handleAuthenticated]
  );

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setWorkspace(null);
    if (currentPage === 'espacio') {
      setCurrentPage('inicio');
    }
  }, [currentPage]);

  const handleNavigate = (
    page: PageRoute,
    options?: { sector?: SectorId | 'all'; anchor?: string; verifiedOnly?: boolean }
  ) => {
    if (options?.sector) setSectorFilter(options.sector);
    else if (page === 'servicios') setSectorFilter('all');

    setVerifiedOnly(Boolean(options?.verifiedOnly));
    if (page !== 'servicios') setSearchQuery('');

    setCurrentPage(page);
    if (options?.anchor) {
      setTimeout(() => {
        document.getElementById(options.anchor!)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchServices = (query: string, sector: SectorId | 'all') => {
    setSearchQuery(query);
    setSectorFilter(sector);
    setVerifiedOnly(false);
    setCurrentPage('servicios');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSector = (sector: SectorId) => {
    setSectorFilter(sector);
    setSearchQuery('');
    setVerifiedOnly(false);
    setCurrentPage('servicios');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: ModalMode) => {
    setRequestPrefill(undefined);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleRequestFromOffer = (sector: SectorId, title: string, budget: number) => {
    setRequestPrefill({ sector, title, budget });
    setAuthModalMode('titular-form');
    setAuthModalOpen(true);
  };

  const activeLegal = legalDocKey ? LEGAL_DOCS[legalDocKey] : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#14284B]">
      <Header
        currentPage={currentPage}
        lang={lang}
        user={currentUser}
        onNavigate={handleNavigate}
        onToggleLang={setLang}
        onOpenAuth={handleOpenAuth}
        onOpenAdminPanel={() => handleDemoLogin('admin')}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {currentPage === 'inicio' && (
          <HomeSections
            lang={lang}
            onSearchServices={handleSearchServices}
            onSelectSector={handleSelectSector}
            onOpenAuth={handleOpenAuth}
            onDemoLogin={handleDemoLogin}
          />
        )}

        {currentPage === 'espacio' && (
          <>
            {workspace && authToken ? (
              <WorkspaceDashboard
                token={authToken}
                workspace={workspace}
                onRefresh={async () => {
                  await fetchWorkspace(authToken);
                  await loadPublicCatalog();
                }}
                onDemoSwitch={handleDemoLogin}
                onLogout={handleLogout}
              />
            ) : (
              <div className="pt-36 pb-24 max-w-[1000px] mx-auto px-6">
                {workspaceLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-28 bg-[#E5DFD5] rounded-xl" />
                    <div className="h-12 bg-[#E5DFD5] rounded-lg w-80" />
                    <div className="h-64 bg-[#E5DFD5] rounded-xl" />
                  </div>
                ) : (
                  <div className="bg-white border border-[#14284B]/15 rounded-xl p-10 text-center space-y-4">
                    <h1 className="font-editorial text-3xl font-semibold text-[#14284B]">
                      Inicia sesión para acceder a Mi Espacio SCP
                    </h1>
                    <p className="text-sm text-[#14284B]/75 max-w-lg mx-auto">
                      Puedes entrar con tu cuenta registrada o probar al instante la vista de Titular, Especialista o Administración SCP con un solo clic.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAuth('login')}
                      className="px-6 py-2.5 rounded-md bg-[#14284B] text-white text-sm font-semibold cursor-pointer"
                    >
                      Abrir acceso a Mi Espacio
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {currentPage !== 'inicio' && currentPage !== 'espacio' && (
          <PublicViews
            page={currentPage}
            lang={lang}
            offers={offers}
            specialists={publicSpecialists}
            documents={publicDocuments}
            initialSector={sectorFilter}
            initialQuery={searchQuery}
            initialVerifiedOnly={verifiedOnly}
            onRequestServiceFromOffer={handleRequestFromOffer}
            onOpenAuth={handleOpenAuth}
          />
        )}
      </main>

      <Footer
        onNavigate={(p) => handleNavigate(p)}
        onOpenLegal={(key) => setLegalDocKey(key)}
      />

      <AuthAndFormsModal
        open={authModalOpen}
        mode={authModalMode}
        currentUser={currentUser}
        authToken={authToken}
        prefill={requestPrefill}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        onDemoLogin={handleDemoLogin}
        onRequestCreated={async () => {
          if (authToken) await fetchWorkspace(authToken);
        }}
      />

      {/* Lector de textos legales */}
      {activeLegal && (
        <div className="fixed inset-0 z-50 bg-[#14284B]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#14284B]/15 rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#14284B]/10">
              <div>
                <p className="text-xs font-semibold text-[#C59B3B]">{activeLegal.updated}</p>
                <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">{activeLegal.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setLegalDocKey(null)}
                aria-label="Cerrar documento legal"
                className="p-1.5 rounded hover:bg-[#E5DFD5] cursor-pointer"
              >
                <X className="w-5 h-5 text-[#14284B]" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-[#14284B]/80 leading-relaxed max-h-[60vh] overflow-y-auto">
              {activeLegal.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="pt-3 border-t border-[#14284B]/10 text-right">
              <button
                type="button"
                onClick={() => setLegalDocKey(null)}
                className="px-4 py-2 rounded-md bg-[#14284B] text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
