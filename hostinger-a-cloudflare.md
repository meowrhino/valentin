# Guía: pasar dominio de Hostinger a Cloudflare + Email Routing

Esta guía cubre dos cosas distintas:
- **Parte A:** transferir el *registro* del dominio de Hostinger a Cloudflare (cambias de registrador, no solo de DNS).
- **Parte B:** configurar Email Routing para recibir `loquesea@tudominio.com` en tu Gmail.

Si solo quieres usar Cloudflare como DNS sin transferir el registro, salta al **Anexo 1** al final.

---

## Antes de empezar — requisitos

1. El dominio debe tener **más de 60 días** desde su registro o última transferencia. Si lo compraste hace menos, tendrás que esperar (lo impone la ICANN, no Hostinger).
2. El TLD tiene que estar **soportado por Cloudflare Registrar**. Soportados: `.com`, `.net`, `.org`, `.io`, `.dev`, `.app`, `.xyz`, y muchos más. **NO soportados** (a día de hoy): `.es`, `.cat`, `.eu`, entre otros. Si tu dominio es uno de estos, no puedes transferir el registro — usa el Anexo 1.
3. Necesitas acceso al email del contacto WHOIS (te van a mandar verificaciones ahí).
4. Ten a mano la contraseña de Hostinger y de Cloudflare (o crea cuenta nueva en Cloudflare si no la tienes).

---

## PARTE A — Transferir el dominio de Hostinger a Cloudflare

### Paso 1 — Crear cuenta en Cloudflare (si no tienes)

1. Ve a https://dash.cloudflare.com/sign-up
2. Email + contraseña.
3. Verifica el email que te mandan.
4. Ya estás dentro del dashboard.

### Paso 2 — Añadir el sitio a Cloudflare PRIMERO (antes de transferir)

Esto es importante: Cloudflare exige que el dominio ya esté usando sus nameservers antes de aceptar la transferencia del registro. O sea, primero mueves el DNS, y luego mueves el registrador.

1. En el dashboard de Cloudflare, click en **"Add a site"** (o "+ Add" arriba).
2. Escribe tu dominio sin `www` ni `https://`. Ejemplo: `midominio.com`.
3. Click **Continue**.
4. Elige el plan **Free** (abajo del todo). Click **Continue**.
5. Cloudflare escanea automáticamente los registros DNS actuales que tienes en Hostinger (registros A, MX, TXT, CNAME...). Esto tarda 30s-1min.
6. **Revisa con cuidado la lista** que te muestra:
   - Que estén los registros de tu web (A o CNAME).
   - Que estén los **MX** (correo entrante) si tienes mail en Hostinger.
   - Que estén los **TXT** de SPF, DKIM, DMARC si los tienes.
   - Si falta alguno, lo añades a mano con "Add record" — copia exactamente lo que veas en el panel DNS de Hostinger.
7. Cuando esté todo, click **Continue**.

### Paso 3 — Cambiar los nameservers en Hostinger

Cloudflare te mostrará 2 nameservers tipo:
```
xxx.ns.cloudflare.com
yyy.ns.cloudflare.com
```
(los nombres exactos cambian según la cuenta — copia los tuyos, no estos).

Ahora vas a Hostinger:

1. Entra en https://hpanel.hostinger.com
2. Menú **Dominios** → click en tu dominio.
3. Busca la sección **Nameservers** o **DNS / Nameservers**.
4. Verás que están puestos los de Hostinger (`ns1.dns-parking.com` o similar).
5. Click en **Cambiar** / **Change nameservers**.
6. Selecciona la opción **"Use custom nameservers"** (o "Usar nameservers personalizados").
7. Borra los que haya y pega los 2 de Cloudflare.
8. **Guardar**.

⚠️ Hostinger te puede pedir confirmación por email. Acéptala.

### Paso 4 — Esperar la propagación

- Tarda entre **15 minutos y 24 horas**, normalmente menos de 1h.
- Cloudflare te mandará un email cuando detecte que ya está activo.
- Mientras tanto, en el dashboard de Cloudflare verás el dominio como "Pending nameserver update".
- Puedes comprobar manualmente en https://www.whatsmydns.net escribiendo tu dominio y eligiendo "NS" — cuando veas los de Cloudflare en todas las regiones, está propagado.

✅ Cuando Cloudflare diga **"Active"**, el DNS ya está bajo su control. La web sigue funcionando igual porque copiaste los registros en el Paso 2.

