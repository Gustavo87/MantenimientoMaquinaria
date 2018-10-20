
var exec = require('cordova/exec');

var PLUGIN_NAME = 'CordovaPluginUpdateApp';

var CordovaPluginUpdateApp = {
  update: function(nombre_apk_file_a_descargar,
				  url_apk_file,
				  titulo_de_descarga,
				  descripcion_descarga,
				  cb) {
    exec(cb, null, PLUGIN_NAME, 'update', [
	nombre_apk_file_a_descargar,
	url_apk_file,
	titulo_de_descarga,
	descripcion_descarga
	]);
  }
};

module.exports = CordovaPluginUpdateApp;
