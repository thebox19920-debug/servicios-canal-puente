export type LanguageCode = 'es' | 'ar';

export type UserRole = 'titular' | 'especialista' | 'admin';

export type SectorId =
  | 'tramites'
  | 'salud'
  | 'inmobiliaria'
  | 'academia'
  | 'bienestar'
  | 'proteccion_animal'
  | 'comunicacion'
  | 'asociacion';

export type RequestStatus =
  | '1. Solicitud recibida'
  | '2. Estudio y opciones'
  | '3. Presupuesto aceptado'
  | '4. En ejecución'
  | '5. Cierre y valoración';

export type SpecialistValidationStatus =
  | 'En revisión por SCP'
  | 'Validado'
  | 'Rechazado';

export type EscrowStatus =
  | 'Pendiente de depósito'
  | 'En custodia SCP'
  | 'Liberado al especialista';

export type AppointmentStatus = 'Solicitada' | 'Confirmada' | 'Completada' | 'Cancelada';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  city: string;
  membershipTier: 'Estándar' | 'SCP Plus' | 'Institucional';
  createdAt: string;
}

export interface SpecialistProfile {
  id: string;
  userId: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  sector: SectorId;
  specialty: string;
  licenseNumber: string;
  rcInsurancePolicy: string;
  city: string;
  modality: 'Presencial' | 'Online' | 'Mixta';
  orientativeRate: number;
  discountPercent: number;
  qualityPledgeAccepted: boolean;
  bio: string;
  validationStatus: SpecialistValidationStatus;
  verifiedAt?: string;
  createdAt: string;
}

export interface ServiceOffer {
  id: string;
  sector: SectorId;
  title: string;
  specialistName: string;
  specialistLicense: string;
  city: string;
  modality: 'Presencial' | 'Online' | 'Mixta';
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  summary: string;
  verified: boolean;
}

export interface ServiceRequest {
  id: string;
  code: string;
  titularId: string;
  titularName: string;
  titularEmail: string;
  sector: SectorId;
  title: string;
  description: string;
  city: string;
  modality: 'Presencial' | 'Online' | 'Mixta';
  estimatedBudget: number;
  appliedDiscountPercent: number;
  status: RequestStatus;
  assignedSpecialistId?: string;
  assignedSpecialistName?: string;
  specialistProposal?: string;
  proposedFinalAmount?: number;
  escrowStatus: EscrowStatus;
  titularRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  requestId?: string;
  requestCode?: string;
  titularId: string;
  titularName: string;
  specialistId: string;
  specialistName: string;
  sector: SectorId;
  dateISO: string;
  timeSlot: string;
  modality: 'Presencial' | 'Videoconsulta SCP';
  notes: string;
  status: AppointmentStatus;
}

export interface EscrowTransaction {
  id: string;
  requestId: string;
  requestCode: string;
  titularName: string;
  specialistName: string;
  grossAmount: number;
  discountSaved: number;
  netCustodyAmount: number;
  status: EscrowStatus;
  referenceCode: string;
  updatedAt: string;
}

export interface ContractDocument {
  id: string;
  sector: SectorId;
  category: 'Trámites' | 'Sanidad' | 'Academia' | 'Bienestar' | 'Inmobiliaria' | 'Protección Animal' | 'Comunicación' | 'Asociación';
  title: string;
  code: string;
  version: string;
  summary: string;
  clauses: string[];
}

export interface StoreOrder {
  id: string;
  itemTitle: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  status: 'Confirmado' | 'En preparación';
  createdAt: string;
}

export interface WorkspacePayload {
  user: UserProfile;
  specialistProfile: SpecialistProfile | null;
  requests: ServiceRequest[];
  specialists: SpecialistProfile[];
  appointments: Appointment[];
  escrowTransactions: EscrowTransaction[];
  documents: ContractDocument[];
  offers: ServiceOffer[];
  storeOrders: StoreOrder[];
}
