
package com.example;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Environment;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;
import java.io.File;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;

import java.util.Date;

public class CordovaPluginUpdateApp extends CordovaPlugin {

  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);

  }

  void DeleteRecursive(File fileOrDirectory) {

    if (fileOrDirectory.isDirectory())
        for (File child : fileOrDirectory.listFiles())
            DeleteRecursive(child);

    fileOrDirectory.delete();

    }
  
  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
    if(action.equals("update")) {
		
      String nombre_apk_file_a_descargar = args.getString(0);
	  String url_apk_file = args.getString(1);
	  String titulo_de_descarga = args.getString(2);
	  String descripcion_descarga = args.getString(3);
	  
	  String destination = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS) + "/";
	  
	  // Elimina todos los archivos en la carpeta downloads
	  DeleteRecursive(new File(destination));
	  
	  destination += nombre_apk_file_a_descargar;
	  final Uri uri_file = Uri.parse("file://" + destination);
	  String url = url_apk_file;
	  
	  DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
      request.setDescription(descripcion_descarga);
      request.setTitle(titulo_de_descarga);
	  request.setDestinationUri(uri_file);
	  
	  final DownloadManager manager = (DownloadManager) webView.getContext().getSystemService(Context.DOWNLOAD_SERVICE);
      final long downloadId = manager.enqueue(request);
	  
	  BroadcastReceiver onComplete = new BroadcastReceiver() {
        public void onReceive(Context ctxt, Intent intent) {
			
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                install.setDataAndType(uri_file,
                        "application/vnd.android.package-archive");
                webView.getContext().startActivity(install);

        }
      };
	  
	  webView.getContext().registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
	  
    } 
    return true;
  }

}
