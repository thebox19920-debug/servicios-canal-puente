import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  loadDatabase,
  saveDatabase,
  hashPassword,
  verifyPassword,
  type UserRole,
  type SectorId,
  type RequestStatus,
  type StoredUser,
  type StoredSpecialist,
  type StoredServiceRequest,
  type StoredAppointment,
  type StoredEscrow,
  type StoredOrder,
} from './src/server/store.ts';

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

interface TokenPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

function signToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TokenPayload;
    if (!parsed.userId || !parsed.role || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    city: u.city,
    membershipTier: u.membershipTier,
    createdAt: u.createdAt,
  };
}

const VALID_SECTORS = new Set<SectorId>([
  'tramites',
  'salud',
  'inmobiliaria',
  'academia',
  'bienestar',
  'proteccion_animal',
  'comunicacion',
  'asociacion',
]);

const VALID_REQUEST_STATUSES = new Set<RequestStatus>([
  '1. Solicitud recibida',
  '2. Estudio y opciones',
  '3. Presupuesto aceptado',
  '4. En ejecución',
  '5. Cierre y valoración',
]);

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sesión no iniciada o token ausente.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Sesión caducada o token inválido.' });
    return;
  }
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Usuario no encontrado.' });
    return;
  }
  req.authUser = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Public catalog: verified offers, validated specialists summary, model documents
  app.get('/api/public/catalog', (_req: Request, res: Response) => {
    const db = loadDatabase();
    const validatedSpecialists = db.specialists
      .filter((s) => s.validationStatus === 'Validado')
      .map((s) => ({
        id: s.id,
        fullName: s.fullName,
        companyName: s.companyName,
        sector: s.sector,
        specialty: s.specialty,
        licenseNumber: s.licenseNumber,
        city: s.city,
        modality: s.modality,
        orientativeRate: s.orientativeRate,
        discountPercent: s.discountPercent,
        bio: s.bio,
        validationStatus: s.validationStatus,
      }));
    res.json({
      offers: db.offers,
      documents: db.documents,
      validatedSpecialists,
    });
  });

  // 1-click Demo Login
  app.post('/api/auth/demo-login', (req: Request, res: Response) => {
    const role = typeof req.body?.role === 'string' ? req.body.role : '';
    const db = loadDatabase();
    let targetId = 'usr-titular-demo';
    if (role === 'especialista') targetId = 'usr-especialista-demo';
    else if (role === 'admin') targetId = 'usr-admin-demo';
    else if (role !== 'titular') {
      res.status(400).json({ error: 'Rol demo no válido.' });
      return;
    }

    const user = db.users.find((u) => u.id === targetId);
    if (!user) {
      res.status(404).json({ error: 'Perfil de demostración no disponible.' });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  });

  // Register new Titular or Especialista
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const {
      email,
      password,
      fullName,
      companyName,
      phone,
      role,
      city,
      sector,
      specialty,
      licenseNumber,
      rcInsurancePolicy,
      modality,
      orientativeRate,
      discountPercent,
      qualityPledgeAccepted,
      bio,
    } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      !email.includes('@') ||
      typeof password !== 'string' ||
      password.length < 6 ||
      typeof fullName !== 'string' ||
      fullName.trim().length < 2
    ) {
      res.status(400).json({
        error: 'Introduce un nombre completo, correo electrónico válido y contraseña (mín. 6 caracteres).',
      });
      return;
    }

    const cleanRole: UserRole = role === 'especialista' ? 'especialista' : 'titular';
    const cleanEmail = email.trim().toLowerCase();
    const db = loadDatabase();

    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo. Inicia sesión en Mi Espacio.' });
      return;
    }

    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();
    const newUser: StoredUser = {
      id: userId,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      fullName: fullName.trim(),
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : '+34 600 000 000',
      role: cleanRole,
      city: typeof city === 'string' && city.trim() ? city.trim() : 'Madrid',
      membershipTier: 'Estándar',
      createdAt: nowIso,
    };
    db.users.push(newUser);

    if (cleanRole === 'especialista') {
      if (!qualityPledgeAccepted) {
        res.status(400).json({
          error: 'Debes aceptar el Compromiso de Calidad SCP para completar el alta profesional.',
        });
        return;
      }
      const cleanSector: SectorId = VALID_SECTORS.has(sector) ? sector : 'tramites';
      const cleanDiscount = Math.min(25, Math.max(5, Number(discountPercent) || 20));
      const cleanRate = Math.max(20, Math.min(20000, Number(orientativeRate) || 95));
      const newSpec: StoredSpecialist = {
        id: `esp-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        fullName: newUser.fullName,
        companyName: typeof companyName === 'string' && companyName.trim() ? companyName.trim() : undefined,
        email: newUser.email,
        phone: newUser.phone,
        sector: cleanSector,
        specialty: typeof specialty === 'string' && specialty.trim() ? specialty.trim() : 'Especialista acreditado',
        licenseNumber:
          typeof licenseNumber === 'string' && licenseNumber.trim()
            ? licenseNumber.trim()
            : 'ACRED-PENDIENTE',
        rcInsurancePolicy:
          typeof rcInsurancePolicy === 'string' && rcInsurancePolicy.trim()
            ? rcInsurancePolicy.trim()
            : 'RC-VERIFICACION',
        city: newUser.city,
        modality: modality === 'Online' || modality === 'Mixta' ? modality : 'Presencial',
        orientativeRate: cleanRate,
        discountPercent: cleanDiscount,
        qualityPledgeAccepted: true,
        bio:
          typeof bio === 'string' && bio.trim()
            ? bio.trim()
            : 'Profesional adherido al Compromiso de Calidad SCP en proceso de validación.',
        validationStatus: 'En revisión por SCP',
        createdAt: nowIso,
      };
      db.specialists.push(newSpec);
    }

    saveDatabase(db);
    const token = signToken(newUser.id, newUser.role);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  // Standard email + password login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.status(400).json({ error: 'Introduce tu correo y contraseña.' });
      return;
    }
    const db = loadDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({
        error: 'Credenciales incorrectas. Si pruebas las cuentas de demostración, usa los botones de acceso rápido.',
      });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  });

  // Protected Workspace ("Mi Espacio" / "Administración SCP")
  app.get('/api/workspace', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();

    const specialistProfile =
      user.role === 'especialista'
        ? db.specialists.find((s) => s.userId === user.id) ?? null
        : null;

    let requests: StoredServiceRequest[] = [];
    if (user.role === 'admin') {
      requests = db.requests;
    } else if (user.role === 'titular') {
      requests = db.requests.filter((r) => r.titularId === user.id);
    } else if (user.role === 'especialista') {
      requests = db.requests.filter(
        (r) =>
          (specialistProfile && r.assignedSpecialistId === specialistProfile.id) ||
          (specialistProfile && r.sector === specialistProfile.sector && !r.assignedSpecialistId)
      );
    }

    const visibleRequestIds = new Set(requests.map((r) => r.id));

    const appointments =
      user.role === 'admin'
        ? db.appointments
        : user.role === 'titular'
          ? db.appointments.filter((a) => a.titularId === user.id)
          : db.appointments.filter(
              (a) => specialistProfile && a.specialistId === specialistProfile.id
            );

    const escrowTransactions =
      user.role === 'admin'
        ? db.escrowTransactions
        : db.escrowTransactions.filter((e) => visibleRequestIds.has(e.requestId));

    const specialists =
      user.role === 'admin'
        ? db.specialists
        : db.specialists.filter((s) => s.validationStatus === 'Validado');

    res.json({
      user: sanitizeUser(user),
      specialistProfile,
      requests,
      specialists,
      appointments,
      escrowTransactions,
      documents: db.documents,
      offers: db.offers,
      storeOrders:
        user.role === 'admin'
          ? db.storeOrders
          : db.storeOrders.filter((o) => o.buyerEmail === user.email),
    });
  });

  // Create Service Request ("Registra tu servicio (Usuario Titular)")
  app.post('/api/requests', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role !== 'titular' && user.role !== 'admin') {
      res.status(403).json({ error: 'Solo un Usuario Titular puede crear expedientes de solicitud.' });
      return;
    }
    const { sector, title, description, city, modality, estimatedBudget } = req.body ?? {};
    if (
      !VALID_SECTORS.has(sector) ||
      typeof title !== 'string' ||
      title.trim().length < 3 ||
      typeof description !== 'string' ||
      description.trim().length < 6
    ) {
      res.status(400).json({
        error: 'Elige un área de actividad, indica un título claro y describe tu necesidad.',
      });
      return;
    }

    const db = loadDatabase();
    const nowIso = new Date().toISOString();
    const budget = Math.max(40, Math.min(50000, Number(estimatedBudget) || 250));
    const discount = 25;
    const netAmount = Math.round(budget * (1 - discount / 100));
    const seq = db.nextExpNumber || db.requests.length + 1;
    db.nextExpNumber = seq + 1;
    const code = `EXP-2026-${String(seq).padStart(3, '0')}`;
    const reqId = `req-${crypto.randomUUID().slice(0, 8)}`;

    const newReq: StoredServiceRequest = {
      id: reqId,
      code,
      titularId: user.id,
      titularName: user.fullName,
      titularEmail: user.email,
      sector,
      title: title.trim(),
      description: description.trim(),
      city: typeof city === 'string' && city.trim() ? city.trim() : user.city,
      modality: modality === 'Online' || modality === 'Mixta' ? modality : 'Presencial',
      estimatedBudget: budget,
      appliedDiscountPercent: discount,
      status: '1. Solicitud recibida',
      escrowStatus: 'Pendiente de depósito',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const newEscrow: StoredEscrow = {
      id: `esc-${crypto.randomUUID().slice(0, 8)}`,
      requestId: reqId,
      requestCode: code,
      titularName: user.fullName,
      specialistName: 'Pendiente de asignación SCP',
      grossAmount: budget,
      discountSaved: budget - netAmount,
      netCustodyAmount: netAmount,
      status: 'Pendiente de depósito',
      referenceCode: `ESC-SCP-${Math.floor(10000 + Math.random() * 89999)}`,
      updatedAt: nowIso,
    };

    db.requests.unshift(newReq);
    db.escrowTransactions.unshift(newEscrow);
    saveDatabase(db);
    res.status(201).json({ request: newReq });
  });

  // Specialist submits proposal on unassigned or assigned request
  app.post('/api/requests/:id/propose', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role !== 'especialista') {
      res.status(403).json({ error: 'Acceso restringido a especialistas.' });
      return;
    }
    const db = loadDatabase();
    const specialist = db.specialists.find((s) => s.userId === user.id);
    if (!specialist || specialist.validationStatus !== 'Validado') {
      res.status(403).json({ error: 'Tu perfil profesional debe estar Validado por SCP para enviar propuestas.' });
      return;
    }

    const request = db.requests.find((r) => r.id === req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Expediente no encontrado.' });
      return;
    }
    if (request.assignedSpecialistId && request.assignedSpecialistId !== specialist.id) {
      res.status(403).json({ error: 'Este expediente ya está asignado a otro especialista.' });
      return;
    }

    const proposal = typeof req.body?.proposal === 'string' ? req.body.proposal.trim() : '';
    const amount = Number(req.body?.proposedFinalAmount) || Math.round(request.estimatedBudget * 0.75);
    if (proposal.length < 8) {
      res.status(400).json({ error: 'Describe la propuesta y alcance cerrado para el Titular.' });
      return;
    }

    request.assignedSpecialistId = specialist.id;
    request.assignedSpecialistName = specialist.fullName;
    request.specialistProposal = proposal;
    request.proposedFinalAmount = Math.max(20, amount);
    request.status = '2. Estudio y opciones';
    request.updatedAt = new Date().toISOString();

    const escrow = db.escrowTransactions.find((e) => e.requestId === request.id);
    if (escrow) {
      escrow.specialistName = specialist.fullName;
      escrow.netCustodyAmount = request.proposedFinalAmount;
      escrow.discountSaved = Math.max(0, escrow.grossAmount - request.proposedFinalAmount);
      escrow.updatedAt = request.updatedAt;
    }

    saveDatabase(db);
    res.json({ request });
  });

  // Titular accepts budget & deposits funds into Pago Protegido (Escrow SCP)
  app.post('/api/requests/:id/escrow-deposit', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();
    const request = db.requests.find((r) => r.id === req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Expediente no encontrado.' });
      return;
    }
    if (user.role !== 'admin' && request.titularId !== user.id) {
      res.status(403).json({ error: 'Solo el Titular del expediente puede activar el Pago Protegido.' });
      return;
    }

    request.escrowStatus = 'En custodia SCP';
    if (
      request.status === '1. Solicitud recibida' ||
      request.status === '2. Estudio y opciones' ||
      request.status === '3. Presupuesto aceptado'
    ) {
      request.status = '4. En ejecución';
    }
    request.updatedAt = new Date().toISOString();

    const escrow = db.escrowTransactions.find((e) => e.requestId === request.id);
    if (escrow) {
      escrow.status = 'En custodia SCP';
      escrow.updatedAt = request.updatedAt;
    }
    saveDatabase(db);
    res.json({ request });
  });

  // Titular or Admin releases Pago Protegido upon completion
  app.post('/api/requests/:id/escrow-release', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();
    const request = db.requests.find((r) => r.id === req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Expediente no encontrado.' });
      return;
    }
    if (user.role !== 'admin' && request.titularId !== user.id) {
      res.status(403).json({ error: 'No autorizado para liberar fondos de este expediente.' });
      return;
    }
    request.escrowStatus = 'Liberado al especialista';
    request.status = '5. Cierre y valoración';
    if (typeof req.body?.rating === 'number') {
      request.titularRating = Math.min(5, Math.max(1, Math.round(req.body.rating)));
    } else if (!request.titularRating) {
      request.titularRating = 5;
    }
    request.updatedAt = new Date().toISOString();

    const escrow = db.escrowTransactions.find((e) => e.requestId === request.id);
    if (escrow) {
      escrow.status = 'Liberado al especialista';
      escrow.updatedAt = request.updatedAt;
    }
    saveDatabase(db);
    res.json({ request });
  });

  // Book Agenda appointment
  app.post('/api/appointments', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const { specialistId, dateISO, timeSlot, modality, notes, requestId } = req.body ?? {};
    if (typeof dateISO !== 'string' || typeof timeSlot !== 'string' || !dateISO || !timeSlot) {
      res.status(400).json({ error: 'Selecciona fecha y franja horaria para la cita.' });
      return;
    }

    const db = loadDatabase();
    const spec =
      db.specialists.find((s) => s.id === specialistId && s.validationStatus === 'Validado') ||
      db.specialists.find((s) => s.validationStatus === 'Validado');
    if (!spec) {
      res.status(400).json({ error: 'No hay especialista validado disponible.' });
      return;
    }

    const linkedReq = typeof requestId === 'string' ? db.requests.find((r) => r.id === requestId) : undefined;
    const newApt: StoredAppointment = {
      id: `apt-${crypto.randomUUID().slice(0, 8)}`,
      requestId: linkedReq?.id,
      requestCode: linkedReq?.code,
      titularId: user.id,
      titularName: user.fullName,
      specialistId: spec.id,
      specialistName: spec.fullName,
      sector: spec.sector,
      dateISO,
      timeSlot,
      modality: modality === 'Videoconsulta SCP' ? 'Videoconsulta SCP' : 'Presencial',
      notes: typeof notes === 'string' ? notes.trim() : '',
      status: 'Solicitada',
    };

    db.appointments.unshift(newApt);
    saveDatabase(db);
    res.status(201).json({ appointment: newApt });
  });

  // Confirm / Update Appointment status
  app.patch('/api/appointments/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();
    const apt = db.appointments.find((a) => a.id === req.params.id);
    if (!apt) {
      res.status(404).json({ error: 'Cita no encontrada.' });
      return;
    }
    const spec = db.specialists.find((s) => s.userId === user.id);
    const isOwner = apt.titularId === user.id || (spec && apt.specialistId === spec.id);
    if (user.role !== 'admin' && !isOwner) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const status = req.body?.status;
    if (status === 'Confirmada' || status === 'Completada' || status === 'Cancelada') {
      apt.status = status;
      saveDatabase(db);
    }
    res.json({ appointment: apt });
  });

  // Admin SCP: Validate or Reject Specialist
  app.patch('/api/admin/specialists/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    if (req.authUser!.role !== 'admin') {
      res.status(403).json({ error: 'Acción reservada a Administración SCP.' });
      return;
    }
    const db = loadDatabase();
    const spec = db.specialists.find((s) => s.id === req.params.id);
    if (!spec) {
      res.status(404).json({ error: 'Especialista no encontrado.' });
      return;
    }
    const status = req.body?.validationStatus;
    if (status !== 'Validado' && status !== 'Rechazado' && status !== 'En revisión por SCP') {
      res.status(400).json({ error: 'Estado de validación no válido.' });
      return;
    }
    spec.validationStatus = status;
    if (status === 'Validado') {
      spec.verifiedAt = new Date().toISOString();
    }
    saveDatabase(db);
    res.json({ specialist: spec });
  });

  // Admin SCP: Advance Request status & assign validated specialist
  app.patch('/api/admin/requests/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    if (req.authUser!.role !== 'admin') {
      res.status(403).json({ error: 'Acción reservada a Administración SCP.' });
      return;
    }
    const db = loadDatabase();
    const request = db.requests.find((r) => r.id === req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Expediente no encontrado.' });
      return;
    }
    const { status, assignedSpecialistId, specialistProposal } = req.body ?? {};
    if (status && VALID_REQUEST_STATUSES.has(status)) {
      request.status = status;
    }
    if (typeof assignedSpecialistId === 'string' && assignedSpecialistId) {
      const spec = db.specialists.find((s) => s.id === assignedSpecialistId && s.validationStatus === 'Validado');
      if (!spec) {
        res.status(400).json({ error: 'El especialista asignado debe estar validado por SCP.' });
        return;
      }
      request.assignedSpecialistId = spec.id;
      request.assignedSpecialistName = spec.fullName;
      if (request.status === '1. Solicitud recibida') {
        request.status = '2. Estudio y opciones';
      }
      const escrow = db.escrowTransactions.find((e) => e.requestId === request.id);
      if (escrow) {
        escrow.specialistName = spec.fullName;
        escrow.updatedAt = new Date().toISOString();
      }
    }
    if (typeof specialistProposal === 'string' && specialistProposal.trim()) {
      request.specialistProposal = specialistProposal.trim();
    }
    request.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ request });
  });

  // Store public submission
  app.post('/api/store/order', (req: Request, res: Response) => {
    const { itemTitle, buyerName, buyerEmail, amount } = req.body ?? {};
    if (
      typeof itemTitle !== 'string' ||
      typeof buyerName !== 'string' ||
      buyerName.trim().length < 2 ||
      typeof buyerEmail !== 'string' ||
      !buyerEmail.includes('@')
    ) {
      res.status(400).json({ error: 'Completa tu nombre y correo electrónico para confirmar el pedido.' });
      return;
    }
    const db = loadDatabase();
    const order: StoredOrder = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      itemTitle: itemTitle.trim(),
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim().toLowerCase(),
      amount: Math.max(0, Number(amount) || 0),
      status: 'Confirmado',
      createdAt: new Date().toISOString(),
    };
    db.storeOrders.unshift(order);
    saveDatabase(db);
    res.status(201).json({ order });
  });

  // Vite middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servicios Canal Puente (SCP) server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SCP server:', err);
  process.exit(1);
});
