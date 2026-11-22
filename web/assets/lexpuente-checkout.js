(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const itemId = params.get('servicio');
  let item;
  let busy = false;

  const status = message => { $('status').textContent = message; };

  function complete(order) {
    const capture = order?.purchase_units?.flatMap(unit => unit.payments?.captures || [])
      .find(value => value.status === 'COMPLETED');
    if (order?.status !== 'COMPLETED' || !capture || capture.amount?.currency_code !== 'EUR' || capture.amount?.value !== String(item.amount)) {
      status('PayPal no ha confirmado la demostración. No se ha registrado ningún pago.');
      return;
    }

    $('paypal-buttons').hidden = true;
    $('accept').disabled = true;
    $('receipt').hidden = false;
    const receipt = item.name + ' · ' + Number(capture.amount.value).toFixed(2) + ' €\nReferencia Sandbox: ' + capture.id;
    $('receipt-text').textContent = receipt;
    $('followup').href = 'https://wa.me/34673735059?text=' + encodeURIComponent('Hola, he completado una demostración de pago Sandbox en SCP.\n' + receipt);
    status('Demostración Sandbox confirmada. No se ha cobrado dinero real.');
  }

  try {
    const response = await fetch('/api/paypal/config', { cache: 'no-store' });
    if (!response.ok) throw Error('No se ha podido cargar la demo de PayPal Sandbox.');
    const config = await response.json();
    item = config.items?.[itemId];
    if (!item) {
      $('name').textContent = 'Selecciona un servicio';
      status('Vuelve a los servicios y elige qué quieres pagar.');
      $('accept').disabled = true;
      return;
    }

    if (config.environment !== 'sandbox' || config.clientId !== 'sb') {
      throw Error('La plataforma no está en modo de demostración Sandbox.');
    }
    if ($('back-services')) {
      $('back-services').href = '/areas/' + (item.area || (/^(salud-|clinic-)/.test(itemId) ? 'sanidad' : 'tramites')) + '.html';
    }

    $('name').textContent = item.name;
    $('scope').textContent = item.scope;
    $('price').textContent = Number(item.amount).toFixed(2) + ' €';
    status('Modo Sandbox: el pago es solo una demostración y no se cobrará dinero real.');

    $('accept').onchange = () => {
      $('paypal-buttons').hidden = !$('accept').checked;
      if ($('accept').checked) status('Selecciona PayPal o tarjeta para abrir la pasarela de prueba.');
    };

    if (params.get('paypal_cancel') === '1') {
      status('Has vuelto de PayPal Sandbox sin completar la demostración. No se ha cobrado dinero.');
    }

    const sdk = document.createElement('script');
    sdk.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=EUR&intent=capture&components=buttons';
    sdk.onerror = () => status('No se pudo cargar PayPal Sandbox. Comprueba la conexión o vuelve a intentarlo más tarde.');
    sdk.onload = () => {
      try {
        if (!window.paypal?.Buttons) throw Error('PayPal no está disponible en esta página.');
        window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
          onClick: (_data, actions) => $('accept').checked ? actions.resolve() : actions.reject(),
          createOrder: (_data, actions) => {
            if (!$('accept').checked) throw Error('Marca la casilla para continuar.');
            status('Abriendo el entorno de pruebas de PayPal…');
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [{
                custom_id: itemId,
                description: item.name,
                amount: { currency_code: 'EUR', value: Number(item.amount).toFixed(2) }
              }],
              application_context: {
                brand_name: 'Servicios Canal Puente SCP',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW'
              }
            });
          },
          onApprove: async (_data, actions) => {
            if (busy) return;
            busy = true;
            status('Confirmando la demostración en PayPal Sandbox…');
            try {
              complete(await actions.order.capture());
            } catch {
              status('PayPal no ha confirmado la demostración. No se ha registrado ningún pago.');
            } finally {
              busy = false;
            }
          },
          onCancel: () => status('Has cerrado PayPal Sandbox. No se ha cobrado dinero.'),
          onError: () => status('No se ha podido abrir la pasarela de pruebas de PayPal. No se ha cobrado dinero.')
        }).render('#paypal-buttons').catch(() => {
          status('No se pudieron mostrar los botones de PayPal Sandbox. No se ha cobrado dinero.');
        });
      } catch {
        status('No se pudieron mostrar los botones de PayPal Sandbox. No se ha cobrado dinero.');
      }
    };
    document.head.append(sdk);
  } catch (error) {
    status(error.message || 'No se ha podido cargar el pago de demostración.');
    $('accept').disabled = true;
  }
})();
