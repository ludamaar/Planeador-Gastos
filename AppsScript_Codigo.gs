/**
 * Puente Captura de Gastos  ->  Google Sheets  ->  Planeador de Gastos
 *
 * Pega este código en Extensiones > Apps Script de tu hoja de Google.
 * 1) Cambia TOKEN por el que quieras (el mismo que pondrás en la app).
 * 2) Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 3) Copia la URL que termina en /exec y pégala en la app (⚙).
 *
 * La hoja "Movimientos" se crea sola con los encabezados correctos.
 * Los respaldos del Planeador van a una carpeta de tu Drive, también creada sola.
 *
 * OJO: al cambiar este código hay que volver a implementar para que surta efecto
 *      (Implementar > Administrar implementaciones > lápiz > Versión: nueva).
 */

var TOKEN   = 'CAMBIA-ESTE-TOKEN';
var HOJA    = 'Movimientos';
var CARPETA = 'Planeador Respaldos';   // se crea sola en tu Drive
var MAX_BK  = 10;                      // cuántas versiones conservar

var COLS = ['ID', 'Fecha', 'Mes', 'Quincena', 'Tipo', 'Monto',
            'Categoria', 'Metodo', 'Nota', 'Quien', 'Capturado'];

var QUIEN_DEFAULT = 'LDMA';   // si un movimiento llega sin persona

/* ─────────────── hoja ─────────────── */

function _hoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  if (!sh) sh = ss.insertSheet(HOJA);

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]);
    sh.getRange(1, 1, 1, COLS.length)
      .setFontWeight('bold').setFontColor('#F5BD4F').setBackground('#3F2A14');
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('yyyy-mm-dd');
    sh.getRange('F:F').setNumberFormat('$#,##0.00');
    sh.setColumnWidth(1, 130);
    sh.setColumnWidth(7, 170);
    sh.setColumnWidth(8, 150);
    sh.setColumnWidth(9, 220);
    sh.setColumnWidth(10, 90);
    sh.setColumnWidth(11, 150);
  } else {
    // La hoja ya existía: agregar la columna "Quien" si le falta (v70)
    var ancho = sh.getLastColumn();
    var hdr = sh.getRange(1, 1, 1, Math.max(ancho, COLS.length)).getValues()[0];
    if (hdr.indexOf('Quien') < 0) {
      sh.insertColumnBefore(10);                 // queda entre Nota y Capturado
      sh.getRange(1, 10).setValue('Quien')
        .setFontWeight('bold').setFontColor('#F5BD4F').setBackground('#3F2A14');
      sh.setColumnWidth(10, 90);
      var n = sh.getLastRow();
      if (n > 1) {
        // lo que ya estaba capturado se asigna al valor por defecto
        var vals = [];
        for (var i = 0; i < n - 1; i++) vals.push([QUIEN_DEFAULT]);
        sh.getRange(2, 10, n - 1, 1).setValues(vals);
      }
    }
  }
  return sh;
}

/** Mapa id -> número de fila (1-based, incluye encabezado). */
function _indice(sh) {
  var n = sh.getLastRow();
  var idx = {};
  if (n < 2) return idx;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    var id = String(ids[i][0] || '').trim();
    if (id) idx[id] = i + 2;
  }
  return idx;
}

function _quincena(fecha) {
  var dia = parseInt(String(fecha).slice(8, 10), 10) || 1;
  return dia <= 15 ? 1 : 2;
}

