// Policy specification only. No live OPP payment or release is enabled.
const oppServiceRules=Object.freeze({curetaje:{label:'Curetajes',waitHours:48,event:'serviceCompletedAt',text:'48 horas desde la realización del curetaje'},extraccion:{label:'Extracciones',waitHours:168,event:'serviceCompletedAt',text:'7 días desde la realización de la extracción'},implante:{label:'Implantes',waitHours:168,event:'crownCompletedAt',text:'Finalización del tratamiento con corona colocada + 7 días'}});
const oppPolicy = Object.freeze({provider:'opp',serviceRules:oppServiceRules,enabled:false,status:'pending_provider_approval',retainedPercent:100,maxHoldingDays:365,releaseMode:'final_confirmation',partialRelease:false,automaticRelease:false,requirements:['treatment_completed','clinical_review_verified','patient_confirmed','no_open_incident'],expiryAction:'manual_resolution_before_deadline',platformFeeRelease:'with_final_payment'});
function oppReleaseEligible(record,now=Date.now()) {
 if (!record || record.provider!=='opp' || record.providerPaymentVerified!==true || !Number.isSafeInteger(record.amountCents) || record.amountCents<=0 || record.heldAmountCents!==record.amountCents || record.state!=='held') return false;
 const start=Date.parse(record.paidAt),deadline=Date.parse(record.holdDeadline);
 if (!Number.isFinite(start)||!Number.isFinite(deadline)||start>now||deadline<=now||deadline>start+365*86400000) return false;
 const rule=Object.hasOwn(oppServiceRules,record.serviceKey)?oppServiceRules[record.serviceKey]:null;
 if (!rule) return false;
 const event=Date.parse(record[rule.event]),confirmed=Date.parse(record.patientConfirmedAt),reviewed=Date.parse(record.clinicalReviewedAt);
 if(!Number.isFinite(event)||event<start||event>now||now<event+rule.waitHours*3600000||!Number.isFinite(confirmed)||confirmed<event+rule.waitHours*3600000||confirmed>now||!Number.isFinite(reviewed)||reviewed<event||reviewed>now) return false;
 return record.treatmentCompleted===true && record.clinicalReviewVerified===true && record.patientConfirmed===true && record.openIncident===false;
}
async function oppApi(request) {
 const path=new URL(request.url).pathname;
 const data=path==='/api/opp/config'&&request.method==='GET'?oppPolicy:{error:'El pago protegido OPP no está activo.',message:'El pago protegido OPP está pendiente de aprobación y conexión. No se ha cobrado ni liberado dinero.',enabled:false};
 return new Response(JSON.stringify(data),{status:path==='/api/opp/config'&&request.method==='GET'?200:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
export {oppApi,oppPolicy,oppReleaseEligible,oppServiceRules};
