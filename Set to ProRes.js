function ProRes(exportFolder) {
    var exportPath = "\\\\srv-harmony24\\usadata000\\00_OUTPUTMOV\\MORTINA\\" + exportFolder + "\\"
        System.println("percorso impostato:" + exportPath);
    var Type = ["WRITE", "null"];
    var burninnode = "Top/Burn-In";
    var sceneName = scene.currentScene();
    var Found = node.getNodes(Type);

    for (var i = 0; i < Found.length; ++i) {
        var path = Found[i];
        if (node.type(path) == "null") {
            MessageLog.trace("Write node: " + node.getName(path));
        }
        else if (node.type(path) == "WRITE") {
            MessageLog.trace("Write: " + node.getName(path));
        }
    }


    // Disattiva il nodo Burn-in, se attivo
    if (node.getEnable(burninnode)) {
        System.println("Burn-in attivo, lo disattivo...");
        node.setEnable(burninnode, false);
    }

    if (exportFolder) {
        node.setTextAttr(path, "MOVIE_PATH", 1, exportPath + sceneName);
            System.println("Percorso di esportazione aggiornato a: " + exportPath + sceneName);
        node.setTextAttr(path, "MOVIE_FORMAT", 1, "com.toonboom.prores.mov.1.0");
        node.setTextAttr(path, "MOVIE_VIDEOAUDIO", 1, "com.toonboom.prores.mov.1.0:enableSound(1)com.toonboom.prores.mov.1.0:sampleRate(22050)com.toonboom.prores.mov.1.0:nChannels(2)com.toonboom.prores.mov.1.0:videoCodec(prores4444)com.toonboom.prores.mov.1.0:alpha(0)");
        node.setTextAttr(path, "exportToMovie", 1, "Output Movie"); 

    }
}