function _fila(it) {
  var f = String(it.fecha || '').slice(0, 10);
  return [
    String(it.id || ''),
    f,
    f.slice(0, 7),
    _quincena(f),
    String(it.tipo || 'Egreso'),
    Number(it.monto) || 0,
    String(it.cat || ''),
    String(it.metodo || ''),
    String(it.nota || ''),
    String(it.quien || QUIEN_DEFAULT).toUpperCase(),
    Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm')
  ];
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─────────────── respaldo del Planeador en Drive ─────────────── */

function _carpeta() {
  var it = DriveApp.getFoldersByName(CARPETA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA);
}

/** Guarda el estado y poda las versiones viejas. */
function _guardarRespaldo(estado) {
  if (!estado || typeof estado !== 'string') throw new Error('estado vacío');
  JSON.parse(estado);   // si no es JSON válido, revienta aquí y no se guarda

  var carpeta = _carpeta();
  var nombre  = 'planeador_' +
    Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd_HHmm') + '.json';
  var archivo = carpeta.createFile(nombre, estado, MimeType.PLAIN_TEXT);

  // podar: deja solo los MAX_BK más recientes
  var todos = [], it = carpeta.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    todos.push({ f: f, t: f.getDateCreated().getTime() });
  }
  todos.sort(function(a, b) { return b.t - a.t; });
  var borrados = 0;
  for (var i = MAX_BK; i < todos.length; i++) { todos[i].f.setTrashed(true); borrados++; }

  return { id: archivo.getId(), nombre: nombre, bytes: estado.length,
           total: Math.min(todos.length, MAX_BK), podados: borrados };
}

