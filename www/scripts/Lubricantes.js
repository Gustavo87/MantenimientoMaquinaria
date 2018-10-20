var TIMEOUT_CONSULTAS = 15000;
var TIMEOUT_INSERCION = 7000;
var services = {
    host: ''
}
var LBR = {
    nueva_version_apk: '',
    url_descarga_apk: '',
    version_app: '',
    modulo: '',
    modulo_des: '',
    esAmbientePiloto: true,
    conectado: true,
    cadena: [],
    latitud_apunte: 0,
    longitud_apunte: 0,
    latitud_sincronizacion: 0,
    longitud_sincronizacion: 0,
    horometro: 0,
    nombreArchivo: "",
    archivo: null,
    flags: {
        flag_equipos: false,
        flag_articulos: false,
        flag_nodrizas: false,
        flag_tareas: false
    },
    indice_tareasGuardas: 0,
    sincronizacion: {
        tiempo: []
    },
    user: {
        nombre: "",
        clave: "",
        auth: false
    },
    usuario: {

        insertarUsuario: function () {

            var store = LBR.data.bd.transaction(['Usuarios'], 'readwrite').objectStore('Usuarios');
            var index = store.index("NombreBusqueda");
            index.get(LBR.user.nombre).onsuccess = function (event) {
                objeto = event.target.result; console.log(objeto);
                objeto.auth = true;
                objeto.clave = LBR.user.clave;
                console.log("Obj" + objeto);
                var data = LBR.data,
                peticion = data.bd.transaction(['Usuarios'], 'readwrite').objectStore('Usuarios').put(objeto);

                peticion.onerror = function (e) {
                    console.log('Error al agregar el Usuario');
                };
                peticion.onsuccess = function (e) {
                    console.log('Usuario agregado');
                };
            }
            index.get(LBR.user.nombre).onerror = function (e) {
                console.log("erroR");
                var data = LBR.data,
                peticion = data.bd.transaction(['Usuarios'], 'readwrite').objectStore('Usuarios').put(LBR.user);

                peticion.onerror = function (e) {
                    console.log('Error al agregar el Usuario');

                };
                peticion.onsuccess = function (e) {
                    console.log('Usuario agregado');
                };
            };

        },
        autenticarUsuarioOffline: function () {
            var store = LBR.data.bd.transaction(['Usuarios'], 'readwrite').objectStore('Usuarios'); var index = store.index("NombreBusqueda");
            console.log("--" + LBR.user.nombre + "--");
            index.get(LBR.user.nombre).onsuccess = function (event) {
                var objeto = event.target.result;
                console.log("Existe usuario");
                if (objeto.clave == LBR.user.clave) {
                    console.log("Clave correcta");
                    objeto.auth = true;
                    LBR.user.auth = true;
                    var request = store.put(objeto);
                    request.onsuccess = function (e) {
                        console.log("Update");
                    };
                    request.onerror = function (e) {
                        console.log("Update Error");
                    };

                    // Visualizamos el nombre del módulo en el toolbar superior
                    funciones.visualizarModuloUI();

                    //funciones.generales.ingresar();
                    $("#contenedor-login").addClass("hide");
                    $("#barra-estado").removeClass();
                    $("#contenedor-general").removeClass();
                    contenedorActual = "contenedor-inicio";
                    document.getElementById('contenedo-datos-login').style.opacity = 1;
                    document.getElementById('loader-login').className = 'hide';
                    $("#encabezado").removeClass("hide");
                }
                else {
                    //Si la clave es incorrecta...
                    console.log("La contraseña que ingreso para el usuario " + LBR.user.nombre + " es distinta con la que ingreso la ultima vez, favor verifique su contraseña.");
                    alert("La contraseña que ingreso para el usuario " + LBR.user.nombre + " es distinta con la que ingreso la ultima vez, favor verifique su contraseña.");
                    funciones.generales.irLogin(contenedorActual);
                }
            };
            index.get(LBR.user.nombre).onerror = function (event) {
                //Si el usuario no se encuentra...
                alert("Para poder iniciar sesión sin internet, debe haber iniciado al menos una vez con conexión al internet");
                console.log("Para poder iniciar sesión sin internet, debe haber iniciado al menos una vez con conexión al internet");
                funciones.generales.irLogin(contenedorActual);
            };
        },
        autentificarUsuario: function () {

            //Si la pantalla es distinta al login, mostrar cargando personalizado.
            if (contenedorActual != "") {
                funciones.generales.ocultarMostrarBloqueoPantalla("autenticar");
            }
            console.log(services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=AuthenticateUser&cmp=01&' + "user=" + LBR.user.nombre + "&password=" + encodeURIComponent(LBR.user.clave));
            $.ajax({
                url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=AuthenticateUser&cmp=01',
                data: "user=" + LBR.user.nombre + "&password=" + encodeURIComponent(LBR.user.clave) + "&dispositivo=" + device.uuid,
                type: "GET",
                timeout: TIMEOUT_CONSULTAS,
                success: function (data) {
                    console.log('respuesta' + data);
                    if (data == "True") {
                        LBR.usuario.insertarUsuario();
                        LBR.user.auth = true;
                        LBR.usuario.actualizarUsuario(true);
                        console.log("Autenticacion Exitosa");
                        if (contenedorActual != "") {

                            // Visualizamos el nombre del módulo en el toolbar superior
                            funciones.visualizarModuloUI();

                            funciones.generales.ocultarMostrarBloqueoPantalla("autenticar");
                        }

                        /*Solo para el Login*/
                        funciones.generales.ingresar();
                    }
                    else if (data == "False") {
                        LBR.user.auth = false;
                        LBR.usuario.actualizarUsuario(false);
                        alert("Usuario o contraseña incorrectos", "");
                        funciones.generales.irLogin(contenedorActual);

                        //Quita autenticando...
                        document.getElementById("contenedor-general").className = ""
                        document.getElementById("block-screen").className = 'hide';
                        document.getElementById("contenedor-barra-progreso").className = "hide";
                        $("#progreso").css("width", "0%");
                        $("#progreso").css("background-color", "#94c948");
                        $("#porcentaje").text("0%");

                        console.log("Autenticacion Incorrecta");
                    }

                    else if (data == "No se ha podido autenticar el usuario") {
                        LBR.user.auth = false;
                        LBR.usuario.actualizarUsuario(false);
                        alert("Usuario o contraseña incorrectos", "");
                        funciones.generales.irLogin(contenedorActual);

                        //Quita autenticando...
                        document.getElementById("contenedor-general").className = ""
                        document.getElementById("block-screen").className = 'hide';
                        document.getElementById("contenedor-barra-progreso").className = "hide";
                        $("#progreso").css("width", "0%");
                        $("#progreso").css("background-color", "#94c948");
                        $("#porcentaje").text("0%");

                        console.log("Autenticacion Incorrecta");
                    }
                    else if (data == "NO DATOS") {
                        LBR.user.auth = false;
                        LBR.usuario.actualizarUsuario(false);

                        console.log("NO DATOS");
                        //LBR.usuario.actualizarUsuario(false);
                        alert("Usuario o contraseña incorrectos", "");
                        console.log("Autenticacion Incorrecta");
                        funciones.generales.irLogin(contenedorActual);

                        //Quita autenticando...
                        document.getElementById("contenedor-general").className = ""
                        document.getElementById("block-screen").className = 'hide';
                        document.getElementById("contenedor-barra-progreso").className = "hide";
                        $("#progreso").css("width", "0%");
                        $("#progreso").css("background-color", "#94c948");
                        $("#porcentaje").text("0%");
                    }
                    else {


                        LBR.user.auth = false;
                        LBR.usuario.actualizarUsuario(false);
                        alert(data, "");
                        funciones.generales.irLogin(contenedorActual);

                        //Quita autenticando...
                        document.getElementById("contenedor-general").className = ""
                        document.getElementById("block-screen").className = 'hide';
                        document.getElementById("contenedor-barra-progreso").className = "hide";
                        $("#progreso").css("width", "0%");
                        $("#progreso").css("background-color", "#94c948");
                        $("#porcentaje").text("0%");

                        console.log("No se puede autenticar porque no hay conexion");

                    }



                },
                error: function (data, status, error) {

                    LBR.user.auth = false;
                    LBR.usuario.actualizarUsuario(false);
                    alert("No se puede autenticar porque no hay conexion a internet", "");
                    //Quita autenticando...
                    document.getElementById("contenedor-general").className = ""
                    document.getElementById("block-screen").className = 'hide';
                    document.getElementById("contenedor-barra-progreso").className = "hide";
                    $("#progreso").css("width", "0%");
                    $("#progreso").css("background-color", "#94c948");
                    $("#porcentaje").text("0%");
                    funciones.generales.irLogin(contenedorActual);

                }
            });

        },
        borrarUsuario: function () {
            LBR.usuario.actualizarUsuario(false);

            LBR.user.auth = false;
            LBR.user.nombre = "";
            LBR.user.clave = "";

        },
        actualizarUsuario: function (estado) {
            var store = LBR.data.bd.transaction(['Usuarios'], 'readwrite').objectStore('Usuarios'); var index = store.index("NombreBusqueda");
            index.get(LBR.user.nombre).onsuccess = function (event) {
                var objeto = event.target.result;
                objeto.auth = estado;
                store.put(objeto);
            };

        }
    },
    generales: {
        abrirBBDD: function () {
            var peticion = indexedDB.open('Lubricantes', 12);

            peticion.onerror = function (e) { console.log('No se pudo crear la base de datos.'); };
            peticion.onsuccess = function (e) {
                LBR.data.bd = e.target.result;

                console.log('Base de datos abierta.');
                funciones.nodrizas.cargarNodrizas();
                funciones.generales.actualizarEstadoConexion();
                funciones.usuario.UsuarioConectado();
                funciones.generales.actualizarTareasPendientes();
                funciones.generales.actualizarTiempoTranscurrido();
                navigator.geolocation.watchPosition(funciones.generales.onSuccessLocation, funciones.generales.onErrorLocation, { maximumAge: 3000, timeout: 8000, enableHighAccuracy: false });
            };
            peticion.onupgradeneeded = function (e) {
                var temp = e.target.result;

                console.log('Tablas creadas');

                if (!temp.objectStoreNames.contains('Apuntes')) {
                    var tabla = temp.createObjectStore('Apuntes', { keyPath: 'id', autoIncrement: true });
                    //Indice para buscar por estado
                   // tabla.createIndex('Estado_OT, Fecha_Apunte', ['Estado_OT', 'Fecha_Apunte']);
                     tabla.createIndex('Estado_OT', 'Estado_OT', { unique: false });
                     tabla.createIndex('Fecha_Apunte', 'Fecha_Apunte', { unique: false });
                }

                //Creación de tabla para nuevos registros
                if (!temp.objectStoreNames.contains('Nuevos')) {
                    var tabla = temp.createObjectStore('Nuevos', { keyPath: 'id', autoIncrement: true });
                }
                //Creación de tabla para Maestro de Equipos
                if (!temp.objectStoreNames.contains('Equipos')) {
                    var tabla = temp.createObjectStore('Equipos', { keyPath: 'id' });
                    tabla.createIndex('Buscar', 'id', { unique: true });
                    tabla.createIndex('Activo', 'Activo', { unique: false });
                    //Campos nuevos
                    tabla.createIndex('Descripcion', 'Descripcion', { unique: false });
                    tabla.createIndex('Fecha_Ultima_Visita', 'Fecha_Ultima_Visita', { unique: false });
                    tabla.createIndex('Fecha_Ultimo_Cambio', 'Fecha_Ultimo_Cambio', { unique: false });
                    tabla.createIndex('Intervalo_Cambio', 'Intervalo_Cambio', { unique: false });
                    tabla.createIndex('Restante_Cambio', 'Restante_Cambio', { unique: false });
                    tabla.createIndex('Ultima_Visita', 'Ultima_Visita', { unique: false });
                    tabla.createIndex('Ultimo_Cambio', 'Ultimo_Cambio', { unique: false });
                }
                //Creación de tabla para Maestro de Tareas
                if (!temp.objectStoreNames.contains('Tareas')) {
                    var tabla = temp.createObjectStore('Tareas', { keyPath: 'id' });
                    tabla.createIndex('Buscar', 'descripcion', { unique: false });
                    tabla.createIndex('Activo', 'Activo', { unique: false });
                }
                //Creación de tabla para Maestro de Nodrizas
                if (!temp.objectStoreNames.contains('Nodrizas')) {
                    var tabla = temp.createObjectStore('Nodrizas', { keyPath: 'id' });
                    tabla.createIndex('Buscar', 'descripcion', { unique: false });
                    tabla.createIndex('Activo', 'Activo', { unique: false });
                }
                //Creación de tabla para Maestro de Artículos
                if (!temp.objectStoreNames.contains('Articulos')) {
                    var tabla = temp.createObjectStore('Articulos', { keyPath: 'id' });
                    tabla.createIndex('Buscar', 'id', { unique: true });
                    tabla.createIndex('Activo', 'Activo', { unique: false });
                }
                //Creacion de tabla Usuario
                if (!temp.objectStoreNames.contains('Usuarios')) {
                    var tabla = temp.createObjectStore('Usuarios', { keyPath: 'id', autoIncrement: true });
                    //Indice para buscar por usuario
                    tabla.createIndex('NombreBusqueda', 'nombre', { unique: true });
                    //   tabla.createIndex('Estado', 'auth', { unique: true });
                }
                //Creacion de tabla sincronizaciones
                if (!temp.objectStoreNames.contains('Sincronizacion')) {
                    var tabla = temp.createObjectStore('Sincronizacion', { keyPath: 'id', autoIncrement: true });
                }

            };
            peticion.onblocked = function (e) { console.log('Base de datos bloqueada'); }

        },
        cargarMaestros: function () {
            $('#equipo-buscar').val('');
            if (LBR.user.auth) {

                // Ponemos la Pantalla de Bloqueo
                funciones.PonerLaPantallaBloqueo();

                var InsertarMaestro = function (Datos, Maestro) {

                    //Define promesa...
                    var deferred = $.Deferred();

                    indice = 0;
                    total = Datos.length;

                    if (Maestro == "Equipos") {
                        document.getElementById("titulo-barra-progreso").innerText = "Sincronizando...";
                        $("#progreso").css("background-color", "#94c948");
                    }

                    var pet = LBR.data.bd.transaction([Maestro], "readwrite").objectStore(Maestro);
                    var registrosExistentes = pet.openCursor();
                    registrosExistentes.onsuccess = function (e) {

                        // Ponemos todos los registros en el storage a cero
                        var registro = e.target.result;
                        if (registro) {
                            registro.value.Activo = 0;
                            var actualizacion_registro = pet.put(registro.value);
                            actualizacion_registro.onsuccess = function (e) {
                                registro.continue();
                                console.log("procesando " + Maestro);
                            }
                        }
                        else {
                            // Iteramos en los datos regresados por el servicio
                            for (var i = 0; i < Datos.length; i++) {
                                // Ponemos el campo activo a 1
                                Datos[i].Activo = 1;
                                // Si el registro se encuentra se actualiza, sino se inserta
                                var peticion = LBR.data.bd.transaction([Maestro], 'readwrite').objectStore(Maestro).put(Datos[i]);
                                peticion.onsuccess = function (e) {

                                    indice++;
                                    console.log("Insertando " + Maestro);

                                    // Mostramos el progreso	
                                    if (Maestro == "Equipos") {
                                        var porcentaje = ((indice * 100) / total);
                                        $("#progreso").css("width", porcentaje + "%");
                                        if (porcentaje > 50) {
                                            $("#porcentaje").css("color", "#fff");
                                        }
                                        $("#porcentaje").text(porcentaje.toFixed(2) + "%");
                                    }

                                    if (indice == total) {

                                        LBR.generales.eliminarRegistrosInactivos(Maestro);
                                        //Promesa exitosa...
                                        deferred.resolve();

                                    }
                                };

                                peticion.onerror = function () {
                                    console.log("Error en " + " " + Maestro + ": " + registrosExistentes.error);
                                    //Promesa falla...
                                    deferred.reject();
                                };

                            }
                        }

                    };

                    registrosExistentes.onerror = function () {
                        console.log("Error en " + " " + Maestro + ": " + registrosExistentes.error);
                        //Promesa falla...
                        deferred.reject();
                    };

                    //Retorna promesa...
                    return deferred.promise();
                };

                // Definimos los llamados a los servicios
                var ParametrosxServicio = "user=" + LBR.user.nombre + "&password=" + encodeURIComponent(LBR.user.clave) + "&dispositivo=" + device.uuid;

                // Definimos el llamado para el servicio de Actualizar App
                var usuario = LBR.user.nombre;
                var password = encodeURIComponent(LBR.user.clave);
                var version = LBR.version_app;
                var dispositivo = device.uuid;
                var ParametrosxServicioActualizarApp = "user=" + usuario + "&password=" + password + "&Version=" + version + "&dispositivo=" + dispositivo;

                var ActualizarApp =
                 $.ajax({
                     type: 'GET',
                     timeout: TIMEOUT_CONSULTAS,
                     url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=ObtenerVersion',
                     data: ParametrosxServicioActualizarApp,
                     dataType: 'json'
                 });

                var MaestroEquipos =
                 $.ajax({
                     type: 'GET',
                     timeout: TIMEOUT_CONSULTAS,
                     url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=ObtenerEquipos&cmp=01',
                     data: ParametrosxServicio,
                     dataType: 'json'
                 });

                var MaestroArticulos =
                 $.ajax({
                     type: 'GET',
                     timeout: TIMEOUT_CONSULTAS,
                     url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=ObtenerArticulos&cmp=01',
                     data: ParametrosxServicio,
                     dataType: 'json'
                 });

                var MaestroBodegas =
                $.ajax({
                    type: 'GET',
                    timeout: TIMEOUT_CONSULTAS,
                    url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=ObtenerBodegaXDispositivo',
                    data: ParametrosxServicio,
                    dataType: 'json'
                });

                var MaestroTareas =
                 $.ajax({
                     type: 'GET',
                     timeout: TIMEOUT_CONSULTAS,
                     url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento?op=ObtenerTareas&cmp=01',
                     data: ParametrosxServicio,
                     dataType: 'json'
                 });

                // Manejamos el llamado al servicio, la respuesta de exito y la respuesta de error de la conexión AJAX
                $.when( 
                        MaestroEquipos.fail(function () { alert("Error bajando el maestro de Equipos  "); funciones.QuitarLaPantallaBloqueo(); }),
                        MaestroArticulos.fail(function () { alert("Error bajando el maestro de Articulos"); funciones.QuitarLaPantallaBloqueo(); }),
                        MaestroBodegas.fail(function () { alert("Error bajando el maestro de Nodrizas "); funciones.QuitarLaPantallaBloqueo(); }),
                        MaestroTareas.fail(function () { alert("Error bajando el maestro de Tareas   "); funciones.QuitarLaPantallaBloqueo(); }),
                        ActualizarApp.fail(function () { alert("Error Obteniendo la versión de la App   "); funciones.QuitarLaPantallaBloqueo(); })
                        )
                .then(function (Equipos, Articulos, Bodegas, Tareas, AppUpdate) {

                    // Verificamos si la app está actualizada
                    var NoestaActualizada = AppUpdate[0][0] != undefined;

                    

                    if (NoestaActualizada) {

                        // Si la app no está actualizada
                        LBR.nueva_version_apk = AppUpdate[0][0].Version;
                        LBR.url_descarga_apk = AppUpdate[0][0].Url;

                        //Ocultamos el botón de sincronización
                        $(".sincronizar-maestro").addClass("hide");

                        //Mostramos el botón de actualizar app
                        $(".actualizar-app").removeClass("hide");

                    }
                    else {
                        //Si la app está actualizada
                        //Ocultamos el botón de actualizar app
                        $(".actualizar-app").addClass("hide");

                        //Mostramos el botón de sincronización
                        $(".sincronizar-maestro").removeClass("hide");

                    }

                    // Si los servicios no regresa un array, mandamos un alert con lo regresado por el servicio (String con el detalle del error) y terminamos
                    if ($.isArray(Equipos[0]) == false) {

                        alert(Equipos[0]);
                        funciones.QuitarLaPantallaBloqueo();
                        return;

                    }
                    if ($.isArray(Articulos[0]) == false) { 

                        alert(Articulos[0]);
                        funciones.QuitarLaPantallaBloqueo();
                        return;

                    }
                    if ($.isArray(Bodegas[0]) == false) { 

                        alert(Bodegas[0]);
                        funciones.QuitarLaPantallaBloqueo();
                        return;

                    }
                    if ($.isArray(Tareas[0]) == false) { 

                        alert(Tareas[0]);
                        funciones.QuitarLaPantallaBloqueo();
                        return;

                    }


                    // Si todos los maestros regresan datos...
                    if (Equipos[0].length > 0 && Articulos[0].length > 0 && Bodegas[0].length > 0 && Tareas[0].length > 0) {

                        // Insertamos los Equipos
                        var InsertaEquipos = InsertarMaestro(Equipos[0], "Equipos");
                        InsertaEquipos.done(function () {
                            // Insertamos los Articulos             (Si los Equipos se insertaron con exito)
                            var InsertaArticulos = InsertarMaestro(Articulos[0], "Articulos");
                            InsertaArticulos.done(function () {
                                // Insertamos las Tareas            (Si los Articulos se insertaron con exito)
                                var InsertaTareas = InsertarMaestro(Tareas[0], "Tareas");
                                InsertaTareas.done(function () {
                                    // Insertamos las Nodrizas      (Si las Tareas se insertaron con exito)
                                    var InsertaBodegas = InsertarMaestro(Bodegas[0], "Nodrizas");
                                    InsertaBodegas.done(function () {
                                        console.log("Promesa Exitosa!");

                                        // Quitamos la pantalla de bloqueo...
                                        funciones.QuitarLaPantallaBloqueo();
                                        // Ponemos el módulo en la UI
                                        funciones.visualizarModuloUI();
                                        // Actualizamos la lista de Bodegas en la UI
                                        funciones.nodrizas.cargarNodrizas();
                                        // Verificamos si hay nueva versión de la app

                                    });
                                          // La promesa de Nodrizas generó error
                                    InsertaBodegas.fail(function () { alert("Error Grabando Nodrizas"); funciones.QuitarLaPantallaBloqueo(); }); 
                                });
                                        // La promesa de Tareas generó error
                                InsertaTareas.fail(function () { alert("Error Grabando Tareas"); funciones.QuitarLaPantallaBloqueo(); });
                            });
                                        // La promesa de Articulos generó error
                            InsertaArticulos.fail(function () { alert("Error Grabando Articulos"); funciones.QuitarLaPantallaBloqueo(); }); 
                        });
                                        // La promesa de Equipos generó error
                        InsertaEquipos.fail(function () { alert("Error Grabando Equipos"); funciones.QuitarLaPantallaBloqueo(); }); 

                    }
                    else {
                        // Si algun maestro no regreso datos...
                        var modulo = Bodegas[0][0].modulo_n;
                        var maestro = "";

                        if (Equipos[0].length == 0) {
                            maestro = "Equipos";
                        }
                        if (Articulos[0].length == 0) {
                            maestro = "Articulos";
                        }
                        if (Tareas[0].length == 0) {
                            maestro = "Tareas";
                        }
                        if (Bodegas[0].length == 0) {
                            maestro = "Bodegas";
                        }
                        var mensaje = "Error cargando el maestro de " + maestro + ". Probablemente el módulo " + modulo + " no tiene definido datos para este maestro.";
                        alert(mensaje);

                        funciones.QuitarLaPantallaBloqueo();

                    }
                });

            }
            else {
                console.log("authenticacion...");
                LBR.usuario.autentificarUsuario();
            }
        },
        actualizarFlags: function (estado) {
            LBR.flags.flag_articulos = estado;
            LBR.flags.flag_equipos = estado;
            LBR.flags.flag_nodrizas = estado;
            LBR.flags.flag_tareas = estado;
        },
        borrarBBDD: function () {
            console.log('inicio a borrar');
            if (LBR.data.bd != undefined) {
                console.log('entre');
                LBR.data.bd.close();
                console.log('cerrada');
                var peticion = indexedDB.deleteDatabase('Lubricantes');
                peticion.onsuccess = function () {
                    console.log('Base de datos borrada');
                };
                peticion.onerror = function () {
                    console.log('Error al borra la base de datos');
                };
            }
        },
        insertarSincronizacion: function () {
            var peticion = LBR.data.bd.transaction(['Sincronizacion'], 'readwrite').objectStore('Sincronizacion').clear();
            peticion.onerror = function () {
                console.log("Error al borrar Sincronizacion");
            };
            peticion.onsuccess = function () {

                var transaction = LBR.data.bd.transaction(['Sincronizacion'], 'readwrite');
                transaction.oncomplete = function (e) {
                    funciones.generales.actualizarTiempoTranscurrido();
                }
                transaction.onerror = function (e) {
                    console.log('Error transaccion');
                };
                var objectStore = transaction.objectStore("Sincronizacion");
                LBR.sincronizacion.tiempo = (new Date().getMonth() + 1) + '-' + new Date().getDate() + '-' + new Date().getFullYear() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
                var objectStoreRequest = objectStore.add(LBR.sincronizacion);

                objectStoreRequest.onsuccess = function (e) {
                    console.log('Nueva Sincronizacion');
                };
                objectStoreRequest.onerror = function (e) {
                    console.log('Error al agregar Sincronizacion');
                }
            };
        },
        sincronizarBBDD: function () {

            if (LBR.conectado) {
                if (LBR.user.auth) {
                    $("#numero-tareas").text("Sincronizando...");
                    funciones.generales.ocultarMostrarBloqueoPantalla();
                    //    funciones.generales.actualizarEstadoConexion();

                    var peticion = LBR.data.bd.transaction(['Nuevos']).objectStore('Nuevos').openCursor();
                    LBR.data.indice_resultados = 0;
                    peticion.onsuccess = function (e) {
                        var data = e.target.result;

                        if (data) {
                            LBR.cadena[LBR.data.indice_resultados] = data.value;
                            LBR.data.indice_resultados++;
                            data.continue();
                        }
                        else {
                            for (var i = 0; i < LBR.cadena.length; i++) {
                                LBR.cadena[i].mod_usr = LBR.user.nombre;
                                LBR.cadena[i].credenciales.user = LBR.user.nombre;
                                LBR.cadena[i].credenciales.password = LBR.user.clave;
                                LBR.cadena[i].latitud_sincronizacion = LBR.latitud_sincronizacion;
                                LBR.cadena[i].longitud_sincronizacion = LBR.longitud_sincronizacion;
                            }
                            if (LBR.cadena.length > 0) {
                                console.log(JSON.stringify(LBR.cadena));
                                $.ajax({
                                    type: 'POST',
                                    url: services.host + '/AgroIndustria/Taller/MTO/Mantenimiento/InsertarMantenimiento?cmp=01',
                                    dataType: 'json',
                                    timeout: TIMEOUT_INSERCION,
                                    data: JSON.stringify(LBR.cadena),
                                    headers: { "Content-type": "application/json;" },
                                    success: function (res) {

                                        var transaction = LBR.data.bd.transaction(['Nuevos'], 'readwrite');

                                        var objectStore = transaction.objectStore('Nuevos');
                                        var objetRequest = objectStore.clear();

                                        objetRequest.onerror = function (e) {
                                            console.log("Error al borrar los datos" + e);
                                        }
                                        objetRequest.onsuccess = function () {
                                            console.log("Datos de Nuevos apuntes borrados");

                                        }
                                        transaction.oncomplete = function (e) {
                                            alert("Apunte Sincronizado", "");
                                            funciones.generales.ocultarMostrarBloqueoPantalla();
                                            funciones.generales.actualizarTareasPendientes();
                                            funciones.generales.activarDesactivarBtnSincronizar("activo");
                                            LBR.cadena.splice(0, LBR.cadena.length);
                                            LBR.longitud_apunte = 0;
                                            LBR.latitud_apunte = 0;
                                            LBR.latitud_sincronizacion = 0;
                                            LBR.longitud_sincronizacion = 0;
                                        }
                                        transaction.onerror = function (e) {
                                            alert("Ocurrió un error en la sincronizacion", "");
                                        }
                                    },
                                    error: function (res) {
                                        funciones.generales.ocultarMostrarBloqueoPantalla();
                                        funciones.generales.actualizarTareasPendientes();
                                        console.log('Error al intentar sincronizar: ' + res);
                                        alert("Error al intentar sincronizar", "");
                                    }
                                }).always(function (xhr, txt) {
                                    console.log("Siempre aca");
                                });
                            }
                            else {
                                //LBR.generales.cargarMaestros();
                                funciones.generales.ocultarMostrarBloqueoPantalla();
                                alert("No se encontraron apuntes guardados", "");
                            }

                        }
                    };
                    peticion.onerror = function (e) {
                        funciones.generales.ocultarMostrarBloqueoPantalla();
                        console.log("Error:" + e.target.errorCode);
                        alert("Ocurrio un error", "");
                    }
                }
                else {
                    LBR.usuario.autentificarUsuario();
                    console.log('aca');
                    funciones.generales.actualizarTareasPendientes();
                }
            }
            else {
                console.log('jajja');
                funciones.generales.actualizarTareasPendientes();
                alert("El dispositivo no tiene conexion a Internet, no puede sincronizar en este momento", "");
                if (funciones.evt_sincronizacion == null) {
                    funciones.generales.sincronizacionAutomatica();
                }
            }
        },


        eliminarRegistrosInactivos: function (tablaEliminar) {

            var peticion = LBR.data.bd.transaction([tablaEliminar], "readwrite").objectStore(tablaEliminar);
            var busqueda = peticion.index("Activo").openCursor(IDBKeyRange.only(0));

            busqueda.onsuccess = function (e) {
                var i = 0;
                var resultado = e.target.result;
                if (resultado) {
                    console.log(resultado.value)
                    i++;
                    var eliminacion = peticion.delete(resultado.value.id);

                    eliminacion.onsuccess = function (e) {
                        resultado.continue();
                        console.log("Elimino registro de la tabla " + tablaEliminar);
                    }
                }

            }
        },



        crearArchivoRespaldoDatos: function () {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, funciones.generales.archivo.gotFS, funciones.generales.archivo.fail);
        },
        delay: function (element, callback, time) {
            if (element.zid) {
                clearTimeout(element.zid);
            }
            element.zid = setTimeout(callback, time);
        }
    },
    apunte: {
        insertarApunte: function () {
            var data = LBR.data;
            var transaction = data.bd.transaction(['Nuevos'], 'readwrite');

            transaction.oncomplete = function (e) {
                LBR.generales.crearArchivoRespaldoDatos();
                LBR.generales.sincronizarBBDD();
            }
            transaction.onerror = function (e) {
                console.log('Error transaccion');
            };
            var objectStore = transaction.objectStore("Nuevos");
            var objectStoreRequest = objectStore.add(LBR.registros_nuevos);

            objectStoreRequest.onsuccess = function (e) {
                console.log('Nuevo agregado');
            };
            objectStoreRequest.onerror = function (e) {
                console.log('Error al agregar nuevo');
            }
        }
    },
    data: {
        bd: '',
        indice_resultados: 0
    },
    eq_id: '',
    registros_nuevos: {}
};

