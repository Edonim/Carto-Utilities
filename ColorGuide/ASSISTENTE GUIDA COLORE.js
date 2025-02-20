#target photoshop

var document = activeDocument;
var doc = activeDocument;

//salvo unità di misura
var originalUnit = app.preferences.rulerUnits;

//cambio in pixel sennò non funziona la posizione della roba
app.preferences.rulerUnits = Units.PIXELS;



// Valori del colore
var red = parseInt(app.foregroundColor.rgb.red);
var green = parseInt(app.foregroundColor.rgb.green);
var blue = parseInt(app.foregroundColor.rgb.blue);
// Verifica se uno dei valori RGB è maggiore di 245 o minore di 10, sennò frigge in TV 

if (red > 245 || green > 245 || blue > 245 || red < 10 || green < 10 || blue < 10) {
    var errore = "";
  
    if (red > 245) {
        errore = "rosso" + "\xa0(" + red + ")";
    } else if (green > 245) {
        errore = "verde" + "\xa0(" + green + ")";
    } else if (blue > 245) {
        errore = "blu" + "\xa0(" + blue + ")";
    } else if (red < 10 || green < 10 || blue < 10) {
        errore = "RGB\xa0(meno di 10)"
    }
    var win = new Window('dialog', 'Oh no!');
    win.orientation = 'column'
    win.add('statictext', undefined, 'Occhio! Il valore ' + errore + ' non è sicuro per la TV!' + "\xa0(╯°□°)╯彡 ┻━┻.").graphics.font = ScriptUI.newFont("Cascadia Mono", 12);
    win.add('button', undefined, 'OK');
    win.show();

} else {

    // pannello per chiedere cosa mettere nel file di photoshop
    var win = new Window('dialog', 'ツ Assistente Guida colore v2.70 ツ');
    win.orientation = 'row';

    var squareCheckbox = win.add('checkbox', undefined, 'Crea guida colore');
    squareCheckbox.value = true; 

    var rgbCheckbox = win.add('checkbox', undefined, ' Crea Valori RGB');
    rgbCheckbox.value = true; 

    var textCheckbox = win.add('checkbox', undefined, 'Inserisci nome colore');
    textCheckbox.value = true; 

    win.add('statictext', undefined, 'Nome Colore:');
    var userInput = win.add('edittext', undefined, '');
    userInput.characters = 18;

    var noteCheckbox = win.add('checkbox', undefined, 'Note:');
    noteCheckbox.value = false;

    var noteInput = win.add('edittext', undefined, '');
    noteInput.characters = 15;
    noteInput.enabled = false;

    var percentCheckbox = win.add('checkbox', undefined, 'opacità');
    percentCheckbox.value = false; 

    win.add('statictext', undefined, '');
    var percentInput = win.add('edittext', undefined, '');
    percentInput.characters = 4;
    percentInput.enabled = false;

    percentCheckbox.onClick = function () {
        percentInput.enabled = percentCheckbox.value;
    }



    noteCheckbox.onClick = function () {
        noteInput.enabled = noteCheckbox.value;
    }  
    

    textCheckbox.onClick = function () {
        userInput.enabled = textCheckbox.value;
    }

    win.group = win.add('group');
    win.group.orientation = 'row';
    win.group.add('button', undefined, 'OK', { name: 'ok' });
    win.group.add('button', undefined, 'Annulla', { name: 'cancella' });

    var result = win.show();
}


    if (result == 1) {

        var layerSet = doc.layerSets.add();
        layerSet.name = userInput.text; 

        if (squareCheckbox.value) {
            var shapeLayer = layerSet.artLayers.add();
          
            function DrawShape() {
                
                var doc = app.activeDocument;
                var y = arguments.length;
                var i = 0;

                var lineArray = [];
                for (i = 0; i < y; i++) {
                    lineArray[i] = new PathPointInfo;
                    lineArray[i].kind = PointKind.CORNERPOINT;
                    lineArray[i].anchor = arguments[i];
                    lineArray[i].leftDirection = lineArray[i].anchor;
                    lineArray[i].rightDirection = lineArray[i].anchor;
                }

                var lineSubPathArray = new SubPathInfo();
                lineSubPathArray.closed = true;
                lineSubPathArray.operation = ShapeOperation.SHAPEADD;
                lineSubPathArray.entireSubPath = lineArray;
                var myPathItem = doc.pathItems.add("myPath", [lineSubPathArray]);


                var desc88 = new ActionDescriptor();
                var ref60 = new ActionReference();
                ref60.putClass(stringIDToTypeID("contentLayer"));
                desc88.putReference(charIDToTypeID("null"), ref60);
                var desc89 = new ActionDescriptor();
                var desc90 = new ActionDescriptor();
                var desc91 = new ActionDescriptor();
                desc91.putDouble(charIDToTypeID("Rd  "), foregroundColor.rgb.red); // R
                desc91.putDouble(charIDToTypeID("Grn "), foregroundColor.rgb.green); // G
                desc91.putDouble(charIDToTypeID("Bl  "), foregroundColor.rgb.blue); // B
                var id481 = charIDToTypeID("RGBC");
                desc90.putObject(charIDToTypeID("Clr "), id481, desc91);
                desc89.putObject(charIDToTypeID("Type"), stringIDToTypeID("solidColorLayer"), desc90);
                desc88.putObject(charIDToTypeID("Usng"), stringIDToTypeID("contentLayer"), desc89);
                executeAction(charIDToTypeID("Mk  "), desc88, DialogModes.NO);

                myPathItem.remove();
            }

            DrawShape([25, 25], [25, 50], [50, 50], [50, 25]);
        }

       
        if (textCheckbox.value) {
     
            
            var textLayer = layerSet.artLayers.add();
            textLayer.kind = LayerKind.TEXT;
            textLayer.textItem.size = 15;
            textLayer.textItem.position = [223, 155];
            textLayer.textItem.fauxBold = true;
            textLayer.textItem.contents = userInput.text.toUpperCase();
            //textLayer.textItem.contents = userInput.text;
        }

        //if (noteCheckbox.value) {
        //    var noteLayer = layerSet.artLayers.add();
        //    noteLayer.kind = LayerKind.TEXT;
        //    noteLayer.textItem.size = 10;
        //    noteLayer.textItem.position = [544, 200];
        //    noteLayer.textItem.contents = noteInput.text;
        //}

        if (rgbCheckbox.value  && noteCheckbox.value == true && percentCheckbox.value == true) {

            var rgbLayer = layerSet.artLayers.add();
            rgbLayer.kind = LayerKind.TEXT;
            rgbLayer.textItem.size = 10;
            rgbLayer.textItem.position = [223, 200];
  
            rgbLayer.textItem.contents = "R: " + red + "\xa0G: " + green + "\xa0B: " + blue + "\xa0" + "(" + noteInput.text + "\xa0" + percentInput.text + "%\xa0)" ;
        }

        else if (rgbCheckbox.value && noteCheckbox.value == false && percentCheckbox.value == true) {

            var rgbLayer = layerSet.artLayers.add();
            rgbLayer.kind = LayerKind.TEXT;
            rgbLayer.textItem.size = 10;
            rgbLayer.textItem.position = [223, 200];

            rgbLayer.textItem.contents = "R: " + red + "\xa0G: " + green + "\xa0B: " + blue + "\xa0" + "(" + percentInput.text + "%\xa0)";
        } 

        else if (rgbCheckbox.value && noteCheckbox.value == true && percentCheckbox.value == false) {
 
            var rgbLayer = layerSet.artLayers.add();
            rgbLayer.kind = LayerKind.TEXT;
            rgbLayer.textItem.size = 10;
            rgbLayer.textItem.position = [223, 200];
 
            rgbLayer.textItem.contents = "R: " + red + "\xa0G: " + green + "\xa0B: " + blue + "\xa0" + "(" + noteInput.text + ")";
        } 

        else if (rgbCheckbox.value && noteCheckbox.value == false && percentCheckbox.value == false) {
            
            var rgbLayer = layerSet.artLayers.add();
            rgbLayer.kind = LayerKind.TEXT;
            rgbLayer.textItem.size = 10;
            rgbLayer.textItem.position = [223, 200];
            
            rgbLayer.textItem.contents = "R: " + red + "\xa0G: " + green + "\xa0B: " + blue;
        }
    }

 


app.preferences.rulerUnits = originalUnit