function _listarRespaldos() {
  var carpeta = _carpeta();
  var out = [], it = carpeta.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    out.push({ id: f.getId(), nombre: f.getName(),
               fecha: Utilities.formatDate(f.getDateCreated(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm'),
               bytes: f.getSize(), _t: f.getDateCreated().getTime() });
  }
  out.sort(function(a, b) { return b._t - a._t; });
  out.forEach(function(o) { delete o._t; });
  return out;
}

function _leerRespaldo(id) {
  return DriveApp.getFileById(id).getBlob().getDataAsString();
}

/** Nombre de quincena a partir del índice 0-23. */
function _etiquetaQ(j) {
  var M = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return M[Math.floor(j / 2)] + ' ' + (j % 2 === 0 ? '1a' : '2a');
}

/**
 * Resumen ligero del Planeador para el celular: totales por quincena y el
 * detalle de la quincena pedida. Se calcula aquí para no mandarle al
 * teléfono los 100 KB del estado completo.
 */
function _resumenPlaneador(qPedida) {
  var lista = _listarRespaldos();
  if (!lista.length) return { hay: false };

  var s = JSON.parse(_leerRespaldo(lista[0].id));
  var filas = (s && s.filas) || [];

  var q = [];
  for (var j = 0; j < 24; j++) q.push({ i: j, etiqueta: _etiquetaQ(j), ingresos: 0, gastos: 0 });

  filas.forEach(function (f) {
    var m = f && f.montos;
    if (!m) return;
    var esIngreso = (f.tipo === 'ingreso');
    for (var j = 0; j < 24; j++) {
      var v = Number(m[j]) || 0;
      if (!v) continue;
      if (esIngreso) q[j].ingresos += v; else q[j].gastos += v;
    }
  });
  q.forEach(function (x) { x.remanente = x.ingresos - x.gastos; });

  // Detalle de la quincena pedida (o la de hoy)
  var jj = (qPedida !== '' && qPedida !== null && !isNaN(qPedida)) ? Number(qPedida) : (function () {
    var d = new Date();
    return d.getMonth() * 2 + (d.getDate() <= 15 ? 0 : 1);
  })();
  if (jj < 0 || jj > 23) jj = 0;

  var detalle = [];
  filas.forEach(function (f) {
    var v = Number(f.montos && f.montos[jj]) || 0;
    if (!v) return;
    detalle.push({ concepto: String(f.concepto || ''), metodo: String(f.metodo || ''),
                   tipo: f.tipo === 'ingreso' ? 'ingreso' : 'gasto', monto: v });
  });
  detalle.sort(function (a, b) { return b.monto - a.monto; });
  if (detalle.length > 60) detalle = detalle.slice(0, 60);

  return {
    hay: true,
    anio: s.anio,
    archivo: lista[0].nombre,
    respaldado: lista[0].fecha,
    filas: filas.length,
    quincena: jj,
    etiqueta: _etiquetaQ(jj),
    quincenas: q,
    detalle: detalle
  };
}

/* ─────────────── escritura (app móvil) ─────────────── */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);

    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
    catch (err) { return _json({ ok: false, error: 'JSON inválido' }); }

    if (String(body.token || '') !== TOKEN) {
      return _json({ ok: false, error: 'token inválido' });
    }

    // Respaldo del Planeador (no toca la hoja de movimientos)
    if (body.accion === 'backup') {
      try {
        return _json({ ok: true, respaldo: _guardarRespaldo(body.estado) });
      } catch (err) {
        return _json({ ok: false, error: 'respaldo falló: ' + err });
      }
    }

    var items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return _json({ ok: true, nuevos: 0, actualizados: 0, borrados: 0 });

    var sh = _hoja();
    var idx = _indice(sh);
    var nuevos = [], act = 0, bor = 0;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var id = String(it.id || '').trim();
      if (!id) continue;

      if (it.accion === 'delete') {
        if (idx[id]) {
          sh.deleteRow(idx[id]);
          idx = _indice(sh);   // las filas se recorren tras borrar
          bor++;
        }
        continue;
      }

      var fila = _fila(it);
      if (idx[id]) {
        sh.getRange(idx[id], 1, 1, COLS.length).setValues([fila]);
        act++;
      } else {
        nuevos.push(fila);
      }
    }

    if (nuevos.length) {
      sh.getRange(sh.getLastRow() + 1, 1, nuevos.length, COLS.length).setValues(nuevos);
    }

    // Reordena por fecha descendente para que lo más reciente quede arriba
    if (sh.getLastRow() > 2) {
      sh.getRange(2, 1, sh.getLastRow() - 1, COLS.length).sort({ column: 2, ascending: false });
    }

    return _json({ ok: true, nuevos: nuevos.length, actualizados: act, borrados: bor });

  } catch (err) {
    return _json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/* ─────────────── lectura (Planeador) ─────────────── */

/**
 * GET ?token=XXX            -> todos los movimientos
 * GET ?token=XXX&desde=2026-09-01&hasta=2026-09-30
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (String(p.token || '') !== TOKEN) {
    return _json({ ok: false, error: 'token inválido' });
  }

  // Listar respaldos disponibles
  if (p.accion === 'backups') {
    try { return _json({ ok: true, respaldos: _listarRespaldos() }); }
    catch (err) { return _json({ ok: false, error: String(err) }); }
  }

  // Resumen ligero del Planeador (para la app del celular)
  if (p.accion === 'resumen') {
    try { return _json({ ok: true, resumen: _resumenPlaneador(p.q) }); }
    catch (err) { return _json({ ok: false, error: 'no se pudo armar el resumen: ' + err }); }
  }

  // Devolver el contenido de un respaldo
  if (p.accion === 'backup') {
    try { return _json({ ok: true, estado: _leerRespaldo(String(p.id || '')) }); }
    catch (err) { return _json({ ok: false, error: 'no se pudo leer el respaldo: ' + err }); }
  }

  var sh = _hoja();
  var n = sh.getLastRow();
  if (n < 2) return _json({ ok: true, items: [], total: 0 });

  var vals = sh.getRange(2, 1, n - 1, COLS.length).getValues();
  var desde = String(p.desde || ''), hasta = String(p.hasta || '');
  var out = [];

  for (var i = 0; i < vals.length; i++) {
    var r = vals[i];
    if (!String(r[0] || '').trim()) continue;

    var f = r[1];
    f = (f instanceof Date)
      ? Utilities.formatDate(f, 'America/Mexico_City', 'yyyy-MM-dd')
      : String(f).slice(0, 10);

    if (desde && f < desde) continue;
    if (hasta && f > hasta) continue;

    out.push({
      id: String(r[0]), fecha: f, mes: String(r[2]), quincena: Number(r[3]) || _quincena(f),
      tipo: String(r[4]), monto: Number(r[5]) || 0, cat: String(r[6]),
      metodo: String(r[7]), nota: String(r[8]),
      quien: String(r[9] || QUIEN_DEFAULT).toUpperCase()
    });
  }

  return _json({ ok: true, items: out, total: out.length });
}