### Paso 5 — Desbloquear el dominio en Hostinger

Ahora sí, vas a transferir el registro.

1. Vuelve a Hostinger → tu dominio.
2. Busca **"Transfer lock"** / **"Bloqueo de transferencia"** / **"Domain lock"**.
3. **Desactívalo** (poner en OFF / unlocked).
4. Algunos TLDs tardan unos minutos en reflejar el cambio.

### Paso 6 — Pedir el código EPP (Auth Code)

1. En la misma pantalla del dominio en Hostinger, busca **"Get EPP code"** o **"Authorization code"** o **"Código de transferencia"**.
2. Click. Hostinger te lo mostrará en pantalla o te lo enviará por email.
3. Cópialo entero — es una cadena tipo `aB3$xK9!mP2@`.

### Paso 7 — Iniciar la transferencia en Cloudflare

1. En Cloudflare dashboard → arriba a la izquierda, click en tu cuenta → **Domain Registration** → **Transfer Domains**.
2. Cloudflare lista los dominios elegibles de tu cuenta (debe aparecer el tuyo, ya que está "Active" desde el Paso 4).
3. Marca el checkbox de tu dominio → **Confirm Domains**.
4. Te pedirá:
   - **EPP code:** pega el que copiaste en el Paso 6.
   - **Datos del contacto** (registrant): nombre, dirección, email, teléfono. Rellénalo bien — esto será el WHOIS.
5. **Pago:** Cloudflare te cobra **1 año de renovación** del dominio a precio mayorista (~10€ para `.com`). Mete tarjeta.
6. Confirma.

### Paso 8 — Verificar el email y esperar

1. Cloudflare manda un email al contacto WHOIS con un link de confirmación. **Click obligatorio**, si no, la transferencia no avanza.
2. Hostinger también puede mandarte un email preguntando si autorizas la salida — acéptalo para acelerar (si no, se aprueba automático en 5 días por inacción).
3. La transferencia tarda **5-7 días** normalmente. Puede ser menos si ambos lados confirman rápido.
4. Mientras tanto el dominio sigue funcionando con normalidad. No hay downtime.

### Paso 9 — Confirmar transferencia completada

- Recibirás email de Cloudflare: "Your domain transfer is complete".
- En **Domain Registration** verás el dominio listado bajo tu cuenta.
- A partir de ahora renuevas, gestionas contactos y todo desde Cloudflare.
- Hostinger ya no tiene control sobre el dominio. Puedes cancelar el servicio si solo lo tenías por eso.

---

## PARTE B — Configurar Email Routing (recibir mail en Gmail)

Esto te permite tener `hola@midominio.com`, `info@midominio.com`, lo que sea, y que todo llegue a tu Gmail personal. **Gratis, ilimitado.**

### Paso 1 — Activar Email Routing

1. En Cloudflare, entra en tu dominio (click sobre él en la lista).
2. Menú lateral izquierdo → **Email** → **Email Routing**.
3. Click **"Get started"** o **"Enable Email Routing"**.

### Paso 2 — Cloudflare añade los registros DNS automáticamente

Cloudflare necesita 3 registros MX y 1 TXT (SPF) para recibir correo. Te los muestra y te pide permiso para añadirlos.

⚠️ **MUY IMPORTANTE:** si ya tenías mail en Hostinger configurado (registros MX viejos), Cloudflare te avisará de que los va a **sustituir**. Esto significa que **el correo de Hostinger dejará de funcionar**. Si tenías mensajes ahí, descárgalos antes (IMAP en Thunderbird/Apple Mail) o no podrás recuperarlos después.

1. Click **"Add records and enable"**.
2. Cloudflare añade:
   - 3 registros MX (`route1`, `route2`, `route3.mx.cloudflare.net`)
   - 1 TXT con SPF (`v=spf1 include:_spf.mx.cloudflare.net ~all`)

### Paso 3 — Crear direcciones de reenvío

1. En la misma pantalla, sección **Routes** → **Custom addresses**.
2. Click **"Create address"**.
3. Rellena:
   - **Custom address:** la parte antes de la `@`. Ejemplo: `hola` → será `hola@midominio.com`.
   - **Action:** "Send to an email".
   - **Destination:** tu Gmail personal, ej. `tunombre@gmail.com`.
4. **Save**.
5. Repite para cada dirección que quieras (`info@`, `contacto@`, `manu@`...).

### Paso 4 — Verificar tu Gmail como destino

