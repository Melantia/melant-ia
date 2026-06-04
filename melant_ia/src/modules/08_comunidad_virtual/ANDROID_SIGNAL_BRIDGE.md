# MelantiaSignalBridge - Integracion minima Android

Este documento define una implementacion minima para exponer el bridge nativo a JavaScript con el contrato esperado por el modulo walkie.

## Contrato JS esperado

En runtime debe existir:

```js
window.MelantiaSignalBridge = {
  getCurrentRSSI: () => number,
  startSignalMonitor: async () => {},
  stopSignalMonitor: async () => {},
  onSignalChanged: (cb) => {},
};
```

Solo `getCurrentRSSI()` es obligatorio.

## Implementacion Kotlin (WebView + JavascriptInterface)

```kotlin
import android.webkit.JavascriptInterface
import android.webkit.WebView
import java.util.concurrent.CopyOnWriteArrayList

class MelantiaSignalBridge(
    private val webView: WebView
) {
    @Volatile
    private var currentRssi: Int = -100

    private val listeners = CopyOnWriteArrayList<String>()

    @JavascriptInterface
    fun getCurrentRSSI(): Int {
        return currentRssi
    }

    @JavascriptInterface
    fun startSignalMonitor() {
        // TODO: iniciar lectura real de RSSI (BLE, Bridgefy SDK, etc.)
        // Ejemplo de valor simulado inicial:
        updateRssi(-72)
    }

    @JavascriptInterface
    fun stopSignalMonitor() {
        // TODO: detener lectura real de RSSI
    }

    @JavascriptInterface
    fun registerSignalCallback(callbackName: String) {
        if (callbackName.isNotBlank()) {
            listeners.add(callbackName)
        }
    }

    fun updateRssi(newRssi: Int) {
        currentRssi = newRssi
        notifyJs(newRssi)
    }

    private fun notifyJs(rssi: Int) {
        if (listeners.isEmpty()) return
        val js = listeners.joinToString(separator = ";") { cb ->
            "if (window['$cb']) window['$cb']($rssi)"
        }
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
```

## Registro del bridge en Activity/Fragment

```kotlin
// Importante: habilitar JavaScript en el WebView
webView.settings.javaScriptEnabled = true

val nativeBridge = MelantiaSignalBridge(webView)
webView.addJavascriptInterface(nativeBridge, "MelantiaSignalBridgeNative")
```

## Bootstrap JS en la web app

Este bloque adapta `MelantiaSignalBridgeNative` al contrato que usa `walkie.js`.

```js
(function bootstrapMelantiaSignalBridge() {
  if (typeof window === 'undefined') return;
  const nativeBridge = window.MelantiaSignalBridgeNative;
  if (!nativeBridge || typeof nativeBridge.getCurrentRSSI !== 'function')
    return;

  const callbacks = [];
  const callbackName = '__melantiaOnSignalChanged';

  window[callbackName] = function onSignalChangedFromNative(rssi) {
    callbacks.forEach((cb) => {
      try {
        cb(Number(rssi));
      } catch (_) {}
    });
  };

  if (typeof nativeBridge.registerSignalCallback === 'function') {
    nativeBridge.registerSignalCallback(callbackName);
  }

  window.MelantiaSignalBridge = {
    getCurrentRSSI() {
      return Number(nativeBridge.getCurrentRSSI());
    },
    async startSignalMonitor() {
      if (typeof nativeBridge.startSignalMonitor === 'function') {
        nativeBridge.startSignalMonitor();
      }
    },
    async stopSignalMonitor() {
      if (typeof nativeBridge.stopSignalMonitor === 'function') {
        nativeBridge.stopSignalMonitor();
      }
    },
    onSignalChanged(cb) {
      if (typeof cb === 'function') callbacks.push(cb);
    },
  };
})();
```

## Prueba rapida en consola del navegador

```js
window.MelantiaSignalBridge && window.MelantiaSignalBridge.getCurrentRSSI();
```

Debe retornar un numero RSSI (por ejemplo, `-72`).

## Activacion recomendada en walkie

Mantener inicialmente:

- `rssiRealHabilitado: false` en desarrollo web normal.
- Activar a `true` solo en build Android con bridge operativo.

Esto evita errores en navegadores sin entorno nativo.
