Cordova Plugin Update App
======

Este plugin actualiza la app sin necesidad de usar Google Play Storage.
Ejemplo de uso:

		// El nombre que tomará el archivo apk una vez se descargue en el dispositivo
		var nombre_apk = "mantenimiento.apk"; 
		// La url que tiene el apk a bajar
		var url_apk = "https://www.dropbox.com/...?dl=1";
		// El titulo que lleva la descarga en progreso
		var titulo_de_descarga = "Actualizando Mantenimiento";
		// La descripción de la descarga en progreso
		var descripcion_descarga = "Actualizando a la version 2.0.0";
		// Callback del plugin
		var fun = function(){};
		
		window.CordovaPluginUpdateApp.update(
		nombre_apk,
		url_apk,
		titulo_de_descarga,
		descripcion_descarga,
		fun);
	