1. Cloudflare manda un email a tu Gmail personal con un link de verificación.
2. Abres Gmail → buscas el mail de Cloudflare → click en el link.
3. Vuelves a Cloudflare y verás el destino marcado como ✅ verified.
4. Hasta que no lo verifiques, el reenvío no funciona.

### Paso 5 — (Opcional) Catch-all

Si quieres que **cualquier** dirección `@midominio.com` (incluso las que no has creado) llegue a tu Gmail:

1. En **Email Routing** → **Routes** → sección **Catch-all address**.
2. Activa el toggle.
3. Action: "Send to an email" → tu Gmail.
4. Save.

Útil para no perder mails si alguien escribe a una dirección que no existe, o para crear direcciones "desechables" sobre la marcha.

### Paso 6 — Probar

1. Desde otra cuenta (puede ser otro Gmail), manda un email a `hola@midominio.com`.
2. En segundos debe llegar a tu Gmail personal.
3. En Cloudflare, en la sección **Overview** de Email Routing, verás contadores de mensajes recibidos/reenviados.

---

## PARTE C — (Opcional) Enviar como `hola@midominio.com` desde Gmail

Email Routing **solo recibe**. Para enviar desde la dirección del dominio, configura "Send mail as" en Gmail usando el SMTP de Gmail:

1. En Gmail → ⚙️ **Settings** → **Accounts and Import** → **Send mail as** → **Add another email address**.
2. Name: tu nombre. Email: `hola@midominio.com`. Desmarca "Treat as alias" si quieres.
3. Next → SMTP server: `smtp.gmail.com`, puerto `587`, usuario tu Gmail completo, contraseña una **App Password** de Google (créala en https://myaccount.google.com/apppasswords — necesitas 2FA activado).
4. Gmail te manda un código de verificación a `hola@midominio.com` — como tienes Email Routing, te llega a tu propio Gmail. Copia el código y pégalo.
5. Listo. Al redactar un email, podrás elegir desde qué dirección lo envías.

⚠️ Esto envía técnicamente desde los servidores de Gmail "en nombre de" tu dominio. Para que no caiga en spam, conviene añadir un registro **DMARC** básico en Cloudflare DNS:

- Tipo: `TXT`
- Nombre: `_dmarc`
- Contenido: `v=DMARC1; p=none; rua=mailto:tunombre@gmail.com`

---

## Resumen del estado final

- **Registrador:** Cloudflare (renovaciones a precio coste, ~10€/año `.com`).
- **DNS:** Cloudflare (rápido, gratis, panel completo).
- **Web:** sigue donde estuviera (GitHub Pages, Cloudflare Pages, Hostinger hosting, lo que sea — solo cambian los registros A/CNAME).
- **Email entrante:** Email Routing → tu Gmail personal. Gratis, ilimitado.
- **Email saliente:** Gmail con "Send mail as", usa SMTP de Gmail. Gratis.
- **Coste mensual:** 0€. Coste anual: solo la renovación del dominio.

---

## Anexo 1 — Si NO puedes/quieres transferir el registro

Si tu TLD no está soportado (ej. `.es`) o prefieres dejar el registro en Hostinger:

1. Haz solo los **Pasos 1-4 de la Parte A** (añadir sitio en Cloudflare + cambiar nameservers en Hostinger).
2. Salta toda la parte de EPP / transferencia.
3. Haz la **Parte B** normal (Email Routing funciona igual, solo necesita que el DNS esté en Cloudflare, no requiere que el registro lo esté).

Resultado: dominio sigue registrado en Hostinger (pagas renovaciones ahí), pero el DNS y el email los gestionas en Cloudflare. Funciona perfectamente.

---

## Anexo 2 — Checklist rápido

- [ ] Dominio tiene más de 60 días
- [ ] TLD soportado por Cloudflare Registrar
- [ ] Cuenta Cloudflare creada
- [ ] Sitio añadido en Cloudflare, registros DNS revisados
- [ ] Nameservers cambiados en Hostinger
- [ ] Esperado a "Active" en Cloudflare
- [ ] Domain lock desactivado en Hostinger
- [ ] EPP code copiado
- [ ] Transferencia iniciada en Cloudflare + pago hecho
- [ ] Email de confirmación clickado
- [ ] Esperar 5-7 días
- [ ] Email Routing activado
- [ ] Direcciones creadas y Gmail verificado
- [ ] (Opcional) Send mail as configurado en Gmail
- [ ] (Opcional) DMARC añadido
