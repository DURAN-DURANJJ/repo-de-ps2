/*
 * Puente mando -> teclado para Play!.js
 *
 * Play!.js solo lee el teclado y escucha los eventos en el <canvas id="outputCanvas">,
 * usando event.code. Este script lee el mando con la Gamepad API y manda esos mismos
 * eventos de teclado al canvas.
 *
 * Teclas que espera Play!.js (sacadas de su código fuente, Source/ui_js/Main.cpp):
 *   Start=Enter  Select=Backspace  Cruceta=Flechas
 *   Cuadrado=KeyA  Equis=KeyZ  Triángulo=KeyS  Círculo=KeyX
 *   L1=Key1  L2=Key2  L3=Key3  R1=Key8  R2=Key9  R3=Key0
 *   Stick izq: KeyF/KeyH (X), KeyT/KeyG (Y)   Stick der: KeyJ/KeyL (X), KeyI/KeyK (Y)
 *
 * Añade ?debug a la URL para ver en pantalla el mando detectado y los botones que pulsas.
 */
(function () {
  'use strict';

  // Índices del mapeo "standard" de la Gamepad API (PS4, y muchos PS3, lo usan)
  var BUTTONS = {
    0:  'KeyZ',       // Equis
    1:  'KeyX',       // Círculo
    2:  'KeyA',       // Cuadrado
    3:  'KeyS',       // Triángulo
    4:  'Key1',       // L1
    5:  'Key8',       // R1
    6:  'Key2',       // L2
    7:  'Key9',       // R2
    8:  'Backspace',  // Select / Share
    9:  'Enter',      // Start / Options
    10: 'Key3',       // L3
    11: 'Key0',       // R3
    12: 'ArrowUp',
    13: 'ArrowDown',
    14: 'ArrowLeft',
    15: 'ArrowRight'
  };

  // Sticks: eje -> [tecla al ir negativo, tecla al ir positivo]
  var AXES = {
    0: ['KeyF', 'KeyH'],  // stick izquierdo X
    1: ['KeyT', 'KeyG'],  // stick izquierdo Y (arriba = negativo)
    2: ['KeyJ', 'KeyL'],  // stick derecho X
    3: ['KeyI', 'KeyK']   // stick derecho Y
  };
  var DEADZONE = 0.5;

  var held = {};          // código de tecla -> { mando: true } de quién la mantiene pulsada
  var sent = {};          // código de tecla -> true si ya mandamos el keydown
  var debug = /[?&]debug\b/.test(location.search);
  var box = null;

  function canvas() { return document.getElementById('outputCanvas'); }

  function fire(type, code) {
    var c = canvas();
    if (!c) return;
    c.dispatchEvent(new KeyboardEvent(type, { code: code, key: code, bubbles: true, cancelable: true }));
  }

  function setKey(code, down, owner) {
    // 'owner' evita que dos fuentes (p. ej. dos mandos) se pisen al soltar
    held[code] = held[code] || {};
    if (down) held[code][owner] = true; else delete held[code][owner];
    var isDown = Object.keys(held[code]).length > 0;
    if (isDown && !sent[code]) { sent[code] = true; fire('keydown', code); }
    if (!isDown && sent[code]) { sent[code] = false; fire('keyup', code); }
  }

  function note(text) {
    if (!debug) return;
    if (!box) {
      box = document.createElement('pre');
      box.style.cssText = 'position:fixed;right:8px;bottom:8px;margin:0;padding:8px 10px;background:#000c;color:#9f9;' +
                          'font:12px/1.4 monospace;border-radius:6px;z-index:99999;max-width:60vw;white-space:pre-wrap';
      document.body.appendChild(box);
    }
    box.textContent = text;
  }

  function poll() {
    var pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    var info = [];
    checkHomeButton(pads);
    for (var p = 0; p < pads.length; p++) {
      var pad = pads[p];
      if (!pad) continue;
      var owner = 'pad' + pad.index;
      var pressed = [];

      for (var i = 0; i < pad.buttons.length; i++) {
        var down = !!(pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.5));
        if (down) pressed.push('b' + i);
        if (BUTTONS[i]) setKey(BUTTONS[i], down, owner);
      }
      for (var a in AXES) {
        var v = pad.axes[a] || 0;
        if (Math.abs(v) > 0.2) pressed.push('a' + a + '=' + v.toFixed(2));
        setKey(AXES[a][0], v < -DEADZONE, owner);
        setKey(AXES[a][1], v >  DEADZONE, owner);
      }
      info.push(pad.id + '\nmapping: ' + (pad.mapping || '(ninguno)') + '\npulsado: ' + (pressed.join(' ') || '-'));
    }
    note(info.length ? info.join('\n\n') : 'Ningún mando detectado.\nPulsa un botón del mando con la página enfocada.');
    requestAnimationFrame(poll);
  }

  // ---- Pantalla completa ----
  // Botón en pantalla, doble clic en el juego, y (si el navegador lo permite) botón PS/Home del mando.
  function toggleFullscreen() {
    var c = canvas();
    if (!c) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (c.requestFullscreen) {
      var p = c.requestFullscreen();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function setupFullscreen() {
    var style = document.createElement('style');
    style.textContent =
      '#outputCanvas:fullscreen{width:100vw!important;height:100vh!important;object-fit:contain;background:#000}' +
      '#fsBtn{position:fixed;top:8px;right:8px;z-index:99999;padding:8px 12px;border:0;border-radius:8px;' +
      'background:#3b82f6;color:#fff;font:14px system-ui,sans-serif;cursor:pointer;opacity:.85}';
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.id = 'fsBtn';
    btn.textContent = '⛶ Pantalla completa';
    btn.addEventListener('click', toggleFullscreen);
    document.body.appendChild(btn);

    var c = canvas();
    if (c) c.addEventListener('dblclick', toggleFullscreen);
  }

  var psHeld = false;
  function checkHomeButton(pads) {
    var down = false;
    for (var p = 0; p < pads.length; p++) {
      if (pads[p] && pads[p].buttons[16] && pads[p].buttons[16].pressed) down = true;
    }
    if (down && !psHeld) toggleFullscreen();
    psHeld = down;
  }

  window.addEventListener('gamepadconnected', function (e) {
    console.log('[gamepad-bridge] mando conectado:', e.gamepad.id, 'mapping:', e.gamepad.mapping);
  });
  window.addEventListener('gamepaddisconnected', function (e) {
    // Soltar todo lo que ese mando tuviera pulsado
    for (var code in held) setKey(code, false, 'pad' + e.gamepad.index);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFullscreen);
  } else {
    setupFullscreen();
  }

  requestAnimationFrame(poll);
})();
