(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const itemId = params.get('servicio');
  let orderId = '';
  let busy = false;
  let sdkFailed = false;

  const status = message => { $('status').textContent = message; };

  async function post(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      const error = Error(data.error || 'No se pudo confirmar el pago.');
      error.code = data.code;
      throw error;
    }
    return data;
  }

  function remember(id) {
    orderId = id;
    try { sessionStorage.setItem('lp-pending-order', id); } catch {}
  }

  function showRedirectFallback() {
    $('paypal-redirect').hidden = !(sdkFailed && $('accept').checked);
  }

  function done(data) {
    if (data.status !== 'COMPLETED') {
      status('El pago todavía no está confirmado. Comprueba su estado antes de repetirlo.');
      $('retry').hidden = false;
      return;
    }
    try { sessionStorage.removeItem('lp-pending-order'); } catch {}
    $('paypal-buttons').hidden = true;
    $('paypal-redirect').hidden = true;
    $('accept').disabled = true;
    $('retry').hidden = true;
    $('receipt').hidden = false;
    const receipt = data.item + ' · ' + Number(data.amount).toFixed(2) + ' €\nReferencia PayPal: ' + data.id;
    $('receipt-text').textContent = receipt;
    $('followup').href = 'https://wa.me/34673735059?text=' + encodeURIComponent('Hola, he pagado en SCP.\n' + receipt + '\nQuisiera coordinar el servicio.');
    status('PayPal ha confirmado el pago.');
  }

  $('retry').onclick = async () => {
    if (busy || !orderId) return;
    busy = true;
    try {
      const data = await post('/api/paypal/status', { orderId });
      done(data.status === 'APPROVED' ? await post('/api/paypal/capture', { orderId }) : data);
    } catch (error) {
      status(error.message);
    } finally {
      busy = false;
    }
  };

  $('paypal-redirect').onclick = async () => {
    if (busy || !$('accept').checked) return;
    busy = true;
    $('paypal-redirect').disabled = true;
    status('Preparando el pago seguro de PayPal…');
    try {
      const data = await post('/api/paypal/orders', { itemId });
      if (!data.approvalUrl) throw Error('PayPal no ha devuelto el enlace seguro de pago.');
      remember(data.id);
      location.assign(data.approvalUrl);
    } catch (error) {
      status(error.message);
      $('paypal-redirect').disabled = false;
      busy = false;
    }
  };

  $('retry').hidden = true;
  $('paypal-redirect').hidden = true;

  try {
    const response = await fetch('/api/paypal/config', { cache: 'no-store' });
    const config = await response.json();
    const item = config.items?.[itemId];
    if (!item) {
      $('name').textContent = 'Selecciona un servicio';
      status('Vuelve a los servicios y elige qué quieres pagar.');
      $('accept').disabled = true;
      return;
    }

    if ($('back-services')) {
      $('back-services').href = '/areas/' + (item.area || (/^(salud-|clinic-)/.test(itemId) ? 'sanidad' : 'tramites')) + '.html';
    }
    $('name').textContent = item.name;
    $('scope').textContent = item.scope;
    $('price').textContent = Number(item.amount).toFixed(2) + ' €';
    if (!config.enabled) throw Error('Pago no disponible en este momento. Contacta con SCP.');

    try {
      const pending = sessionStorage.getItem('lp-pending-order');
      if (pending) {
        orderId = pending;
        $('retry').hidden = false;
        status('Comprueba el estado de tu pago anterior antes de iniciar otro.');
      }
    } catch {}

    $('accept').onchange = () => {
      $('paypal-buttons').hidden = !$('accept').checked;
      showRedirectFallback();
    };

    const returnedOrderId = params.get('token');
    if (returnedOrderId) {
      remember(returnedOrderId);
      busy = true;
      $('accept').disabled = true;
      status('PayPal ha devuelto el pedido. Confirmando el pago…');
      try {
        done(await post('/api/paypal/capture', { orderId: returnedOrderId }));
      } catch (error) {
        status(error.message || 'No se pudo confirmar el pago. Comprueba su estado antes de repetirlo.');
        $('retry').hidden = false;
      } finally {
        busy = false;
      }
      return;
    }

    if (params.get('paypal_cancel') === '1') {
      status('Has vuelto de PayPal sin terminar el pago. No se confirma ningún cobro.');
      if (orderId) $('retry').hidden = false;
    }

    const sdk = document.createElement('script');
    sdk.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(config.clientId) + '&currency=EUR&intent=capture&components=buttons';
    sdk.onerror = () => {
      sdkFailed = true;
      showRedirectFallback();
      status('No se pudo cargar el botón integrado de PayPal. Marca la casilla de confirmación y aparecerá un botón para continuar en PayPal.');
    };
    sdk.onload = () => {
      try {
        if (!window.paypal?.Buttons) throw Error('PayPal no está disponible en esta página.');
        window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
          onClick: (_data, actions) => $('accept').checked ? actions.resolve() : actions.reject(),
          createOrder: async () => {
            status('Preparando pedido…');
            try {
              const data = await post('/api/paypal/orders', { itemId });
              remember(data.id);
              status('Confirma el pago en PayPal.');
              return data.id;
            } catch (error) {
              status(error.message);
              throw error;
            }
          },
          onApprove: async (data, actions) => {
            if (busy) return;
            busy = true;
            remember(data.orderID);
            try {
              done(await post('/api/paypal/capture', { orderId: data.orderID }));
            } catch (error) {
              if (error.code === 'INSTRUMENT_DECLINED') {
                busy = false;
                return actions.restart();
              }
              status(error.message);
              $('retry').hidden = false;
            } finally {
              busy = false;
            }
          },
          onCancel: () => {
            status('Pago cerrado sin confirmación. Si ya lo autorizaste, comprueba su estado antes de repetirlo.');
            if (orderId) $('retry').hidden = false;
          },
          onError: () => {
            sdkFailed = true;
            showRedirectFallback();
            status('No se ha podido completar el botón de PayPal. Marca la casilla y usa el botón para continuar en PayPal.');
            if (orderId) $('retry').hidden = false;
          }
        }).render('#paypal-buttons').catch(() => {
          sdkFailed = true;
          showRedirectFallback();
          status('No se pudo mostrar el botón integrado. Marca la casilla de confirmación y aparecerá un botón para continuar en PayPal.');
        });
      } catch {
        sdkFailed = true;
        showRedirectFallback();
        status('No se pudo mostrar el botón integrado. Marca la casilla de confirmación y aparecerá un botón para continuar en PayPal.');
      }
    };
    document.head.append(sdk);
  } catch (error) {
    status(error.message || 'No se ha podido cargar el pago.');
    $('accept').disabled = true;
  }
})();
