
var count = 0;
var gnStartTime = 0;
var positionEvt = 0;
var gbMove = false;
var gbStillTouching = false;
var seg = 0, segtranscurridos = 0;
var posicionTarea = 0;
var contenedorActual = "";
var clickTimer = null;

var funciones = {
    color_tareas: [],
    lista_items: [],
    items_seleccionados: [],
    tareas: [],
    tarea_seleccionada: {
        id: 0,
        descripcion: ""
    },
    cantidadTareasSinc: 0,
    equipo_seleccionado: "",
    lista_tareas: [],
    lista_apunte: [],
    nodriza: "",
    evt_sincronizacion: null,

    definirAmbiente: function () {

        if (LBR.esAmbientePiloto) {
            // IP Server Piloto
            services.host = "http://190.212.139.237:90"
            $('#encabezado h1').addClass("piloto");

        }
        else {
            // IP Server Producción
            services.host = "http://190.212.139.236:90"
            $('#encabezado h1').removeClass("piloto");

        }

    },

    descargarApuntesxEstado: function (fecha_inicio,fecha_fin) {

        // Pone Bloqueo
        document.getElementById("block-screen").className = "";
        document.getElementById("contenedor-general").className = "blur-fondo";
        document.getElementById("contenedor-barra-progreso").className = "";
        document.getElementById("titulo-barra-progreso").innerText = "Actualizando Apuntes...";
        $("#progreso").css("background-color", "#94c948");

        // Consume servicio...
        var ListaApuntes = [];
        var dispositivo = device.uuid;
        var usuario = LBR.user.nombre;
        var password = encodeURIComponent(LBR.user.clave);
        var ParametrosxServicio = "&user=" + usuario + "&password=" + password + "&dispositivo=" + dispositivo + "&FechaInicio=" + fecha_inicio + "&FechaFin=" + fecha_fin;

        var ApuntesEstado =
         $.ajax({
             type: 'GET',
             timeout: TIMEOUT_CONSULTAS,
             url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?cmp=1&op=ObtenerApuntesEstados',
             data: ParametrosxServicio,
             dataType: 'json'
         });
        console.log(services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?cmp=1&op=ObtenerApuntesEstados' + ParametrosxServicio);
        ApuntesEstado.done(function (ListaApuntes) {

            // Si el servicio manda un error, lo mostramos
            if ($.isArray(ListaApuntes) == false) {
                // Quita Bloqueo
                document.getElementById("contenedor-general").className = "contenedor-listado-ot";
                document.getElementById("block-screen").className = 'hide';
                document.getElementById("contenedor-barra-progreso").className = "hide";
                $("#progreso").css("width", "0%");
                $("#progreso").css("background-color", "#94c948");
                $("#porcentaje").text("0%");
                alert(ListaApuntes);
            }
            else {

                var total = ListaApuntes.length;
                if (total > 0) {

                    var fecha = $("#filtro-ot-fecha").val();
                    fecha = fecha.split("-")[2] + "/" + fecha.split("-")[1] + "/" + fecha.split("-")[0];
                    var transaction = LBR.data.bd.transaction(['Apuntes'], 'readwrite');
                    var objectStore = transaction.objectStore('Apuntes');
                    objectStore.openCursor().onsuccess = function (event) {

                        var cursor = event.target.result;
                        if (cursor) {

                            if (
                                // Borramos los registros hasta la fecha seleccionada
                               cursor.value.Fecha_Apunte.split("/")[0] <= fecha.split("/")[0] &&               //dia
                               cursor.value.Fecha_Apunte.split("/")[1] == fecha.split("/")[1] &&               //mes
                               cursor.value.Fecha_Apunte.split(" ")[0].split("/")[2] == fecha.split("/")[2]    //año
                               ) {
                                console.log(cursor.value.Fecha_Apunte);
                                cursor.delete();
                            }
                            cursor.continue();
                        } else {
                            var pet = LBR.data.bd.transaction(['Apuntes'], "readwrite").objectStore('Apuntes');
                            var registrosExistentes = pet.openCursor();
                            // Guarda los Apuntes en el Storage
                            indice = 0;
                            for (i = 0; i < total; i++) {
                                var peticion = LBR.data.bd.transaction(['Apuntes'], 'readwrite').objectStore('Apuntes').put(ListaApuntes[i]);
                                peticion.onsuccess = function (e) {
                                    indice++;
                                    // Mostramos el progreso	
                                    var porcentaje = ((indice * 100) / total);
                                    $("#progreso").css("width", porcentaje + "%");
                                    if (porcentaje > 50) {
                                        $("#porcentaje").css("color", "#fff");
                                    }
                                    $("#porcentaje").text(porcentaje.toFixed(2) + "%");

                                    if (indice == total) {
                                        // Quita Bloqueo
                                        document.getElementById("contenedor-general").className = "contenedor-listado-ot";
                                        document.getElementById("block-screen").className = 'hide';
                                        document.getElementById("contenedor-barra-progreso").className = "hide";
                                        $("#progreso").css("width", "0%");
                                        $("#progreso").css("background-color", "#94c948");
                                        $("#porcentaje").text("0%");
                                        // Dibuja la tabla
                                        funciones.mostrarTablaApuntesxEstado("No hay datos para este día");

                                    }
                                };
                            }
                        }
                    };


                } else {

                    // Quita Bloqueo
                    document.getElementById("contenedor-general").className = "contenedor-listado-ot";
                    document.getElementById("block-screen").className = 'hide';
                    document.getElementById("contenedor-barra-progreso").className = "hide";
                    $("#progreso").css("width", "0%");
                    $("#progreso").css("background-color", "#94c948");
                    $("#porcentaje").text("0%");

                    alert("No hay datos");


                }

            }

        });

        ApuntesEstado.fail(function (error) {

            // Quita Bloqueo
            document.getElementById("contenedor-general").className = "contenedor-listado-ot";
            document.getElementById("block-screen").className = 'hide';
            document.getElementById("contenedor-barra-progreso").className = "hide";
            $("#progreso").css("width", "0%");
            $("#progreso").css("background-color", "#94c948");
            $("#porcentaje").text("0%");

            alert("Error de red, favor intente otra vez");

        });

    },

    mostrarTablaApuntesxEstado: function (mensaje) {

        $("#lista-ot>table>tbody").html("");
        var html = '';
        var estado = $.trim($("#select-ot").html()); 
        var fecha = $("#filtro-ot-fecha").val();
        fecha = fecha.split("-")[2] + "/" + fecha.split("-")[1] + "/" + fecha.split("-")[0];
        var cantidad_apuntes = 0;
        query = estado;
        var indice = LBR.data.bd.transaction(['Apuntes']).objectStore('Apuntes').index('Estado_OT'),
        rango = IDBKeyRange.lowerBound(query),
        peticion = indice.openCursor(rango);

        peticion.onsuccess = function (e) {
            var data = e.target.result;
            if (data) {
                if (data.value.Estado_OT.indexOf(query) >= 0) {
                    if (data.value.Fecha_Apunte.split(" ")[0] == fecha) {
                        var tarea_html = '';
                        var id_fila = data.value.Equipo + data.value.Fecha_Apunte.replace(/\D+/g, "");
                        $.each(data.value.Lista_Tareas, function (index, tarea) {

                            var items_html = '';
                            $.each(tarea.Lista_Items, function (index, item) {
                                items_html += `
                                        <tr>
                                            <td>${item.Item}</td>
                                            <td><span class='descripcion'>${(item.Item_N == undefined ? '-': item.Item_N)}</span></td>
                                            <td>${item.UDM}</td>
                                            <td>${Number.parseFloat(item.Cantidad).toFixed(2)}</td>
                                        </tr>
                                    `;
                            });
                            tarea_html += `
                                    <tr data-padre='${id_fila}' class ='hide'>
                                        <td colspan='7'>
                                            <table class='tabla-articulos'>
                                                <thead></thead>
                                                <tbody>
                                                    <tr>
                                                        <td colspan='4' class='tarea-descripcion'>
                                                            <span>
                                                                ${tarea.Tarea} -${tarea.Tarea_N}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr class='cabecera-tabla-articulos'>
                                                        <td>#Item</td>
                                                        <td>Descripcion</td>
                                                        <td>UDM</td>
                                                        <td>Cantidad</td>
                                                    </tr>
                                                    ${items_html}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                `;
                        });
                        boton_cerrar_ot = `<button data-codigo-ot='${data.value.OT}'>CERRAR</button>`;
                        html += `
                              <tr id='${id_fila}'>
                                    <td>${(data.value.Lista_Tareas.length > 0 ? '+' : '')}   </td>
                                    <td>${data.value.Fecha_Apunte}                           </td>
                                    <td>${data.value.Equipo}                                 </td>
                                    <td>${data.value.Lista_Tareas.length}                    </td>
                                    <td>${(data.value.OT == undefined ? '-' : data.value.OT)}</td>
                                    <td>${data.value.Estado_OT}                              </td>
                                    <td>
                                        ${(data.value.Estado_OT != 'Despachada' ? boton_cerrar_ot : '-')}
                                        
                                    </td>
                                </tr>
                                ${tarea_html}
                                `;

                        cantidad_apuntes++;
                    }
                }
                data.continue();

            }
            else {
                if (cantidad_apuntes === 0) {
                    html = `<tr colspan='7'>
                                <td>${mensaje}</td>
                            </tr>`;
                }
                $("#lista-ot>table>tbody").html(html); console.log(html);
            }
        };

       
    },

    visualizarModuloUI: function () {

        var peticion = LBR.data.bd.transaction(['Nodrizas']).objectStore('Nodrizas').openCursor();

        peticion.onsuccess = function (e) {
            var data = e.target.result;
            if (data) {
                $('#encabezado h1').html("Módulo: " + data.value.modulo_n);
                // Guardamos en memoria el módulo en uso
                LBR.modulo = data.value.modulo_id;
                LBR.modulo_des = data.value.modulo_n;
            }

        };
    },

    verListadoOT: function () {

        LBR.generales.delay(this, function () {
            document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = "Listado Ordenes de Trabajo";
            document.getElementById('encabezado').getElementsByTagName('h1')[0].innerText = "";
            $("#contenedor-inicio").addClass("hide");
            $("#barra-estado").addClass("hide");
            $("#menu-opciones").removeClass().addClass("icono-menu-opciones-inactive");
            $("#contenedor-listado-ot").removeClass();
            contenedorActual = "contenedor-listado-ot";
            var hoy = new Date();
            var dia = function (d) { return (d < 10 ? '0' : '') + d; };
            var mes = function (m) { return (m < 10 ? '0' : '') + m; };
            document.getElementById("filtro-ot-fecha").value = `${hoy.getFullYear()}-${mes(hoy.getMonth())}-${dia(hoy.getDate())}`;
        }, 100);

    },

    actualizarApp: function () {

        if (LBR.conectado) {

            confirm("Desea actualizar la aplicación?", "", function (btnIndex) {
                if (btnIndex == 1) {

                    // Parámetros para el plugin
                    var nombre_apk_file_a_descargar = "Mantenimiento(version " + LBR.nueva_version_apk + ").apk";
                    var url_apk_file = LBR.url_descarga_apk;
                    var titulo_de_descarga = nombre_apk_file_a_descargar;
                    var descripcion_descarga = "Descargando actualización de app Mantenimiento";
                    var callback = function () { };

                    // Llamada al plugin para actualizar la app
                    window.CordovaPluginUpdateApp.update(
                        nombre_apk_file_a_descargar,
                        url_apk_file,
                        titulo_de_descarga,
                        descripcion_descarga,
                        callback);


                }
            });

        } else {
            alert("El dispositivo no tiene conexion a Internet, no puede actualizar la app en este momento", "");
        }

    },

   PonerLaPantallaBloqueo : function () {

        // Ponemos la Pantalla de Bloqueo
        funciones.generales.activarDesactivarBtnSincronizar("sincronizando");
        funciones.generales.ocultarMostrarBloqueoPantalla("barra");
        LBR.generales.insertarSincronizacion();
        document.getElementById("titulo-barra-progreso").innerText = "Conectando...";

    },

    QuitarLaPantallaBloqueo : function () {

    // Quitamos la pantalla de bloqueo...
    document.getElementById("contenedor-general").className = ""
    document.getElementById("block-screen").className = 'hide';
    document.getElementById("contenedor-barra-progreso").className = "hide";
    $("#progreso").css("width", "0%");
    $("#progreso").css("background-color", "#94c948");
    $("#porcentaje").text("0%");

    // Activamos el botón
    $("#sincronizar-maestro").removeClass("sincronizar-maestro-inactivo");
    $("#sincronizar-maestro").addClass("sincronizar-maestro");
    document.getElementById('img-sincronizar').src = "images/ICN_sincronizar_activo.svg";
    document.querySelector('#sincronizar-maestro section div h1').innerText = "Sincronizar Datos";

    },

    mostrarIDDispositivo: function () {

        if (clickTimer == null) {
            clickTimer = setTimeout(function () {
                clickTimer = null;
            }, 500)
        } else {

            cordova.getAppVersion.getVersionNumber().then(function (version) {

                var descripcion_app = "ID de dispositivo: \t" + device.uuid + "\n";
                descripcion_app = descripcion_app + "Versión de la app: " + version + "\n";
                clearTimeout(clickTimer);
                clickTimer = null;
                console.log(descripcion_app);
                alert(descripcion_app, "");
            });


        }

    },

    usuario: {
        guardarUsuario: function () {

            var _keySt = "$3RLubr!c4n73sNI";
            var contrasena = document.getElementById('txt-clave').value;

            LBR.user.nombre = document.getElementById('txt-usuario').value;
            LBR.user.clave = funciones.generales.EncryptStringToAES(contrasena, _keySt);
            LBR.user.auth = false;
            funciones.generales.actualizarTareasPendientes();

            document.querySelector('#contenedor-usuario section h1').innerText = LBR.user.nombre;
            //LBR.usuario.insertarUsuario();

            document.getElementById('txt-usuario').value = "";
            document.getElementById('txt-clave').value = "";

        },
        UsuarioConectado: function () {
            console.log('aqui');
            var peticion = LBR.data.bd.transaction(['Usuarios']).objectStore('Usuarios').openCursor();
            peticion.onsuccess = function (e) {
                var data = e.target.result;
                if (data) {

                    if (data.value.auth == true) {

                        LBR.user.nombre = data.value.nombre;
                        LBR.user.clave = data.value.clave;
                        LBR.user.auth = data.value.auth;
                        console.log("Es:" + LBR.user.auth);
                        $("#contenedor-login").addClass("hide");
                        $("#menu-opciones").addClass("hide");
                        $("#barra-estado").removeClass();
                        $("#contenedor-general").removeClass();
                        contenedorActual = "contenedor-inicio";
                        if (LBR.conectado) {
                            console.log("Autenticando Online...");
                            console.log("Pass:" + LBR.user.clave);
                            console.log("User:" + LBR.user.nombre);
                            LBR.user.auth = LBR.usuario.autentificarUsuario();
                        }
                        else {
                            console.log("Autenticando Offline...");
                            LBR.user.auth = LBR.usuario.autenticarUsuarioOffline();
                        }
                        document.querySelector('#contenedor-usuario section h1').innerText = data.value.nombre;
                    }
                    else {
                        $("#contenedor-login").removeClass();
                        $("#contenedor-general").addClass("hide");
                        console.log("Debe loguearse...");
                        data.continue();
                        
                    }


                }
              

            }
        }
    },
    tarea:
    {
        cargarTareas: function () {

            var query = document.getElementById('buscador-tareas').value;
            $('#menu-tareas').html("<p style='border:2px solid;font-size:1.8em;color:#cbcbcb;text-align:center'>Cargando...</p>");
            $('#menu-tareas').css("width", "100%");

            var indice = 0
            var numTareas = 0
            icono_tareas: [];
            lista = [];

            var img = "";
            var transaction = LBR.data.bd.transaction(['Tareas']);

            transaction.oncomplete = function (e) {
                if (numTareas > 0) {
                    var width = (Math.ceil((numTareas / 2))) * 35 + 3;
                    document.getElementById("menu-tareas").style.width = width + "vw";
                } else {
                    $('#menu-tareas').css("width", "100% !important");
                    $('#menu-tareas').html("<p style='border:2px solid;font-size:1.8em;color:#cbcbcb;text-align:center'>No existe esa tarea</p>");
                }
            }
            transaction.onerror = function (e) {
                console.log('Error transaccion');
            };

            var objectStore;
            var objectStoreRequest;

            if (query.length == 0) {
                // Top 15
                objectStore = transaction.objectStore('Tareas');
                objectStoreRequest = objectStore.openCursor();
                objectStoreRequest.onsuccess = function (e) {
                    var data = e.target.result;
                    if (!!data == false || numTareas == 15) {
                        document.getElementById('menu-tareas').innerHTML = lista.join('');
                        funciones.tarea.agregarEventoTarea();
                        return;
                    }

                    if (indice > 7)
                        indice = 0;
                    if (data.value.descripcion.indexOf("Chequeo") >= 0) {
                        img = "images/ICN_chequeo.svg";
                    }
                    else if (data.value.descripcion.indexOf("Relleno") >= 0) {
                        img = "images/ICN_relleno.svg";
                    }
                    else if (data.value.descripcion.indexOf("Cambio") >= 0) {
                        img = "images/ICN_cambio.svg";
                    }
                    else if (data.value.descripcion.indexOf("Engrase") >= 0) {
                        img = "images/ICN_engrase.svg";
                    }
                    lista.push('<div class="contenedor-iconoTarea" >' +
                               '<div data-descripcion="' + data.value.descripcion + '" data-id="' + data.value.id + '" style="background-image: url(' + img + ');" class="colorIconoTarea' + (indice + 1) + '"></div>' +
                               '<div class="descripcion">' + data.value.descripcion + '</div></div>');

                    data.continue();
                    numTareas++;
                    indice++;

                };
            } else {

                query = query.split(" ").map(function (elemento, i) {
                    return elemento[0].toUpperCase() + elemento.substr(1, query.length);
                }).join(" ");
                console.log(query);
                // Busqueda por descripcion
                objectStore = transaction.objectStore('Tareas').index('Buscar'),
                rango = IDBKeyRange.lowerBound(query),
                objectStoreRequest = objectStore.openCursor(rango);
                objectStoreRequest.onsuccess = function (e) {
                    var data = e.target.result;
                    if (!!data == false) {
                        if (numTareas > 0) {
                            document.getElementById('menu-tareas').innerHTML = lista.join('');
                            funciones.tarea.agregarEventoTarea();
                        }
                        return;
                    }

                    if (data.value.descripcion.indexOf(query) >= 0) {

                        if (indice > 7) {
                            indice = 0;
                        }
                        if (data.value.descripcion.indexOf("Chequeo") >= 0) {
                            img = "images/ICN_chequeo.svg";
                        }
                        else if (data.value.descripcion.indexOf("Relleno") >= 0) {
                            img = "images/ICN_relleno.svg";
                        }
                        else if (data.value.descripcion.indexOf("Cambio") >= 0) {
                            img = "images/ICN_cambio.svg";
                        }
                        else if (data.value.descripcion.indexOf("Engrase") >= 0) {
                            img = "images/ICN_engrase.svg";
                        }
                        lista.push('<div class="contenedor-iconoTarea" >' +
                                   '<div data-descripcion="' + data.value.descripcion + '" data-id="' + data.value.id + '" style="background-image: url(' + img + ');" class="colorIconoTarea' + (indice + 1) + '"></div>' +
                                   '<div class="descripcion">' + data.value.descripcion + '</div></div>');
                        numTareas++;
                        indice++;
                    }
                    data.continue();
                };
            }

            //LBR.generales.delay(this, function () {
            //    var indice = 0
            //    var numTareas = 0
            //    icono_tareas: [];
            //    lista = [];
            //    //var colores = ["#55b647", "#76c56b", "#00acec", "#28c5ff", "#f7b720", "#f7c920", "#f05847", "#f26e5e"];
            //    //var active_color = ["#449139","#55b647","#008fc5","#00acec","#f7a520","#f7b720","#ec2e17","#f05847"];
            //    var img = "";
            //    var transaction = LBR.data.bd.transaction(['Tareas']);

            //    transaction.oncomplete = function (e) {
            //        var width = (Math.ceil((numTareas / 2))) * 35 + 3;
            //        document.getElementById("menu-tareas").style.width = width + "vw";
            //    }
            //    transaction.onerror = function (e) {
            //        console.log('Error transaccion');
            //    };
            //    var objectStore = transaction.objectStore('Tareas');
            //    var objectStoreRequest = objectStore.openCursor();
               

            //    objectStoreRequest.onsuccess = function (e) {
            //        var data = e.target.result;
            //        if (!!data == false) {
            //            document.getElementById('menu-tareas').innerHTML = lista.join('');
            //            funciones.tarea.agregarEventoTarea();
            //            return;
            //        }

            //        if (indice > 7)
            //            indice = 0;
            //        if (data.value.descripcion.indexOf("Chequeo") >= 0) {
            //            img = "images/ICN_chequeo.svg";
            //        }
            //        else if (data.value.descripcion.indexOf("Relleno") >= 0) {
            //            img = "images/ICN_relleno.svg";
            //        }
            //        else if (data.value.descripcion.indexOf("Cambio") >= 0) {
            //            img = "images/ICN_cambio.svg";
            //        }
            //        else if (data.value.descripcion.indexOf("Engrase") >= 0) {
            //            img = "images/ICN_engrase.svg";
            //        }
            //        lista.push('<div class="contenedor-iconoTarea" >' +
            //                   '<div data-descripcion="' + data.value.descripcion + '" data-id="' + data.value.id + '" style="background-image: url(' + img + ');" class="colorIconoTarea' + (indice + 1) + '"></div>' +
            //                   '<div class="descripcion">' + data.value.descripcion + '</div></div>');

            //        data.continue();
            //        numTareas++;
            //        indice++;

            //    };
            //}, 1000);
        },
        eliminarTarea: function (e) {
            console.log("Tarea:" + funciones.tarea_seleccionada.descripcion);
            var element = this;
            var index = element.getAttribute("data-index");
            confirm("Esta seguro que desea eliminar la tarea " + funciones.tareas[index].descripcion, "", function (btnIndex) {
                if (btnIndex == 1) {
                    $('.contenedor-iconoTarea div[data-id=' + funciones.tareas[index].id + ']').removeClass('iconoTareaInactivo');
                    funciones.lista_tareas.splice(element.getAttribute("data-index"), 1);
                    funciones.tareas.splice(element.getAttribute("data-index"), 1);

                    document.getElementById('tareas-agregadas').innerHTML = funciones.lista_tareas.join('');


                    if (funciones.lista_tareas.length > 0) {
                        funciones.tarea.agregarEventoTareaAgregada();
                    }
                    else {
                        document.getElementById("empty-msg-tarea").className = "";
                        document.getElementById("revisarApunte").className = "boton-guardar-inactive";
                        funciones.tarea.ocultarBtnEliminarTarea();
                    }
                }
            });

        },
        regresarTarea: function () {
            if (funciones.lista_items.length > 0) {
                confirm("Esta seguro que desea cancelar esta tarea?", "", function (btnIndex) {
                    console.log("Index" + btnIndex);
                    if (btnIndex == 1) {
                        funciones.item.borrarDatosItems();
                        var editarTarea = $.grep(funciones.tareas, function (e) {
                            return e.estado == "Edit";
                        });
                        if (funciones.tareas.length > 0 && editarTarea.length > 0) {

                            editarTarea[0].estado = "";
                        }
                    }
                });
            }
            else {
                funciones.item.borrarDatosItems();
            }
            document.getElementById("items-buscar").value = "";

        },


        agregarTarea: function (e) {

            var tareas = document.getElementById('items-agregados');

            var items_agregados = document.getElementById('items-agregados').getElementsByTagName('li');
            var items = [];
            var total_items = 0;
            if (items_agregados.length > 0) {
                for (var i = 0; i < items_agregados.length; i++) {
                    items[i] = {
                        id: items_agregados[i].getElementsByClassName('texto-item')[0].getElementsByTagName('p')[0].innerText,
                        descripcion: items_agregados[i].getElementsByClassName('texto-item')[0].getElementsByTagName('h1')[0].innerText,
                        cantidad: parseFloat(items_agregados[i].getElementsByClassName('cantidad-item')[0].innerText).toFixed(2),
                        //nodriza: funciones.nodriza,
                        udm: items_agregados[i].getElementsByClassName('udm-item')[0].innerText
                    };
                    total_items += parseInt(items_agregados[i].getElementsByClassName('cantidad-item')[0].innerText);
                }
            }
            else {
                items[0] = {
                    id: null,
                    descripcion: "",
                    cantidad: null,
                    //nodriza: funciones.nodriza,
                    udm: null
                }


            }
            var editarTarea = $.grep(funciones.tareas, function (e) {
                return e.estado == "Edit";
            });
            if (funciones.tareas.length > 0 && editarTarea.length > 0) {

                editarTarea[0].items = items;
                editarTarea[0].estado = "";
                var tarea_borrar = $('#tareas-agregadas section[data-id=' + editarTarea[0].id + ']').parent().html();
                var indexTarea_borrar = funciones.lista_tareas.indexOf('<li data-state="false">' + tarea_borrar + '</li>');
                funciones.lista_tareas.splice(indexTarea_borrar, 1);
                funciones.tarea_seleccionada.id = editarTarea[0].id;
                funciones.tarea_seleccionada.descripcion = editarTarea[0].descripcion;

            }
            else {
                funciones.tareas.push({ id: funciones.tarea_seleccionada.id, descripcion: funciones.tarea_seleccionada.descripcion, items: items, estado: '' });
            }
            funciones.lista_tareas.push('<li data-state="false">' +
                                          '<section data-id="' + funciones.tarea_seleccionada.id + '">' +
                                              '<article>' +
                                                  '<div class="texto-item"><h1>' + funciones.tarea_seleccionada.descripcion + '</h1></div>' +
                                              '</article>' +
                                              '<article>' +
                                                  '<span class="cantidad-item">' + items_agregados.length + '</span>' +
                                                  '<span> Items </span>' +
                                              '</article>' +
                                          '</section>' +
                                      '</li>');
            document.getElementById("tareas-agregadas").innerHTML = funciones.lista_tareas.join('');
            funciones.item.borrarDatosItems();
            funciones.tarea.agregarEventoTareaAgregada();
            document.getElementById("items-buscar").value = "";
            document.getElementById("empty-msg-tarea").className = "hide";
            document.getElementById("empty-msg").className = "";
            document.getElementById("revisarApunte").className = "boton-guardar";

            $('.contenedor-iconoTarea div[data-id=' + funciones.tarea_seleccionada.id + ']').addClass('iconoTareaInactivo');
            e.stopPropagation();
        },
        agregarEventoTarea: function () {
            var div = document.querySelector('#menu-tareas').getElementsByClassName("descripcion");
            var div_tareas = document.querySelector('.contenedor-iconoTarea').getElementsByTagName('div');

            for (var i = 0; i < div.length; i++) {
                div[i].previousSibling.onclick = function () {
                    if (funciones.tarea.validarTarea(this.getAttribute("data-id"))) {
                        funciones.tarea_seleccionada.id = this.getAttribute("data-id");
                        funciones.tarea_seleccionada.descripcion = this.getAttribute("data-descripcion");
                        document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = this.getAttribute("data-descripcion");
                        $("#contenedor-tarea section").scrollLeft(0)
                        funciones.item.irItems();
                    }
                };
            }
        },
        agregarEventoTareaAgregada: function () {
            var li = document.getElementById('tareas-agregadas').getElementsByTagName('li');
            [].forEach.call(li, function (li) {

                li.addEventListener('click', function (event) {
                    var numItems = this.getElementsByClassName("cantidad-item")[0].innerText;
                    if (numItems != "0") {
                        var element = this;
                        funciones.item.cargarEdicionItems(element.getElementsByTagName("section")[0].getAttribute("data-id"));
                        $("#contenedor-tarea").addClass("hide");
                        $("#contenedor-edicionItems").removeClass();
                        contenedorActual = "contenedor-edicionItems";
                    }
                    else {
                        alert("Esta tarea no contiene items", "");
                    }

                }, false);

                li.addEventListener("touchstart", function (event) {
                    var element = this;
                    positionEvt = 0;
                    positionEvt = $(this).position().top;
                    gbMove = false;
                    gbStillTouching = true;
                    gnStartTime = Number(new Date());
                    setTimeout(function () {
                        if ((!gbMove) && (gbStillTouching) && (gnStartTime == gnStartTime)) {
                            gnStartTime = 0;
                            gbMove = false;
                            funciones.generales.eventListener(positionEvt, null, element);
                        }
                    }, 1200);
                }, false);
                li.addEventListener('touchend', function (event) {
                    gbStillTouching = false;
                });
                li.addEventListener('touchmove', function (event) {
                    gbMove = true;
                    positionEvt = $(this).position().top;
                    funciones.tarea.ocultarBtnEliminarTarea();
                }, false);
            });
        },
        agregarEventoDesplegables: function () {
            var items = document.querySelectorAll("li .titulo");

            for (var i = 0; i < items.length; i++) {
                items[i].onclick = function (e) {
                    if ($(this).children("div").css('background-image').indexOf("ICN_arrow_up") > 0) {
                        $(this).next().slideUp("slow");
                        $(this).children("div").removeClass("mostrar-cantidad-apunte").addClass('ocultar-cantidad-apunte');
                        $(this).children().children().removeClass("hide")
                    }
                    else {
                        $(this).children("div").removeClass('ocultar-cantidad-apunte').addClass('mostrar-cantidad-apunte');
                        $(this).next().attr('class', 'lista-items');
                        $(this).next().slideDown("slow");
                        $(this).children().children().addClass("hide")
                    }
                    e.stopPropagation();
                }
            }
        },
        borrarDatosTarea: function () {
            funciones.lista_tareas.splice(0, funciones.lista_tareas.length);
            funciones.tareas.splice(0, funciones.tareas.length);
            document.getElementById("tareas-agregadas").innerHTML = "";
            document.getElementById("menu-tareas").innerHTML = "";
            if (funciones.lista_tareas.length < 1) {
                document.getElementById("empty-msg-tarea").className = "";
            }

        },
        validarTarea: function (id_tarera) {
            for (var i = 0; i < funciones.lista_tareas.length; i++) {
                var id = funciones.lista_tareas[i].split(id_tarera);
                if (id.join() != funciones.lista_tareas[i]) {
                    alert("La tarea seleccionada ya contiene items agregados", "");
                    return false;
                }
            }
            return true;
        },
        ocultarBtnEliminarTarea: function () {
            var divEliminar = document.getElementById("bt-eliminar-tarea");
            var divPointer = document.getElementById("pointer-tarea");
            divPointer.className = 'hide';
            divEliminar.className = 'hide';
        }
    },
    equipo: {
        cambioAceite: 0,
        buscarEquipo: function () {
            var txt = document.querySelector('#equipo-buscar');
            //if (txt.value.length >= 2)
            //  {
            txt.className = "loading";
            //   }            
            // LBR.generales.delay(this, function () {
            var query = txt.value.toUpperCase()
            if (query.length >= 1) {
                var indice = LBR.data.bd.transaction(['Equipos']).objectStore('Equipos').index('Buscar'),
                rango = IDBKeyRange.lowerBound(query),
                peticion = indice.openCursor(rango),
                lista = [];

                peticion.onsuccess = function (e) {
                    var data = e.target.result;
                    if (data && LBR.data.indice_resultados < 10) {
                        if (data.value.id.substr(0, query.length) === query) {
                            //lista.push('<li data-horometroAnt="' + data.value.horometro_anterior + '" data-cambioAceite="' + data.value.Intervalo_Cambio_Aceite + '"><h1>' + data.value.descripcion + '</h1><p>' + data.value.id + '</p></li>');
                            lista.push('<li data-ultimo-cambio="' + data.value.Ultimo_Cambio + '" data-horometroAnt="' + data.value.Ultimo_Cambio + '" data-cambioAceite="' + data.value.Intervalo_Cambio + '" data-ultimaVisita="' + data.value.Fecha_Ultima_Visita + '"><h1>' + data.value.descripcion + '</h1><p>' + data.value.id + '</p></li>');
                        }
                        LBR.data.indice_resultados++;
                        data.continue();
                    } else {
                        if (lista.length > 0) {
                            document.querySelector('#equipos-encontrados').innerHTML = lista.join('');
                        }
                        else {
                            document.querySelector('#equipos-encontrados').innerHTML = "<div>No se encontraron equipos</div>";
                        }
                        document.querySelector('#equipos-encontrados').className = "";
                        funciones.equipo.agregarEventoEquipo();
                        LBR.data.indice_resultados = 0;
                    }
                    txt.className = "";
                };
            } else {
                document.querySelector('#equipos-encontrados').innerHTML = '';
                txt.className = "";
            }

            document.querySelector('#equipos-encontrados').className = "hide";
            // }, 1000);
        },
        agregarEventoEquipo: function () {
            var li = document.getElementById('equipos-encontrados').getElementsByTagName('li');
            for (var i = 0; i < li.length; i++) {
                li[i].onclick = function () {

                    nodrizas = $('#nodriza li').length;
                    if (nodrizas == 0) {
                        funciones.nodrizas.cargarNodrizas();
                    }

                    $("#nodriza").addClass("hide");
                    funciones.tarea.cargarTareas();
                    var ultimaVisita = this.getAttribute('data-ultimaVisita').substring(0, 10);
                    ultimaVisita = ultimaVisita.split("-");
                    if (ultimaVisita[0] == '1900') {
                        ultimaVisita = "Primera Visita";
                    }
                    else {
                        ultimaVisita = 'Última Visita: ' + ultimaVisita[2] + '/' + ultimaVisita[1] + '/' + ultimaVisita[0];
                    }
                    LBR.generales.delay(this, function () {
                        document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = LBR.eq_id + '-' + funciones.equipo_seleccionado;
                        document.getElementById('encabezado').getElementsByTagName('h1')[0].innerText = ultimaVisita;
                        $("#contenedor-inicio").addClass("hide");
                        $("#barra-estado").addClass("hide");
                        $("#menu-opciones").removeClass().addClass("icono-menu-opciones-inactive");
                        $("#contenedor-resumen").removeClass();
                        contenedorActual = "contenedor-resumen";
                        //document.getElementById('contenedor-inicio').className += ' hide';
                        //document.getElementById('contenedor-resumen').className = 'paginas';
                        //document.getElementById('estado-conexion').className = 'hide';

                    }, 100);
                    var horometroAnterior = this.getAttribute('data-horometroAnt') == "undefined" ? 0 : this.getAttribute('data-horometroAnt');
                    $("#km-anterior").val(horometroAnterior);
                    funciones.equipo.cambioAceite = this.getAttribute('data-cambioAceite') == "undefined" ? 0 : this.getAttribute('data-cambioAceite');
                    if (funciones.equipo.cambioAceite == 0) {
                        $("#msjCambioAceite").removeClass().addClass("msj_cambio_aceite no_definido");
                        $("#msjCambioAceite").html("* Este equipo no tiene definido rango para cambio de aceite");
                    }
                    else {
                        $("#msjCambioAceite").html("");
                    }
                    funciones.equipo_seleccionado = this.getElementsByTagName('h1')[0].innerText
                    LBR.eq_id = this.getElementsByTagName('p')[0].innerText;
                };
            }
        }
    },
    item: {
        buscarArticulo: function () {
            var txt = document.getElementById('items-buscar');
            // if (txt.value.length > 2)
            // {
            txt.className = "loading";
            // }            
            //  LBR.generales.delay(this, function () {
            var query = txt.value.toUpperCase();

            if (query.length >= 1) {
                var transaction = LBR.data.bd.transaction(['Articulos']);
                var objectStore = transaction.objectStore('Articulos').openCursor();
                //var peticion = LBR.data.bd.transaction(['Articulos']).objectStore('Articulos').openCursor(),
                var lista = [];

                objectStore.onsuccess = function (e) {
                    var data = e.target.result;
                    if (data) {
                        console.log(data.value.id);
                    }

                    if (data) {
                        if (data.value.descripcion.toUpperCase().indexOf(query) !== -1 || data.value.id.indexOf(query) !== -1) {
                            var descripcionItem = $.grep(funciones.items_seleccionados, function (e) {
                                return e.descripcion == data.value.descripcion;
                            });
                            var idItem = $.grep(funciones.items_seleccionados, function (e) {
                                return e.descripcion == data.value.descripcion;
                            });

                            if (descripcionItem.length < 1 || idItem < 1) {
                                lista.push('<li id="' + data.value.id + '">' +
                                                '<section>' +
                                                    '<hgroup class="texto-item" ><h2>' + data.value.descripcion + '</h2><h3>' + data.value.id + '<label> |</label> <span>' + data.value.udm + '</span></h3></hgroup>' +
                                                    '<aside>' +
                                                        '<div class="btn-menos">-</div>' +
                                                        '<input class="txt-cantidad" type="number" value="1" minlength="0" maxlength="2" max="99"/>' +
                                                        '<div class="btn-mas">+</div>' +
                                                        '<div class="btn-agregar-item" data-id="' + data.value.id + '" data-descripcion="' + data.value.descripcion + '" data-udm="' + data.value.udm + '">AGREGAR</div>' +
                                                    '</aside>' +
                                                '</section>' +
                                           '</li>');
                            }
                        }

                        LBR.data.indice_resultados++;
                        data.continue();
                    }

                };
                transaction.oncomplete = function (e) {
                    if (lista.length > 0) {
                        document.getElementById('items-encontrados').innerHTML = lista.join('');
                        funciones.item.agregarEventoArticulo();
                    }
                    else {
                        document.getElementById('items-encontrados').innerHTML = "<div>No se encontraron art&iacute;culos</div>";
                        document.getElementById('items-encontrados').className = '';
                    }
                    LBR.data.indice_resultados = 0;
                    txt.className = "";

                };
            } else {
                document.getElementById('items-encontrados').innerHTML = '';
                document.getElementById('items-encontrados').className = 'hide';
                txt.className = "";

                //funciones.item.ocultarMenuItems();
            }

            //  },1000);
        },
        agregarEventoArticulo: function () {
            document.getElementById("items-encontrados").className = "";
            var btn_menos = document.getElementsByClassName('btn-menos');
            var btn_mas = document.getElementsByClassName('btn-mas');
            var txt_cantidad = document.getElementsByClassName('txt-cantidad');
            var btn_agregar_item = document.getElementsByClassName('btn-agregar-item')
            var li = document.getElementById("items-encontrados").getElementsByTagName('li');
            for (var i = 0; i < btn_menos.length; i++) {
                li[i].onclick = function (e) {
                    e.stopPropagation();
                };
                btn_agregar_item[i].onclick = function (e) {
                    if (this.previousSibling.previousSibling.value > 0) {
                        var id = this.getAttribute("data-id");
                        var descripcion = this.getAttribute("data-descripcion");
                        var udm = this.getAttribute("data-udm");
                        var ul = document.getElementById("items-encontrados");

                        funciones.items_seleccionados.push({ id: id, descripcion: descripcion });

                        funciones.lista_items.push('<li data-state="false">' +
                                                     '<section>' +
                                                        '<article>' +
                                                            '<div class="texto-item"><h1>' + descripcion + '</h1><p>' + id + '</p></div>' +
                                                        '</article>' +
                                                        '<article>' +
                                                            '<span class="cantidad-item">' + this.previousSibling.previousSibling.value + '</span>' +
                                                            '<span class="udm-item"> ' + udm + '</span>' +
                                                        '</article>' +
                                                    '</section>' +
                                               '</li>');
                        document.getElementById('items-agregados').innerHTML = funciones.lista_items.join('');

                        //Borrar de lista de busqueda
                        ul.removeChild(document.getElementById(id));
                        funciones.item.agregarEventoItems();

                        if (document.getElementById("items-encontrados").getElementsByTagName('li').length < 1) {
                            document.getElementById('items-encontrados').className = 'hide';
                        }
                        document.getElementById("empty-msg").className = "hide";
                        //document.getElementById("agregar-ItemsTarea").className = "boton-guardar";
                        funciones.item.ocultarMenuItems();
                    }
                    else {
                        alert("La cantidad tiene que ser mayor a 0", "");
                    }
                    e.stopPropagation();
                };
                txt_cantidad[i].onclick = function (e) {
                    e.stopPropagation();
                };
                txt_cantidad[i].onblur = function () {
                    if (parseInt(this.value) < 0 || parseInt(this.value) > 99) {
                        alert("La cantidad ingresada es incorrecta", "Aviso !!!");
                        this.value = 0;
                        this.className = "numero-inactivo";
                        this.parentNode.lastChild.className = "btn-agregar-item-inactive "
                    }
                    else {
                        this.className = "";
                        this.parentNode.lastChild.className = "btn-agregar-item";
                    }
                };

                btn_menos[i].addEventListener("touchstart", function (e) {
                    this.className = "btn-menos-active";
                    if (parseInt(this.nextSibling.value) > 0) {
                        this.nextSibling.className = "";
                        this.nextSibling.value = parseInt(this.nextSibling.value) - 1;
                        this.parentNode.lastChild.className = "btn-agregar-item";
                    }
                    if (parseInt(this.nextSibling.value) < 1) {
                        this.nextSibling.className = "numero-inactivo";
                        this.parentNode.lastChild.className = "btn-agregar-item-inactive";
                    }
                    e.stopPropagation();
                }, false);
                btn_menos[i].addEventListener("touchend", function () {
                    this.className = "btn-menos";
                }, false);

                btn_mas[i].addEventListener("touchstart", function (e) {
                    this.className = "btn-mas-active";
                    if (parseInt(this.previousSibling.value) < 99) {
                        this.previousSibling.className = "";
                        this.parentNode.lastChild.className = "btn-agregar-item";
                        this.previousSibling.value = parseInt(this.previousSibling.value) + 1;
                    }

                    e.stopPropagation();
                }, false);
                btn_mas[i].addEventListener("touchend", function (e) {
                    this.className = "btn-mas";
                }, false);
            }
        },
        agregarEventoItems: function () {

            var li = document.getElementById('items-agregados').getElementsByTagName('li');
            [].forEach.call(li, function (li) {

                li.addEventListener("touchstart", function (event) {

                    var element = this;
                    positionEvt = 0;
                    positionEvt = $(this).position().top;
                    gbMove = false;
                    gbStillTouching = true;
                    gnStartTime = Number(new Date());
                    setTimeout(function () {
                        if ((!gbMove) && (gbStillTouching) && (gnStartTime == gnStartTime)) {

                            gnStartTime = 0;
                            gbMove = false;

                            funciones.generales.eventListener(positionEvt, null, element);
                        }
                    }, 1200);
                }, false);
                li.addEventListener('touchend', function (event) {
                    gbStillTouching = false;
                });
                li.addEventListener('touchmove', function (event) {
                    gbMove = true;
                    funciones.item.ocultarBtnEliminarItem();
                    positionEvt = $(this).position().top;
                }, false);
            });
        },
        eliminarItems: function (e) {
            var index = this.getAttribute("data-index");
            var element = this;
            confirm("Esta seguro que desea eliminar el artículo " + funciones.items_seleccionados[index].id + " - " + funciones.items_seleccionados[index].descripcion + "?", "", function (btnIndex) {
                if (btnIndex == 1) {
                    funciones.lista_items.splice(element.getAttribute("data-index"), 1);
                    funciones.items_seleccionados.splice(element.getAttribute("data-index"), 1);
                    document.getElementById('items-agregados').innerHTML = funciones.lista_items.join('');
                    if (funciones.lista_items.length > 0) {
                        funciones.item.agregarEventoItems();
                    }
                    else {
                        var divEliminar = document.getElementById("bt-eliminar-item");
                        var divPointer = document.getElementById("pointer");
                        divPointer.className = 'hide';
                        divEliminar.className = 'hide';
                        //document.getElementById("agregar-Items").className = "boton-guardar-inactive";
                        document.getElementById("empty-msg").className = "";
                    }
                }

            });
        },
        irItems: function () {
            $("#contenedor-tarea").addClass("hide");
            $("#contenedor-items").removeClass();
            contenedorActual = "contenedor-items";
            //document.getElementById('contenedor-tarea').className = 'hide';
            //document.getElementById('contenedor-items').className = 'paginas';
        },
        cargarEdicionItems: function (tarea) {
            document.getElementById("empty-msg").className = "hide";
            for (var i = 0; i < funciones.tareas.length; i++) {
                if (funciones.tareas[i].id == tarea) {
                    var items = "";
                    posicionTarea = i;
                    funciones.tareas[i].estado = 'Edit';
                    for (var j = 0; j < funciones.tareas[i].items.length; j++) {
                        if (funciones.tareas[i].items[j].id != null) {
                            items += '<li>' +
                                        '<section>' +
                                            '<article>' +
                                                '<div class="texto-item"><h1>' + funciones.tareas[i].items[j].descripcion + '</h1><p>' + funciones.tareas[i].items[j].id + '</p></div>' +
                                            '</article>' +
                                            '<article>' +
                                                '<span class="cantidad-item">' + funciones.tareas[i].items[j].cantidad + '</span>' +
                                                '<span class="udm-item"> ' + funciones.tareas[i].items[j].udm + '</span>' +
                                           '</article>' +
                                        '</section>' +
                                    '</li>';
                        }
                    }
                    break;
                }
            }
            document.getElementById("lista-items").innerHTML = items;
        },
        editarItems: function () {
            var numTarea = posicionTarea;
            for (var i = 0; i < funciones.tareas[numTarea].items.length; i++) {
                funciones.items_seleccionados.push({ id: funciones.tareas[numTarea].items[i].id, descripcion: funciones.tareas[numTarea].items[i].descripcion });

                funciones.lista_items.push('<li data-state="false">' +
                                             '<section>' +
                                                '<article>' +
                                                    '<div class="texto-item"><h1>' + funciones.tareas[numTarea].items[i].descripcion + '</h1><p>' + funciones.tareas[numTarea].items[i].id + '</p></div>' +
                                                '</article>' +
                                                '<article>' +
                                                    '<span class="cantidad-item">' + funciones.tareas[numTarea].items[i].cantidad + '</span>' +
                                                    '<span class="udm-item"> ' + funciones.tareas[numTarea].items[i].udm + '</span>' +
                                                '</article>' +
                                            '</section>' +
                                       '</li>');
            }
            document.getElementById('items-agregados').innerHTML = funciones.lista_items.join('');
            funciones.item.agregarEventoItems();
            $("#contenedor-edicionItems").addClass("hide");
            $("#contenedor-items").removeClass();
            contenedorActual = "contenedor-items";
            //document.getElementById('contenedor-edicionItems').className = "hide";
            //document.getElementById('contenedor-items').className = "paginas";
            document.getElementById('agregar-ItemsTarea').className = "boton-guardar";

        },
        borrarDatosItems: function () {
            $("#contenedor-items").addClass("hide");
            $("#contenedor-tarea").removeClass();
            contenedorActual = "contenedor-tarea";

            document.getElementById('items-agregados').innerHTML = '';
            //Borrar Items Agregados
            funciones.lista_items.splice(0, funciones.lista_items.length);
            funciones.items_seleccionados.splice(0, funciones.items_seleccionados.length);
            document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = LBR.eq_id + "-" + funciones.equipo_seleccionado;
            //document.getElementById("agregar-ItemsTarea").className = "boton-guardar-inactive";
        },
        ocultarMenuItems: function () {
            document.getElementById('items-encontrados').className = 'hide';
            //document.getElementById('items-buscar').value = "";
            funciones.item.ocultarBtnEliminarItem();
            if (document.getElementById('items-agregados').getElementsByTagName('li').length > 0) {
                var li = document.getElementById('items-agregados').getElementsByTagName('li');
                for (var i = 0; i < li.length; i++) {
                    li[i].setAttribute("data-state", "false");
                }
            }
        },
        ocultarBtnEliminarItem: function () {
            var divEliminar = document.getElementById("bt-eliminar-item");
            var divPointer = document.getElementById("pointer");
            divPointer.className = 'hide';
            divEliminar.className = 'hide';
        },

    },
    apunte: {
        irDetalleApunte: function () {

            if (funciones.lista_tareas.length > 0) {
                $("#contenedor-tarea").addClass("hide");
                $("#contenedor-detalleApunte").removeClass();
                contenedorActual = "contenedor-detalleApunte";
                $("#guardar-apunte").text("Confirmar y Guardar");
                //document.getElementById('contenedor-tarea').className = "hide";
                //document.getElementById('contenedor-detalleApunte').className = "";
                funciones.apunte.crearDetalleApunte();
            }
            else {
                alert("Por favor agregue una tarea para la revisión", "");
            }
        },
        irDetalleSincApunte: function (contenedorOrigen) {
            funciones.lista_apunte.splice(0, funciones.lista_apunte.length);
            if (funciones.cantidadTareasSinc > 0) {
                $("#barra-estado").addClass("hide");
                $("#pointer-menu").addClass("hide");
                $("#" + contenedorOrigen).addClass("hide");
                $("#contenedor-detalleSincAnpunte").removeClass();
                $("#guardar-apunte").text("Sincronizar");
                document.getElementById('lista-apuntes').innerHTML = "";
                funciones.apunte.crearDetalleSincApunte();
            }
        },
        crearDetalleApunte: function () {
            if (funciones.tareas.length > 0) {
                var tareas_html = ""
                var items_html = ""
                var clase_lista = 'class="lista-items"';
                var clase_textos = '';
                var pointer = ">";
                for (var i = 0; i < funciones.tareas.length; i++) {
                    if (funciones.tareas[i].items.length >= 3 && funciones.tareas.length > 1) {
                        clase_lista = 'class="hide"';
                        clase_textos = '';
                        pointer = 'ocultar-cantidad-apunte';

                    }
                    else {
                        clase_lista = 'class="lista-items"';
                        pointer = 'mostrar-cantidad-apunte';
                        clase_textos = 'class="hide"';
                    }
                    if (funciones.tareas[i].items.length < 2 && funciones.tareas[i].items[0].id == null) {
                        pointer = "";
                    }
                    tareas_html = '<li>' +
                                    '<div class="titulo">' +
                                        '<h2 class="titulo-tarea">' + funciones.tareas[i].descripcion + '</h2> ' +
                                        '<div class="' + pointer + '">' +
                                            '<h1 ' + clase_textos + '>' + funciones.tareas[i].items.length + ' </h1>' +
                                            '<p ' + clase_textos + '> Items</p>' +
                                         '</div>' +
                                    '</div>' +
                                    '<ul ' + clase_lista + '>';
                    for (var j = 0; j < funciones.tareas[i].items.length; j++) {
                        if (funciones.tareas[i].items[0].id != null) {
                            items_html += '<li>' +
                                        '<section>' +
                                            '<article>' +
                                                '<div class="texto-item"><h1>' + funciones.tareas[i].items[j].descripcion + '</h1><p>' + funciones.tareas[i].items[j].id + '</p></div>' +
                                            '</article>' +
                                            '<article>' +
                                                '<span class="cantidad-item">' + funciones.tareas[i].items[j].cantidad + '</span>' +
                                                '<span>' + funciones.tareas[i].items[j].udm + ' </span>' +
                                            '</article>' +
                                        '</section>' +
                                    '</li>';
                        }
                    }

                    tareas_html += items_html;
                    tareas_html += '</ul>' +
                                  '</li>';
                    items_html = "";
                    funciones.lista_apunte.push(tareas_html);
                }
                document.getElementById("lista-tareas").innerHTML = funciones.lista_apunte.join('');
                funciones.tarea.agregarEventoDesplegables();
            }
        },
        crearDetalleSincApunte: function () {
            var apunte = [];
            var index = 0;
            var peticion = LBR.data.bd.transaction(['Nuevos']).objectStore('Nuevos').openCursor();
            peticion.onsuccess = function (e) {
                var data = e.target.result;

                if (data) {
                    apunte[index] = data.value;
                    index++;
                    data.continue();
                }
                else {
                    if (apunte.length > 0) {
                        var apuntes_html = "";
                        var tareas_html = "";
                        var items_html = "";
                        var clase_lista = 'class="lista-items"';
                        var clase_textos = '';
                        var pointer = "";
                        for (var i = 0; i < apunte.length; i++) {
                            apuntes_html = '<li>' +
                                            '<h2 class="titulo-apunte">Apunte ' + (i + 1) + '</h2>';
                            for (var k = 0; k < apunte[i].tareas.length; k++) {
                                if (apunte[i].tareas[k].items.length >= 3 && (apunte[i].tareas.length > 1 || apunte.length > 1)) {
                                    clase_lista = 'class="hide"';
                                    clase_textos = '';
                                    pointer = 'ocultar-cantidad-apunte';

                                }
                                else {
                                    clase_lista = 'class="lista-items"';
                                    pointer = 'mostrar-cantidad-apunte';
                                    clase_textos = 'class="hide"';
                                }
                                if (apunte[i].tareas[k].items.length < 2 && apunte[i].tareas[k].items[0].id == null) {
                                    pointer = "";
                                }
                                tareas_html += '<ul class="lista-tareas">' +
                                               '<li>' +
                                               '<div class="titulo">' +
                                                   '<h2 class="titulo-tarea">' + apunte[i].tareas[k].descripcion + '</h2> ' +
                                                   '<div class="' + pointer + '">' +
                                                       '<h1 ' + clase_textos + '>' + apunte[i].tareas[k].items.length + ' </h1>' +
                                                       '<p ' + clase_textos + '> Items</p>' +
                                                    '</div>' +
                                               '</div>' +
                                               '<ul ' + clase_lista + '>';
                                for (var j = 0; j < apunte[i].tareas[k].items.length; j++) {
                                    if (apunte[i].tareas[k].items[j].id != null) {
                                        items_html += '<li>' +
                                                        '<section>' +
                                                            '<article>' +
                                                                '<div class="texto-item"><h1>' + apunte[i].tareas[k].items[j].descripcion + '</h1><p>' + apunte[i].tareas[k].items[j].id + '</p></div>' +
                                                            '</article>' +
                                                            '<article>' +
                                                                '<span class="cantidad-item">' + apunte[i].tareas[k].items[j].cantidad + '</span>' +
                                                                '<span>' + apunte[i].tareas[k].items[j].udm + ' </span>' +
                                                            '</article>' +
                                                        '</section>' +
                                                    '</li>';
                                    }
                                    else {
                                        pointer = "";
                                    }
                                }
                                tareas_html += items_html;
                                tareas_html += '</ul>' +
                                        '</li>';
                                items_html = "";
                            }
                            apuntes_html += tareas_html;
                            apuntes_html += '</ul>' +
                                        '</li>';
                            tareas_html = "";

                            funciones.lista_apunte.push(apuntes_html);
                        }
                        document.getElementById("lista-apuntes").innerHTML = funciones.lista_apunte.join('');
                        funciones.tarea.agregarEventoDesplegables();
                    }
                }
            }
        },
        guardarApunte: function () {
            var DateTime = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();
            var odometro = 0;
            val_hr = 0;
            if ($("#tabHorometro").hasClass("tab_udm_activo")) {
                val_hr = document.getElementById('km-recorrido').value;
            }
            else {
                odometro = document.getElementById('km-recorrido').value;
            }
            if (val_hr == "") {
                val_hr = null;
            }
            if (odometro == "") {
                odometro = null;
            }
            var apunte = {
                nodriza: funciones.nodriza,
                equipo: LBR.eq_id,
                tareas: funciones.tareas,
                odometro: parseFloat(odometro),
                odometro_udm: 'km',
                observaciones: document.getElementById('observaciones').value,
                horometro: val_hr,
                latitud_apunte: LBR.latitud_apunte,
                longitud_apunte: LBR.longitud_apunte,
                latitud_sincronizacion: LBR.latitud_sincronizacion,
                longitud_sincronizacion: LBR.longitud_sincronizacion,
                id_dispositivo: device.uuid,
                plataforma: device.platform + ' ' + device.version,
                version_app: LBR.version_app,

                creado_usr: LBR.user.nombre,
                mod_usr: LBR.user.nombre,
                fecha_apunte: DateTime,
                credenciales: {
                    user: LBR.user.nombre,
                    password: LBR.user.clave
                }
            }

            LBR.registros_nuevos = apunte;
            LBR.apunte.insertarApunte();

            $("#contenedor-detalleApunte").addClass("hide");
            funciones.generales.irInicio();
            contenedorActual = "contenedor-inicio";

            document.getElementById('km-anterior').value = "";
            document.getElementById('km-recorrido').value = "";
            document.getElementById('observaciones').value = "";
            //document.getElementById('hr-recorrido').value = "";
            //  document.getElementById('select-nodriza').innerText = "";
            document.getElementById('tareas-agregadas').innerHTML = "";
            LBR.eq_id = '';
        }
    },
    nodrizas: {
        cargarNodrizas: function () {
            var ul = document.getElementById('nodriza');
            var cont = 0;
            //   document.getElementById('select-nodriza').className = "loading";        
            LBR.generales.delay(this, function () {

                var peticion = LBR.data.bd.transaction(['Nodrizas']).objectStore('Nodrizas').openCursor(), lista = [];

                peticion.onsuccess = function (e) {
                    var data = e.target.result;
                    if (data) {
                        funciones.nodriza = data.value.id;
                        lista.push('<li><h1>' + data.value.id + '</h1></li>');
                        //$('#select-nodriza').html(data.value.id + '-' + data.value.descripcion);
                        $('#select-nodriza').html(data.value.descripcion);
                        console.log("Nodriza " + cont + "=" + data.value.descripcion);
                        cont++;
                        data.continue();
                    } else {
                        if (cont > 1) {
                            $("#select-nodriza").removeClass().addClass("nodriza-plegada");
                            document.getElementById('nodriza').innerHTML = lista.join('');
                            console.log("Lista:" + lista);
                            funciones.nodrizas.agregarEventoMenuNodriza();
                        }
                        else {
                            $("#nodriza").html("");
                            $("#select-nodriza").removeClass();
                        }
                    }

                };
                document.getElementById('select-nodriza').className = "";
            }, 1000);
        },
        agregarEventoMenuNodriza: function () {
            var li = document.getElementById("nodriza").getElementsByTagName("li");
            for (var i = 0; i < li.length; i++) {
                li[i].onclick = function (e) {
                    document.getElementById("select-nodriza").innerText = this.innerText;
                    var nod = this.innerText.split("-");
                    funciones.nodriza = nod[0];
                    $("#nodriza").scrollTop(0);
                    $("#nodriza").addClass("hide");
                    $("#select-nodriza").css('background-image', 'url(images/ICN_arrow_down.svg)');
                    e.stopPropagation();
                }
            }
        }
    },
    generales: {
        asignarEventos: function () {
            /*Ocultar contenedores*/
            $("#contenedor-general").addClass("hide");
            $("#contenedor-resumen").addClass("hide");
            $("#contenedor-listado-ot").addClass("hide");
            $("#contenedor-tarea").addClass("hide");
            $("#contenedor-items").addClass("hide");
            $("#contenedor-edicionItems").addClass("hide");
            $("#contenedor-detalleApunte").addClass("hide");
            $("#contenedor-detalleSincAnpunte").addClass("hide");
            $("#barra-estado").addClass("hide");
            $("#pointer-menu").addClass("hide");

            funciones.generales.actAutomaticaTiempoTranscurrido();


            /****Eventos propios del dispositivo****/
            document.addEventListener("offline", funciones.generales.actualizarEstadoConexion, false);
            document.addEventListener("online", funciones.generales.actualizarEstadoConexion, false);
            document.addEventListener("backbutton", funciones.generales.regresar, false);
            document.addEventListener("menubutton", funciones.generales.salirAplicacion, false);

            /****Eventos del Login****/
            document.getElementById('txt-usuario').onkeyup = function () {
                funciones.generales.activarDesactivarBtnLogin();
            }
            document.getElementById('txt-clave').onkeyup = function () {
                funciones.generales.activarDesactivarBtnLogin();
            }
            document.getElementById('btn-login').addEventListener("touchstart", function () {
                if (document.getElementById('txt-clave').value != "" && document.getElementById('txt-usuario').value != "") {
                    document.getElementById('contenedo-datos-login').style.opacity = 0;
                    document.getElementById('loader-login').className = 'login_cargando';
                    funciones.usuario.guardarUsuario();
                    $('#txt-clave').blur();
                    if (LBR.conectado) {
                        //   LBR.usuario.autenticarUsuarioOffline();
                        LBR.usuario.autentificarUsuario();
                    }
                    else {
                        // funciones.generales.ingresar();
                        //LBR.usuario.autentificarUsuario();
                        LBR.usuario.autenticarUsuarioOffline();
                    }
                }
                else {
                    alert("Escriba su usuario y contraseña", "");
                }
            }, false);

            /****Eventos del contenedor Inicio****/
            document.getElementById('contenedor-inicio').onclick = function () {
                document.querySelector('#equipos-encontrados').className = "hide";
                //document.querySelector('#equipo-buscar').value = "";
            }
            document.getElementById('contenedor-salir').addEventListener("touchstart", function (e) {

                confirm("Esta seguro que desea cerrar la sesión?", "", function (btnIndex) {
                    if (btnIndex == 1) {
                        LBR.usuario.borrarUsuario();
                        funciones.tarea.borrarDatosTarea();

                        if ($("#contenedor-inicio").is(":visible")) {

                            funciones.generales.cerrarSesion("contenedor-inicio");
                        }
                        else if ($("#contenedor-resumen").is(":visible")) {

                            funciones.generales.cerrarSesion("contenedor-resumen");
                        }
                        else if ($("#contenedor-tarea").is(":visible")) {
                            funciones.generales.cerrarSesion("contenedor-tarea");
                        }
                        else if ($("#contenedor-items").is(":visible")) {
                            funciones.generales.cerrarSesion("contenedor-items");
                        }
                        else if ($("#contenedor-edicionItems").is(":visible")) {
                            funciones.generales.cerrarSesion("contenedor-edicionItems");
                        }
                        else if ($("#contenedor-detalleApunte").is(":visible")) {
                            funciones.generales.cerrarSesion("contenedor-detalleApunte");
                        }
                        $("#menu-opciones").addClass("hide");
                        $("#barra-estado").removeClass();
                        $("#barra-estado").addClass("hide");
                        $("#pointer-menu").addClass("hide");
                        $("#contenedor-salir").removeClass().addClass("contenedor-salir");
                        contenedorActual = "";
                    }
                });
                //confirm("Desea cerrar totalmente la aplicacion", "", function (btnIndex) {
                //    if(btnIndex==1)
                //    {
                //        navigator.app.exitApp();
                //    }                    
                //});

                e.stopPropagation();

            }, false);
            document.getElementById('menu-opciones').addEventListener("touchstart", function (e) {

                if ($("#barra-estado").is(":visible")) {

                    $("#pointer-menu").addClass("hide");
                    $("#barra-estado").removeClass().addClass("hide");
                    $("#menu-opciones").removeClass().addClass("icono-menu-opciones-inactive");
                    $("#contenedor-salir").removeClass().addClass("contenedor-salir");
                }
                else {
                    $("#menu-opciones").removeClass().addClass("icono-menu-opciones");
                    $("#barra-estado").removeClass().addClass("barra-estado-menu");
                    $("#contenedor-salir").removeClass().addClass("contenedor-salir-menu");
                    $("#pointer-menu").removeClass();
                }
                e.stopPropagation();
            }, false);
            document.getElementById('contenedor-usuario').addEventListener("touchstart", function (e) {
                if ($("#contenedor-inicio").is(":visible")) {
                    contenedorActual = "contenedor-inicio";
                    funciones.apunte.irDetalleSincApunte("contenedor-inicio");
                }
                else if ($("#contenedor-resumen").is(":visible")) {
                    contenedorActual = "contenedor-resumen";
                    funciones.apunte.irDetalleSincApunte("contenedor-resumen");
                }
                else if ($("#contenedor-tarea").is(":visible")) {
                    contenedorActual = "contenedor-tarea";
                    funciones.apunte.irDetalleSincApunte("contenedor-tarea");
                }
                else if ($("#contenedor-items").is(":visible")) {
                    contenedorActual = "contenedor-items";
                    funciones.apunte.irDetalleSincApunte("contenedor-items");
                }
                else if ($("#contenedor-edicionItems").is(":visible")) {
                    contenedorActual = "contenedor-edicionItems";
                    funciones.apunte.irDetalleSincApunte("contenedor-edicionItems");
                }
                else if ($("#contenedor-detalleApunte").is(":visible")) {
                    contenedorActual = "contenedor-detalleApunte";
                    funciones.apunte.irDetalleSincApunte("contenedor-detalleApunte");
                }

                if (funciones.evt_sincronizacion == null && LBR.conectado) {
                    document.getElementById("guardarSinc-apunte").className = "boton-guardar";
                }
                else {
                    document.getElementById("guardarSinc-apunte").className = "boton-guardar-inactive";
                }
                e.stopPropagation();
                e.preventDefault();
            }, false);
            document.getElementById('equipo-buscar').onkeyup = funciones.equipo.buscarEquipo;
            document.getElementById('equipo-buscar').onclick = function (e) { e.stopPropagation(); }
            document.getElementById('equipo-buscar').onfocus = function () {
                var equipo = document.querySelector('#equipo-buscar');
                if (equipo.value.length > 1) {
                    document.querySelector('#equipos-encontrados').className = "";
                }
            }
            document.getElementById('sincronizar-maestro').addEventListener("touchstart", funciones.generales.eventoSincronizar, false);
            // Evento para actualizar la app
            document.getElementById('actualizar-app').addEventListener("touchstart", funciones.actualizarApp, false);
            // Evento para cambiar a la pantalla Listado de OT
            document.getElementById('contenedor-ot').addEventListener("touchstart", funciones.verListadoOT, false);
            // Evento para actualizar los maestros
            document.getElementById('contenedor-conexion').addEventListener("touchstart", funciones.generales.eventoSincronizar, false);/* function () {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, funciones.generales.archivo.removeFile, funciones.generales.archivo.fail);
            }//funciones.generales.eventoSincronizar;*/

            //Eventos para mostrar ID del dispositivo
            document.getElementById('encabezado').addEventListener("touchstart", funciones.mostrarIDDispositivo, false);
            document.getElementById('logo').addEventListener("touchstart", funciones.mostrarIDDispositivo, false);
           
            document.getElementById('logo').addEventListener("touchstart", function () {
                if (clickTimer == null) {
                    clickTimer = setTimeout(function () {
                        clickTimer = null;
                        //navigator.geolocation.getCurrentPosition(funciones.generales.onSuccessLocation, funciones.generales.onErrorLocation, { maximumAge: 3000, timeout: 8000, enableHighAccuracy: true});
                    }, 500)
                } else {

                    cordova.getAppVersion.getVersionNumber().then(function (version) {

                        var descripcion_app = "ID de dispositivo: \t" + device.uuid + "\n";
                        descripcion_app = descripcion_app + "Versión de la app: " + version + "\n";
                        clearTimeout(clickTimer);
                        clickTimer = null;
                        console.log(descripcion_app);
                        alert(descripcion_app, "");
                    });


                }
            }, false);

            /****Eventos Contenedor OT ****/

            $("#lista-ot").delegate("button[data-codigo-ot]", "touchstart", function () {

                // Pone Bloqueo
                document.getElementById("block-screen").className = "";
                document.getElementById("contenedor-general").className = "blur-fondo";
                document.getElementById("titulo-barra-progreso").innerText = "Actualizando Orden de Trabajo...";


                var codigo_ot = $(this).attr("data-codigo-ot"); //"OT809782"; 

                var dispositivo = device.uuid;
                var usuario = LBR.user.nombre;
                var password = encodeURIComponent(LBR.user.clave);
                var ParametrosxServicio = "&user=" + usuario + "&password=" + password + "&dispositivo=" + dispositivo + "&OT=" + codigo_ot;
                var cerrar_ot_llamado = $.ajax({
                    type: 'GET',
                    timeout: TIMEOUT_CONSULTAS,
                    url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento/CerrarOT?cmp=1',
                    data: ParametrosxServicio,
                    dataType: 'json'
                });

                cerrar_ot_llamado.done(function (Respuesta) {

                    if (Respuesta.Exito == true) {
                        alert(Respuesta.Resultado);
                    } else {
                        alert(Respuesta.MensajeError);
                    }

                    var FechaInicio = $("#filtro-ot-fecha").val().split("-")[0] + "-" + $("#filtro-ot-fecha").val().split("-")[1] + "-" + "01";
                    var FechaFin = $("#filtro-ot-fecha").val();
                    funciones.descargarApuntesxEstado(FechaInicio, FechaFin);

                    // Quita Bloqueo
                    document.getElementById("contenedor-general").className = "contenedor-listado-ot";
                    document.getElementById("block-screen").className = 'hide';

                });

                cerrar_ot_llamado.fail(function (error) {
                    alert("Error de red, favor intente otra vez ");
                    // Quita Bloqueo
                    document.getElementById("contenedor-general").className = "contenedor-listado-ot";
                    document.getElementById("block-screen").className = 'hide';

                });

            });



            $("#filtro-ot-fecha").change(function () {

                funciones.mostrarTablaApuntesxEstado("No hay datos de apuntes bajados para esta fecha");

            });

            $("#ul-ot li").on("touchstart", function (e) {
                //document.getElementById("select-ot").innerText = this.innerText;
                $("#select-ot").html(this.innerText);
                $("#ul-ot").scrollTop(0);
                $("#ul-ot").addClass("hide"); console.log("*"+this.innerText+"*");
                funciones.mostrarTablaApuntesxEstado("No hay datos para " + this.innerText + " en esta fecha");
                e.stopPropagation();
            });

            document.getElementById('select-ot').addEventListener("touchstart", function (e) {
                if ($("#ul-ot li").length > 1) {

                    if ($(this).css('background-image').indexOf("ICN_arrow_up") > 0) {
                        $(this).removeClass().addClass("estado-ot-desplegada"); 
                    }
                    else {
                        $(this).removeClass().addClass("estado-ot-plegada");
                    }

                    if ($("#ul-ot").is(":visible")) {
                        $("#ul-ot").addClass("hide");
                    }
                    else {
                        $("#ul-ot").removeClass();
                    }
                    e.stopPropagation();
                    e.preventDefault();
                }

            }, false);
            $("#lista-ot>table").delegate("tbody>tr>td:first-child", "touchstart", function () {
                var fila_id = $(event.target).parent()[0].id;
                $("[data-padre='" + fila_id + "']").toggleClass("hide");
            });
            document.getElementById('cancelar-listado-ot').addEventListener("touchstart", function () {
                $("#" + contenedorActual).addClass("hide");
                funciones.generales.irInicio();
            }, false);
            document.getElementById('guardar-ot').addEventListener("touchstart", function () {
                    
                var FechaInicio = $("#filtro-ot-fecha").val().split("-")[0] + "-" + $("#filtro-ot-fecha").val().split("-")[1] + "-" + "01";
                var FechaFin = $("#filtro-ot-fecha").val();
                funciones.descargarApuntesxEstado(FechaInicio, FechaFin);

            }, false);

            /****Eventos del contenedor Resumen****/
            $(".contenedor_tab_udm").on("touchstart", "span", function () {
                $(".contenedor_tab_udm > span").removeClass("tab_udm_activo");
                $(this).addClass("tab_udm_activo");
                funciones.generales.calcularCambioAceite();
            });
            document.getElementById('select-nodriza').addEventListener("touchstart", function (e) {
                if ($("#nodriza li").length > 1) {
                    if ($(this).css('background-image').indexOf("ICN_arrow_up") > 0) {
                        // $(this).css('background-image', 'url(images/ICN_arrow_down.svg)');
                        $(this).removeClass().addClass("nodriza-desplegada");
                    }
                    else {
                        //$(this).css('background-image', 'url(images/ICN_arrow_up.svg)');
                        $(this).removeClass().addClass("nodriza-plegada");
                    }

                    if ($("#nodriza").is(":visible")) {
                        $("#nodriza").addClass("hide");
                    }
                    else {
                        $("#nodriza").removeClass();
                    }
                    //$("#nodriza").slideToggle("slow");
                    funciones.generales.activarDesactivarBtnResumen();
                    e.stopPropagation();
                    e.preventDefault();
                }

            }, false);
            //document.getElementById('km-recorrido').onkeyup = function () {              
            //    funciones.generales.calcularCambioAceite();              
            //    funciones.generales.activarDesactivarBtnResumen();
            //}

            document.getElementById('km-recorrido').onchange = function () {
                funciones.generales.calcularCambioAceite();
                funciones.generales.activarDesactivarBtnResumen();
            }

            $('#km-recorrido').on("blur", function () {

                if ($("#km-recorrido").val() == "") {
                    $("#km-recorrido").val(0);
                }
                funciones.generales.calcularCambioAceite();
            });

            document.getElementById('contenedor-resumen').onclick = function () {
                //$("#nodriza").slideUp();
                $("#nodriza").addClass("hide");
            }
            document.getElementById('guardarResumen').addEventListener("touchstart", function (e) {
                var nodriza = document.getElementById('select-nodriza').innerText;
                var km = 0;
                var horometro = 0;
                if ($("#tabHorometro").hasClass("tab_udm_activo")) {
                    horometro = document.getElementById('km-recorrido').value;
                }
                else {
                    km = document.getElementById('km-recorrido').value;
                }
                if (nodriza != "" && (km != "" || horometro != "")) {
                    if (parseFloat($("#km-recorrido").val()) < parseFloat($("#km-anterior").val())) {
                        confirm("Ha introducido un valor de Kilometros/Horas inferior al mantenimiento anterior, desea continuar?", "", function (btnIndex) {
                            if (btnIndex == 1) {
                                var li_equipos = document.getElementById('equipos-encontrados').getElementsByTagName('li');


                                document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = LBR.eq_id + "-" + funciones.equipo_seleccionado;

                                document.getElementById('contenedor-datos').innerHTML = '<div><p>' + document.getElementById('km-recorrido').value + ' Km Recorridos </p>'
                                                                                         + '<p>' + document.getElementById('observaciones').value + '</p></div>';
                                //document.getElementById('contenedor-resumen').className = 'hide';
                                //document.getElementById('contenedor-tarea').className = 'pagina';
                                $("#contenedor-resumen").addClass("hide");
                                $("#contenedor-tarea").removeClass();
                                contenedorActual = "contenedor-tarea";
                            }
                        });
                    }
                    else {
                        var li_equipos = document.getElementById('equipos-encontrados').getElementsByTagName('li');


                        document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = LBR.eq_id + "-" + funciones.equipo_seleccionado;

                        document.getElementById('contenedor-datos').innerHTML = '<div><p>' + document.getElementById('km-recorrido').value + ' Km Recorridos </p>'
                                                                                 + '<p>' + document.getElementById('observaciones').value + '</p></div>';
                        //document.getElementById('contenedor-resumen').className = 'hide';
                        //document.getElementById('contenedor-tarea').className = 'pagina';
                        $("#contenedor-resumen").addClass("hide");
                        $("#contenedor-tarea").removeClass();
                        contenedorActual = "contenedor-tarea";
                    }
                }
                else {
                    alert("Por favor ingrese la nodriza y la cantidad de kilómetros", "");
                }
                e.stopPropagation();
                e.preventDefault();
            }, false);
            document.getElementById('cancelar-resumen').addEventListener("touchstart", function () {
                $("#contenedor-resumen").addClass("hide");
                if (contenedorActual == "contenedor-tarea") {
                    $("#" + contenedorActual).removeClass();
                }
                else {
                    funciones.tarea.borrarDatosTarea();
                    funciones.generales.irInicio();
                }

            }, false);

            /****Eventos Contenedor Tareas****/
            document.getElementById('buscador-tareas').onkeyup = function () {
                funciones.tarea.cargarTareas();
            };
            //Evento para cerrar los POPUP de la pantalla Tareas
            document.getElementById('contenedor-tarea').onclick = function () {
                if (document.getElementById('tareas-agregadas').getElementsByTagName('li').length > 0) {
                    var li = document.getElementById('tareas-agregadas').getElementsByTagName('li');
                    funciones.tarea.ocultarBtnEliminarTarea();
                    for (var i = 0; i < li.length; i++) {
                        li[i].setAttribute("data-state", "false");
                    }
                }
            };
            document.getElementById('contenedor-datos').onclick = function () {
                $("#contenedor-tarea").addClass("hide");
                $("#contenedor-resumen").removeClass();
                contenedorActual = "contenedor-tarea";
                //document.getElementById('contenedor-tarea').className = "hide";
                //document.getElementById('contenedor-resumen').className = "";
            }
            document.getElementById('revisarApunte').addEventListener("touchstart", function (e) {
                funciones.apunte.irDetalleApunte();
                e.stopPropagation();
                e.preventDefault();
            }, false);
            document.getElementById('cancelar-tarea').addEventListener("touchstart", function () {
                if (funciones.lista_tareas.length > 0) {
                    confirm("Esta seguro que desea cancelar?, se perderá toda la información ingresada", "", function (btnIndex) {
                        console.log("Bt:" + btnIndex);
                        if (btnIndex == 1) {
                            funciones.tarea.borrarDatosTarea();
                            $("#contenedor-tarea").addClass("hide");
                            funciones.generales.irInicio();
                        }

                    });
                }
                else {
                    funciones.tarea.borrarDatosTarea();
                    $("#contenedor-tarea").addClass("hide");
                    funciones.generales.irInicio();
                }
            }, false);
            //Evento desplegar u ocultar contenedor tareas
            document.getElementById('btn-ocultar-tareas').addEventListener("touchstart", function () {
                if ($(this).css('background-image').indexOf("ICN_arrow_up") > 0) {
                    $("#menu-tareas").slideUp("slow");
                    $("#msg-tareas").slideUp("slow");
                    $('#contenedor-tareas-agregadas').css('max-height', '56vh');
                    $(this).removeClass("btn-ocultar-tareas").addClass('btn-mostrar-tareas');
                }
                else {
                    $(this).removeClass("btn-mostrar-tareas").addClass('btn-ocultar-tareas');
                    $('#contenedor-tareas-agregadas').css('max-height', '18vh');
                    $("#menu-tareas").slideDown("slow");
                    $("#msg-tareas").slideDown("slow");
                }
            }, false);
            document.getElementById('bt-eliminar-tarea').addEventListener("touchstart", funciones.tarea.eliminarTarea, false);

            /****Eventos Contenedor Items****/
            //Eventos de los buscadores            
            document.getElementById('items-buscar').onkeyup = funciones.item.buscarArticulo;
            document.getElementById('items-buscar').onclick = function (e) { e.stopPropagation(); }
            document.getElementById('items-buscar').onfocus = function () {
                var item = document.querySelector('#items-buscar');
                if (item.value.length > 1) {
                    document.getElementById('items-encontrados').className = '';
                }
            }
            //Evento para cerrar los POPUP de la pantalla Items
            document.getElementById('contenedor-items').onclick = function () {
                funciones.item.ocultarMenuItems();
            };
            //Evento botón agregar items a Tarea
            document.getElementById('agregar-ItemsTarea').addEventListener("touchstart", function (evt) {
                var items_agregados = document.getElementById('items-agregados').getElementsByTagName('li');
                if (items_agregados.length > 0) {
                    funciones.tarea.agregarTarea(evt);
                }
                else {
                    confirm("Esta seguro de agregar esta tarea sin items?", "", function (btnIndex) {
                        if (btnIndex == 1) {
                            funciones.tarea.agregarTarea(evt);
                        }

                    })
                }
                evt.stopPropagation();
                evt.preventDefault();
            }, false);
            document.getElementById('cancelar-items').addEventListener("touchstart", funciones.tarea.regresarTarea, false);
            document.getElementById('bt-eliminar-item').addEventListener("touchstart", funciones.item.eliminarItems, false);

            /****Eventos Contenedor Editar Items****/
            document.getElementById('cancelar-edicion').addEventListener("touchstart", function () {
                $("#contenedor-edicionItems").addClass("hide");
                $("#contenedor-tarea").removeClass();
                for (var i = 0; i < funciones.tareas.length; i++) {
                    if (funciones.tareas[i].estado == 'Edit') {
                        funciones.tareas[i].estado = '';
                    }
                }
                //document.getElementById("contenedor-edicionItems").className = "hide";
                //document.getElementById("contenedor-tarea").className = "";
            }, false);
            document.getElementById('editar-items').addEventListener("touchstart", function (e) {
                funciones.item.editarItems();
                e.stopPropagation();
                e.preventDefault();
            }, false);

            /****Eventos Contenedor Detalle Apunte ****/
            document.getElementById('cancelar-apunte').addEventListener("touchstart", function (e) {
                funciones.lista_apunte.splice(0, funciones.lista_apunte.length);
                document.getElementById('lista-tareas').innerHTML = "";
                $("#contenedor-detalleApunte").addClass("hide");
                $("#contenedor-tarea").removeClass();
                contenedorActual = "contenedor-tarea";
                e.stopPropagation();
                e.preventDefault();
            }, false);
            document.getElementById('guardar-apunte').addEventListener("touchstart", function (e) {
                //navigator.geolocation.getCurrentPosition(funciones.generales.onSuccessLocation, funciones.generales.onErrorLocation, { maximumAge: 3000, timeout: 8000, enableHighAccuracy: true });
                funciones.apunte.guardarApunte();
                e.stopPropagation();
                e.preventDefault();
            }, false);

            /****Eventos Contenedor Detalle Sincronizar Apunte****/
            document.getElementById('cancelarSinc-apunte').addEventListener("touchstart", function (e) {
                funciones.lista_apunte.splice(0, funciones.lista_apunte.length);
                document.getElementById('lista-apuntes').innerHTML = "";
                $("#contenedor-detalleSincAnpunte").addClass("hide");
                $("#guardar-apunte").text("Confirmar y Guardar");
                if (contenedorActual == "contenedor-inicio") {
                    $("#barra-estado").removeClass();
                }
                $("#" + contenedorActual).removeClass();
                e.stopPropagation();
                e.preventDefault();
            }, false);
            document.getElementById('guardarSinc-apunte').addEventListener("touchstart", function (e) {

                if (this.className == "boton-guardar") {
                    document.getElementById('lista-apuntes').innerHTML = "";
                    funciones.lista_apunte.splice(0, funciones.lista_apunte.length);
                    if (LBR.user.auth) {
                        LBR.generales.sincronizarBBDD();
                        funciones.lista_apunte.splice(0, funciones.lista_apunte.length);
                        $("#contenedor-detalleSincAnpunte").addClass("hide");
                        $("#guardar-apunte").text("Confirmar y Guardar");
                        if (contenedorActual == "contenedor-inicio") {
                            $("#barra-estado").removeClass();
                        }
                        $("#" + contenedorActual).removeClass();
                    }
                    else {
                        console.log("Usuario no autenticado");
                        LBR.usuario.autentificarUsuario();
                        funciones.generales.actualizarTareasPendientes();
                    }
                    e.stopPropagation();
                    e.preventDefault();
                }

            }, false);

        },
        calcularCambioAceite: function () {
            var dif = parseFloat($("#km-recorrido").val()) - parseFloat($("#km-anterior").val());
            $("#km-diferencia").val(dif);
            var udm = "";
            if ($("#tabHorometro").hasClass("tab_udm_activo")) {
                udm = "horas";
            }
            else {
                udm = "kilometros";
            }
            if (funciones.equipo.cambioAceite == 0) {
                $("#msjCambioAceite").removeClass().addClass("msj_cambio_aceite no_definido");
                $("#msjCambioAceite").html("* Este equipo no tiene definido rango para cambio de aceite");
            }
            else if (parseFloat(funciones.equipo.cambioAceite) - dif >= 0) {
                $("#msjCambioAceite").removeClass().addClass("msj_cambio_aceite");
                $("#msjCambioAceite").html("* Faltan " + Math.abs(parseFloat(funciones.equipo.cambioAceite) - dif) + " " + udm + " para el siguiente cambio");
                //$("#msjCambioAceite").html("* Faltan " + Math.abs(parseFloat(funciones.equipo.cambioAceite) - dif) + " " + udm + " para realizar el próximo cambio de aceite");
            }
            else if (parseFloat(funciones.equipo.cambioAceite) - dif < 0) {
                $("#msjCambioAceite").removeClass().addClass("msj_cambio_aceite realizar");
                //$("#msjCambioAceite").html("* Realice el cambio de aceite, esta pasado en " + Math.abs((parseFloat(funciones.equipo.cambioAceite) - dif)) + " " + udm);
                $("#msjCambioAceite").html("* Debe haberse realizado cambio de aceite hace " + Math.abs((parseFloat(funciones.equipo.cambioAceite) - dif)) + " " + udm);

            }
        },
        activarDesactivarBtnLogin: function () {
            var txtpass = document.getElementById('txt-clave').value;
            var txtuser = document.getElementById('txt-usuario').value;

            if (txtpass == "" && txtuser == "") {
                document.getElementById('btn-login').className = "btn-aceptar-inactive";
            }
            else {
                document.getElementById('btn-login').className = "btn-aceptar";
            }
        },
        activarDesactivarBtnResumen: function () {
            var nodriza = document.getElementById("select-nodriza").innerText;
            var km_recorrido = document.getElementById("km-recorrido").value;
            if (nodriza == "" && km_recorrido == "") {
                document.getElementById('guardarResumen').className = "boton-guardar-inactive";
            }
            else {
                document.getElementById('guardarResumen').className = "boton-guardar";
            }
        },
        activarDesactivarBtnSincronizar: function (estado) {
            if (estado == "inactivo") {
                $("#sincronizar-maestro").removeClass("sincronizar-maestro");
                $("#sincronizar-maestro").addClass("sincronizar-maestro-inactivo");
                document.getElementById('img-sincronizar').src = "images/ICN_sincronizar_inactivo.svg";
            }
            else if (estado == "activo") {
                $("#sincronizar-maestro").removeClass("sincronizar-maestro-inactivo");
                $("#sincronizar-maestro").addClass("sincronizar-maestro");
                document.getElementById('img-sincronizar').src = "images/ICN_sincronizar_activo.svg";
                document.querySelector('#sincronizar-maestro section div h1').innerText = "Sincronizar Datos";
            }
            //else if (estado == "sincronizando") {
            //    document.getElementById('sincronizar-maestro').className = "sincronizar-maestro-inactivo";
            //    document.getElementById('img-sincronizar').src = "images/ICN_sincronizar_inactivo.svg";
            //    document.querySelector('#sincronizar-maestro section div h1').innerText = "Sincronizando...";
            //}
        },
        activarDesactivarBtnUpdateApp: function (estado) {

            

            if (estado == "inactivo") {

                $("#actualizar-app").removeClass("actualizar-app");
                $("#actualizar-app").addClass("actualizar-app-inactivo");
                document.getElementById('img-actualizar-app').src = "images/ICN_sincronizar_inactivo.svg";
            }
            else if (estado == "activo") {

                $("#actualizar-app").removeClass("actualizar-app-inactivo");
                $("#actualizar-app").addClass("actualizar-app");
                document.getElementById('img-actualizar-app').src = "images/ICN_sincronizar_activo.svg";
            }

        },
        actualizarTiempoTranscurrido: function () {
            var peticion = LBR.data.bd.transaction(['Sincronizacion']).objectStore('Sincronizacion').openCursor();
            peticion.onsuccess = function (e) {
                var data = e.target.result;
                if (data) {
                    var fecha = (new Date().getMonth() + 1) + '-' + new Date().getDate() + '-' + new Date().getFullYear() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
                    var tiempo = funciones.generales.tiempoTranscurrido(data.value.tiempo, fecha);
                    document.querySelector('#contenedor-conexion section p').innerText = "hace " + tiempo;
                }
                else {
                    document.querySelector('#contenedor-conexion section p').innerText = "No hay sincronizaciones";
                }
            }

        },
        actualizarEstadoConexion: function () {
            var red = navigator.connection.type;
            //var red = Windows.Networking.Connectivity.NetworkInformation,
            //    internet = red.getInternetConnectionProfile();
            var states = {};
            states[Connection.UNKNOWN] = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI] = 'WiFi connection';
            states[Connection.CELL_2G] = 'Cell 2G connection';
            states[Connection.CELL_3G] = 'Cell 3G connection';
            states[Connection.CELL_4G] = 'Cell 4G connection';
            states[Connection.CELL] = 'Cell generic connection';
            states[Connection.NONE] = 'No network connection';
            //alert("Conexion" + states[red],"");        
            if (states[red] === 'No network connection') {
                document.querySelector('#contenedor-conexion section h1').innerText = 'Sin Conexión';
                document.querySelector('#contenedor-conexion section h1').className = '';
                funciones.generales.activarDesactivarBtnSincronizar("inactivo");
                funciones.generales.activarDesactivarBtnUpdateApp("inactivo");
                LBR.conectado = false;

                //setear LBR.user.nombre con el user que auth este true en bd local...
                //Busca usuario autenticado.
                //var store = LBR.data.bd.transaction(['Usuarios'], 'readwrite').objectStore('Usuarios');
                //var index = store.index("Estado");
                //index.get(true).onsuccess = function (event) {
                //    console.log("Encontrado user");
                //    var objeto = event.target.result;
                //    LBR.user.nombre = objeto.nombre;
                //    LBR.user.clave = objeto.clave;
                //    LBR.user.auth = true;
                //    LBR.usuario.autenticarUsuarioOffline();
                //};  
            } else {
                document.querySelector('#contenedor-conexion section h1').innerText = 'Conectado';
                document.querySelector('#contenedor-conexion section h1').className = 'conectado';
                funciones.generales.activarDesactivarBtnSincronizar("activo");
                funciones.generales.activarDesactivarBtnUpdateApp("activo");
                LBR.conectado = true;
                var peticion = LBR.data.bd.transaction(['Usuarios']).objectStore('Usuarios').openCursor();
                peticion.onsuccess = function (e) {
                    var data = e.target.result;
                    if (data) {
                        LBR.user.nombre = data.value.nombre;
                        LBR.user.clave = data.value.clave;
                        LBR.user.auth = data.value.auth;
                        console.log("Usuario:" + LBR.user.nombre + "Auth:" + LBR.user.auth);
                        if (LBR.user.nombre != "" && LBR.user.auth == true) {  // if (LBR.user.nombre != "" && LBR.user.auth == false) {
                            //   LBR.user.auth = LBR.usuario.autentificarUsuario();
                        }
                        //if (LBR.user.nombre != "" && LBR.user.auth == false) {
                        //    $("#contenedor-login").removeClass();
                        //    $("#contenedor-general").addClass("hide");
                        //}
                    }
                }
            }

        },
        actualizarTareasPendientes: function () {

            //var pet = LBR.data.bd.transaction(['Nuevos'], 'readwrite').objectStore('Nuevos').clear()
            //pet.onerror = function () {
            //    console.log("Error al borrar los datos");
            //}
            var peticion = LBR.data.bd.transaction(['Nuevos'], 'readonly').objectStore('Nuevos').openCursor();
            LBR.data.indice_resultados = 0;
            var numTareas = 0;
            peticion.onsuccess = function (e) {
                var data = e.target.result;
                if (data) {
                    data.continue();
                    numTareas += data.value.tareas.length;
                }
                else {
                    var msg = "";
                    if (numTareas == 0) {
                        msg = ' por sincronizar';
                    }
                    else if (numTareas > 0 && numTareas < 2) {
                        msg = ' por sincronizar';
                    }
                    else {
                        msg = ' por sincronizar';
                    }
                    funciones.cantidadTareasSinc = numTareas;
                    document.querySelector('#contenedor-usuario section p').innerText = numTareas + msg;
                }

            }
            peticion.onerror = function (e) {
                console.log("Error2:" + e);
            }
        },
        irInicio: function () {
            document.getElementById('encabezado').getElementsByTagName('p')[0].innerText = 'Aplicación de Mantenimiento';
            document.getElementById('equipos-encontrados').innerHTML = '';
            document.getElementById('equipo-buscar').value = '';
            document.getElementById('km-recorrido').value = '';
            //  document.getElementById('select-nodriza').innerText = '';
            document.getElementById('observaciones').value = '';
            document.getElementById('km-diferencia').value = '';

            $("#menu-opciones").addClass("hide");
            $("#barra-estado").removeClass();
            $("#barra-estado").removeClass();
            $("#contenedor-salir").removeClass().addClass("contenedor-salir");
            $("#contenedor-inicio").removeClass();

            // Visualizamos el nombre del módulo en el toolbar superior
            funciones.visualizarModuloUI();

            contenedorActual = "contenedor-inicio";
            funciones.generales.actualizarTareasPendientes();
        },
        ingresar: function () {
            if (contenedorActual != "") {
                $("#contenedor-login").addClass("hide");
                document.getElementById('contenedo-datos-login').style.opacity = 1;
                document.getElementById('loader-login').className = 'hide';
                if (contenedorActual == "contenedor-inicio") {
                    $("#barra-estado").removeClass();
                    $('#contenedor-detalleSincAnpunte').addClass('hide');
                }
                $("#" + contenedorActual).removeClass();
            }
            else {
                $("#contenedor-login").addClass("hide");
                $("#barra-estado").removeClass();
                $("#contenedor-general").removeClass();
                contenedorActual = "contenedor-inicio";
                document.getElementById('contenedo-datos-login').style.opacity = 1;
                document.getElementById('loader-login').className = 'hide';
            }
            $("#encabezado").removeClass("hide");
        },
        irLogin: function (contenedorActual) {
            $("#" + contenedorActual).addClass("hide");
            contenedorActual = "";
            document.getElementById('contenedo-datos-login').style.opacity = 1;
            document.getElementById('loader-login').className = 'hide';
            $("#barra-estado").addClass("hide");
            $("#encabezado").addClass("hide");
            $("#contenedor-login").removeClass();

        },
        cerrarSesion: function (contenedor) {
            $("#contenedor-login").removeClass();
            $("#" + contenedor).addClass("hide");
            $("#contenedor-general").addClass("hide");
            funciones.generales.irInicio();
            //document.getElementById('contenedor-login').className = "";
            //document.getElementById('contenedor-general').className = "hide";
        },
        sincronizacionAutomatica: function () {
            // alert("Inicio de Conteo", "");
            //console.log(seg);
            seg = seg + 1;
            funciones.evt_sincronizacion = setTimeout("funciones.generales.sincronizacionAutomatica()", 1000);
            if (seg > 30) {
                funciones.generales.actualizarEstadoConexion();
                if (LBR.conectado) {
                    console.log("Conectado");
                    clearTimeout(funciones.evt_sincronizacion);
                    LBR.generales.sincronizarBBDD();
                    funciones.evt_sincronizacion = null;
                }
                else {
                    console.log("Desconectado");
                }

            }
        },
        actAutomaticaTiempoTranscurrido: function () {
            segtranscurridos++;
            setTimeout("funciones.generales.actAutomaticaTiempoTranscurrido()", 1000);
            if (segtranscurridos > 59) {
                funciones.generales.actualizarTiempoTranscurrido();
                segtranscurridos = 0;
                console.log("Tiempo Actualizado");
            }
        },
        regresar: function (evt) {
            if ($("#contenedor-login").is(":visible")) {
                confirm("Desea cerrar la aplicacion?", "", function (btnIndex) {
                    if (btnIndex == 1) {
                        navigator.app.exitApp();
                    }
                });
            }
            if ($("#contenedor-resumen").is(":visible")) {
                $("#cancelar-resumen").trigger("click");
            }
            else if ($("#contenedor-tarea").is(":visible")) {
                $("#cancelar-tarea").trigger("click");
            }
            else if ($("#contenedor-items").is(":visible")) {
                $("#cancelar-items").trigger("click");
            }
            else if ($("#contenedor-edicionItems").is(":visible")) {
                $("#cancelar-edicion").trigger("click");
            }
            else if ($("#contenedor-detalleApunte").is(":visible")) {
                $("#cancelar-apunte").trigger("click");
            }
            else {
                evt.preventDefault();
            }
        },
        ocultarMostrarBloqueoPantalla: function (tipo) {
            console.log("Bloqueo Pantalla");
            if (document.getElementById("block-screen").className != "") {
                console.log("if");
                document.getElementById("block-screen").className = "";
                document.getElementById("contenedor-general").className = "blur-fondo";
                document.getElementById("titulo-barra-progreso").innerText = "Sincronizando..."
                if (tipo == "barra") {
                    console.log("if");
                    document.getElementById("contenedor-barra-progreso").className = "";
                }
                else if (tipo == "autenticar") {
                    console.log("else if");
                    document.getElementById("titulo-barra-progreso").innerText = "Autenticando...";
                }
            }
            else {
                console.log("else");
                document.getElementById("contenedor-general").className = ""
                document.getElementById("block-screen").className = 'hide';
                document.getElementById("contenedor-barra-progreso").className = "hide";
                $("#progreso").css("width", "0%");
                $("#progreso").css("background-color", "#94c948");
                $("#porcentaje").text("0%");
            }
        },
        eventListener: function (position, gestureHandler, control) {
            var divEliminar = "";
            var divPointer = "";
            var index = "";
            if (control.parentNode.getAttribute('id') == "items-agregados") {
                divEliminar = document.getElementById("bt-eliminar-item");
                divPointer = document.getElementById("pointer");
                index = funciones.lista_items.indexOf('<li data-state="' + control.getAttribute("data-state") + '">' + control.innerHTML + '</li>');
            }
            else {
                divEliminar = document.getElementById("bt-eliminar-tarea");
                divPointer = document.getElementById("pointer-tarea");
                index = funciones.lista_tareas.indexOf('<li data-state="' + control.getAttribute("data-state") + '">' + control.innerHTML + '</li>');
            }
            divEliminar.className = '';
            divPointer.className = '';
            divEliminar.setAttribute("data-index", index);
            divEliminar.style.top = (position + parseInt(control.clientHeight)) + "px";
            divPointer.style.top = ((position + parseInt(control.clientHeight)) - parseInt(divPointer.offsetHeight)) + 1 + "px";
        },
        asignarColorTareas: function (id) {
            funciones.color_tareas.push(
                                            { id: "570", color: "#55b647" },
                                            { id: "571", color: "#f05847" },
                                            { id: "572", color: "#55b647" },
                                            { id: "574", color: "#76c56b" },
                                            { id: "576", color: "#00acec" },
                                            { id: "578", color: "#28c5ff" },
                                            { id: "580", color: "#f7b720" },
                                            { id: "583", color: "#f7c920" },
                                            { id: "573", color: "#55b647" },
                                            { id: "575", color: "#76c56b" },
                                            { id: "577", color: "#00acec" },
                                            { id: "579", color: "#28c5ff" },
                                            { id: "581", color: "#f7b720" },
                                            { id: "584", color: "#f7c920" },
                                            { id: "582", color: "#f26e5e" }
                                        );
            for (var i = 0; i < funciones.color_tareas.length; i++) {
                if (funciones.color_tareas[i].id.indexOf(id) >= 0) {
                    return funciones.color_tareas[i].color;
                }
            }
            return "#00000";
        },
        tiempoTranscurrido: function (fechaInicial, fechaFinal) {
            // asignar el valor de las unidades en milisegundos
            var msecPerMinute = 1000 * 60;
            var msecPerHour = msecPerMinute * 60;
            var msecPerDay = msecPerHour * 24;

            // asignar la fecha en milisegundos
            var date = new Date(fechaFinal);
            var dateMsec = date.getTime();

            var date2 = new Date(fechaInicial);
            var dateMsec2 = date2.getTime();

            // Obtener la diferencia en milisegundos
            var interval = dateMsec - dateMsec2;

            // Calcular cuentos días contiene el intervalo. Substraer cuantos días
            //tiene el intervalo para determinar el sobrante
            var days = Math.floor(interval / msecPerDay);
            interval = interval - (days * msecPerDay);

            // Calcular las horas , minutos y segundos
            var hours = Math.floor(interval / msecPerHour);
            interval = interval - (hours * msecPerHour);

            var minutes = Math.floor(interval / msecPerMinute);
            interval = interval - (minutes * msecPerMinute);

            var seconds = Math.floor(interval / 1000);

            var msg = "";
            if (days > 0) {
                msg = days + " días";
            }
            else if (hours > 0) {
                msg = hours + " horas";
            }
            else if (minutes > 0) {
                msg = minutes + " minutos";
            }
            else if (seconds > 0) {
                msg = seconds + " segundos";
            }
            else {
                msg = " pocos segundos";
            }
            // Mostrar el resultado.    
            return msg;
        },
        EncryptStringToAES: function (text_plain, key_str) {
            var key = CryptoJS.enc.Utf8.parse(key_str); //Llave publica compartida
            var iv = CryptoJS.enc.Utf8.parse('7061737323313233'); // Vector de inicializacion
            var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text_plain), key,
                {
                    keySize: 128 / 8, // Longitud de la llave de 128 bits
                    iv: iv, //vector de inicializacion
                    mode: CryptoJS.mode.CBC, //modo de cifrado
                    padding: CryptoJS.pad.Pkcs7
                });

            return encrypted.toString();
        },
        DecryptAESToString: function (text_plain, key_str) {
            var key = CryptoJS.enc.Utf8.parse(key_str); //Llave publica compartida
            var iv = CryptoJS.enc.Utf8.parse('7061737323313233'); // Vector de inicializacion
            var decrypted = CryptoJS.AES.decrypt(CryptoJS.enc.Utf8.parse(text_plain), key,
                {
                    keySize: 128 / 8, // Longitud de la llave de 128 bits
                    iv: iv, //vector de inicializacion
                    mode: CryptoJS.mode.CBC, //modo de cifrado
                    padding: CryptoJS.pad.Pkcs7
                });
            return decrypted.toString();
        },
        onSuccessLocation: function (posicion) {
            LBR.latitud_apunte = posicion.coords.latitude;
            LBR.longitud_apunte = posicion.coords.longitude;
            LBR.latitud_sincronizacion = posicion.coords.latitude;
            LBR.longitud_sincronizacion = posicion.coords.longitude;
            console.log("Coordenadas generadas");
        },
        onErrorLocation: function (error) {
            LBR.latitud_apunte = 0;
            LBR.longitud_apunte = 0;
            LBR.latitud_sincronizacion = 0;
            LBR.longitud_sincronizacion = 0;
        },
        salirAplicacion: function (e) {
            var event = e
            confirm("Esta seguro que desea salir de la aplicacción?, perderá la información que no ha sido guardada", "", function (indexBtn) {
                if (indexBtn == 2 || indexBtn == 1) {
                    event.preventDefault();
                }
            })
        },
        eventoSincronizar: function () {
            if (LBR.conectado) {
                confirm("Esta seguro que desea sincronizar los maestros?", "Advertencia", function (btnIndex) {
                    if (btnIndex == 1) {
                        LBR.generales.cargarMaestros();
                    }
                })
            }
            else {
                alert("El dispositivo no tiene conexion a Internet, no puede sincronizar en este momento", "Advertencia!!!");
            }
        },
        DiferenciaEntreFechas: function (fecIni, fecFin) {
            var one_day = 1000 * 60 * 60 * 24;
            arrayFechaIni = fecIni.split('-');
            arrayFechaFin = fecFin.split('-');

            var diaI = arrayFechaIni[2];
            var mesI = (arrayFechaIni[1]);
            var anoI = (arrayFechaIni[0]);

            var diaF = arrayFechaFin[2];
            var mesF = (arrayFechaFin[1]);
            var anoF = (arrayFechaFin[0]); //le restamos un año

            var fechaDateIni = new Date(anoI, mesI, diaI);
            var fechaDateFin = new Date(anoF, mesF, diaF);

            Diff = Math.ceil((fechaDateIni.getTime() - fechaDateFin.getTime()) / (one_day));
            return Diff
        },
        archivo: {
            gotFS: function (fileSystem) {
                var fecha = new Date();
                var nombreArchivo = "Backup" + fecha.getFullYear() + "-" + (fecha.getMonth() + 1) + "-" + fecha.getDate() + ".txt";
                LBR.nombreArchivo = nombreArchivo;
                fileSystem.root.getDirectory("Lubricantes", { create: true }, funciones.generales.archivo.gotDir, funciones.generales.archivo.fail);
                //fileSystem.root.getFile(LBR.nombreArchivo, { create: true }, funciones.generales.archivo.gotFileEntry, funciones.generales.archivo.fail);
            },
            gotFileEntry: function (fileEntry) {
                fileEntry.createWriter(funciones.generales.archivo.gotFileWriter, funciones.generales.archivo.fail);
            },
            gotDir: function (dirEntry) {
                dirEntry.getFile(LBR.nombreArchivo, { create: true }, funciones.generales.archivo.gotFileEntry, funciones.generales.archivo.fail);
                var dirReader = dirEntry.createReader();
                funciones.generales.archivo.deleteFile(dirReader);
            },
            deleteFile: function (dirReader) {
                dirReader.readEntries(function (entries) {
                    var fechaActual = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate();
                    if (entries.length >= 5) {
                        for (var i = 0; i < entries.length; i++) {
                            var fechaArch = entries[i].name.replace('Backup', '').replace('.txt', '');
                            var dias = funciones.generales.DiferenciaEntreFechas(fechaActual, fechaArch);
                            if (dias > 4) {
                                entries[i].remove(function () {
                                    console.log("Borrado");
                                }, funciones.generales.archivo.fail);
                            }
                        }
                    }

                }, funciones.generales.archivo.fail);
            },
            gotFileWriter: function (writer) {
                writer.onwrite = function (evt) {
                    console.log("write success");
                };
                var registros = $.extend({}, LBR.registros_nuevos);
                registros.credenciales = null;
                if (writer.length > 0) {
                    writer.position = writer.length + 2;
                }
                writer.write(JSON.stringify(registros));
                writer.abort();
                funciones.tareas.splice(0, funciones.tareas.length);
                funciones.lista_tareas.splice(0, funciones.lista_tareas.length);
                funciones.lista_apunte.splice(0, funciones.lista_apunte.length);
            },
            fail: function (error) {
                LBR.cadena.splice(0, LBR.cadena.length);
                console.log("error : " + error.code);
            },
            removeFile: function (fileSystem) {
                fileSystem.root.getFile("Backup7112014-95437.txt", null, // remove file system entry
               function (entry) {
                   entry.remove(callback, function () {
                       console.log('[ERROR] deleteFile cleanup method invoked fail callback.');
                   });
               }, // doesn't exist
               function () { console.log("No existe") });
            }
        }
    },

};
function alert(content, title) {
    navigator.notification.alert(content, null, "Aplicación de Mantenimiento", 'Ok');
}
function confirm(content, title, func) {
    navigator.notification.confirm(content, func, "Aplicación de Mantenimiento", ['Si', 'No']);
}



